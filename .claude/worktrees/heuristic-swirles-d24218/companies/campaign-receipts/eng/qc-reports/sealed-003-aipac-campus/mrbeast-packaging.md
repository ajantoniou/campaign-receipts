# MrBeast Packaging — sealed-003-aipac-campus

ROLE: MrBeast Packaging
MODE: TRANSFORM
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumb + first VO line all point at the same fact — a free-speech promise rewritten by a federal order.
- **One image, one idea:** The order number **EO 13899** is the receipt. Verdict BROKEN.
- **Mobile shorts grid:** word count on thumb ≤ 5; numerals + a stamp.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship)** | `HE PROMISED CAMPUS FREE SPEECH. EO 13899 SAID NO.` | 49 |
| 2 | `THE EXECUTIVE ORDER THAT QUIETLY NARROWED CAMPUS SPEECH` | 55 |
| 3 | `BROKEN: CAMPUS FREE SPEECH vs EO 13899` | 39 |

**Thumbnail (parchment `sealed` template, number-first):**

- `headline`: **EO 13899**
- `subline`: **CAMPUS SPEECH NARROWED**
- `verdict`: **BROKEN**

Rationale: the order number is more concrete than "BROKEN" alone; pairing with the BROKEN stamp keeps the verdict legible without burning the headline slot.

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> He promised to protect campus speech on the trail — but in December twenty nineteen he signed Executive Order thirteen eight ninety-nine, pushing schools toward federal rules on criticism of Israel.

**Description line 1:** verbatim cold open above.
**Description line 2 (promise):** Trail talk: open debate. Receipt: EO 13899 (Dec 11, 2019) applied the IHRA antisemitism definition to Title VI schools. The book grades it BROKEN.
**Description line 3 (CTA):** Full 145-promise audit: https://sealed2016.com?utm_source=youtube&utm_medium=shorts&utm_campaign=campus-eo

## YPP risk

`green-expected` for the title (no death-verb, no slur). Body discusses Title VI policy — neutral, sourced. Should monetize normally once YPP unlocks.

## Pipeline

- Ship fields: `eng/youtube-meta/sealed-003-aipac-campus.json`
- Render thumb: `node scripts/pipeline/generate-thumbnail.mjs --template sealed --headline "EO 13899" --subline "CAMPUS SPEECH NARROWED" --verdict BROKEN --out scripts/shorts/_build/003/thumbnail.jpg`
- Resume script: update `--title` for "Short 003 campus" to ship pick.
