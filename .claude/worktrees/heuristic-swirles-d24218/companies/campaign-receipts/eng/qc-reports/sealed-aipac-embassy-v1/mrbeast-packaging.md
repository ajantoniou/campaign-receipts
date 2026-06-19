# MrBeast Packaging — sealed-aipac-embassy-v1

ROLE: MrBeast Packaging  
MODE: TRANSFORM  
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumbnail + first spoken line are one unit — viewer must get the same promise in all three.
- **One image, one idea:** Giant **60** = same-day border death count; not three dates on the thumb.
- **First ~2 lines of description** mirror cold open before "…more" — drives AVD.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship)** | `60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT` | 50 |
| 2 | `4 PRESIDENTS SAID NOT YET. THEN JERUSALEM — 60 DEAD` | 52 |
| 3 | `KEPT: EMBASSY MOVED. HERE'S WHAT ELSE HAPPENED THAT DAY` | 54 |

**Thumbnail (SEALED parchment — `generate-thumbnail.mjs` default):**

- `headline`: **60**
- `subline`: **SAME DAY AS JERUSALEM** / **AY-PACK #2 KEPT**
- `verdict`: **KEPT**

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> Twenty years of presidents said not yet — keep the embassy in Tel Aviv, keep the peace talks alive. Then, on one spring afternoon in twenty eighteen, the United States cut the ribbon in Jerusalem. Before you cheer or curse that moment, you need the rest of the afternoon — because the book does not let you have the ceremony without the border.

**Description lines 1–2 (drop-in):** same block above, then one-sentence promise (line 3 in `eng/youtube-meta/sealed-aipac-embassy-v1.json`).

## Pipeline

- Source: `personas/viral-panel/06-mrbeast-packaging.md` + `MRBEAST-HOW-TO-GO-VIRAL.md`
- Ship fields: `eng/youtube-meta/sealed-aipac-embassy-v1.json`
- Render: `pre-upload-pack.py --slug sealed-aipac-embassy-v1 --mode longform`
