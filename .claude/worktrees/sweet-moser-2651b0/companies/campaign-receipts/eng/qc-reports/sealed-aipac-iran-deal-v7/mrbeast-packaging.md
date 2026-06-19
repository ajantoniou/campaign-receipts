# MrBeast Packaging — sealed-aipac-iran-deal-v7

ROLE: MrBeast Packaging
MODE: TRANSFORM
VERDICT: **PASS**

## Playbook anchors

- **Expectations contract:** Title + thumb + cold open all answer the same question — who paid the $82M, what did they get?
- **One image, one idea:** Giant **$82M** (Adelson 2016 cycle giving). The verdict applies to the JCPOA exit, not to the donor — stamp BROKEN refers to the Iran deal that was torn up.
- **Curiosity gap:** "3 promises kept" — viewer wants to know which three.

## CTR (title + thumb)

| Rank | Title (≤60 chars) | Chars |
|------|-------------------|-------|
| **1 (ship — current)** | `$82M DONOR. 3 PROMISES KEPT. WHO PAID FOR THE IRAN EXIT?` | 56 |
| 2 | `SHELDON ADELSON GAVE $82M — THEN THE IRAN DEAL DIED` | 51 |
| 3 | `FOLLOW THE $82M: IRAN, JERUSALEM, CAMPUS RULE` | 45 |

**Thumbnail (parchment `sealed` template, number-first):**

- `headline`: **$82M**
- `subline`: **3 PROMISES KEPT**
- `verdict`: **BROKEN**

Already locked in `youtube-meta` — no change needed. Keep as-is.

## AVD (description + cold open)

**First spoken line (verbatim — must match description line 1):**

> Sheldon Adelson gave roughly eighty-two million dollars in the twenty sixteen cycle — and three AIPAC priorities landed within Trump's first term.

**Description line 1 (drop-in):** verbatim cold open above (or current `description` line 1, which already opens with the $82M figure).
**Description line 2 (promise):** Three deliverables: U.S. left the Iran nuclear deal (May 8, 2018), embassy moved to Jerusalem (May 14, 2018), and EO 13899 (Dec 11, 2019) expanded campus antisemitism rules. Promise #73 on the SEALED scorecard.

## YPP risk

`yellow-expected`. Campaign-finance + named donor + "BROKEN" verdict on a deal — clean documentary framing but the donor angle invites limited-ads classification on the conservative side. Same posture as embassy LF: founder-acceptable trade for reach.

## Pipeline

- Source: `personas/viral-panel/06-mrbeast-packaging.md` + `MRBEAST-HOW-TO-GO-VIRAL.md`
- Ship fields: `eng/youtube-meta/sealed-aipac-iran-deal-v7.json` (already number-first)
- Render thumb: `node scripts/pipeline/generate-thumbnail.mjs --template sealed --headline "$82M" --subline "3 PROMISES KEPT" --verdict BROKEN --out _build/sealed-aipac-iran-deal-v7/thumbnail.jpg`
- Resume script: title already matches; no change required.
