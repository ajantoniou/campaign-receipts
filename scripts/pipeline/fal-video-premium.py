#!/usr/bin/env python3
"""
Premium multi-character video generation via fal.ai's 2026 top-tier models.

Three models, dispatched per scene by the video-producer persona:

  sora2       — OpenAI Sora 2  ($0.10/sec, native audio + multi-character)
                Best DEFAULT for character scenes. Cheapest of the top tier.

  veo3-fast   — Google Veo 3.1 Fast with audio ($0.15/sec, native lip-sync)
                Best for DIALOGUE — actual mouth movement synced to generated speech.
                Use when James (or any character) speaks on-screen.

  seedance    — ByteDance Seedance 2.0 ($0.30/sec, director-level camera)
                Best for HERO shots with explicit camera moves (dolly, push-in,
                crane, etc.). Most expensive — reserve for climax beats.

  kling3-pro  — Kling 3 Pro with audio ($0.17/sec, multi-shot, cinematic)
                Alternate to Sora 2 — slightly more expensive, sometimes better
                cinematic look. Use for atmospheric establishing scenes.

All four are TEXT-TO-VIDEO with native audio. For IMAGE-TO-VIDEO with a James
portrait anchor, keep using scripts/fal-kling-i2v.py (Kling 2.5 Pro i2v at
$0.07/sec).

Usage:
    python3 fal-video-premium.py \\
        --model sora2 \\
        --prompt "Two robed first-century men walk slowly along a dusty Judean road at golden hour, deep in conversation. One older with a grey beard, one younger. Documentary realism. No halos." \\
        --duration 8 \\
        --out content/videos/<slug>/clips-premium/scene-walk.mp4 \\
        --piece <slug>

    # Veo with dialogue audio
    python3 fal-video-premium.py --model veo3-fast --duration 8 \\
        --prompt "James, a Mediterranean man in his fifties wearing a plain linen tunic, looks at the camera and says: 'My brother spent three years teaching.' Soft golden hour. Documentary realism." \\
        --out scene-james-intro.mp4 --piece <slug>
"""
import json, os, sys, time, urllib.request, urllib.error, datetime as dt
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
ENV = REPO / ".env"
COST_LOG = CR / "scripts/.external-costs.jsonl"

# fal.ai endpoint catalog (verified 2026-05-20)
MODELS = {
    "sora2": {
        "endpoint": "fal-ai/sora-2/text-to-video",
        "price_per_sec": 0.10,
        "label": "OpenAI Sora 2",
        "default_aspect": "16:9",
        "allowed_durations": [4, 8, 12, 16, 20],  # fal Sora 2 enum
        "supports_audio": True,
    },
    "veo3-fast": {
        "endpoint": "fal-ai/veo3.1/fast",
        "price_per_sec": 0.15,  # with audio enabled
        "label": "Veo 3.1 Fast (audio on)",
        "default_aspect": "16:9",
        "allowed_durations": [4, 6, 8],
        "supports_audio": True,
    },
    "veo3-standard": {
        "endpoint": "fal-ai/veo3.1",
        "price_per_sec": 0.40,
        "label": "Veo 3.1 Standard (audio on)",
        "default_aspect": "16:9",
        "allowed_durations": [4, 6, 8],
        "supports_audio": True,
    },
    # Seedance 2.0 DISABLED 2026-05-20 — fal queue accepts submission but the
    # ByteDance backend rejects at process time (0.04s inference, then 404 result).
    # Likely requires enterprise/regional approval. Re-enable when fal grants access.
    # "seedance": {
    #     "endpoint": "fal-ai/bytedance/seedance-2.0/text-to-video",
    #     "price_per_sec": 0.30,
    #     "label": "ByteDance Seedance 2.0 (director camera)",
    #     "default_aspect": "16:9",
    #     "allowed_durations": [5, 10, 15],
    #     "supports_audio": True,
    # },
    "kling3-pro": {
        "endpoint": "fal-ai/kling-video/v3/pro/text-to-video",
        "price_per_sec": 0.17,
        "label": "Kling v3 Pro (audio on)",
        "default_aspect": "16:9",
        "allowed_durations": [5, 10],
        "supports_audio": True,
    },
}


def load_env():
    env = {}
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k,_,v = line.partition("=")
                env[k.strip()] = v.strip().strip('"')
    return env


def get_api_key():
    env = load_env()
    for k in ("CR_FAL_API_KEY", "FAL_API_KEY", "FAL_KEY"):
        if env.get(k) or os.environ.get(k):
            return env.get(k) or os.environ.get(k)
    print("ERR: CR_FAL_API_KEY missing", file=sys.stderr); sys.exit(1)


def log_cost(piece, vendor, usd, note):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(COST_LOG, "a") as f:
        f.write(json.dumps({"ts": dt.datetime.now().isoformat(), "issueId": piece,
                            "vendor": vendor, "cost_usd": round(usd, 4),
                            "note": note}) + "\n")


def snap_duration(requested, allowed):
    return min(allowed, key=lambda v: abs(v - requested))


def fal_request(endpoint, body, api_key, max_wait=900):
    """Submit + poll. Returns the result dict or None."""
    submit_url = f"https://queue.fal.run/{endpoint}"
    req = urllib.request.Request(submit_url, data=json.dumps(body).encode(), method="POST")
    req.add_header("Authorization", f"Key {api_key}")
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            sub = json.loads(r.read())
    except urllib.error.HTTPError as e:
        body_text = e.read().decode()
        print(f"  ⚠️  fal HTTP {e.code}: {body_text[:500]}", file=sys.stderr)
        return None

    status_url = sub.get("status_url"); response_url = sub.get("response_url")
    request_id = sub.get("request_id", "?")
    print(f"  Submitted: {request_id[:24]}...")

    start = time.time()
    consecutive_errors = 0
    time.sleep(3)
    while True:
        if time.time() - start > max_wait:
            print(f"  ⚠️  timeout (>{max_wait}s)", file=sys.stderr)
            return None
        try:
            req = urllib.request.Request(status_url)
            req.add_header("Authorization", f"Key {api_key}")
            with urllib.request.urlopen(req, timeout=15) as r:
                st = json.loads(r.read())
            consecutive_errors = 0
        except urllib.error.HTTPError as e:
            consecutive_errors += 1
            if consecutive_errors >= 5: return None
            time.sleep(5); continue
        except Exception:
            consecutive_errors += 1
            if consecutive_errors >= 5: return None
            time.sleep(5); continue

        s = st.get("status", "?")
        if s == "COMPLETED": break
        if s in ("FAILED", "ERROR"):
            print(f"  ⚠️  fal {s}: {json.dumps(st)[:400]}", file=sys.stderr); return None
        print(f"  {s} ({int(time.time()-start)}s)")
        time.sleep(8)

    try:
        req = urllib.request.Request(response_url)
        req.add_header("Authorization", f"Key {api_key}")
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError:
        return None


def extract_video_url(result):
    if not result: return None
    for key in ("video", "output"):
        v = result.get(key)
        if isinstance(v, dict) and v.get("url"): return v["url"]
        if isinstance(v, str) and v.startswith("http"): return v
    vs = result.get("videos")
    if isinstance(vs, list) and vs:
        first = vs[0]
        if isinstance(first, dict) and first.get("url"):
            return first["url"]
    return None


def download(url, out_path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=600) as r:
        out_path.write_bytes(r.read())


def main():
    args = sys.argv[1:]
    def get(f, d=None):
        if f in args: i = args.index(f); return args[i+1] if i+1 < len(args) else d
        return d
    if "--help" in args or not args:
        print(__doc__); return

    model_key = get("--model", "sora2")
    if model_key not in MODELS:
        print(f"ERR: unknown model '{model_key}'. Options: {list(MODELS.keys())}", file=sys.stderr); sys.exit(1)
    model = MODELS[model_key]

    prompt = get("--prompt")
    duration_raw = float(get("--duration", "8"))
    aspect = get("--aspect", model["default_aspect"])
    out = get("--out")
    piece = get("--piece", "manual")
    audio_off = "--no-audio" in args
    raw_prompt = "--raw-prompt" in args  # skip house-style suffix (advanced override)

    if not prompt or not out:
        print("ERR: --prompt + --out required", file=sys.stderr); sys.exit(1)

    # CAMPAIGN RECEIPTS HOUSE-STYLE PROMPT SUFFIX (founder lock 2026-05-20):
    # Always appended to prompts unless --raw-prompt is set. Prevents common
    # AI-hallucinated failures for an evidence-driven political-accountability
    # channel:
    #   - Synthetic faces of named real living politicians — HARD BAN (use kling-i2v
    #     with a Wikimedia photo as seed instead)
    #   - Cable-news chyron / campaign-rally aesthetic (off-brand for an
    #     investigative-archive channel)
    #   - Saturated partisan palettes (red-meat MAGA red, hyper-blue resistance)
    #   - Legible text on documents (the model hallucinates; treat as redacted)
    #   - Crowd / shouting / weeping / overt emotion (Betsy-voice is calm)
    HOUSE_STYLE_NEGATIVE = (
        " IMPORTANT VISUAL RULES: No synthetic faces of named real living politicians — "
        "if a real politician needs to appear, the caller MUST use fal-kling-i2v.py with a "
        "Wikimedia / public-domain photo as the seed image; never generate a real-person "
        "likeness via text-to-video. Characters here must be UNNAMED and STYLIZED: "
        "silhouettes, back-of-head, anonymous suits, generic podiums, no campaign signage, "
        "no party-color flags. "
        "No cable-news chyron aesthetic. No campaign-rally crowd shots. No flames, no "
        "money-rain, no explosions. No legible text on documents (treat all on-screen "
        "documents as redacted / illegible). No shouting, no crying, no overtly emotional "
        "performance — investigative-archive tone only. "
        "Maintain documentary realism throughout. Frontline / Retro Report aesthetic. "
        "Restrained color: navy, cream, civic-red accents only — no saturated partisan palettes."
    )
    if not raw_prompt:
        prompt = prompt.rstrip(". ") + "." + HOUSE_STYLE_NEGATIVE

    duration = snap_duration(int(duration_raw), model["allowed_durations"])
    if duration != int(duration_raw):
        print(f"  (duration {duration_raw}s → {duration}s — {model_key} only accepts {model['allowed_durations']})")

    api_key = get_api_key()
    print(f"=== fal-video-premium ({model['label']}) ===")
    print(f"  prompt: {prompt[:100]}{'...' if len(prompt)>100 else ''}")
    print(f"  duration: {duration}s   aspect: {aspect}   audio: {'off' if audio_off else 'on'}")

    # Per-model body construction (schemas differ per docs as of 2026-05-20)
    if model_key == "sora2":
        body = {
            "prompt": prompt,
            "duration": duration,           # NUMBER, not string (enum: 4|8|12|16|20)
            "aspect_ratio": aspect,
            "resolution": "720p",
        }
    elif model_key in ("veo3-fast", "veo3-standard"):
        body = {
            "prompt": prompt,
            "duration": f"{duration}s",     # string with "s" suffix
            "aspect_ratio": aspect,
            "generate_audio": not audio_off,
            "resolution": "720p",
        }
    elif model_key == "seedance":
        body = {
            "prompt": prompt,
            "duration": duration,           # number
            "aspect_ratio": aspect,
            "resolution": "720p",
            "generate_audio": not audio_off,
        }
    elif model_key == "kling3-pro":
        body = {
            "prompt": prompt,
            "duration": str(duration),      # string
            "aspect_ratio": aspect,
            "generate_audio": not audio_off,
        }
    else:
        body = {"prompt": prompt, "duration": duration, "aspect_ratio": aspect}

    result = fal_request(model["endpoint"], body, api_key)
    video_url = extract_video_url(result)
    if not video_url:
        print(f"  ⚠️  no video URL in response: {json.dumps(result)[:300] if result else 'None'}", file=sys.stderr)
        sys.exit(1)

    out_path = Path(out)
    if not out_path.is_absolute():
        # If the relative path already starts with companies/campaign-receipts, anchor to REPO.
        # Otherwise (legacy short paths like content/videos/...), anchor to NT.
        if out_path.parts[:2] == ("companies", "campaign-receipts"):
            out_path = REPO / out_path
        else:
            out_path = CR / out_path
    download(video_url, out_path)

    cost = duration * model["price_per_sec"]
    log_cost(piece, f"fal.ai/{model_key}", cost,
             f"{model_key} {duration}s aspect={aspect} audio={not audio_off}")
    print(f"\n  ✅ {out_path}  (${cost:.3f}, {out_path.stat().st_size/1e6:.1f}MB)")


if __name__ == "__main__":
    main()
