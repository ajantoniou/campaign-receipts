# Fact-Check QC — three-way reconciliation

> **Historical note (2026-05-21):** This report references a character
> named "Sarah." She was renamed to **Betsy** on 2026-05-21 (same
> character, same portrait, new name; founder directive). Mentions of
> Sarah below are preserved as the historical record of v3 — not
> updated retroactively.

**Video:** v3 — https://youtu.be/dWTVFcuyAo0 ("How $82 Million Killed Obama's Iran Deal | SEALED")
**Source:** downloaded from YouTube (no local master exists; state.json shows `assembled: false`, clips/ dir absent)
**Duration:** 263.5s (4:23) — matches published runtime
**Audio:** mean_volume = -19.2 dB, max_volume = -3.8 dB — passes the runbook ≥ -60 dB gate
**QC date:** 2026-05-21
**Spend:** $0.10 (ElevenLabs Scribe). OCR (tesseract), frame extraction (ffmpeg), and yt-dlp are free.

## Three-way reconciliation table

For each canonical figure: (a) SEALED book source line, (b) VO transcript (Scribe), (c) on-screen OCR.

| Figure | (a) SEALED book line | (b) VO (Scribe) | (c) On-screen (OCR/visual) | Verdict |
|---|---|---|---|---|
| $82M Adelson 2016 | build-retail-pdf.mjs:749 — "roughly **$82 million** to Republican-aligned committees in the 2016 cycle alone (FEC; OpenSecrets)" | "roughly $82 million to Republican-aligned committees in the 2016 cycle alone" | s7-03: "$82M" big-number reveal (visual confirm; OCR missed due to giant serif) | PASS |
| $218M Adelson lifetime | build-retail-pdf.mjs:726, 749 — "**$218 million** across his lifetime to Republican causes" | "Across his lifetime, a reported $218 million to Republican causes" | Not rendered as a dedicated card on screen (only $82M reveal) | PASS-VO / no-card |
| 3.67% JCPOA cap | build-retail-pdf.mjs:1519 — "up from 3.67% under the deal" | "cap their uranium enrichment at 3.67%" + "the cap was 3.67" | s2-01 "3.67% / UNDER DEAL"; s2-03 source card "3.67% under deal"; s9-01 "3.67% / UNDER DEAL"; s9-03 source card | PASS |
| 60% post-withdrawal | build-retail-pdf.mjs:1519, 1539 — "60% purity by 2021" | "By 2021, they hit 60% purity" | s2-03 "surged to 60% after withdrawal"; s9-01 "60% / AFTER WITHDRAWAL"; s9-03 "60% by 2021" | PASS |
| 90% weapons-grade | build-retail-pdf.mjs:1539 — "weapons-grade is 90%" | "Weapons grade is 90%" + "Weapons grade is 90" | s2-01 "90% / WEAPONS-GRADE THRESHOLD" | PASS |
| May 8, 2018 JCPOA withdrawal | build-retail-pdf.mjs:740, 820, 1517 | "May 8th, 2018" (twice) | s4-02 "MAY 8, 2018 / FEDERAL REGISTER — withdrawal announced" (visual confirm; OCR missed bold serif) | PASS |
| May 14, 2018 Embassy Jerusalem | build-retail-pdf.mjs:820 — "Embassy Jerusalem (State Dept, May 14, 2018)" | "Six days later, May 14th, 2018, embassy moves to Jerusalem" | Not rendered as a dedicated date card; only spoken | PASS-VO / no-card |
| Dec 11, 2019 EO 13899 | build-retail-pdf.mjs:744, 820, 898 | "December 11th, 2019. Executive Order 13899 expands the antisemitism definition" | Not rendered as a dedicated date card; only spoken | PASS-VO / no-card |
| 3-for-3 AIPAC priorities | build-retail-pdf.mjs:726, 740–744 — Iran / Embassy / Antisemitism EO | "Number one, kill the Iran deal; number two, move the U.S. embassy to Jerusalem; number three, expand the antisemitism definition" + "Three for three" | s6-01 "THREE FOR THREE / IRAN DEAL / EMBASSY MOVE / **TAX CUTS**" | **FAIL** |
| 145 promises (book total) | (book ToC) | "The book grades all 145 promises" | s10-01 "THE 2016 PROMISE AUDIT" (count not on card) | PASS |
| Promise #73 (Iran deal) | (Iran-deal chapter heading) | "promise number 73" + "Promise 73" | s3-02 "PROMISE #73 / Tear Up The Iran Nuclear Deal" | PASS |

## Founder-flagged failure modes — explicit search

| Failure mode | Result |
|---|---|
| Adelson figure that is NOT $82M / $218M (e.g. $26M, $86M) | NOT FOUND. Only $82M appears on screen, matching the book. |
| Multi-decimal nonsense (e.g. "3.6.1%") | NOT FOUND. All percentages render as "3.67%" / "60%" / "90%". |
| Source-card page number not HTML-rendered | NOT FOUND. s2-03 and s9-03 render "p.1519" cleanly; s7-04 renders "p.730–798". HTML text-card renderer (commit cb7e0503) worked. |
| Year-token "twenty thousand" leak in VO | NOT FOUND. Scribe transcript shows "2015", "2016", "2018", "2019", "2021" spoken correctly. |

## NEW failures discovered

### FAIL #1 — s6-01 "THREE FOR THREE" card has wrong third item (FACTUAL ERROR)
**On screen:** IRAN DEAL · EMBASSY MOVE · **TAX CUTS**
**VO says:** "Number one, kill the Iran deal; number two, move the U.S. embassy to Jerusalem; **number three, expand the antisemitism definition** to cover criticism of Israel on U.S. campuses."
**SEALED book (build-retail-pdf.mjs:744):** "Priority #3: Expand the antisemitism definition to cover criticism of Israel. Done. December 11, 2019. Executive Order 13899..."

"Tax cuts" was never an AIPAC published priority — it is unrelated to the chapter thesis and undermines the entire three-for-three argument. The on-screen card directly contradicts the spoken narration and the book. This is exactly the class of error the founder created the fact-check QC role to catch.

**Root cause (suspected):** The s6-01 storyboard prompt was generic ("three different policy phrases in large serif type"); when the HTML text-card renderer (`render-text-cards.mjs`, added in cb7e0503) instantiated the card, it appears to have substituted a generic Trump-era policy ("tax cuts") for the AIPAC priority #3 ("antisemitism EO 13899"). The storyboard JSON did not pin the content to the canonical wish list.

### FAIL #2 — Sarah is a small corner-box overlay, NOT full-frame presenter
**Observed at t=2s, t=6s, t=245s, t=257s, t=261s:** Sarah appears as a ~180x180px box anchored to the upper-right corner of a 1280x720 frame. Background is the underlying scene (world map, parchment cards), not a presenter composition.
**Required per runbook Hard Rule #4 (referenced in brief):** Full-frame presenter at intro/mid-1/mid-2/outro — Sarah at ~70–80% of frame for intro/outro, ~60% width for mid-1/mid-2, with feathered alpha and text callouts beside her.

## Verdict — FAIL (two distinct failures)

1. **Factual:** s6-01 mislabels AIPAC priority #3 as "tax cuts" instead of antisemitism EO 13899.
2. **Composition:** Sarah is corner-box, not full-frame presenter.

See `qc-blocked.md` for rebuild decision.
