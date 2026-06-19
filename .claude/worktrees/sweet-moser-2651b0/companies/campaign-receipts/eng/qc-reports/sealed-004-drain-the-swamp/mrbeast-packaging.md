# MrBeast Packaging — sealed-004-drain-the-swamp

ROLE: MrBeast Packaging
MODE: TRANSFORM
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumb + cold open all answer the same question — did the swamp drain? No: it grew $3.15B → $3.53B, then the pledge was revoked.
- **One image, one idea:** Money number `$3.53B` (lobbying spend after a "drain" pledge). Verdict BROKEN.
- **Mobile shorts grid:** money signs and the up-arrow / delta read at thumb size.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship)** | `LOBBYING SPEND ROSE $400M WHILE HE DRAINED THE SWAMP` | 52 |
| 2 | `DAY 8: PLEDGE SIGNED. LAST DAY: PLEDGE REVOKED.` | 47 |
| 3 | `BROKEN: DRAIN THE SWAMP — $3.15B → $3.53B` | 41 |

**Thumbnail (parchment `sealed` template, number-first):**

- `headline`: **$3.53B**
- `subline`: **LOBBYING — AFTER THE PLEDGE**
- `verdict`: **BROKEN**

Rationale: dollar number + delta beats the abstract "SWAMP GREW" subline that was on the prior thumb. Numerals + `$` survive on the shorts shelf.

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> Drain the swamp was the loudest promise of twenty sixteen — so follow the one piece of paper that actually tried to enforce it, and what happened to it on his last day.

**Description line 1:** verbatim cold open above.
**Description line 2 (promise):** EO 13770 (Jan 28, 2017) — five-year lobbyist ban. EO 13983 (Jan 20, 2021) — pledge revoked. Lobbying spend $3.15B (2016) → $3.53B (2020).
**Description line 3 (CTA):** Full 145-promise audit: https://sealed2016.com?utm_source=youtube&utm_medium=shorts&utm_campaign=drain-swamp

## YPP risk

`green-expected`. Policy/ethics content, no sensitive-events bucket. Should monetize normally.

## Pipeline

- Ship fields: `eng/youtube-meta/sealed-004-drain-the-swamp.json`
- Render thumb: `node scripts/pipeline/generate-thumbnail.mjs --template sealed --headline "$3.53B" --subline "LOBBYING — AFTER THE PLEDGE" --verdict BROKEN --out scripts/shorts/_build/004/thumbnail.jpg`
- Resume script: update `--title` for "Short 004 swamp" to ship pick.
