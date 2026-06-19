# MrBeast Packaging — sealed-007-repeal-obamacare

ROLE: MrBeast Packaging
MODE: TRANSFORM
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumb + cold open all converge on one Senate night — 49–51, McCain's thumb, Collins + Murkowski.
- **One image, one idea:** Giant **49–51** vote tally. Verdict BROKEN.
- **Mobile shorts grid:** the vote score reads as instantly recognizable drama.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship)** | `THREE REPUBLICANS KILLED OBAMACARE REPEAL — 49 TO 51` | 52 |
| 2 | `ONE SENATE NIGHT. ONE THUMB. OBAMACARE LIVED.` | 46 |
| 3 | `BROKEN: SKINNY REPEAL FAILED 49–51` | 35 |

**Thumbnail (parchment `sealed` template, number-first):**

- `headline`: **49–51**
- `subline`: **MCCAIN · COLLINS · MURKOWSKI**
- `verdict`: **BROKEN**

Rationale: the three names give viewers a face to attach — the founder screenshot showed real names beat abstract labels (Massie/Bush tier). Vote tally is the most recognizable single number from that night.

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> Seven years of repeal-and-replace chants — and one Senate night in twenty seventeen decided whether Obamacare actually died. Forty-nine yes votes. Not enough.

**Description line 1:** verbatim cold open above.
**Description line 2 (promise):** July 28, 2017 — Senate skinny repeal failed 49–51. McCain, Collins, Murkowski voted no. No replacement bill ever cleared the Senate. Book grades it BROKEN.
**Description line 3 (CTA):** Full 145-promise audit: https://sealed2016.com?utm_source=youtube&utm_medium=shorts&utm_campaign=obamacare-repeal

## YPP risk

`green-expected`. Senate procedural / health-policy history. Should monetize normally.

## Pipeline

- Ship fields: `eng/youtube-meta/sealed-007-repeal-obamacare.json`
- Render thumb: `node scripts/pipeline/generate-thumbnail.mjs --template sealed --headline "49–51" --subline "MCCAIN · COLLINS · MURKOWSKI" --verdict BROKEN --out scripts/shorts/_build/007/thumbnail.jpg`
- Resume script: update `--title` for "Short 007 skinny repeal" to ship pick.
