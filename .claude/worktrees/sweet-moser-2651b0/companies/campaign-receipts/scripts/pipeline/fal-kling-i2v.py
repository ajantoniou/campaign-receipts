#!/usr/bin/env python3
"""
fal.ai Kling 2.5 Pro image-to-video — character-anchored motion video.

Use case: scenes where James (or any recurring character) should appear.
Anchors output to a reference image (default: brand/james-portrait.png), then
generates motion from that anchor + a text prompt.

NOT true Soul ID (cross-clip identity tracking). Each clip starts from the
same image, so the FIRST frame is exactly James. Subsequent frames drift per
the model, but face features stay close enough that viewers read it as "the
same character" across clips.

Verified 2026-05-19 in i2v A/B test (clip-09 Sodom seed + prompt → strong output).
Endpoint: fal-ai/kling-video/v2.5-turbo/pro/image-to-video
Cost: ~$0.35-0.70 per 5s clip ($0.07/sec)

House-style negatives (locked 2026-05-20):
no campaign-rally aesthetic, no cable-news chyron, no shouting crowds, no flames /
money-rain / explosions, no saturated partisan palettes (no red-meat MAGA red,
no hyper-resistance blue), no legible text on documents (treat as redacted /
illegible), no overtly emotional performance — Betsy-voice is calm and the
on-screen subject is treated as an archival subject, not a campaign performer.

This script's PRIMARY USE for CR: animate a Wikimedia / public-domain photo of a
named real politician via image-to-video. Identity comes from the seed image —
the prompt should ONLY describe subtle motion (head turn, micro-expression,
slight wind), never new facial features.

Usage:
    python3 fal-kling-i2v.py \\
        --image brand/james-portrait.png \\
        --prompt "James slowly turns his head to look at the camera, soft natural light, documentary realism" \\
        --duration 5 \\
        --out content/videos/<slug>/clips-james/james-intro.mp4 \\
        --piece <slug>
"""
import json, os, sys, time, base64, subprocess, urllib.request, urllib.error, datetime as dt
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
ENV = REPO / ".env"
COST_LOG = CR / "scripts/.external-costs.jsonl"

ENDPOINT = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video"
PRICE_PER_SEC = 0.07
ALLOWED_DURATIONS = [5, 10]  # Kling 2.5 only accepts these
MAX_PROMPT_CHARS = 2400  # fal Kling silently 422s above ~2500 (memory: kling-prompt-length-limit)
# Luma thresholds mirror qc-black-frames.py EXACTLY — a clip below these reads as
# black/blank on playback even though it is not pure #000. THREE black renders shipped
# because the old path had no post-generation luma check (diagnosis 2026-05-31).
# A frame is BAD if: DARK (YAVG < 70) OR BLANK (spread < 18 AND not bright, YAVG < 180).
# A flat-but-BRIGHT frame (parchment/navy card, YAVG ~232) is brand design, NOT blank.
DARK_MEAN_MAX = 70.0     # YAVG below this = dark/black
BLANK_SPREAD_MAX = 18.0  # YHIGH-YLOW below this = flat
BLANK_MEAN_MAX = 180.0   # a flat frame is only "blank" if also NOT bright


def frame_luma(video_or_image, at_s=None):
    """Return (yavg, spread) for one sampled frame via ffprobe signalstats.
    Works on a video (samples a mid frame) or a still image. Returns (None, None) on error."""
    src = str(video_or_image)
    # signalstats needs a single frame; use a select filter at the sample point.
    sel = f"select='eq(n\\,0)'" if at_s is None else f"select='gte(t\\,{at_s})'"
    cmd = ["ffprobe", "-v", "error", "-f", "lavfi",
           "-i", f"movie='{src}',{sel},signalstats",
           "-show_entries", "frame_tags=lavfi.signalstats.YAVG,lavfi.signalstats.YLOW,lavfi.signalstats.YHIGH",
           "-of", "json", "-read_intervals", "%+#1"]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        data = json.loads(out.stdout or "{}")
        frames = data.get("frames", [])
        if not frames:
            return (None, None)
        t = frames[0].get("tags", {})
        yavg = float(t.get("lavfi.signalstats.YAVG", 0))
        ylow = float(t.get("lavfi.signalstats.YLOW", 0))
        yhigh = float(t.get("lavfi.signalstats.YHIGH", 0))
        return (yavg, yhigh - ylow)
    except Exception as e:
        print(f"  ⚠️  luma probe failed ({e}); treating as unknown", file=sys.stderr)
        return (None, None)


def luma_ok(yavg, spread, label):
    """True if frame is NOT dark and NOT blank, matching qc-black-frames.py.
    None values pass (probe failed — don't hard-block on a tooling error)."""
    if yavg is None:
        return True
    is_dark = yavg < DARK_MEAN_MAX
    is_blank = (spread < BLANK_SPREAD_MAX) and (yavg < BLANK_MEAN_MAX)
    if is_dark or is_blank:
        why = "dark" if is_dark else "blank (flat + not bright)"
        print(f"  ✗ {label}: YAVG={yavg:.1f} spread={spread:.1f} — reads as black/{why}",
              file=sys.stderr)
        return False
    print(f"  ✓ {label}: YAVG={yavg:.1f} spread={spread:.1f} — OK (bright or contrasty)")
    return True


def load_env():
    env = {}
    if ENV.exists():
        for l in ENV.read_text().splitlines():
            if "=" in l and not l.startswith("#"):
                k,_,v = l.partition("=")
                env[k.strip()] = v.strip().strip('"')
    return env


def get_api_key():
    env = load_env()
    for k in ("CR_FAL_API_KEY", "FAL_API_KEY", "FAL_KEY"):
        if env.get(k) or os.environ.get(k):
            return env.get(k) or os.environ.get(k)
    print("ERR: CR_FAL_API_KEY missing", file=sys.stderr); sys.exit(1)


def log_cost(piece, usd, note):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(COST_LOG, "a") as f:
        f.write(json.dumps({"ts": dt.datetime.now().isoformat(), "issueId": piece,
                            "vendor": "fal.ai/kling-2.5-pro-i2v",
                            "cost_usd": round(usd, 4), "note": note}) + "\n")


def image_to_data_uri(image_path):
    """fal.ai accepts data: URIs for the image_url field — no need to upload."""
    p = Path(image_path)
    data = p.read_bytes()
    if data[:3] == b'\xff\xd8\xff':
        mime = "image/jpeg"
    elif data[:8] == b'\x89PNG\r\n\x1a\n':
        mime = "image/png"
    else:
        mime = "image/jpeg"
    b64 = base64.b64encode(data).decode()
    return f"data:{mime};base64,{b64}"


def fal_request(body, api_key, max_wait=600):
    """Submit + poll Kling i2v job. Returns video URL or None.

    Uses the SYNC fal.run endpoint first (returns the result directly + surfaces
    HTTP 422 immediately) and only falls back to the async queue if the sync call
    times out. The old queue.fal.run-only path masked silent server-side failures
    (memory: kling-prompt-length-limit; diagnosis 2026-05-31)."""
    # --- Try sync endpoint: result comes back in the POST response ---
    sync_url = f"https://fal.run/{ENDPOINT}"
    req = urllib.request.Request(sync_url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Authorization", f"Key {api_key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=max_wait) as r:
            result = json.loads(r.read())
        v = result.get("video")
        if isinstance(v, dict): return v.get("url")
        if isinstance(v, str): return v
        print(f"  ⚠️  sync response had no video field: {json.dumps(result)[:300]}", file=sys.stderr)
        return None
    except urllib.error.HTTPError as e:
        body_txt = e.read().decode()[:400]
        # 422 = prompt rejected (usually too long). Surface loudly, do NOT silently retry.
        print(f"  fal sync HTTP {e.code}: {body_txt}", file=sys.stderr)
        if e.code == 422:
            return None
        # Other errors: fall through to the async queue path below.
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
        print(f"  sync call failed ({e}); falling back to async queue", file=sys.stderr)

    # --- Async fallback ---
    submit_url = f"https://queue.fal.run/{ENDPOINT}"
    req = urllib.request.Request(submit_url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Authorization", f"Key {api_key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            sub = json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"  fal HTTP {e.code}: {e.read().decode()[:300]}", file=sys.stderr)
        return None

    status_url = sub.get("status_url"); response_url = sub.get("response_url")
    request_id = sub.get("request_id", "?")
    print(f"  Submitted: {request_id[:24]}...")

    start = time.time()
    time.sleep(3)
    while True:
        if time.time() - start > max_wait:
            print(f"  ⚠️  timeout (>{max_wait}s)", file=sys.stderr)
            return None
        try:
            r = urllib.request.Request(status_url)
            r.add_header("Authorization", f"Key {api_key}")
            with urllib.request.urlopen(r, timeout=15) as resp:
                st = json.loads(resp.read())
        except urllib.error.HTTPError as e:
            time.sleep(5); continue
        s = st.get("status", "?")
        if s == "COMPLETED": break
        if s in ("FAILED", "ERROR"):
            print(f"  ⚠️  fal {s}: {json.dumps(st)[:400]}", file=sys.stderr); return None
        print(f"  {s} ({int(time.time()-start)}s)")
        time.sleep(8)

    try:
        r = urllib.request.Request(response_url)
        r.add_header("Authorization", f"Key {api_key}")
        with urllib.request.urlopen(r, timeout=30) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return None

    # Kling response: result.video.url
    v = result.get("video")
    if isinstance(v, dict): return v.get("url")
    if isinstance(v, str): return v
    return None


def download(url, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=300) as r:
        out_path.write_bytes(r.read())


def main():
    args = sys.argv[1:]
    def get(f, d=None):
        if f in args: i = args.index(f); return args[i+1] if i+1 < len(args) else d
        return d
    if "--help" in args or not args:
        print(__doc__); return

    image = get("--image")
    prompt = get("--prompt")
    duration_raw = int(get("--duration", "5"))
    out = get("--out")
    piece = get("--piece", "manual")

    if not prompt or not out or not image:
        print("ERR: --image + --prompt + --out required (CR requires a Wikimedia / public-domain seed image)", file=sys.stderr); sys.exit(1)

    # Cap motion prompt — fal Kling silently 422s above ~2500 chars.
    if len(prompt) > MAX_PROMPT_CHARS:
        cut = prompt[:MAX_PROMPT_CHARS].rsplit(" ", 1)[0]
        print(f"  (prompt {len(prompt)} chars → truncated to {len(cut)} at word boundary, cap {MAX_PROMPT_CHARS})")
        prompt = cut

    image_path = Path(image)
    if not image_path.is_absolute(): image_path = CR / image_path
    if not image_path.exists():
        print(f"ERR: image not found: {image_path}", file=sys.stderr); sys.exit(1)

    # Start-frame brightness gate: a dark seed propagates black through i2v.
    sy, ss = frame_luma(image_path)
    if not luma_ok(sy, ss, f"start-frame {image_path.name}"):
        print("ERR: seed image too dark/flat — i2v will black-render. Brighten the seed or pick another.",
              file=sys.stderr)
        sys.exit(2)

    # Snap duration to allowed values
    duration = min(ALLOWED_DURATIONS, key=lambda v: abs(v - duration_raw))
    if duration != duration_raw:
        print(f"  (duration {duration_raw}s → {duration}s, Kling only accepts {ALLOWED_DURATIONS})")

    api_key = get_api_key()

    print(f"=== fal-kling-i2v ===")
    print(f"  image: {image_path.name} ({image_path.stat().st_size/1e6:.1f}MB)")
    print(f"  prompt: {prompt[:100]}{'...' if len(prompt)>100 else ''}")
    print(f"  duration: {duration}s")
    print(f"  out: {out}")

    body = {
        "image_url": image_to_data_uri(image_path),
        "prompt": prompt,
        "duration": str(duration),
        "aspect_ratio": "16:9",
        "negative_prompt": (
            "low quality, blurry, distorted face, multiple faces, morphed features, "
            "new facial features not in seed image, identity drift, face swap, "
            "campaign rally, cheering crowd, partisan signage, party flags, "
            "cable news chyron, lower-third graphics, breaking-news banner, "
            "shouting, crying, screaming, fist pump, money rain, flames, explosions, "
            "saturated red, saturated blue, MAGA hat, resistance pin, "
            "logos, watermarks, text overlays"
        ),
    }
    video_url = fal_request(body, api_key)
    if not video_url:
        print("  ⚠️  generation failed", file=sys.stderr); sys.exit(1)

    out_path = Path(out)
    if not out_path.is_absolute():
        if out_path.parts[:2] == ("companies", "campaign-receipts"):
            out_path = REPO / out_path
        else:
            out_path = CR / out_path
    download(video_url, out_path)
    cost = duration * PRICE_PER_SEC
    # Cost is incurred whether or not the clip is usable — log it before gating.
    log_cost(piece, cost, f"kling-i2v {duration}s seed={image_path.name}")

    # POST-GENERATION LUMA GATE — the fix for 3 silent black renders.
    # Sample two points (early + mid) so a clip that fades to dark is also caught.
    y0, s0 = frame_luma(out_path, at_s=0.5)
    y1, s1 = frame_luma(out_path, at_s=max(1.0, duration * 0.6))
    early_ok = luma_ok(y0, s0, f"{out_path.name} @0.5s")
    mid_ok = luma_ok(y1, s1, f"{out_path.name} @{max(1.0, duration*0.6):.1f}s")
    if not (early_ok and mid_ok):
        bad = out_path.with_suffix(".dark.mp4")
        out_path.rename(bad)
        print(f"\n  ✗ REJECTED — clip reads as black/blank (kept for inspection: {bad.name})", file=sys.stderr)
        print(f"     (${cost:.3f} spent. Reroll with a brighter prompt/seed or fall back to Remotion.)", file=sys.stderr)
        sys.exit(2)

    print(f"\n  ✅ {out_path}  (${cost:.3f}, {out_path.stat().st_size/1e6:.1f}MB) — passed luma gate")


if __name__ == "__main__":
    main()
