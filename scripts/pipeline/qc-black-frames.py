#!/usr/bin/env python3
"""qc-black-frames.py — Stage 25 dark/blank-frame HARD gate for CR + SEALED masters.

WHY THIS EXISTS (failure mode locked into doctrine 2026-05-31):
  ffmpeg `blackdetect` only flags near-PURE-black (#000) sustained for a
  duration. The CR TX-Senate LF master was ~60% dark generative "atmosphere"
  clips — dark vignette, very low mean luma, subtle gradient — which are NOT
  pure black, so blackdetect (and the stills-based qc-visual-master.py) PASSED
  it THREE times. This detector measures actual per-frame brightness AND
  brightness spread, so dark-vignette atmosphere clips CANNOT slip through.

HOW IT WORKS — one deterministic ffmpeg signalstats pass over the WHOLE file:
  * sample one frame every SAMPLE_INTERVAL_S seconds (fps=1/N), no python loop;
  * read per-frame YAVG (mean luma 0-255) and the YLOW..YHIGH spread
    (YHIGH-YLOW is the 90th-10th percentile luma band = a robust "is there
    visible content / contrast" proxy that ignores a few outlier pixels);
  * a frame is BAD if:
      - DARK:  YAVG < DARK_MEAN_MAX                (a dark photo / black void), OR
      - BLANK: spread < BLANK_SPREAD_MAX AND        (flat, no content) AND
               YAVG is not BRIGHT (< BLANK_MEAN_MAX) (so a flat-but-bright
               parchment card is NOT blank — bright flat = brand design).
  * FAIL if  bad% > MAX_BAD_FRAC*100   OR   longest contiguous bad run > MAX_BAD_RUN_S.

CALIBRATION (verified 2026-05-31):
  * CR brand parchment cards = #F4EFE6 → YAVG ~232 (very bright). PASS.
  * Dark atmosphere clips → YAVG ~10-45, tiny spread. FAIL.
  Thresholds chosen so bright parchment (flat OR busy) always passes and the
  TX-Senate dark clips always fail.

Usage:
  python3 scripts/pipeline/qc-black-frames.py --master public/longform/foo.mp4
  python3 scripts/pipeline/qc-black-frames.py --master ... --interval 2 --json-out out.json

Exit codes:
  0 — PASS (within dark/blank budget)
  2 — FAIL (too dark / blank)
  3 — script-side error (missing master, ffmpeg failure)
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

CR = Path(__file__).resolve().parents[2]

# --- tuned thresholds (luma is 0-255) ---
SAMPLE_INTERVAL_S = 2.0      # one frame every 2s across the whole file
DARK_MEAN_MAX = 70.0         # YAVG below this = dark/black frame (parchment ~232)
BLANK_SPREAD_MAX = 18.0      # YHIGH-YLOW below this = flat / no contrast
BLANK_MEAN_MAX = 180.0       # a flat frame is only "blank" if NOT bright (parchment passes)
MAX_BAD_FRAC = 0.10          # FAIL if >10% of sampled frames are bad
MAX_BAD_RUN_S = 3.0          # FAIL if any contiguous bad stretch exceeds 3s


def ffprobe_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0


def collect_stats(master: Path, interval: float, stats_file: Path) -> list[dict]:
    """One ffmpeg pass: per-frame YAVG / YLOW / YHIGH at fps=1/interval."""
    fps = f"1/{interval}" if interval >= 1 else str(1.0 / interval)
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error",
         "-i", str(master),
         "-vf", f"fps={fps},signalstats,metadata=print:file={stats_file}",
         "-an", "-f", "null", "-"],
        check=True)
    frames: list[dict] = []
    cur: dict = {}
    pat = re.compile(r"lavfi\.signalstats\.(\w+)=([\d.]+)")
    for line in stats_file.read_text().splitlines():
        if line.startswith("frame:"):
            if cur:
                frames.append(cur)
            m = re.search(r"pts_time:([\d.]+)", line)
            cur = {"t": float(m.group(1)) if m else 0.0}
        else:
            mm = pat.search(line)
            if mm:
                cur[mm.group(1)] = float(mm.group(2))
    if cur:
        frames.append(cur)
    return frames


def classify(f: dict) -> tuple[bool, str]:
    yavg = f.get("YAVG", 255.0)
    spread = f.get("YHIGH", 255.0) - f.get("YLOW", 0.0)
    if yavg < DARK_MEAN_MAX:
        return True, "dark"
    if spread < BLANK_SPREAD_MAX and yavg < BLANK_MEAN_MAX:
        return True, "blank"
    return False, ""


def longest_bad_run(flags: list[tuple[float, bool]], interval: float) -> tuple[float, float, float]:
    """Returns (run_seconds, start_t, end_t) of the longest contiguous bad stretch."""
    best = (0.0, 0.0, 0.0)
    run_start = None
    prev_t = None
    for t, bad in flags:
        if bad:
            if run_start is None:
                run_start = t
            prev_t = t
        else:
            if run_start is not None:
                length = (prev_t - run_start) + interval
                if length > best[0]:
                    best = (length, run_start, prev_t)
            run_start = None
    if run_start is not None:
        length = (prev_t - run_start) + interval
        if length > best[0]:
            best = (length, run_start, prev_t)
    return best


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--master", required=True, type=Path)
    ap.add_argument("--interval", type=float, default=SAMPLE_INTERVAL_S)
    ap.add_argument("--json-out", type=Path)
    args = ap.parse_args()

    if not args.master.exists():
        print(f"ERR: master not found: {args.master}", file=sys.stderr)
        return 3

    dur = ffprobe_duration(args.master)
    if dur <= 0:
        print(f"ERR: ffprobe failed on {args.master}", file=sys.stderr)
        return 3

    stats_file = CR / "_review" / f".qc-black-{args.master.stem}.txt"
    stats_file.parent.mkdir(parents=True, exist_ok=True)
    try:
        frames = collect_stats(args.master, args.interval, stats_file)
    except subprocess.CalledProcessError as e:
        print(f"ERR: ffmpeg signalstats failed: {e}", file=sys.stderr)
        return 3

    if not frames:
        print("ERR: no frames sampled", file=sys.stderr)
        return 3

    flags: list[tuple[float, bool]] = []
    bad_frames: list[dict] = []
    for f in frames:
        bad, reason = classify(f)
        flags.append((f["t"], bad))
        if bad:
            bad_frames.append({"t": round(f["t"], 1), "reason": reason,
                               "yavg": round(f.get("YAVG", 0), 1),
                               "spread": round(f.get("YHIGH", 0) - f.get("YLOW", 0), 1)})

    n = len(frames)
    n_bad = len(bad_frames)
    bad_frac = n_bad / n
    run_s, run_a, run_b = longest_bad_run(flags, args.interval)

    fail_frac = bad_frac > MAX_BAD_FRAC
    fail_run = run_s > MAX_BAD_RUN_S
    verdict = "FAIL" if (fail_frac or fail_run) else "PASS"

    report = {
        "master": str(args.master.relative_to(CR)) if args.master.is_relative_to(CR) else str(args.master),
        "duration_s": round(dur, 1),
        "sampled_frames": n,
        "interval_s": args.interval,
        "bad_frames": n_bad,
        "bad_pct": round(bad_frac * 100, 1),
        "longest_bad_run_s": round(run_s, 1),
        "longest_bad_run_window": [round(run_a, 1), round(run_b, 1)] if run_s else None,
        "thresholds": {
            "dark_mean_max": DARK_MEAN_MAX, "blank_spread_max": BLANK_SPREAD_MAX,
            "blank_mean_max": BLANK_MEAN_MAX, "max_bad_frac": MAX_BAD_FRAC,
            "max_bad_run_s": MAX_BAD_RUN_S,
        },
        "verdict": verdict,
        "fail_reasons": [r for r, ok in [("dark/blank >10% of frames", fail_frac),
                                          (f"contiguous dark run >{MAX_BAD_RUN_S}s", fail_run)] if ok],
        "bad_timestamps": bad_frames,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    out = args.json_out or (CR / "_review" / f"qc-black-{args.master.stem}.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2))

    print(f"[qc-black] master={args.master.name} dur={dur:.0f}s "
          f"sampled={n} bad={n_bad} ({bad_frac*100:.1f}%) "
          f"longest_run={run_s:.1f}s")
    print(f"=== qc-black {args.master.name} -> {verdict} ===")
    if verdict == "FAIL":
        for r in report["fail_reasons"]:
            print(f"  FAIL: {r}")
        ts = ", ".join(f"{b['t']}s({b['reason']},Y{b['yavg']})" for b in bad_frames[:20])
        print(f"  bad frames: {ts}" + (" ..." if n_bad > 20 else ""))
    else:
        print(f"  within budget ({bad_frac*100:.1f}% dark/blank, "
              f"longest run {run_s:.1f}s)")
    print(f"report: {out.relative_to(CR) if out.is_relative_to(CR) else out}")
    return 0 if verdict == "PASS" else 2


if __name__ == "__main__":
    sys.exit(main())
