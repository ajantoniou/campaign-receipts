#!/usr/bin/env python3
"""
Pre-TTS script gate — BINDING. Run before elevenlabs-tts / produce-from-storyboard VO stage.

Ensures **VO:** blocks exist and cleaned spoken text contains no metadata/URLs.
"""
import argparse
import importlib.util
import re
import subprocess
import sys
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
PIPE = CR / "scripts/pipeline"


def _load_elevenlabs():
    spec = importlib.util.spec_from_file_location("elevenlabs_tts", PIPE / "elevenlabs-tts.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True, help="Path to VO markdown script")
    ap.add_argument("--report", help="Write qc-script.md (default: alongside script)")
    ap.add_argument("--skip-storyteller", action="store_true",
                    help="Skip script-storyteller-gate.py (debug only)")
    args = ap.parse_args()

    script = Path(args.script)
    if not script.is_absolute():
        script = CR / script
    if not script.is_file():
        print(f"ERR: script not found: {script}", file=sys.stderr)
        sys.exit(2)

    if not args.skip_storyteller:
        sg = ["python3", str(PIPE / "script-storyteller-gate.py"), "--script", str(script)]
        print(f"[script-qc] storyteller gate (ADVISORY): {' '.join(sg)}")
        # Advisory only, per [no-council-gates] doctrine — the storyteller gate
        # reports but must NOT hard-block a re-render (founder 2026-06-01: a
        # downstream-only VO edit was wrongly blocked here). Was check=True.
        r = subprocess.run(sg)
        if r.returncode != 0:
            print("[script-qc] storyteller gate flagged issues (advisory, not blocking) — review above",
                  file=sys.stderr)

    tts = _load_elevenlabs()
    raw = script.read_text()
    is_plain_vo = script.name.endswith("-vo.txt")
    if not is_plain_vo and re.search(r"\*\*ON SCREEN:\*\*", raw, re.I):
        print("ERR: **ON SCREEN:** in script — move visuals to storyboard JSON only", file=sys.stderr)
        sys.exit(1)
    if is_plain_vo and re.search(r"\*\*VO:\*\*", raw, re.I):
        print("ERR: -vo.txt must be plain narration — no **VO:** labels", file=sys.stderr)
        sys.exit(1)
    vo_lines = tts.extract_vo_lines(raw)
    if not vo_lines:
        print("ERR: no spoken text (use **VO:** blocks or a plain -vo.txt file)", file=sys.stderr)
        sys.exit(1)
    if not is_plain_vo and re.search(r"\*\*VO:\*\*", raw, re.I):
        leaked = tts.strip_vo_markers(vo_lines)
        if re.search(r"\bVO\s*[-:–—]|^\s*VO\s*[-:–—]", leaked, re.I | re.M):
            print("ERR: VO editor marker in cleaned text", file=sys.stderr)
            sys.exit(1)

    cleaned = tts.clean_script_md(raw)
    try:
        tts.validate_spoken_text(cleaned, str(script))
    except SystemExit:
        sys.exit(1)

    vo_blocks = len(re.findall(r"\*\*VO:\*\*", raw, re.I))
    # Long-form: Sarah must narrate in connected STORYLINE sentences, not bullet fragments.
    if "shorts-scripts" in str(script):
        quoted = re.findall(r'\*\*VO:\*\*\s*"([^"]+)"', raw, re.MULTILINE)
        if quoted:
            short = [q for q in quoted if len(q.strip()) < 40]
            if short:
                print(
                    f"ERR: short VO reads like bullets ({len(short)}/{len(quoted)} blocks < 40 chars). "
                    "Use flowing sentences — see brand/voice-writing.md Shorts section.",
                    file=sys.stderr,
                )
                sys.exit(1)

    if "longform-scripts" in str(script):
        quoted = re.findall(r'\*\*VO:\*\*\s*"([^"]+)"', raw, re.MULTILINE)
        if not quoted:
            print("ERR: long-form script needs **VO:** \"...\" quoted paragraphs", file=sys.stderr)
            sys.exit(1)
        short = [q for q in quoted if len(q.strip()) < 80]
        if short:
            print(
                f"ERR: long-form VO reads like bullets ({len(short)}/{len(quoted)} blocks < 80 chars). "
                "Rewrite as STORYLINE — connected sentences with bridges between beats.",
                file=sys.stderr,
            )
            for s in short[:3]:
                print(f"  short: {s[:60]}...", file=sys.stderr)
            sys.exit(1)
        words = len(cleaned.split())
        if words < 400:
            print(f"ERR: long-form VO too thin ({words} words) — target ~500+ for ~3–4 min", file=sys.stderr)
            sys.exit(1)

    report = Path(args.report) if args.report else script.parent / f"qc-script-{script.stem}.md"
    report.write_text(
        f"# Script QC — PASS\n\n- script: `{script}`\n- vo_chars: {len(cleaned)}\n"
        f"- vo_blocks: {vo_blocks}\n"
    )
    print(f"[script-qc] ✅ PASS — {len(cleaned)} chars, {len(vo_lines.split())} words approx")
    print(f"[script-qc] report: {report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
