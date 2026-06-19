#!/usr/bin/env python3
"""
Convert persona .md files in companies/<co>/personas/ and shared/personas/
to the Paperclip AGENTS.md 8-section format.

Reference: infrastructure/paperclip/skills/paperclip-create-agent/references/baseline-role-guide.md

The 8 canonical sections:
  1. Identity and reporting line
  2. Role / Role charter
  3. Operating workflow / Working rules
  4. Domain lenses
  5. Output / Output bar
  6. Collaboration / Collaboration and handoffs
  7. Safety / Safety and permissions
  8. Done / Done criteria

Strategy:
- Files that already have AGENTS.md format (`<!-- AGENTS.md format -->` marker
  in first 200 chars) are skipped (idempotent re-runs).
- For each persona file, prepend a structural AGENTS.md frontmatter that
  maps existing content into the 8-section frame. Original prose is
  preserved under section 9 "Persona reference".
- This is intentionally a low-risk transformation: it ADDS structure rather
  than rewriting existing content. High-quality manual rewrites can follow
  for high-leverage roles (CEO, Chief of Staff).

Hibernating companies are SKIPPED. Re-run after wake-up to convert them.

Usage:
  python3 convert-personas-to-agents-md.py            # dry run, prints what would change
  python3 convert-personas-to-agents-md.py --apply    # applies in-place

Author: Audit fix 2026-05-05 (Chief of Staff)
"""

import os
import re
import sys
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
HIBERNATING = {"hyperlocal-matrix", "plutus-street"}
MARKER = "<!-- AGENTS.md format (Paperclip-native, 8 sections) -->"


def role_from_filename(path: Path) -> str:
    """Convert e.g. 'head-of-growth.core.md' -> 'Head Of Growth'."""
    stem = path.stem
    if stem.endswith(".core"):
        stem = stem[:-len(".core")]
    return stem.replace("-", " ").replace("_", " ").title()


def company_from_path(path: Path) -> str:
    """Extract company slug from path; 'shared' for shared templates."""
    parts = path.parts
    try:
        i = parts.index("companies")
        return parts[i + 1]
    except (ValueError, IndexError):
        return "shared"


def already_converted(text: str) -> bool:
    return MARKER in text[:500]


def build_agents_md_header(role: str, company: str) -> str:
    """Build the canonical 8-section AGENTS.md header.

    Sections 1-8 are the Paperclip baseline; section 9 wraps the original
    persona content. The header is small enough to add without bloat.
    """
    company_label = "Portfolio" if company == "shared" else company
    return f"""{MARKER}
# AGENTS.md — {role} ({company_label})

This file is the Paperclip instruction bundle for the {role} agent. Format
follows `infrastructure/paperclip/skills/paperclip-create-agent/references/baseline-role-guide.md`.
At hire time, send this file's content as `instructionsBundle.files["AGENTS.md"]`
on `POST /api/companies/<id>/agent-hires`.

## 1. Identity and reporting line

You are agent {role} at {company_label}. When you wake up, follow the
Paperclip skill (it contains the full heartbeat procedure). See section
6 below for your reporting line; if not specified, default to the CEO
of this company.

## 2. Role

See section 9 "Persona reference" below. The role charter lives in the
existing persona prose. Future revisions should split that content into
this section explicitly.

## 3. Working rules

Start actionable work in the same heartbeat; do not stop at a plan unless
planning was requested. Leave durable progress with a clear next action.
Use child issues for long or parallel delegated work instead of polling.
Mark blocked work with owner and action. Respect budget, pause/cancel,
approval gates, and company boundaries.

If `.cos-pause` exists at the parent monorepo root, pause auto-promotes
and side-effecting actions; continue to write briefings.

Update your task with a comment before exiting any heartbeat.

## 4. Domain lenses

See section 9 "Persona reference" below. Lenses live inline with role
prose for now; future revisions should extract them here.

## 5. Output bar

See section 9 "Persona reference" below.

## 6. Collaboration

Default reporting line: CEO of this company. Cross-cutting roles (Chief
Accountant, Chief Legal, McKinsey advisor, YC advisor, Paperclip Feedback
agent) report to the Chief of Staff at Portfolio HQ — see
`companies/portfolio-hq/vision.md`.

## 7. Safety and permissions

Default to least privilege. Heartbeats off unless explicitly enabled with
an `intervalSec`. Do not embed secrets in `adapterConfig`,
`instructionsBundle`, or persona prose. Use `desiredSkills` and env-injected
credentials only.

## 8. Done

Verify your own work before marking an issue `done`. Cite evidence in the
final comment (commands run, outputs checked, screenshots captured). PATCH
status via `PATCH /api/issues/<id>` with `{{"status":"done"}}` — do NOT
write closure-narration markdown files.

---

## 9. Persona reference (original prose, preserved)

The remainder of this file is the original persona content from before
the AGENTS.md restructure on 2026-05-05. It contains the role charter,
domain lenses, and output bar inline. Future quality passes will extract
those into sections 2/4/5 above.

"""


def convert_file(path: Path, apply: bool) -> str:
    """Convert one persona file. Returns 'converted' / 'skipped' / 'error'."""
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return f"error: not utf-8 ({path})"
    if already_converted(text):
        return "skipped (already converted)"
    role = role_from_filename(path)
    company = company_from_path(path)
    header = build_agents_md_header(role, company)
    new_text = header + text
    if apply:
        path.write_text(new_text, encoding="utf-8")
    return "converted"


def find_persona_files() -> list[Path]:
    """All .md files under companies/*/personas/ and shared/personas/.
    Skips hibernating companies and skips the 'reference.md' meta-files
    that aren't actual personas.
    """
    files: list[Path] = []
    for co_dir in sorted((REPO / "companies").iterdir()):
        if not co_dir.is_dir() or co_dir.name in HIBERNATING:
            continue
        personas = co_dir / "personas"
        if personas.is_dir():
            files.extend(p for p in personas.glob("*.md") if not p.name.endswith(".reference.md"))
    shared = REPO / "shared" / "personas"
    if shared.is_dir():
        files.extend(p for p in shared.glob("*.md") if not p.name.endswith(".reference.md"))
    return files


def main():
    apply = "--apply" in sys.argv
    files = find_persona_files()
    print(f"Found {len(files)} persona files (skipping hibernating: {sorted(HIBERNATING)})")
    counts = {"converted": 0, "skipped": 0, "error": 0}
    for f in files:
        rel = f.relative_to(REPO)
        result = convert_file(f, apply)
        if result.startswith("converted"):
            counts["converted"] += 1
        elif result.startswith("skipped"):
            counts["skipped"] += 1
        else:
            counts["error"] += 1
        print(f"  {result:<30} {rel}")
    print(f"\nTotals: {counts}")
    if not apply:
        print("\nDry run. Re-run with --apply to write changes.")


if __name__ == "__main__":
    main()
