#!/usr/bin/env python3
"""qc-missing-plate.py — PRE-RENDER hard gate: every asset a storyboard references must exist on disk.

WHY THIS EXISTS (failure mode locked into doctrine 2026-06-01):
  The CR TX-Senate LF shipped a black-background master MULTIPLE times this
  session because a remotion clip's `backgroundVideo` prop pointed at an
  ai-plate file that was NOT on disk. Remotion's <Video src={staticFile(...)}>
  silently renders NOTHING (a black background behind the text) when the file
  is missing — it does not throw. So the render "succeeded", the text cards
  drew on top, and only a human watching the master caught the black plate.

  The producer (produce-from-storyboard.py) DOES FileNotFoundError on top-level
  seed_image / reuse_path / image_path — but it never looks INSIDE remotion
  `props` (backgroundVideo, portraits[].src), and it only fails MID-RUN, after
  spend has already started on earlier clips. This gate is a $0 PRE-FLIGHT:
  it walks the whole storyboard, resolves every asset reference against the
  RIGHT root, and hard-fails before a single clip is rendered.

THE ROOT-RESOLUTION TRAP (the reason a naive check fails):
  A remotion prop path like "ai-plates/cr-tx-senate/hook-01-open.mp4" is
  relative to remotion/public/ (Remotion's staticFile root), NOT to the
  campaign-receipts dir. The same-looking path resolved against CR/public/
  does not exist — which is exactly how the missing-plate slipped through a
  hand check. This gate resolves remotion props against REMOTION_PUBLIC and
  non-remotion paths against CR.

WHAT IT CHECKS, per clip:
  * remotion props: backgroundVideo, image/img/src/portraits[].src, and any
    string prop value that looks like a media path (.mp4/.png/.jpg/.webm/.mov)
      -> resolved against remotion/public/
  * top-level: seed_image, model_args.seed_image, reuse_path, image_path,
    portrait, audio, caricature image (if image_path given)
      -> resolved against campaign-receipts/
  * caricature_slug clips are SKIPPED for image existence (the caricature is
    generated/cached on demand by politician-caricature.py) — we only verify
    the slug is non-empty.

Usage:
  python3 scripts/pipeline/qc-missing-plate.py --storyboard eng/storyboards/foo.json
  python3 scripts/pipeline/qc-missing-plate.py --storyboard ... --json-out out.json

Exit codes:
  0 — PASS (every referenced asset exists)
  2 — FAIL (one or more referenced assets missing)
  3 — script-side error (storyboard missing / unparseable)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
CR = Path(__file__).resolve().parents[2]
REMOTION_PUBLIC = REPO / "remotion" / "public"

MEDIA_RE = re.compile(r"\.(mp4|webm|mov|png|jpe?g)$", re.I)
# prop keys whose VALUE is a media path relative to remotion/public/
REMOTION_PATH_KEYS = {"backgroundVideo", "image", "img", "src", "poster", "logo"}


def load_sb(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def _resolve(root: Path, ref: str) -> Path:
    p = Path(ref)
    return p if p.is_absolute() else (root / ref)


def _collect_remotion_refs(obj, refs: list[str]) -> None:
    """Recurse remotion props; gather every media-path string value."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and (k in REMOTION_PATH_KEYS or MEDIA_RE.search(v)):
                refs.append(v)
            else:
                _collect_remotion_refs(v, refs)
    elif isinstance(obj, list):
        for v in obj:
            _collect_remotion_refs(v, refs)


def check(sb: dict) -> list[dict]:
    """Returns a list of {clip, ref, root, resolved} for every MISSING asset."""
    missing: list[dict] = []
    for clip in sb.get("clips", []):
        cid = clip.get("clip_id", "?")
        vendor = clip.get("vendor", "")

        # --- remotion props (resolved against remotion/public) ---
        if vendor == "remotion":
            refs: list[str] = []
            _collect_remotion_refs(clip.get("props") or {}, refs)
            for ref in refs:
                resolved = _resolve(REMOTION_PUBLIC, ref)
                if not resolved.is_file():
                    missing.append({"clip": cid, "ref": ref, "root": "remotion/public",
                                    "resolved": str(resolved)})
            continue

        # --- non-remotion vendors (resolved against CR) ---
        candidates: list[str] = []
        for key in ("seed_image", "reuse_path", "image_path", "portrait", "audio"):
            v = clip.get(key)
            if v:
                candidates.append(v)
        ma = clip.get("model_args") or {}
        if ma.get("seed_image"):
            candidates.append(ma["seed_image"])

        # caricature: slug-based clips are generated on demand — only need a slug
        if clip.get("caricature_slug"):
            if not str(clip.get("caricature_slug")).strip():
                missing.append({"clip": cid, "ref": "(empty caricature_slug)",
                                "root": "-", "resolved": "-"})
            # if an explicit image_path was ALSO given it's still checked above
        for ref in candidates:
            resolved = _resolve(CR, ref)
            if not resolved.is_file():
                missing.append({"clip": cid, "ref": ref, "root": "campaign-receipts",
                                "resolved": str(resolved)})
    return missing


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--storyboard", required=True, type=Path)
    ap.add_argument("--json-out", type=Path)
    args = ap.parse_args()

    path = args.storyboard if args.storyboard.is_absolute() else (CR / args.storyboard)
    if not path.is_file():
        print(f"ERR: storyboard not found: {path}", file=sys.stderr)
        return 3
    try:
        sb = load_sb(path)
    except json.JSONDecodeError as e:
        print(f"ERR: storyboard not valid JSON: {e}", file=sys.stderr)
        return 3

    clips = sb.get("clips", [])
    missing = check(sb)
    verdict = "FAIL" if missing else "PASS"

    report = {
        "storyboard": str(path.relative_to(CR)) if path.is_relative_to(CR) else str(path),
        "clips": len(clips),
        "missing_count": len(missing),
        "missing": missing,
        "roots": {"remotion": str(REMOTION_PUBLIC), "campaign_receipts": str(CR)},
        "verdict": verdict,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    out = args.json_out or (CR / "_review" / f"qc-missing-plate-{path.stem}.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(report, indent=2))

    print(f"[qc-missing-plate] {path.name}: {len(clips)} clips, "
          f"{len(missing)} missing asset(s)")
    print(f"=== qc-missing-plate {path.name} -> {verdict} ===")
    if missing:
        for m in missing:
            print(f"  MISSING [{m['clip']}] {m['ref']}  (root={m['root']})")
            print(f"          looked at: {m['resolved']}")
    print(f"report: {out.relative_to(CR) if out.is_relative_to(CR) else out}")
    return 0 if verdict == "PASS" else 2


if __name__ == "__main__":
    sys.exit(main())
