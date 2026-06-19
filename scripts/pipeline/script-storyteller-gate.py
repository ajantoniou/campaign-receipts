#!/usr/bin/env python3
"""
Storyteller gate — binding before TTS (SEALED + CR).

Enforces STORYLINE + story grammar from brand/storytelling-pipeline.md.
Complements script-qc.py (metadata/URL hygiene).

Usage:
  python3 script-storyteller-gate.py --script eng/longform-scripts/sealed-aipac-embassy.md
  python3 script-storyteller-gate.py --script eng/shorts-scripts/sealed-007-repeal-obamacare.md --mode short
"""
import argparse
import importlib.util
import re
import sys
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
CR = REPO / "companies/campaign-receipts"
PIPE = CR / "scripts/pipeline"
MIN_LONG_VO_BLOCK = 80
MIN_SHORT_VO_BLOCK = 35
MIN_LONG_WORDS = 400
MIN_SHORT_WORDS = 70

# Campaign-finance jargon — each occurrence needs a bridge within ~300 chars.
JARGON_PATTERNS = [
    (r"\bindependent expenditures?\b", "independent expenditure(s)"),
    (r"\bschedule\s+e\b", "Schedule E"),
    (r"\bsuper-?pacs?\b", "super-PAC"),
    (r"\boutside spend(?:ing)?\b", "outside spending"),
    (r"\bie filings?\b", "IE filing"),
    (r"\bindependent committees?\b", "independent committee"),
]
GLOSS_BRIDGE = re.compile(
    r"\b(in other words|that means|put simply|so here is what that means|"
    r"so in plain english|which means|what that really means|here is what that means)\b",
    re.I,
)
OPEN_LOOP = re.compile(
    r"\b(but first|in a moment|stay with me|here is the part|that sounds like a lot|"
    r"the number is public|what it actually bought|not the crazy part|"
    r"i(?:'ll| will) show you|before i show you)\b",
    re.I,
)


def _load_tts():
    spec = importlib.util.spec_from_file_location("elevenlabs_tts", PIPE / "elevenlabs-tts.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def extract_vo_blocks(raw: str, path: Path) -> list[str]:
    blocks = re.findall(r'\*\*VO:\*\*\s*"([^"]+)"', raw, re.MULTILINE)
    if blocks:
        return blocks
    # CR new-news plain -vo.txt — paragraphs are scenes
    if path.name.endswith("-vo.txt"):
        paras = [p.strip() for p in re.split(r"\n\s*\n", raw) if p.strip()]
        return paras
    return []


def has_storyline_comment(raw: str) -> bool:
    return bool(
        re.search(r"STORYLINE\s*:", raw, re.I)
        or re.search(r"^##\s+STORYLINE\b", raw, re.M | re.I)
    )


def telegraph_lines(vo_text: str) -> list[str]:
    """PowerPoint / aphorism lines — not lay storytelling."""
    bad = []
    patterns = [
        (r"The front is .{3,40}\. The back is", "front/back telegraph (explain in one flowing scene)"),
        (r"The \w+ is .{2,35}\. The \w+ is .{2,35}\. The \w+ is", "three 'The X is Y' bullets in a row"),
        (r"\bbox one\b|\bbox two\b", "box-one box-two receipt dump"),
        (r"on the record:\s", "lecture header"),
    ]
    for pat, msg in patterns:
        if re.search(pat, vo_text, re.I):
            bad.append(msg)
    return bad


def staccato_blocks(vo_blocks: list[str]) -> list[str]:
    """Flag a VO block only when it reads like a bullet list — i.e. is DOMINATED
    by ultra-short fragments (>=50% of sentences are <22 chars, AND >=3 of them).

    Acronyms-with-periods (A.I.P.A.C., F.E.C., P.A.C., U.D.P., R.J.C.) are spelled
    that way for ElevenLabs Jessica pronunciation; the gate must not count their
    internal periods as sentence boundaries. Pre-strip them before splitting.

    Rhetorical punch lines like "Same playbook. Three outcomes. One variable."
    sitting inside an otherwise full block are NOT staccato — they're craft.
    Only flag when short fragments are the dominant voice of the block.
    """
    bad = []
    acronym_re = re.compile(r"\b(?:[A-Z]\.){2,}[A-Z]\.?")
    for block in vo_blocks:
        normalized = acronym_re.sub(lambda m: m.group(0).replace(".", ""), block)
        all_sents = [s.strip() for s in re.split(r"[.!?]+", normalized) if s.strip()]
        short = [s for s in all_sents if 2 < len(s) < 22]
        if len(short) >= 3 and len(all_sents) > 0 and len(short) / len(all_sents) >= 0.5:
            bad.append(block[:72] + "…")
    return bad


def hook_strength(first_vo: str, mode: str) -> tuple[bool, str]:
    low = first_vo.lower()
    banned = (
        "tonight we", "tonight i'm", "today we'll", "in this video",
        "let's look at", "we're going to", "on the record",
    )
    for b in banned:
        if b in low:
            return False, f"hook opens like lecture/podcast ({b!r})"
    spelled_nums = r"zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|hundred|thousand|million|billion|percent"
    has_number = bool(re.search(rf"\d|{spelled_nums}|\$", first_vo, re.I))
    has_human = bool(re.search(
        r"\b(voter|senator|president|people|families|you|she|he|they|crowd|student)\b",
        first_vo, re.I,
    ))
    if mode == "short":
        if len(first_vo) < 40:
            return False, "short hook too thin — need outcome + gap in line 1"
        if not (has_number or "?" in first_vo):
            return False, "short hook needs a number or sharp question in line 1"
        return True, "ok"
    if not (has_number or has_human):
        return False, "long-form hook needs human stakes or a spelled number early"
    if len(first_vo) < 60:
        return False, "hook VO block too short for long-form cold open"
    return True, "ok"


def jargon_without_bridge(vo_text: str) -> list[str]:
    """Jargon term must be followed by an 'in other words' bridge within ~300 chars."""
    bad = []
    for pat, label in JARGON_PATTERNS:
        for m in re.finditer(pat, vo_text, re.I):
            tail = vo_text[m.end(): m.end() + 320]
            if not GLOSS_BRIDGE.search(tail):
                snippet = vo_text[max(0, m.start() - 20): m.end() + 40].replace("\n", " ")
                bad.append(f"{label} without 'in other words' bridge near: …{snippet}…")
    return bad


def retention_markers(raw_meta: str, vo_text: str, mode: str, is_cr_news: bool) -> list[str]:
    """Long-form CR new-news needs re-hook plan + open-loop language in VO."""
    issues = []
    if mode != "longform" or not is_cr_news:
        return issues
    if not re.search(r"RE-HOOKS\s*:", raw_meta, re.I):
        issues.append("missing RE-HOOKS: comment — mark ~60–90s open loops (see storyline-editor § Pass C)")
    if len(OPEN_LOOP.findall(vo_text)) < 2:
        issues.append(
            "fewer than 2 open-loop / tease phrases in VO "
            "(e.g. 'but first', 'stay with me', 'here is the part') — retention spine weak"
        )
    return issues


def turn_markers(vo_text: str, mode: str = "longform") -> bool:
    markers = (
        r"\bbut\b", r"\bso\b", r"\bthen\b", r"\bthat'?s when\b",
        r"\bhere'?s\b", r"\bhere is\b", r"\bwhat\b.+\bdidn'?t\b", r"\bwait\b",
        r"\bthe part\b", r"\bthe receipt\b", r"\bplain english\b", r"\bsame (day|calendar)\b",
        r"\bin other words\b",
    )
    hits = sum(1 for m in markers if re.search(m, vo_text, re.I))
    need = 2 if mode == "short" else 3
    return hits >= need


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", required=True)
    ap.add_argument("--mode", choices=("longform", "short", "auto"), default="auto")
    ap.add_argument("--report")
    args = ap.parse_args()

    script = Path(args.script)
    if not script.is_absolute():
        script = CR / script
    if not script.is_file():
        print(f"ERR: not found: {script}", file=sys.stderr)
        sys.exit(2)

    raw = script.read_text()
    mode = args.mode
    if mode == "auto":
        mode = "short" if "shorts-scripts" in str(script) else "longform"

    tts = _load_tts()
    editorial = script
    if script.name.endswith("-vo.txt"):
        sibling = script.with_name(script.name.replace("-vo.txt", ".md"))
        if sibling.is_file():
            editorial = sibling
            raw_meta = sibling.read_text()
        else:
            raw_meta = raw
    else:
        raw_meta = raw

    cleaned = tts.clean_script_md(raw if script.name.endswith("-vo.txt") else raw)
    vo_blocks = extract_vo_blocks(raw if not script.name.endswith("-vo.txt") else raw, script)
    if not vo_blocks:
        print("ERR: no VO content (**VO:** blocks or -vo.txt paragraphs)", file=sys.stderr)
        sys.exit(1)

    errors = []
    warnings = []

    if not has_storyline_comment(raw_meta):
        errors.append(
            "missing STORYLINE in editorial script — run Screenwriter → JK → MrBeast → storyline editor"
        )

    min_block = MIN_SHORT_VO_BLOCK if mode == "short" else MIN_LONG_VO_BLOCK
    # Plain -vo.txt: short paras are OK if total word count passes (not bullet scenes)
    if not script.name.endswith("-vo.txt"):
        short_blocks = [b for b in vo_blocks if len(b.strip()) < min_block]
        if short_blocks:
            errors.append(
                f"{len(short_blocks)}/{len(vo_blocks)} VO blocks under {min_block} chars (bullet voice)"
            )

    staccato = staccato_blocks(vo_blocks)
    if staccato:
        errors.append(
            f"{len(staccato)} VO block(s) read like bullet lists (3+ sentences <22 chars) — screenwriter pass required"
        )

    tele = telegraph_lines(cleaned)
    if tele:
        errors.append(
            "telegraph / bullet voice: " + "; ".join(tele) + " — see personas/storyline-editor.md § Lay audience"
        )

    is_cr_news = "cr-new-news" in str(script) or "cr-new-news" in str(editorial) or script.name.startswith("cr-")
    if not re.search(r"\b(so you see|that is why|here is what that means|the punchline|in plain english|now you see|in other words)\b", cleaned, re.I):
        if mode == "longform" and is_cr_news:
            warnings.append(
                "missing explicit 'aha' bridge — add one sentence where the viewer can say 'I get it now'"
            )

    jargon = jargon_without_bridge(cleaned)
    if jargon and is_cr_news:
        for j in jargon:
            errors.append(j + " — see personas/storyline-editor.md § Jargon bridges")

    for rm in retention_markers(raw_meta, cleaned, mode, is_cr_news):
        errors.append(rm)

    ok_hook, hook_msg = hook_strength(vo_blocks[0], mode)
    if not ok_hook:
        errors.append(f"hook: {hook_msg}")

    if not turn_markers(cleaned, mode):
        errors.append("no story turn markers (but/then/here's the receipt) — needs screenwriter + JK pass")

    words = len(cleaned.split())
    min_w = MIN_SHORT_WORDS if mode == "short" else MIN_LONG_WORDS
    if words < min_w:
        errors.append(f"spoken word count {words} < {min_w} for {mode}")

    if mode == "longform" and len(vo_blocks) < 5:
        warnings.append("fewer than 5 VO scenes — consider more re-hook beats")

    report = Path(args.report) if args.report else script.parent / f"qc-storyteller-{script.stem}.md"
    status = "PASS" if not errors else "FAIL"
    body = (
        f"# Storyteller gate — {status}\n\n"
        f"- script: `{script}`\n- mode: {mode}\n- words: {words}\n- vo_blocks: {len(vo_blocks)}\n\n"
    )
    if errors:
        body += "## Errors\n" + "\n".join(f"- {e}" for e in errors) + "\n"
    if warnings:
        body += "## Warnings\n" + "\n".join(f"- {w}" for w in warnings) + "\n"
    if status == "PASS":
        body += "\nSee `brand/storytelling-pipeline.md` and `personas/storyteller-score-rubric.md`.\n"
    report.write_text(body)

    print(f"[storyteller-gate] {status} — {words} words, {len(vo_blocks)} VO blocks")
    if warnings:
        for w in warnings:
            print(f"  warn: {w}")
    if errors:
        for e in errors:
            print(f"  ERR: {e}", file=sys.stderr)
        print(f"[storyteller-gate] report: {report}", file=sys.stderr)
        sys.exit(1)
    print(f"[storyteller-gate] report: {report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
