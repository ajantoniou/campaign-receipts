# MrBeast Packaging — sealed-drain-the-swamp-v1

ROLE: MrBeast Packaging
MODE: TRANSFORM
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumbnail + first VO line all converge on one fact — the swamp grew, on paper, while the pledge was active.
- **One image, one idea:** Money number `$3.53B` (lobbying after the pledge). Stamp BROKEN.
- **First ~2 lines of description** mirror cold open before "…more" — drives AVD.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship)** | `LOBBYING ROSE $400M WHILE TRUMP DRAINED THE SWAMP` | 49 |
| 2 | `DAY 8: PLEDGE SIGNED. LAST DAY: PLEDGE REVOKED.` | 47 |
| 3 | `BROKEN: DRAIN THE SWAMP — PLEDGE SIGNED, THEN REVOKED` | 53 |

**Thumbnail (parchment `sealed` template, number-first):**

- `headline`: **$3.53B**
- `subline`: **LOBBYING — AFTER THE PLEDGE**
- `verdict`: **BROKEN**

Rationale: parallel to short 004 so the LF + short read as one unit on the channel page. Dollar number beats abstract "SWAMP GREW".

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> Drain the swamp was the loudest promise of twenty sixteen — so follow the one piece of paper that actually tried to enforce it, and what happened to it on his last day.

**Description line 1 (drop-in):** verbatim cold open above.
**Description line 2 (promise):** EO 13770 (Jan 28, 2017) — five-year lobbyist ban + lifetime foreign-lobby ban. EO 13983 (Jan 20, 2021) — pledge revoked. Lobbying spend: $3.15B (2016) → $3.53B (2020). Promise graded BROKEN.

## Pipeline

- Source: `personas/viral-panel/06-mrbeast-packaging.md` + `MRBEAST-HOW-TO-GO-VIRAL.md`
- Ship fields: `eng/youtube-meta/sealed-drain-the-swamp-v1.json`
- Render thumb: `node scripts/pipeline/generate-thumbnail.mjs --template sealed --headline "$3.53B" --subline "LOBBYING — AFTER THE PLEDGE" --verdict BROKEN --out _build/sealed-drain-the-swamp-v1/thumbnail.jpg`
- Resume script: `scripts/pipeline/sealed-youtube-resume.sh` — update `--title` for "LF drain" to ship pick.
