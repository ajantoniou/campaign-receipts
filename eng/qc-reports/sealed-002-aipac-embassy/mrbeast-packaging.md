# MrBeast Packaging — sealed-002-aipac-embassy

ROLE: MrBeast Packaging
MODE: TRANSFORM
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumbnail + first VO line are one unit — the viewer must hear the same promise they read.
- **One image, one idea:** Giant **60** (same-day Gaza death count). Receipt stamp KEPT — the promise was kept; the cost stays in the subline.
- **Mobile shorts grid:** ~360 px wide. Numerals must survive at that size; word count on thumb ≤ 6.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship)** | `60 DEAD THE SAME DAY THE EMBASSY MOVED` | 39 |
| 2 | `4 PRESIDENTS DELAYED JERUSALEM — THEN 60 DIED` | 45 |
| 3 | `MAY 14, 2018: RIBBON IN JERUSALEM, 60 AT THE BORDER` | 51 |

**Thumbnail (parchment `sealed` template, number-first):**

- `headline`: **60**
- `subline`: **SAME DAY · JERUSALEM**
- `verdict`: **KEPT**

Rationale: matches the LF embassy thumb (also `60` / `KEPT`) so the playlist + shelf read as one unit. Number is feed-legible at 246×138.

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> Four presidents delayed Jerusalem for decades — then on May fourteenth, twenty eighteen, the ribbon finally cut in Jerusalem while, forty miles away, the border turned deadly.

**Description line 1 (drop-in):** verbatim cold open above.
**Description line 2 (promise):** AIPAC priority #2 KEPT — embassy moved. Same afternoon: ~60 killed at the Gaza border. Promise #74 on the SEALED scorecard.
**Description line 3 (CTA):** Full 145-promise audit: https://sealed2016.com?utm_source=youtube&utm_medium=shorts&utm_campaign=embassy

## YPP risk (forward-looking; channel pre-YPP)

`yellow-expected` — "60 dead" in title triggers Sensitive Events. Documentary framing in description, no extremism tags. Same posture as LF embassy; founder previously approved limited-ads tax for reach.

## Pipeline

- Source: `personas/viral-panel/06-mrbeast-packaging.md` + `MRBEAST-HOW-TO-GO-VIRAL.md`
- Ship fields: `eng/youtube-meta/sealed-002-aipac-embassy.json`
- Render thumb: `node scripts/pipeline/generate-thumbnail.mjs --template sealed --headline "60" --subline "SAME DAY · JERUSALEM" --verdict KEPT --out scripts/shorts/_build/002/thumbnail.jpg`
- Resume script: `scripts/pipeline/sealed-youtube-resume.sh` — update the `--title` flag for "Short 002 embassy" to the ship pick.
