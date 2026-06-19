#!/usr/bin/env python3
"""
Cut 9:16 vertical Shorts from a body video.

Each Short structure:
  0.0 - 2.5s   = QUESTION HOOK card (dark backdrop + bold question)
  2.5 - 27.5s  = BODY (cropped 9:16 from source) + selective punchline overlays
  27.5 - 30.5s = FOOTER (channel handle)
Audio: original VO from body (no music bed by default).

Reads:
  content/videos/<slug>/shorts-cuts-v2.json
  content/videos/<slug>/body-v2.mp4
  content/videos/<slug>/audio-qa/body-v2.transcript.json (word-level scribe)

Writes:
  content/videos/<slug>/shorts-v2/short-NN.mp4

Usage:
    python3 cut-shorts-v2.py --episode-dir content/videos/<slug>
    python3 cut-shorts-v2.py --episode-dir <dir> --only short-08
"""
import json, os, sys, subprocess, re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"


def run(cmd, check=True):
    pretty = ' '.join(str(c) for c in cmd)
    print(f"  $ {pretty[:200]}{'...' if len(pretty)>200 else ''}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0 and check:
        err = r.stderr
        for marker in ["Error", "Invalid", "Cannot find", "moov atom"]:
            if marker in err:
                idx = err.find(marker)
                print(f"  >>> {err[max(0,idx-200):idx+500]}")
                break
        else:
            print(f"  STDERR (last 1500): {err[-1500:]}")
        raise SystemExit(f"ffmpeg failed: {cmd[0]}")
    return r


def probe_duration(p):
    r = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1", str(p)]).decode().strip()
    return float(r) if r else 0.0


def find_anchor_time(words, anchor_substring):
    """Slide window through word stream; find where consecutive words form the anchor.
    Returns (start_s, end_s) of the matched span, or None.
    """
    needle = re.sub(r"\s+", " ", anchor_substring.lower()).strip()
    if not needle: return None
    tokens = [(w["text"].strip(), w["start"], w["end"])
              for w in words if w.get("type") == "word" and w.get("text", "").strip()]
    n = len(tokens)
    needle_words = needle.split()
    win = len(needle_words)
    for i in range(n - win + 1):
        chunk = " ".join(t[0] for t in tokens[i:i+win]).lower()
        chunk_norm = re.sub(r"[^\w\s]", "", chunk)
        if needle in chunk_norm or needle in chunk:
            return tokens[i][1], tokens[i+win-1][2]
    # Try slightly larger windows
    for i in range(n):
        for w_extra in (win+1, win+2, win+3):
            if i + w_extra > n: break
            chunk = " ".join(t[0] for t in tokens[i:i+w_extra]).lower()
            chunk_norm = re.sub(r"[^\w\s]", "", chunk)
            if needle in chunk_norm or needle in chunk:
                return tokens[i][1], tokens[i+w_extra-1][2]
    return None


def get_font(size, bold=True):
    cands = [
        "/System/Library/Fonts/Supplemental/Georgia Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    p = next((f for f in cands if Path(f).exists()), None)
    return ImageFont.truetype(p, size) if p else ImageFont.load_default()


def wrap_text(draw, text, font, max_w):
    words = text.split()
    lines, cur = [], []
    for w in words:
        test = " ".join(cur + [w])
        bbox = draw.textbbox((0,0), test, font=font)
        if bbox[2] - bbox[0] > max_w and cur:
            lines.append(" ".join(cur)); cur = [w]
        else:
            cur.append(w)
    if cur: lines.append(" ".join(cur))
    return lines


def render_hook_card(question, out_path):
    """Full 1080x1920 dark card with the big question, vertically centered."""
    img = Image.new("RGBA", (1080, 1920), (15, 12, 8, 255))  # near-black warm
    draw = ImageDraw.Draw(img)
    font = get_font(76, bold=True)
    lines = wrap_text(draw, question, font, max_w=960)
    line_h = 96
    total_h = len(lines) * line_h
    y = (1920 - total_h) // 2
    for line in lines:
        bbox = draw.textbbox((0,0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (1080 - tw) // 2
        draw.text((x+3, y+3), line, font=font, fill=(0,0,0,255))         # shadow
        draw.text((x, y), line, font=font, fill=(245, 241, 232, 255))   # cream text
        y += line_h
    img.save(out_path, "PNG")


def render_overlay_strip(text, out_path):
    """1080x1920 transparent PNG with a punchline strip at ~62% height."""
    img = Image.new("RGBA", (1080, 1920), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    font = get_font(62, bold=True)
    lines = wrap_text(draw, text, font, max_w=960)
    line_h = 82
    total_h = len(lines) * line_h
    band_y = int(1920 * 0.62)
    pad_y = 28
    draw.rectangle([0, band_y - pad_y, 1080, band_y + total_h + pad_y], fill=(0,0,0,217))
    y = band_y
    for line in lines:
        bbox = draw.textbbox((0,0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (1080 - tw) // 2
        draw.text((x+2, y+2), line, font=font, fill=(0,0,0,255))
        draw.text((x, y), line, font=font, fill=(245, 241, 232, 255))
        y += line_h
    img.save(out_path, "PNG")


def render_footer(text, out_path):
    """1080x1920 with a small footer strip near the bottom."""
    img = Image.new("RGBA", (1080, 1920), (0,0,0,0))
    draw = ImageDraw.Draw(img)
    font = get_font(44, bold=False)
    bbox = draw.textbbox((0,0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    bg_x = (1080 - tw) // 2 - 24
    bg_y = 1720
    draw.rectangle([bg_x, bg_y - 12, bg_x + tw + 48, bg_y + th + 22], fill=(43,40,32,217))
    draw.text(((1080-tw)//2, bg_y), text, font=font, fill=(245,241,232,255))
    img.save(out_path, "PNG")


def cut_short(short, body_path, words, out_dir, hook_duration=2.5, footer_duration=3.0):
    sid = short["id"]
    hook_q = short["hook_question"]
    footer_text = short.get("footer", "Watch full episode → @NewTestamentOnly")
    overlays = short.get("punchline_overlays", [])
    anchor_text = short.get("body_match_anchor", short.get("anchor_line_text", ""))

    match = find_anchor_time(words, anchor_text)
    if not match:
        print(f"  ⚠️  {sid}: anchor '{anchor_text}' not found in transcript — skipping")
        return None
    anchor_start, _ = match

    body_dur = probe_duration(body_path)
    cut_start = max(0, anchor_start - 1.5)
    body_section_s = 28.0
    cut_end = min(body_dur, cut_start + body_section_s)
    body_section_s = cut_end - cut_start
    total_dur = hook_duration + body_section_s

    print(f"  {sid}: anchor @ {anchor_start:.1f}s → cut {cut_start:.1f}-{cut_end:.1f}s → total {total_dur:.1f}s")

    work_dir = out_dir / "_work"
    work_dir.mkdir(exist_ok=True)
    hook_png = work_dir / f"{sid}_hook.png"
    footer_png = work_dir / f"{sid}_footer.png"
    overlay_pngs = []
    render_hook_card(hook_q, hook_png)
    render_footer(footer_text, footer_png)
    for i, ov in enumerate(overlays):
        p = work_dir / f"{sid}_ov{i}.png"
        render_overlay_strip(ov["text"], p)
        overlay_pngs.append((p, ov["t"], ov.get("duration", 3.0)))

    # SINGLE-PASS filter_complex
    inputs = [
        "-ss", f"{cut_start:.3f}", "-t", f"{body_section_s:.3f}", "-i", str(body_path),
        "-loop", "1", "-t", f"{hook_duration:.3f}", "-i", str(hook_png),
    ]
    for png, ov_t, ov_dur in overlay_pngs:
        inputs.extend(["-loop", "1", "-t", f"{ov_dur:.3f}", "-i", str(png)])
    inputs.extend(["-loop", "1", "-t", f"{footer_duration:.3f}", "-i", str(footer_png)])

    n_ov = len(overlay_pngs)
    footer_idx = 2 + n_ov

    chain = []
    # Crop body 9:16 from 16:9 source: 608x1080 then scale to 1080x1920
    chain.append("[0:v]crop=608:1080:(in_w-608)/2:0,scale=1080:1920,setsar=1,fps=30,format=yuv420p[bodyv]")
    chain.append("[0:a]aresample=48000,aformat=channel_layouts=stereo[bodya]")
    chain.append("[1:v]scale=1080:1920,setsar=1,fps=30,format=yuv420p[hookv]")
    chain.append(f"anullsrc=channel_layout=stereo:sample_rate=48000:duration={hook_duration:.3f}[hooka]")
    chain.append("[hookv][hooka][bodyv][bodya]concat=n=2:v=1:a=1[v0][aout]")

    last_v = "[v0]"
    for i, (png, ov_t, ov_dur) in enumerate(overlay_pngs):
        idx = 2 + i
        global_t = hook_duration + ov_t
        global_end = global_t + ov_dur
        out_label = f"[v{i+1}]"
        chain.append(f"{last_v}[{idx}:v]overlay=0:0:enable='between(t,{global_t:.2f},{global_end:.2f})'{out_label}")
        last_v = out_label

    footer_start = total_dur - footer_duration
    chain.append(f"{last_v}[{footer_idx}:v]overlay=0:0:enable='gte(t,{footer_start:.2f})'[vout]")

    full_filter = ";".join(chain)
    out_path = out_dir / f"{sid}.mp4"
    cmd = ["ffmpeg", "-y"] + inputs + [
        "-filter_complex", full_filter,
        "-map", "[vout]", "-map", "[aout]",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "fast", "-crf", "21",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(out_path)
    ]
    run(cmd)
    return out_path


def main():
    args = sys.argv[1:]
    def get(f, d=None):
        if f in args: i = args.index(f); return args[i+1] if i+1 < len(args) else d
        return d
    if "--help" in args:
        print(__doc__); return

    ep_dir_arg = get("--episode-dir")
    if not ep_dir_arg:
        print("ERR: --episode-dir required", file=sys.stderr); sys.exit(1)
    ep = Path(ep_dir_arg)
    if not ep.is_absolute(): ep = CR / ep
    only = get("--only")

    cuts_path = ep / "shorts-cuts-v2.json"
    body = ep / "body-v2.mp4"
    transcript = ep / "audio-qa" / "body-v2.transcript.json"

    for p, name in [(cuts_path, "shorts-cuts-v2.json"), (body, "body-v2.mp4"), (transcript, "transcript")]:
        if not p.exists():
            print(f"ERR: {name} not found at {p}", file=sys.stderr); sys.exit(1)

    cuts = json.loads(cuts_path.read_text())
    shorts = cuts.get("shorts", [])
    if only:
        shorts = [s for s in shorts if s["id"] == only]
        if not shorts:
            print(f"ERR: no short matching --only {only}", file=sys.stderr); sys.exit(1)

    tr = json.loads(transcript.read_text())
    words = tr.get("words", [])
    print(f"Loaded {len(words)} transcript tokens")

    out_dir = ep / "shorts-v2"
    out_dir.mkdir(exist_ok=True)

    print(f"\nCutting {len(shorts)} Shorts → {out_dir}/")
    successes, fails = [], []
    for s in shorts:
        sid = s["id"]
        print(f"\n=== {sid}: {s['hook_question'][:60]} ===")
        try:
            out = cut_short(s, body, words, out_dir)
            if out:
                size = out.stat().st_size / 1e6
                dur = probe_duration(out)
                print(f"  ✅ {out.name} — {dur:.1f}s, {size:.1f}MB")
                successes.append(out)
            else:
                fails.append(sid)
        except SystemExit:
            print(f"  ⚠️  {sid} failed")
            fails.append(sid)

    work = out_dir / "_work"
    if work.exists():
        for f in work.iterdir(): f.unlink()
        work.rmdir()

    print(f"\n=== Done — {len(successes)}/{len(shorts)} succeeded ===")
    if fails: print(f"   Failed: {fails}")


if __name__ == "__main__":
    main()
