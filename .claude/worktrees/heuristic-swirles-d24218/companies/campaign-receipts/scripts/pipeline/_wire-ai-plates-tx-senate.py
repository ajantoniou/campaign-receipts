#!/usr/bin/env python3
"""One-off: wire 7 luma-passed AI plates into the cr-tx-senate-2026-superpacs
storyboard as TextSlate backgroundVideo (founder 2026-06-01).

The FEC SOURCE card (r3-04-passthrough-source) and the CTA card
(verdict-02-costume) stay clean static text-cards — info beats, not narrative.

Idempotent. Refuses to run unless all 7 plates exist AND pass the luma gate.
Copies plates to remotion/public/ai-plates/cr-tx-senate/<id>.mp4 (staticFile root),
then sets props.backgroundVideo + props.scrimOpacity on the 7 narrative beats.
"""
import json, shutil, sys, importlib.util
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
SB = CR / "eng/storyboards/cr-tx-senate-2026-superpacs.json"
AI_DIR = CR / "_build/cr-tx-senate-2026-superpacs/clips_ai"
PUBLIC = REPO / "remotion/public/ai-plates/cr-tx-senate"
SCRIM = 0.55

AI_BEATS = [
    "hook-01-open", "hook-03-friendly-name", "stakes-02-the-flood",
    "r1-02-cornyn-nau", "r2-01-walk-across", "r3-01-whos-behind",
    "why-01-real-question",
]

# Reuse the hardened tool's luma gate so we re-confirm before wiring.
spec = importlib.util.spec_from_file_location("k", CR / "scripts/pipeline/fal-kling-i2v.py")
k = importlib.util.module_from_spec(spec); spec.loader.exec_module(k)


def main():
    # 1. Verify all 7 plates exist + pass luma gate.
    missing, dark = [], []
    for cid in AI_BEATS:
        p = AI_DIR / f"{cid}.mp4"
        if not p.exists() or p.stat().st_size < 50000:
            missing.append(cid); continue
        y0, s0 = k.frame_luma(p, at_s=0.5)
        y1, s1 = k.frame_luma(p, at_s=3.0)
        if not (k.luma_ok(y0, s0, f"{cid}@0.5") and k.luma_ok(y1, s1, f"{cid}@3.0")):
            dark.append(cid)
    if missing:
        print(f"ABORT: missing/empty plates: {missing}", file=sys.stderr); sys.exit(1)
    if dark:
        print(f"ABORT: plates failed luma gate (would black-render): {dark}", file=sys.stderr); sys.exit(2)

    # 2. Copy plates into the Remotion public dir (staticFile root).
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for cid in AI_BEATS:
        shutil.copy2(AI_DIR / f"{cid}.mp4", PUBLIC / f"{cid}.mp4")
    print(f"  copied {len(AI_BEATS)} plates → {PUBLIC.relative_to(REPO)}")

    # 3. Patch storyboard props for the 7 narrative beats.
    sb = json.loads(SB.read_text())
    patched = 0
    for c in sb.get("clips", []):
        cid = c.get("clip_id") or c.get("id")
        if cid in AI_BEATS:
            if c.get("vendor") != "remotion" or c.get("composition") != "TextSlate":
                print(f"ABORT: {cid} is not remotion/TextSlate (vendor={c.get('vendor')})", file=sys.stderr); sys.exit(3)
            props = dict(c.get("props") or {})
            props["backgroundVideo"] = f"ai-plates/cr-tx-senate/{cid}.mp4"
            props["scrimOpacity"] = SCRIM
            c["props"] = props
            patched += 1
    if patched != len(AI_BEATS):
        print(f"ABORT: patched {patched}, expected {len(AI_BEATS)}", file=sys.stderr); sys.exit(4)
    SB.write_text(json.dumps(sb, indent=2) + "\n")
    print(f"  patched {patched} beats with backgroundVideo + scrimOpacity={SCRIM}")
    print("  ✅ storyboard wired. Re-run produce-from-storyboard to re-render + re-splice.")


if __name__ == "__main__":
    main()
