#!/usr/bin/env python3
"""qc-freeze-vs-vo.py — PRE-RENDER hard gate: no background plate freezes while VO keeps talking.

WHY THIS EXISTS (failure mode locked into doctrine 2026-06-01):
  CR long-form clips put text cards (and VO narration) OVER a moving ai-plate
  set as `backgroundVideo`. When the plate is SHORTER than the clip slot, one
  of two bad things happens behind the still-talking voiceover:
    * the plate freezes on its last frame (looks broken — "AI plate froze"),
    * or, worse, the renderer shows nothing past the plate's end (black).
  This session shipped a master where a 10s plate sat under a ~18s slot. The
  TextSlate Loop fix (this session) makes TextSlate LOOP the plate to fill the
  slot — but that only works if (a) the clip uses a loop-capable composition
  AND (b) the declared backgroundVideoDurationInFrames matches the REAL file,
  because the loop math is driven by that declared number.

  Two real defects this gate catches on the TX-Senate board at $0:
    * declared bgFrames=301 for verdict-02-costume.mp4, which is really 151
      frames — the loop point is computed wrong, so the plate jumps.
    * slot 17.82s over a 10.04s plate — only safe BECAUSE TextSlate loops;
      any non-looping composition there would freeze 7.8s under live VO.

WHAT IT CHECKS, per remotion clip that declares a backgroundVideo:
  1. DECLARED-vs-ACTUAL: backgroundVideoDurationInFrames (at --fps) must match
     the real file's frame count within DURATION_TOLERANCE_FRAMES. A wrong
     number means the loop/hold math is fed garbage. (HARD)
  2. SLOT-vs-PLATE: if slot_seconds > plate_seconds, the composition MUST be
     loop-capable (LOOP_CAPABLE_COMPOSITIONS). If it is, OK (it tiles the
     plate). If it is NOT, FAIL — it will freeze/black for (slot-plate)s
     under live narration. (HARD)

  Missing plate files are NOT this gate's job — run qc-missing-plate.py first;
  here a missing file is reported as a soft note (can't measure it) and the
  clip is skipped so the two gates don't double-report the same root cause.

Usage:
  python3 scripts/pipeline/qc-freeze-vs-vo.py --storyboard eng/storyboards/foo.json
  python3 scripts/pipeline/qc-freeze-vs-vo.py --storyboard ... --fps 30 --json-out out.json

Exit codes:
  0 — PASS (no freeze risk)
  2 — FAIL (declared-vs-actual mismatch, or non-loop composition under-runs slot)
  3 — script-side error
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
CR = Path(__file__).resolve().parents[2]
REMOTION_PUBLIC = REPO / "remotion" / "public"

DEFAULT_FPS = 30
DURATION_TOLERANCE_FRAMES = 2     # rounding slack between declared and actual
# Compositions that loop/tile their backgroundVideo to fill the slot.
# TextSlate gained this with the Loop fix (commit da61486e9, 2026-06-01).
LOOP_CAPABLE_COMPOSITIONS = {"TextSlate"}


def _ffprobe_duration(path: Path) -> float | None:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return None


def _resolve(ref: str) -> Path:
    p = Path(ref)
    return p if p.is_absolute() else (REMOTION_PUBLIC / ref)


def check(sb: dict, fps: int) -> tuple[list[dict], list[dict]]:
    """Returns (failures, notes)."""
    failures: list[dict] = []
    notes: list[dict] = []
    for clip in sb.get("clips", []):
        if clip.get("vendor") != "remotion":
            continue
        props = clip.get("props") or {}
        bg = props.get("backgroundVideo")
        if not bg:
            continue
        cid = clip.get("clip_id", "?")
        comp = clip.get("composition", "")
        slot_s = float(clip.get("duration", 0) or 0)
        declared_frames = props.get("backgroundVideoDurationInFrames")

        plate = _resolve(bg)
        if not plate.is_file():
            notes.append({"clip": cid, "plate": bg,
                          "note": "plate file missing — run qc-missing-plate.py (skipped here)"})
            continue

        plate_s = _ffprobe_duration(plate)
        if plate_s is None:
            notes.append({"clip": cid, "plate": bg, "note": "ffprobe failed — cannot measure"})
            continue
        actual_frames = round(plate_s * fps)

        # check 1: declared frames vs actual
        if declared_frames is not None:
            if abs(int(declared_frames) - actual_frames) > DURATION_TOLERANCE_FRAMES:
                failures.append({
                    "clip": cid, "plate": bg, "kind": "declared_vs_actual",
                    "declared_frames": int(declared_frames),
                    "actual_frames": actual_frames,
                    "actual_seconds": round(plate_s, 2),
                    "detail": (f"backgroundVideoDurationInFrames={declared_frames} but file is "
                               f"{actual_frames} frames ({plate_s:.2f}s @ {fps}fps) — "
                               f"loop/hold math will be wrong"),
                })
        else:
            notes.append({"clip": cid, "plate": bg,
                          "note": (f"no backgroundVideoDurationInFrames declared "
                                   f"(actual {actual_frames}f / {plate_s:.2f}s) — add it")})

        # check 2: slot vs plate
        if slot_s - plate_s > (1.0 / fps):  # slot meaningfully longer than plate
            if comp not in LOOP_CAPABLE_COMPOSITIONS:
                failures.append({
                    "clip": cid, "plate": bg, "kind": "freeze_under_vo",
                    "composition": comp,
                    "slot_seconds": round(slot_s, 2),
                    "plate_seconds": round(plate_s, 2),
                    "gap_seconds": round(slot_s - plate_s, 2),
                    "detail": (f"slot {slot_s:.2f}s > plate {plate_s:.2f}s on non-loop "
                               f"composition '{comp}' — plate freezes/blacks for "
                               f"{slot_s - plate_s:.2f}s under live VO"),
                })
            else:
                notes.append({"clip": cid, "plate": bg,
                              "note": (f"slot {slot_s:.2f}s > plate {plate_s:.2f}s but '{comp}' "
                                       f"loops — OK (tiles plate {slot_s / plate_s:.1f}x)")})
    return failures, notes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--storyboard", required=True, type=Path)
    ap.add_argument("--fps", type=int, default=DEFAULT_FPS)
    ap.add_argument("--json-out", type=Path)
    args = ap.parse_args()

    path = args.storyboard if args.storyboard.is_absolute() else (CR / args.storyboard)
    if not path.is_file():
        print(f"ERR: storyboard not found: {path}", file=sys.stderr)
        return 3
    try:
        sb = json.load(open(path))
    except json.JSONDecodeError as e:
        print(f"ERR: storyboard not valid JSON: {e}", file=sys.stderr)
        return 3

    failures, notes = check(sb, args.fps)
    verdict = "FAIL" if failures else "PASS"

    report = {
        "storyboard": str(path.relative_to(CR)) if path.is_relative_to(CR) else str(path),
        "fps": args.fps,
        "failures": failures,
        "notes": notes,
        "verdict": verdict,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    out = args.json_out or (CR / "_review" / f"qc-freeze-vs-vo-{path.stem}.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2))

    print(f"[qc-freeze-vs-vo] {path.name}: {len(failures)} freeze risk(s), {len(notes)} note(s)")
    print(f"=== qc-freeze-vs-vo {path.name} -> {verdict} ===")
    for f in failures:
        print(f"  FAIL [{f['clip']}] {f['kind']}: {f['detail']}")
    for n in notes:
        print(f"  note [{n['clip']}] {n['note']}")
    print(f"report: {out.relative_to(CR) if out.is_relative_to(CR) else out}")
    return 0 if verdict == "PASS" else 2


if __name__ == "__main__":
    sys.exit(main())
