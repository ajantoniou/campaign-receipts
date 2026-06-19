# SEALED — working manuscript & editorial coordination

> ⚠️ **Workflow superseded (2026-05-12).** The canonical manuscript pipeline is
> now **`scripts/build-retail-pdf.mjs`** (prose embedded inline) →
> **`artifacts/SEALED-v1-retail.pdf`**. The Markdown editorial draft
> (`artifacts/sealed-v1-content.md`) and the Ch.1 proof pipeline referenced
> below are archived in `artifacts/archive/` and `scripts/archive/`. This
> document is preserved for history. To edit manuscript content today, edit
> `scripts/build-retail-pdf.mjs` directly.

**Milestone + ticket map (Ch.1 pilot):** [`SEALED-V1-DELIVERY-MILESTONES.md`](SEALED-V1-DELIVERY-MILESTONES.md) (CON-171 subtree). **Live progress (which chapter/section is done):** [`MANUSCRIPT-PROGRESS-TRACKER.md`](MANUSCRIPT-PROGRESS-TRACKER.md). **Repeat until TOC complete:** [`CHAPTER-EXECUTION-LOOP.md`](CHAPTER-EXECUTION-LOOP.md).

## Canonical working manuscript

| Artifact | Role |
|----------|------|
| [`artifacts/sealed-v1-content.md`](../artifacts/sealed-v1-content.md) | **Live working manuscript** — foreword, methodology, hooks, case studies, scorecard scaffolds. Writer/copywriter extends this **chapter by chapter, section by section** until print/PDF freeze. |
| [`artifacts/SEALED-CHAPTER-OUTLINE-V1.md`](../artifacts/SEALED-CHAPTER-OUTLINE-V1.md) | Spine reference — parts, chapters, section titles. |

Drive-hosted finals (Concise Reads / Grab It Nation lineage) remain symlinks per `eng/CONCISE-READS-SOURCE-MAP.md`; **repo markdown is the integration surface** for web copy and generator scripts.

## Paperclip execution (Concise)

Milestone epic **CON-171** sequences outline lock → Part I Ch.1 research packet → Ch.1 manuscript → Ch.1 plates → CTO proof PDF; Paperclip may show the epic **`blocked`** as a board visibility gate while children (**CON-174** … **CON-176**) execute — see [`SEALED-V1-DELIVERY-MILESTONES.md`](SEALED-V1-DELIVERY-MILESTONES.md). Child issues: **CON-172** (M1 Literary), **CON-173** (M2 Pipeline Validator), **CON-174** (M3 Literary), **CON-175** (M4 Book Illustrator), **CON-176** (M5 CTO). Detail + deps: [`SEALED-V1-DELIVERY-MILESTONES.md`](SEALED-V1-DELIVERY-MILESTONES.md). Research drops: [`research/README.md`](../research/README.md).

## Roles

| Role | Delivers |
|------|-----------|
| **Writer / copywriter** | Narrative body (comparison-first after verbatim blocks), margin-rail discipline, chapter/section drafts merged into `sealed-v1-content.md` or attached sections merged by CTO/literary agent. |
| **Copy researcher** | Per-section **research packets**: deep hooks (URLs, dataset names, agency calendars), contradictory primary sources, date-stamped captures. Feeds the writer **before** prose freeze on that section—never the reverse. |

## Cadence (default)

1. **Outline lock** — Section titles align to `SEALED-CHAPTER-OUTLINE-V1.md` (or explicit TOC amendment).
2. **Research packet in** — Hooks, transcripts IDs, `.gov` pointers; optional “stress tests” (what could embarrass the ledger if omitted).
3. **Writer draft out** — Verbatim quote + context rail + comparison body for that section only.
4. **Cross-check** — Researcher verifies quotes against transcripts; writer fixes attribution lines.
5. **Merge** — CTO or literary agent lands Markdown into `sealed-v1-content.md`; PDF/ePub pipeline picks up on release tags.

## Outline lock (Part I sections)

- As of CON-172 (M1 Literary), `artifacts/SEALED-CHAPTER-OUTLINE-V1.md` lists Part I chapters 1‑5 and their Section A/B/C headings exactly as they appear in `sealed-v1-content.md`, so the Table of Contents is locked to the current manuscript draft.
- Future chapter or section renames must be recorded here with the date and commit hash (e.g., `2026-05-07: Section B “Margin rails decoded” → “Margin rails guide”`) so the editorial workflow preserves the lock history.

## Landing page sync

Marketing (`lib/landing-content.ts`, `verificationPathCards`) must **match** the manuscript: same **lead** + **support** sentences as **Verification paths** in `sealed-v1-content.md`—full prose, no “Hook ·” placeholder chrome.

## Escalation

Stale section blocking retail freeze → Chief of Staff flags in company backlog; writer and researcher pair on the smallest unblocking packet (usually missing primary URL or ambiguous date).
