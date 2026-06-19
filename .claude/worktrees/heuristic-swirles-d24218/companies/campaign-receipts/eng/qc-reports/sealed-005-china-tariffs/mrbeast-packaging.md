# MrBeast Packaging — sealed-005-china-tariffs

ROLE: MrBeast Packaging
MODE: TRANSFORM
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumb + cold open all say the same number — $350B+ in China tariffs, kept across two administrations.
- **One image, one idea:** Giant **$350B**. Verdict KEPT.
- **Mobile shorts grid:** the dollar-sign + B reads at any size.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship)** | `$350 BILLION IN TARIFFS — AND BIDEN KEPT THEM` | 46 |
| 2 | `HE CALLED CHINA A PIGGY BANK. THEN HIT $350B IN TARIFFS.` | 56 |
| 3 | `KEPT: $350B+ CHINA TARIFFS — SECTION 301` | 41 |

**Thumbnail (parchment `sealed` template, number-first):**

- `headline`: **$350B**
- `subline`: **CHINA TARIFFS · KEPT BY BIDEN TOO**
- `verdict`: **KEPT**

Rationale: dual-administration angle is the curiosity gap — adds "Biden kept them" to the subline so the thumb doesn't read as a partisan brag.

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> He said China was robbing America like a piggy bank — and once in office he put tariffs on more than three hundred fifty billion dollars in Chinese goods.

**Description line 1:** verbatim cold open above.
**Description line 2 (promise):** Section 301 tariffs across four rounds (2018–2019). Phase One deal Jan 15, 2020. Biden kept almost every tariff. Book grades it KEPT — the money actually moved.
**Description line 3 (CTA):** Full 145-promise audit: https://sealed2016.com?utm_source=youtube&utm_medium=shorts&utm_campaign=china-tariffs

## YPP risk

`green-expected`. Trade/tariff content, factual. Should monetize normally.

## Pipeline

- Ship fields: `eng/youtube-meta/sealed-005-china-tariffs.json`
- Render thumb: `node scripts/pipeline/generate-thumbnail.mjs --template sealed --headline "$350B" --subline "CHINA TARIFFS · KEPT BY BIDEN TOO" --verdict KEPT --out scripts/shorts/_build/005/thumbnail.jpg`
- Resume script: update `--title` for "Short 005 china" to ship pick.
