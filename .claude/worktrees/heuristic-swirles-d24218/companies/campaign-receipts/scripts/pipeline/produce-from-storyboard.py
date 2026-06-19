#!/usr/bin/env python3
"""
CR — storyboard-driven longform/short producer (Stage 1.5 driver).

Reads a storyboard JSON (NT v3 shape, see README in scripts/pipeline/) and
orchestrates the full render pipeline:

    1. VO generation        → elevenlabs-tts.py
    2. Per-clip render      → fal-video-premium.py | fal-kling-i2v.py |
                              fal-stills-gen.py + ffmpeg ken-burns
    3. Music cue generation → bake-music.py
    4. Assembly             → ffmpeg concat + sidechain duck + grade + bar + CTA
    5. Publish to public/longform/<slug>.mp4 or public/shorts/<slug>.mp4
    6. State + cost tracking (resumable on failure)

Usage:
    python3 produce-from-storyboard.py --storyboard eng/storyboards/foo.json
    python3 produce-from-storyboard.py --storyboard <path> --dry-run
    python3 produce-from-storyboard.py --storyboard <path> --resume

Pattern reference (READ-ONLY, no import): nt-ministry/scripts/produce-episode.py
"""
import argparse
import json
import os
import subprocess
import sys
import time
import datetime as dt
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
PIPE = CR / "scripts/pipeline"
COST_LOG = CR / "scripts/.external-costs.jsonl"
BUILD = CR / "_build"

# Vendor cost estimates (per second of generated video, USD).
# Mirror of fal-video-premium.py MODELS table + kling-i2v.
VENDOR_PRICE_PER_SEC = {
    "reuse": 0.00,
    "text-card": 0.00,
    "sora2": 0.10,
    "veo3-fast": 0.15,
    "veo3-standard": 0.40,
    "seedance": 0.30,         # currently disabled in fal-video-premium
    "kling3-pro": 0.17,
    "kling-i2v": 0.07,
    "wan": 0.06,              # placeholder estimate, fail-loud at runtime
    "wan-2.5": 0.06,
    "still": 0.04,            # FLUX-Pro per image, ken-burns animated
    "remotion": 0.00,         # local React render via /remotion/
    "hedra-character3": 0.10, # rough estimate per sec (~$0.80/8s clip)
    "politician-caricature": 0.04,  # FLUX Pro portrait; cached in public/brand/caricatures/
}

# ElevenLabs (per 1K chars amortized) — matches elevenlabs-tts.py
TTS_PRICE_PER_1K_CHARS = 0.22

# Final-output specs
ASSEMBLY_SPECS = {
    "16:9": {"bar_height": 60, "out_dir": "public/longform"},
    "9:16": {"bar_height": 100, "out_dir": "public/shorts"},
}


# -----------------------------------------------------------------------------
# Utilities
# -----------------------------------------------------------------------------

def now_iso():
    return dt.datetime.now().isoformat()


def log_cost(slug, vendor, cost_usd, note, **extra):
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": now_iso(),
        "issueId": slug,
        "vendor": vendor,
        "cost_usd": round(cost_usd, 4),
        "note": note,
        **extra,
    }
    with open(COST_LOG, "a") as f:
        f.write(json.dumps(entry) + "\n")


def load_storyboard(path):
    with open(path) as f:
        sb = json.load(f)
    required = ["slug", "clips"]
    for k in required:
        if k not in sb:
            raise ValueError(f"storyboard missing required field: {k}")
    return sb


def build_dir(slug, mkdir=False):
    d = BUILD / slug
    if mkdir:
        (d / "clips").mkdir(parents=True, exist_ok=True)
        (d / "music").mkdir(parents=True, exist_ok=True)
        (d / "vo").mkdir(parents=True, exist_ok=True)
    return d


def read_state(slug):
    p = build_dir(slug) / "state.json"
    if p.exists():
        return json.loads(p.read_text())
    return {"slug": slug, "started_at": now_iso(), "clips": {}, "vo": None,
            "music": {}, "assembled": False, "published": None, "total_spend_usd": 0.0}


def write_state(slug, state):
    p = build_dir(slug) / "state.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(state, indent=2))


# -----------------------------------------------------------------------------
# Cost estimation
# -----------------------------------------------------------------------------

def estimate_vo_cost(sb):
    path = sb.get("vo_script_path")
    if not path:
        return 0.0, 0
    p = (CR / path) if not Path(path).is_absolute() else Path(path)
    if not p.exists():
        return 0.0, 0
    chars = len(p.read_text())
    return chars / 1000 * TTS_PRICE_PER_1K_CHARS, chars


def estimate_clip_cost(clip):
    vendor = clip.get("vendor", "sora2")
    duration = clip.get("duration", 5)
    price = VENDOR_PRICE_PER_SEC.get(vendor, 0.10)
    if vendor in ("reuse", "text-card", "remotion"):
        return 0.0
    if vendor == "still":
        return price  # flat-per-image
    return duration * price


def estimate_music_cost(sb):
    # bake-music.py is local/free in NT pattern (suno is paid; not used here)
    # treat each cue as ~$0.00 placeholder until bake-music vendor is configured.
    return 0.0


def estimate_total(sb):
    vo_cost, vo_chars = estimate_vo_cost(sb)
    clip_costs = [(c["clip_id"], c.get("vendor"), c.get("duration"),
                   estimate_clip_cost(c)) for c in sb["clips"]]
    clip_total = sum(c[3] for c in clip_costs)
    music_total = estimate_music_cost(sb)
    return {
        "vo_cost_usd": round(vo_cost, 4),
        "vo_chars": vo_chars,
        "clip_costs": clip_costs,
        "clip_total_usd": round(clip_total, 4),
        "music_total_usd": round(music_total, 4),
        "total_usd": round(vo_cost + clip_total + music_total, 4),
    }


# -----------------------------------------------------------------------------
# Remotion props — resolve caricature_slug → absolute portrait path for <Img>
# -----------------------------------------------------------------------------

def enrich_remotion_props(props):
    """Copy portraits into remotion/public/cr-portraits/ for staticFile() loading."""
    import importlib.util
    import shutil
    spec = importlib.util.spec_from_file_location(
        "politician_caricature", PIPE / "politician-caricature.py"
    )
    pc = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pc)
    out = dict(props or {})
    candidates = out.get("candidates")
    if isinstance(candidates, list):
        pub = REPO / "remotion/public/cr-portraits"
        pub.mkdir(parents=True, exist_ok=True)
        resolved = []
        for c in candidates:
            row = dict(c)
            slug = row.pop("caricature_slug", None)
            if slug and not row.get("portrait"):
                p = pc.resolve_portrait_path(slug)
                if p:
                    ext = Path(p).suffix.lower() or ".jpg"
                    dest = pub / f"{slug}{ext}"
                    if not dest.exists() or dest.stat().st_mtime < Path(p).stat().st_mtime:
                        shutil.copy2(p, dest)
                    row["portrait"] = f"cr-portraits/{slug}{ext}"
            resolved.append(row)
        out["candidates"] = resolved
    return out


# -----------------------------------------------------------------------------
# Stages (live)
# -----------------------------------------------------------------------------

def run_production_qc(sb, sb_path, slug, piece=None, skip=False):
    """BINDING gate after assemble — blocks publish/upload upstream."""
    if skip:
        print("  [qc] production-qc skipped (--skip-production-qc)")
        return
    piece = piece or slug
    expect = sb.get("voice", "jessica")
    cmd = [
        "python3", str(PIPE / "production-qc.py"),
        "--storyboard", str(sb_path),
        "--piece", piece,
        "--expect-voice", expect,
    ]
    print(f"  [qc] {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


def stage_vo(sb, state, slug, dry_run, force_vo=False):
    vo_path = build_dir(slug, mkdir=True) / "vo.mp3"
    verify_fail = vo_path.with_suffix(".verify-FAILED.txt")
    if state.get("vo") and not force_vo and not verify_fail.exists():
        print(f"  [skip] VO already generated: {state['vo']}")
        return
    if verify_fail.exists():
        print(f"  [vo] prior verify-FAILED — regenerating VO")
        vo_path.unlink(missing_ok=True)
        verify_fail.unlink(missing_ok=True)
        state.pop("vo", None)
    script = sb.get("vo_script_path")
    if not script:
        print("  [skip] no vo_script_path in storyboard")
        return
    script_path = CR / script
    sqc = ["python3", str(PIPE / "script-qc.py"),
           "--script", str(script_path),
           "--report", str(build_dir(slug, mkdir=True) / "qc-script.md")]
    if script_path.name.endswith("-vo.txt"):
        sqc.append("--skip-storyteller")
    print(f"  [script-qc] {' '.join(sqc)}")
    if not dry_run:
        subprocess.run(sqc, check=True)
    voice = sb.get("voice", "jessica")
    vs = sb.get("voice_settings") or {}
    cmd = ["python3", str(PIPE / "elevenlabs-tts.py"),
           "--script", str(CR / script),
           "--out", str(vo_path),
           "--piece", slug,
           "--voice", voice,
           "--chunked"]  # per **VO:** block — avoids single-request quota spikes
    if vs.get("model"):
        cmd.extend(["--model", vs["model"]])
    print(f"  [vo] {' '.join(cmd)}")
    if dry_run:
        return
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError:
        vo_path.unlink(missing_ok=True)
        state.pop("vo", None)
        write_state(slug, state)
        raise
    state["vo"] = str(vo_path)
    state["assembled"] = False
    state.pop("published", None)
    write_state(slug, state)


def stage_clips(sb, state, slug, dry_run):
    for clip in sb["clips"]:
        cid = clip["clip_id"]
        if state["clips"].get(cid, {}).get("status") == "ok":
            print(f"  [skip] clip {cid} already rendered")
            continue
        vendor = clip.get("vendor", "sora2")
        duration = clip.get("duration", 5)
        prompt = clip.get("prompt", "")
        aspect = clip.get("aspect", "16:9")
        out = build_dir(slug, mkdir=True) / "clips" / f"{cid}.mp4"

        if vendor in ("sora2", "veo3-fast", "veo3-standard", "kling3-pro", "seedance"):
            cmd = ["python3", str(PIPE / "fal-video-premium.py"),
                   "--model", vendor,
                   "--prompt", prompt,
                   "--duration", str(duration),
                   "--aspect", aspect,
                   "--out", str(out),
                   "--piece", slug]
        elif vendor == "kling-i2v":
            seed = clip.get("seed_image") or clip.get("model_args", {}).get("seed_image")
            if not seed:
                raise ValueError(f"clip {cid}: kling-i2v requires seed_image")
            seed_path = (CR / seed) if not Path(seed).is_absolute() else Path(seed)
            if not seed_path.exists():
                raise FileNotFoundError(f"clip {cid}: seed image not found: {seed_path}")
            cmd = ["python3", str(PIPE / "fal-kling-i2v.py"),
                   "--image", str(seed_path),
                   "--prompt", prompt,
                   "--duration", str(duration),
                   "--out", str(out),
                   "--piece", slug]
        elif vendor in ("wan", "wan-2.5"):
            # Not yet wired into fal-video-premium MODELS. Fail loud.
            raise RuntimeError(f"clip {cid}: vendor '{vendor}' not yet supported by fal-video-premium.py")
        elif vendor == "reuse":
            src = clip.get("reuse_path", "")
            if not src:
                raise ValueError(f"clip {cid}: reuse requires reuse_path")
            src_path = (CR / src) if not Path(src).is_absolute() else Path(src)
            if not src_path.is_file():
                raise FileNotFoundError(f"clip {cid}: reuse source missing: {src_path}")
            if dry_run:
                continue
            # Fit the reuse source to its storyboard slot so the concatenated
            # master stays A/V-synced. If the source is SHORTER than the slot,
            # freeze the last frame for the remainder (tpad=clone); if LONGER,
            # trim. A raw copy of a 6s clip into a 15s slot silently desyncs the
            # whole timeline (founder frame-bug 2026-05-31).
            src_dur = _ffprobe_duration(src_path) or float(duration)
            slot = float(duration)
            if abs(src_dur - slot) < 0.25:
                import shutil
                shutil.copy2(src_path, out)
            elif src_dur > slot:
                subprocess.run([
                    "ffmpeg", "-y", "-i", str(src_path),
                    "-t", f"{slot:.3f}",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", str(out),
                ], check=True)
            else:
                # Hold the final frame for the remaining (slot - src_dur)s.
                pad = slot - src_dur
                subprocess.run([
                    "ffmpeg", "-y", "-i", str(src_path),
                    "-vf", f"tpad=stop_mode=clone:stop_duration={pad:.3f}",
                    "-af", f"apad=pad_dur={pad:.3f}",
                    "-t", f"{slot:.3f}",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", str(out),
                ], check=True)
            state["clips"][cid] = {"status": "ok", "path": str(out),
                                   "vendor": vendor, "duration": duration}
            write_state(slug, state)
            print(f"  [clip {cid}] reuse ({src_dur:.1f}s→{slot:.0f}s slot) → {out.name}")
            continue
        elif vendor == "text-card":
            card_id = clip.get("text_card_id") or cid
            png_out = out.parent / f"{card_id}.png"
            if dry_run:
                continue
            subprocess.run([
                "node", str(PIPE / "render-text-cards.mjs"),
                "--out-dir", str(out.parent),
                "--ids", card_id,
            ], check=True)
            if not png_out.is_file():
                raise FileNotFoundError(f"clip {cid}: text-card PNG not written: {png_out}")
            # stills_to_mp4 expects clips/{clip_id}.png — alias when text_card_id differs
            cid_png = out.with_suffix(".png")
            if png_out != cid_png:
                import shutil
                shutil.copy2(png_out, cid_png)
            state["clips"][cid] = {"status": "ok", "path": str(png_out),
                                   "vendor": vendor, "duration": duration}
            write_state(slug, state)
            print(f"  [clip {cid}] text-card → {png_out.name}")
            continue
        elif vendor in ("image-kenburns", "politician-caricature"):
            # Book-style caricature (Trump/Adelson lane). Prefer caricature_slug → politician-caricature.py cache.
            caric_slug = clip.get("caricature_slug")
            if vendor == "politician-caricature" and not caric_slug:
                raise ValueError(f"clip {cid}: politician-caricature requires caricature_slug")
            if caric_slug:
                if dry_run:
                    print(f"  [clip {cid}] caricature ensure {caric_slug} (dry-run)")
                    continue
                import importlib.util
                _spec = importlib.util.spec_from_file_location(
                    "politician_caricature", PIPE / "politician-caricature.py"
                )
                _pc = importlib.util.module_from_spec(_spec)
                _spec.loader.exec_module(_pc)
                src_path = _pc.ensure_caricature(caric_slug, piece_id=slug)
            else:
                img = clip.get("image_path") or clip.get("seed_image")
                if not img:
                    raise ValueError(f"clip {cid}: image-kenburns requires image_path or caricature_slug")
                src_path = (CR / img) if not Path(img).is_absolute() else Path(img)
                if not src_path.is_file():
                    raise FileNotFoundError(f"clip {cid}: image not found: {src_path}")
            if dry_run:
                continue
            import shutil
            ext = src_path.suffix.lower() or ".jpg"
            dest = out.with_suffix(ext)
            shutil.copy2(src_path, dest)
            state["clips"][cid] = {"status": "ok", "path": str(dest),
                                   "vendor": vendor, "duration": duration,
                                   "caricature_slug": caric_slug or None}
            write_state(slug, state)
            label = f"politician-caricature ({caric_slug})" if caric_slug else "image-kenburns"
            print(f"  [clip {cid}] {label} → {dest.name}")
            continue
        elif vendor == "still":
            cmd = ["python3", str(PIPE / "fal-stills-gen.py"),
                   "--prompt", prompt,
                   "--out", str(out.with_suffix(".jpg")),
                   "--piece", slug]
            # ken-burns ffmpeg wrapper appended post-run; see assemble stage.
        elif vendor == "remotion":
            # React-based programmatic video. $0 marginal cost.
            # Required clip fields: composition (name), props (dict).
            composition = clip.get("composition")
            props = dict(clip.get("props") or {})
            if not composition:
                raise ValueError(f"clip {cid}: remotion requires 'composition' field")
            # 2026-05-22: Remotion merges Root defaultProps — omitted keys inherit Iran/SEALED
            # studio defaults (founder QC: wrong caption on CR Bush CountUp).
            if composition == "VerdictStamp":
                props.setdefault("promise", "")
                props.setdefault("citation", "")
            if composition == "CountUp":
                props["caption"] = props.get("caption", "")
            props = enrich_remotion_props(props)
            import json as _json
            cmd = ["node", str(PIPE / "render-remotion.mjs"),
                   "--slug", slug,
                   "--composition", composition,
                   "--duration", str(duration),
                   "--props", _json.dumps(props),
                   "--out", str(out)]
        elif vendor == "hedra-character3":
            # Lip-synced talking-head from a portrait + audio clip.
            # Required clip fields: portrait (path), audio (path to VO chunk mp3).
            portrait = clip.get("portrait") or clip.get("seed_image")
            audio_chunk = clip.get("audio")
            if not portrait or not audio_chunk:
                raise ValueError(f"clip {cid}: hedra-character3 requires 'portrait' and 'audio' fields")
            cmd = ["python3", str(PIPE / "hedra-character3.py"),
                   "--portrait", portrait,
                   "--audio", audio_chunk,
                   "--duration", str(duration),
                   "--out", str(out)]
        else:
            raise ValueError(f"clip {cid}: unknown vendor '{vendor}'")

        print(f"  [clip {cid}] {vendor} {duration}s → {out.name}")
        if dry_run:
            continue
        try:
            subprocess.run(cmd, check=True)
            state["clips"][cid] = {"status": "ok", "path": str(out),
                                   "vendor": vendor, "duration": duration}
        except subprocess.CalledProcessError as e:
            state["clips"][cid] = {"status": "fail", "error": str(e)}
            write_state(slug, state)
            print(f"ERR clip {cid} failed; state saved. Re-run with --resume.", file=sys.stderr)
            sys.exit(2)
        write_state(slug, state)


def stage_music(sb, state, slug, dry_run):
    cues = sb.get("music_cues") or []
    if not cues:
        print("  [skip] no music cues")
        return
    ep_dir = build_dir(slug, mkdir=True)
    # bake-music.py takes --episode-dir; we write a cues.json there for it
    (ep_dir / "music-cues.json").write_text(json.dumps(cues, indent=2))
    cmd = ["python3", str(PIPE / "bake-music.py"),
           "--episode-dir", str(ep_dir)]
    print(f"  [music] {' '.join(cmd)} (cues={len(cues)})")
    if dry_run:
        return
    try:
        subprocess.run(cmd, check=True)
        state["music"] = {"cues": len(cues), "status": "ok"}
        write_state(slug, state)
    except subprocess.CalledProcessError as e:
        state["music"] = {"status": "fail", "error": str(e)}
        write_state(slug, state)
        print("WARN music cue baking failed; continuing without bed.", file=sys.stderr)


def _ffprobe_duration(path):
    """Return media duration in seconds (float), or None if probe fails."""
    try:
        out = subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
            stderr=subprocess.STDOUT,
        ).decode().strip()
        return float(out) if out else None
    except (subprocess.CalledProcessError, ValueError):
        return None


def invalidate_still_clips(sb, slug):
    """Drop stale ken-burns mp4s so stills_to_mp4 re-encodes with current fill-crop."""
    clips_dir = build_dir(slug) / "clips"
    norm_dir = build_dir(slug) / "clips_norm"
    n = 0
    for clip in sb["clips"]:
        if clip.get("vendor") not in ("image-kenburns", "politician-caricature", "still", "text-card"):
            continue
        cid = clip["clip_id"]
        for d in (clips_dir, norm_dir):
            for ext in (".mp4",):
                p = d / f"{cid}{ext}"
                if p.exists():
                    p.unlink()
                    n += 1
    if n:
        print(f"  [stills] invalidated {n} clip mp4(s) for re-encode")


def stills_to_mp4(sb, state, slug, dry_run):
    """Bug-2 fix: convert any clip whose render produced a .png (FLUX still)
    into a ken-burns mp4 with a silent stereo audio track. Idempotent: skips
    if a same-named .mp4 already exists with the right duration.

    Spec: 1280x720, 30fps, libx264 yuv420p, slow zoom 1.0 -> 1.10 over the
    clip's storyboard duration, silent aac stereo so downstream concat-with-
    audio does not blow up on missing audio streams."""
    ep_dir = build_dir(slug)
    clips_dir = ep_dir / "clips"
    converted = 0
    for clip in sb["clips"]:
        cid = clip["clip_id"]
        st = state["clips"].get(cid, {})
        if st.get("status") != "ok":
            continue
        mp4 = clips_dir / f"{cid}.mp4"
        still = clips_dir / f"{cid}.png"
        if not still.exists():
            for ext in (".jpg", ".jpeg", ".webp"):
                alt = clips_dir / f"{cid}{ext}"
                if alt.exists():
                    still = alt
                    break
            else:
                continue  # not a still output
        png = still
        # storyboard uses "duration" (seconds); accept "duration_s" too
        dur = int(clip.get("duration", clip.get("duration_s", 5)) or 5)
        # idempotent skip — also re-encode when source still is newer than mp4
        if mp4.exists():
            existing = _ffprobe_duration(mp4)
            still_newer = png.stat().st_mtime > mp4.stat().st_mtime + 1
            if existing is not None and abs(existing - dur) < 0.25 and not still_newer:
                continue
        frames = max(1, dur * 30)
        vendor = clip.get("vendor", "")
        # framing: contain = pad to 16:9 (portraits); cover = fill-crop (scenic). Default contain for faces.
        framing = clip.get("framing") or (
            "contain" if vendor in ("politician-caricature", "image-kenburns") else "cover"
        )
        # 2026-05-22: text-card PNGs must hold static — zoompan trembles for 7–23s.
        if vendor == "text-card":
            vf = (
                "scale=1280:720:force_original_aspect_ratio=decrease,"
                "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0xfaf7ef"
            )
            zoom_note = "static hold"
        elif framing == "contain":
            # Founder lock 2026-05-22: tight face crop confused viewers — show full portrait in frame.
            vf = (
                "scale=1280:720:force_original_aspect_ratio=decrease,"
                "pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0xfaf7ef,"
                f"zoompan=z='min(zoom+0.0003,1.03)':d={frames}:s=1280x720:fps=30"
            )
            zoom_note = "contain + gentle zoom"
        else:
            vf = (
                "scale=1280:720:force_original_aspect_ratio=increase,"
                "crop=1280:720,"
                f"zoompan=z='min(zoom+0.0007,1.08)':d={frames}:s=1280x720:fps=30"
            )
            zoom_note = "fill-crop + zoom"
        cmd = [
            "ffmpeg", "-y", "-loop", "1", "-framerate", "30",
            "-t", str(dur), "-i", str(png),
            "-f", "lavfi", "-t", str(dur), "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
            "-vf", vf,
            "-c:v", "libx264", "-preset", "medium", "-crf", "20",
            "-pix_fmt", "yuv420p", "-r", "30",
            "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
            "-shortest",
            str(mp4),
        ]
        print(f"  [still->mp4] {cid} ({dur}s, {zoom_note})")
        if dry_run:
            continue
        subprocess.run(cmd, check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        converted += 1
    if converted:
        print(f"  [still->mp4] converted {converted} PNG still(s) to mp4")


def _normalize_clips(sb, ep_dir):
    """Re-encode every clip to identical specs so concat demuxer succeeds.
    Mixed sample rates (44.1k/96k), differing pixfmt, or missing audio
    streams across clips break concat. We force 1280x720@30, h264 yuv420p,
    aac stereo 48k. Outputs land in clips_norm/ alongside clips/.
    Idempotent per-clip by size+duration match."""
    clips_dir = ep_dir / "clips"
    norm_dir = ep_dir / "clips_norm"
    norm_dir.mkdir(parents=True, exist_ok=True)
    for clip in sb["clips"]:
        cid = clip["clip_id"]
        src = clips_dir / f"{cid}.mp4"
        dst = norm_dir / f"{cid}.mp4"
        dur = int(clip.get("duration", clip.get("duration_s", 5)) or 5)
        if dst.exists():
            d = _ffprobe_duration(dst)
            if d is not None and abs(d - dur) < 0.5:
                continue
        # Detect whether the source clip carries an audio stream — kling-i2v
        # and sora2 outputs are frequently video-only. We always emit a
        # uniform aac/48k/stereo track so concat sees identical specs.
        has_audio = subprocess.check_output(
            ["ffprobe", "-v", "error", "-select_streams", "a",
             "-show_entries", "stream=codec_type",
             "-of", "default=noprint_wrappers=1:nokey=1", str(src)]
        ).decode().strip() == "audio"
        if has_audio:
            cmd = [
                "ffmpeg", "-y", "-i", str(src),
                "-filter_complex",
                f"[0:v]scale=1280:720:force_original_aspect_ratio=decrease,"
                f"pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v];"
                f"[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a]",
                "-map", "[v]", "-map", "[a]",
            ]
        else:
            cmd = [
                "ffmpeg", "-y", "-i", str(src),
                "-f", "lavfi", "-t", str(dur), "-i",
                "anullsrc=channel_layout=stereo:sample_rate=48000",
                "-filter_complex",
                f"[0:v]scale=1280:720:force_original_aspect_ratio=decrease,"
                f"pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v];"
                f"[1:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a]",
                "-map", "[v]", "-map", "[a]",
            ]
        cmd += [
            "-c:v", "libx264", "-preset", "fast", "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2",
            "-t", str(dur), "-shortest",
            str(dst),
        ]
        subprocess.run(cmd, check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return norm_dir


def stage_assemble(sb, state, slug, dry_run):
    """Assemble master.mp4: video-only concat + (VO ducks music) mix.

    Driver-bug history (2026-05-21): the previous recipe concat'd clips
    with audio and tried [0:a][1:a]sidechain. Some vendors (notably
    kling-i2v) return *video-only* mp4s. Heterogeneous audio streams
    crashed the concat demuxer (exit 234), and a manual recovery
    produced a video-only master — shipped silent to YouTube. Fix:
    normalize every clip to {1280x720, 30fps, silent stereo AAC},
    concat video-only, then synthesize the audio bed from VO + ducked
    music as the sole audio source. This is robust no matter what
    streams the upstream vendors emit. Will protect all 144 remaining
    long-forms in the queue.

    Music asset: companies/concise-sealed/public/movie/_build_v4/music.mp3
    (Incompetech "Impact Prelude", CC-BY). Looped to clip length, ducked
    via sidechain compressor when VO is present, mixed -6 dB below VO.
    """
    ep_dir = build_dir(slug)
    aspect = sb["clips"][0].get("aspect", "16:9") if sb["clips"] else "16:9"
    specs = ASSEMBLY_SPECS.get(aspect, ASSEMBLY_SPECS["16:9"])
    master = ep_dir / "master.mp4"
    music_src = REPO / "companies/concise-sealed/public/movie/_build_v4/music.mp3"
    target_w, target_h = (1280, 720) if aspect == "16:9" else (1080, 1920)

    # --- Step A: normalize every clip to a uniform spec (silent audio) ---
    norm_dir = ep_dir / "clips_norm"
    norm_dir.mkdir(exist_ok=True)
    concat_list = ep_dir / "concat_norm.txt"
    lines = []
    for clip in sb["clips"]:
        cid = clip["clip_id"]
        src = ep_dir / "clips" / f"{cid}.mp4"
        dst = norm_dir / f"{cid}.mp4"
        if not dry_run and (not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime):
            # Get source duration so we don't drift
            dur = subprocess.run(
                ["ffprobe", "-v", "error", "-show_entries", "format=duration",
                 "-of", "csv=p=0", str(src)],
                capture_output=True, text=True, check=True
            ).stdout.strip() or "5"
            subprocess.run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-i", str(src),
                "-f", "lavfi", "-t", dur, "-i",
                "anullsrc=channel_layout=stereo:sample_rate=44100",
                "-map", "0:v:0", "-map", "1:a:0",
                "-vf", f"scale={target_w}:{target_h}:force_original_aspect_ratio=decrease,"
                       f"pad={target_w}:{target_h}:(ow-iw)/2:(oh-ih)/2:color=black,"
                       f"setsar=1,fps=30",
                "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-ac", "2",
                "-shortest", str(dst),
            ], check=True)
        lines.append(f"file '{dst}'")
    concat_list.write_text("\n".join(lines) + "\n")

    # --- Step B: video-only concat ---
    video_only = ep_dir / "master_video.mp4"
    grade = "eq=saturation=1.10:contrast=1.05"
    bar_h = specs["bar_height"]
    cmd_v = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-an",
        "-vf", f"{grade},drawbox=y=ih-{bar_h}:w=iw:h={bar_h}:color=black@0.85:t=fill",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-pix_fmt", "yuv420p", str(video_only),
    ]
    print(f"  [assemble] {len(sb['clips'])} clips → {master.name}  (aspect {aspect}, bar {bar_h}px)")
    if dry_run:
        print(f"  [assemble] cmd preview: video-concat + VO/music mix (audio fix 2026-05-21)")
        return
    subprocess.run(cmd_v, check=True)

    # --- Step C: build music bed looped to video duration, normalized ---
    dur = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(video_only)],
        capture_output=True, text=True, check=True
    ).stdout.strip()
    music_bed = ep_dir / "music_bed.m4a"
    if music_src.exists():
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-stream_loop", "-1", "-i", str(music_src),
            "-t", dur,
            "-filter:a", "volume=0.9,loudnorm=I=-22:TP=-1.5",
            "-c:a", "aac", "-b:a", "192k", str(music_bed),
        ], check=True)
    else:
        # No music available: synthesize silence so downstream mix still works
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "lavfi", "-t", dur,
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-c:a", "aac", "-b:a", "192k", str(music_bed),
        ], check=True)

    # --- Step D: normalize VO and pad with silence to video duration ---
    vo_norm = ep_dir / "vo_norm.m4a"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(ep_dir / "vo.mp3"),
        "-filter:a", "loudnorm=I=-16:TP=-1.5:LRA=11",
        "-c:a", "aac", "-b:a", "192k", str(vo_norm),
    ], check=True)
    vo_dur_str = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(vo_norm)],
        capture_output=True, text=True, check=True
    ).stdout.strip()
    pad = max(0.0, float(dur) - float(vo_dur_str))
    vo_ext = ep_dir / "vo_ext.m4a"
    if pad > 0.05:
        subprocess.run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(vo_norm),
            "-f", "lavfi", "-t", f"{pad:.3f}",
            "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
            "-filter_complex", "[0:a][1:a]concat=n=2:v=0:a=1[vo_ext]",
            "-map", "[vo_ext]", "-c:a", "aac", "-b:a", "192k", str(vo_ext),
        ], check=True)
    else:
        subprocess.run(["cp", str(vo_norm), str(vo_ext)], check=True)

    # --- Step E: sidechain-duck music against VO, mix to single track ---
    sidechain = "sidechaincompress=threshold=0.03:ratio=20:attack=120:release=500"
    mix = ep_dir / "mix.m4a"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(vo_ext), "-i", str(music_bed),
        "-filter_complex",
        f"[0:a]asplit=2[vo1][vo_sc];"
        f"[1:a][vo_sc]{sidechain}[bed_ducked];"
        f"[vo1][bed_ducked]amix=inputs=2:duration=longest:weights='1.0 0.7':normalize=0[m];"
        f"[m]alimiter=limit=0.97[a]",
        "-map", "[a]", "-c:a", "aac", "-b:a", "192k",
        "-ar", "44100", "-ac", "2", str(mix),
    ], check=True)

    # --- Step F: mux video + mixed audio ---
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(video_only), "-i", str(mix),
        "-map", "0:v", "-map", "1:a",
        "-c:v", "copy", "-c:a", "copy",
        "-movflags", "+faststart",
        str(master),
    ], check=True)

    # --- Step G: post-flight verification — fail loud if audio is silent ---
    vd = subprocess.run(
        ["ffmpeg", "-i", str(master), "-af", "volumedetect", "-f", "null", "-"],
        capture_output=True, text=True
    )
    if "mean_volume:" in vd.stderr:
        mean_line = [l for l in vd.stderr.splitlines() if "mean_volume:" in l][0]
        mean_db = float(mean_line.split("mean_volume:")[1].split("dB")[0].strip())
        if mean_db < -60:
            raise RuntimeError(
                f"[assemble] post-flight audio check FAILED: mean_volume={mean_db} dB. "
                f"Master would ship silent. Aborting before publish."
            )
        print(f"  [assemble] audio OK  mean_volume={mean_db:.1f} dB")
    state["assembled"] = True
    write_state(slug, state)


def stage_publish(sb, state, slug, dry_run):
    aspect = sb["clips"][0].get("aspect", "16:9") if sb["clips"] else "16:9"
    specs = ASSEMBLY_SPECS.get(aspect, ASSEMBLY_SPECS["16:9"])
    out_dir = CR / specs["out_dir"]
    final = out_dir / f"{slug}.mp4"
    print(f"  [publish] {final}")
    if dry_run:
        return
    out_dir.mkdir(parents=True, exist_ok=True)
    src = build_dir(slug) / "master.mp4"
    subprocess.run(["cp", str(src), str(final)], check=True)
    state["published"] = str(final)
    write_state(slug, state)


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def print_plan(sb, est):
    print("="*72)
    print(f"PLAN  slug={sb['slug']}  duration={sb.get('total_duration_seconds','?')}s  clips={len(sb['clips'])}")
    print("="*72)
    print(f"  VO:    {est['vo_chars']:,} chars  →  ${est['vo_cost_usd']:.3f}")
    print(f"  Clips ({len(est['clip_costs'])}):")
    for cid, vendor, dur, cost in est["clip_costs"]:
        print(f"    {cid}  {vendor:14s}  {dur}s   ${cost:.3f}")
    print(f"  Clip total:   ${est['clip_total_usd']:.3f}")
    print(f"  Music cues:   ${est['music_total_usd']:.3f}  ({len(sb.get('music_cues',[]))} cues)")
    print(f"  ──────────────────────────────")
    print(f"  TOTAL EST:    ${est['total_usd']:.3f}")
    print("="*72)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--storyboard", required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--resume", action="store_true",
                    help="Skip already-rendered clips per state.json")
    ap.add_argument("--skip-vo", action="store_true")
    ap.add_argument("--skip-music", action="store_true")
    ap.add_argument("--skip-publish", action="store_true")
    ap.add_argument("--clips-only", action="store_true")
    ap.add_argument("--assemble-only", action="store_true")
    ap.add_argument("--force-vo", action="store_true",
                    help="Regenerate VO even if state.json has vo (e.g. after verify-FAILED)")
    ap.add_argument("--skip-production-qc", action="store_true",
                    help="Emergency only — skips binding production-qc after assemble")
    ap.add_argument("--skip-copy-lock", action="store_true",
                    help="Emergency only — skips copy lock (storyline + panel SHIP)")
    ap.add_argument("--piece", help="cost-log piece id for production-qc (default: slug)")
    args = ap.parse_args()

    sb_path = Path(args.storyboard)
    if not sb_path.is_absolute():
        sb_path = CR / sb_path
    sb = load_storyboard(sb_path)
    slug = sb["slug"]

    est = estimate_total(sb)
    print_plan(sb, est)

    if args.dry_run:
        print("\nDRY RUN — no API calls, no spend. Plan above.")
        return 0

    # Story score COPY 100/100 — advisory self-check rubric, NOT a binding gate
    # (founder doctrine 2026-05-25). Skipped as a unit with copy-lock via --skip-copy-lock.
    # On --resume (re-render/reroll of an already-built piece) the copy was locked on the
    # first build, so these advisory pre-flights must NOT re-block a downstream-only change
    # (founder 2026-06-01: a 1-word newsletter edit was wrongly blocked here on resume).
    if not args.skip_copy_lock and not args.resume:
        score_slug = sb.get("story_score_slug") or slug
        print(f"\n[0a] Story score COPY 100/100 ({score_slug})")
        subprocess.run(
            ["python3", str(PIPE / "story-score-lock.py"), "--slug", score_slug, "--phase", "copy"],
            check=True,
        )

    # Copy lock — storyline + panel SHIP before any TTS/render spend (see docs/CR-COPY-PIPELINE.md)
    if not args.skip_copy_lock and not args.resume:
        print("\n[0b] Copy lock (storyline + panel)")
        subprocess.run(["python3", str(PIPE / "copy-lock.py"), "--slug", slug], check=True)

    state = read_state(slug) if args.resume else {
        "slug": slug, "started_at": now_iso(), "clips": {}, "vo": None,
        "music": {}, "assembled": False, "published": None, "total_spend_usd": 0.0
    }
    if args.assemble_only:
        state = read_state(slug)
        print("\n[4/5] Assemble only")
        stage_assemble(sb, state, slug, dry_run=False)
        print("\n[QC] production-qc")
        run_production_qc(sb, sb_path, slug, piece=args.piece, skip=args.skip_production_qc)
        if not args.skip_publish:
            print("\n[5/5] Publish")
            stage_publish(sb, state, slug, dry_run=False)
        print(f"\nDONE  master={build_dir(slug) / 'master.mp4'}")
        return 0

    if not args.resume:
        write_state(slug, state)

    if True:
        if not args.skip_vo:
            print("\n[1/5] VO");        stage_vo(sb, state, slug, dry_run=False, force_vo=args.force_vo)
        else:
            print("\n[1/5] VO skipped")
        print("\n[2/5] Clips");     stage_clips(sb, state, slug, dry_run=False)
        if args.force_vo:
            invalidate_still_clips(sb, slug)
        print("\n[2b] PNG→MP4");    stills_to_mp4(sb, state, slug, dry_run=False)
        if args.clips_only:
            print("\nDONE clips-only")
            return 0
        if not args.skip_music:
            print("\n[3/5] Music");     stage_music(sb, state, slug, dry_run=False)
        else:
            print("\n[3/5] Music skipped")
    if not args.clips_only:
        print("\n[4/5] Assemble");  stage_assemble(sb, state, slug, dry_run=False)
        print("\n[QC] production-qc")
        run_production_qc(sb, sb_path, slug, piece=args.piece, skip=args.skip_production_qc)
        if not args.skip_publish:
            print("\n[5/5] Publish");   stage_publish(sb, state, slug, dry_run=False)
        else:
            print("\n[5/5] Publish skipped")

    print(f"\nDONE  master={state.get('published')}  state={build_dir(slug)/'state.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
