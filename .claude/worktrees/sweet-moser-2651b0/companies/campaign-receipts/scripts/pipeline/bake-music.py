#!/usr/bin/env python3
"""
Stage 12.5 — Bake music cues into body video.

Reads music-cues.yaml. Each cue carries either:
  - track_file: relative path to existing mp3, OR
  - prompt: AI-generates via fal-music-gen.py (cached by prompt hash)

Mixes cues at their start_s/end_s with fade-in/fade-out + level_db,
then mixes the resulting music track UNDER the body VO.

Output: body-with-music.mp4 (same video, original VO + music bed).

Usage:
    python3 bake-music.py --episode-dir content/videos/<slug>
    python3 bake-music.py --episode-dir <dir> --dry-run
"""
import json, os, sys, subprocess, hashlib, re
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERR: pyyaml required", file=sys.stderr); sys.exit(1)

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
AI_MUSIC_GEN = CR / "scripts/fal-music-gen.py"
AI_CACHE = CR / "brand/music/library/ai-cache"


def run(cmd, log_handle=None, check=True):
    print(f"$ {' '.join(str(c) for c in cmd)[:220]}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if log_handle: log_handle.write(r.stderr[-3000:] + "\n---\n")
    if r.returncode != 0 and check:
        print(f"STDERR (last 1500): {r.stderr[-1500:]}")
        raise SystemExit("ffmpeg failed")
    return r


def probe_duration(p):
    r = subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration",
        "-of","default=noprint_wrappers=1:nokey=1", str(p)]).decode().strip()
    return float(r) if r else 0.0


def build_prompt(cue):
    if cue.get("prompt"): return cue["prompt"]
    parts = []
    m = cue.get("mood")
    if m: parts.append(", ".join(m) if isinstance(m,list) else m)
    if cue.get("instrumentation"): parts.append(cue["instrumentation"])
    if cue.get("key"): parts.append(f"in {cue['key']}")
    if cue.get("tempo_bpm"): parts.append(f"{cue['tempo_bpm']} BPM")
    parts.append("instrumental, contemplative, no vocals, no drums")
    return ", ".join(parts) or "calm instrumental cinematic"


def cue_cache_path(cue, duration_s):
    prompt = build_prompt(cue)
    key = hashlib.sha256(f"{prompt}|{duration_s:.1f}".encode()).hexdigest()[:16]
    safe = re.sub(r"[^\w-]", "-", cue.get("id","cue"))[:32]
    return AI_CACHE / f"{safe}-{key}.mp3"


def generate_cue(cue, slug):
    dur = cue["end_s"] - cue["start_s"]
    gen_dur = max(5.0, dur + 4)  # 4s headroom for fade
    out = cue_cache_path(cue, gen_dur)
    if out.exists() and out.stat().st_size > 10000:
        return out
    out.parent.mkdir(parents=True, exist_ok=True)
    prompt = build_prompt(cue)
    print(f"  🎵 gen cue '{cue['id']}' ({gen_dur:.1f}s): {prompt[:100]}")
    try:
        subprocess.check_call(["python3", str(AI_MUSIC_GEN),
            "--prompt", prompt, "--duration", f"{gen_dur:.1f}",
            "--out", str(out), "--piece", slug])
    except subprocess.CalledProcessError:
        print(f"  ⚠️  AI gen failed for '{cue['id']}'")
        return None
    return out if out.exists() else None


def build_music_track(cues, body_dur, work_dir, log_handle, slug):
    work_dir.mkdir(exist_ok=True)
    segments = []
    for cue in cues:
        if cue.get("type") != "music": continue
        if "track_file" in cue:
            track_file = CR / cue["track_file"] if not Path(cue["track_file"]).is_absolute() else Path(cue["track_file"])
            if not track_file.exists():
                print(f"  ⚠️  cue '{cue['id']}' track_file missing → {track_file}")
                continue
        else:
            track_file = generate_cue(cue, slug)
            if not track_file:
                print(f"  ⚠️  cue '{cue['id']}' gen failed — skipping")
                continue
        cue_dur = cue["end_s"] - cue["start_s"]
        if cue_dur <= 0: continue
        seg = work_dir / f"cue_{cue['id']}.wav"
        level_db = cue.get("level_db", -24)
        fade_in = cue.get("fade_in_s", 0)
        fade_out = cue.get("fade_out_s", 0)
        gain = 10 ** (level_db / 20)
        afilter = [f"atrim=0:{cue_dur:.3f}", f"asetpts=PTS-STARTPTS", f"volume={gain:.4f}"]
        if fade_in > 0: afilter.append(f"afade=t=in:st=0:d={fade_in}")
        if fade_out > 0: afilter.append(f"afade=t=out:st={cue_dur - fade_out:.3f}:d={fade_out}")
        run(["ffmpeg","-y","-i", str(track_file), "-af", ",".join(afilter),
             "-ar","48000","-ac","2", str(seg)], log_handle=log_handle)
        segments.append({"id": cue["id"], "path": seg,
                        "start_s": cue["start_s"], "duration_s": cue_dur})

    if not segments:
        print("  ⚠️  no cues produced — output VO-only")
        return None

    # Combine into one music-only stream padded to body_dur
    inputs = []
    parts = []
    labels = []
    for i, s in enumerate(segments):
        inputs.extend(["-i", str(s["path"])])
        delay_ms = int(s["start_s"] * 1000)
        parts.append(f"[{i}:a]adelay={delay_ms}|{delay_ms}[d{i}]")
        labels.append(f"[d{i}]")
    n = len(segments)
    parts.append(f"{''.join(labels)}amix=inputs={n}:normalize=0:dropout_transition=0[m]")
    parts.append(f"[m]apad=whole_dur={body_dur:.3f}[music]")
    music_track = work_dir / "music_track.wav"
    cmd = ["ffmpeg","-y"] + inputs + ["-filter_complex", ";".join(parts),
                                       "-map","[music]","-ar","48000","-ac","2",
                                       str(music_track)]
    run(cmd, log_handle=log_handle)
    return music_track


def mix_with_body(body, music, out, log_handle, level_offset_db=0):
    if music is None:
        import shutil; shutil.copy(body, out); return
    music_gain = 10 ** (level_offset_db / 20)
    flt = (f"[0:a]volume=1.0[vo];"
           f"[1:a]volume={music_gain:.4f}[mu];"
           f"[vo][mu]amix=inputs=2:normalize=0:dropout_transition=0[aout]")
    cmd = ["ffmpeg","-y", "-i", str(body), "-i", str(music),
           "-filter_complex", flt, "-map","0:v","-map","[aout]",
           "-c:v","copy", "-c:a","aac","-b:a","192k", str(out)]
    run(cmd, log_handle=log_handle)


def main():
    args = sys.argv[1:]
    def get(f,d=None):
        if f in args: i=args.index(f); return args[i+1] if i+1<len(args) else d
        return d
    if "--help" in args or not args:
        print(__doc__); return

    ep_dir_arg = get("--episode-dir")
    if not ep_dir_arg:
        print("ERR: --episode-dir required", file=sys.stderr); sys.exit(1)
    ep = Path(ep_dir_arg)
    if not ep.is_absolute(): ep = CR / ep

    dry_run = "--dry-run" in args
    level_offset = float(get("--level-offset-db","0"))

    cues_yaml = ep / "music-cues.yaml"
    body = ep / "body-v2.mp4"
    if not cues_yaml.exists():
        print(f"ERR: no music-cues.yaml at {cues_yaml}", file=sys.stderr); sys.exit(1)
    if not body.exists():
        print(f"ERR: no body-v2.mp4 at {body}", file=sys.stderr); sys.exit(1)

    cue_data = yaml.safe_load(cues_yaml.read_text())
    cues = cue_data.get("cues", [])
    body_dur = probe_duration(body)

    print(f"=== bake-music.py ===")
    print(f"Body: {body_dur:.1f}s   Cues: {len(cues)} ({sum(1 for c in cues if c.get('type')=='music')} music)")

    for c in cues:
        if c.get("type") == "music":
            dur = c["end_s"] - c["start_s"]
            print(f"  {c['start_s']:6.1f}→{c['end_s']:6.1f}s ({dur:4.1f}s) {c.get('level_db','?'):>3}dB | {build_prompt(c)[:80]}")
        else:
            print(f"  {c['start_s']:6.1f}→{c['end_s']:6.1f}s ({c['end_s']-c['start_s']:4.1f}s) silence")

    if dry_run:
        print("\n--dry-run: no files written")
        return

    work = ep / "_music-bake"
    work.mkdir(exist_ok=True)
    log_path = ep / "_bake-music.log"
    with open(log_path, "w") as log:
        log.write(f"bake-music run {ep.name}\nbody_dur={body_dur}\n\n")
        print(f"\nBuilding music track...")
        music = build_music_track(cues, body_dur, work, log, ep.name)
        out = ep / "body-with-music.mp4"
        print(f"\nMixing music with body → {out.name}...")
        mix_with_body(body, music, out, log, level_offset)
    print(f"\n✅ {out}  ({probe_duration(out):.1f}s)")


if __name__ == "__main__":
    main()
