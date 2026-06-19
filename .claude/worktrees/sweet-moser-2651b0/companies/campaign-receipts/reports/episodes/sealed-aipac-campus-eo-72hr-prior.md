# Stage 1 Analytics — sealed-aipac-campus-eo (prior-piece review)

**Prepared for:** Stage 2 (story-investigator) of LF `sealed-aipac-campus-eo`
**Date:** 2026-05-28
**Prior piece of record:** live Short `CNmFoUgK4ls` — "HE PROMISED CAMPUS FREE SPEECH. EO 13899 SAID NO." (slug `sealed-003-aipac-campus`)

---

## 1. Data availability statement (what's real vs unavailable)

**REAL (cite-able, on disk):**
- View/like/comment counts for the live campus Short and its 14 batch-mates, from `reports/episodes/sealed-shorts-batch-2026-05-24-10h-baseline.md` (snapshot 2026-05-25 14:20 UTC, ~10h after a simultaneous 15-Short upload). Source = YouTube **Data API** (statistics only).
- The Short's locked title/thumb/desc from `eng/youtube-meta/sealed-003-aipac-campus.json`.

**UNAVAILABLE (declared gap, NOT fabricated):**
- **CTR, average view duration (AVD), average % viewed, traffic source, subscribers-gained** — all require the YouTube **Analytics API**, which is **blocked at 403** (GCP project 884808726991 needs `youtubeanalytics.googleapis.com` enabled per the baseline report's data-source note).
- `scripts/pipeline/youtube-analytics-snapshot.py` **does not exist** (persona file lists it as TODO; `ls` confirms no file). No 72h re-pull was ever captured for this batch — the latest snapshot on disk is the ~10-11h one. The 11h JSON (`...analytics-11h.json`) reads all-zero (Data API statistics lag), so the **10h baseline is the only usable real number.**

So: I have **views, not retention.** Per founder rule I will not invent CTR/AVD numbers. The signal below is built from real view counts + the Short's metadata/structure.

---

## 2. Prior-piece signal — does the live Short show LF appetite?

**Real number:** the campus Short pulled **63 views / 2 likes / 0 comments in ~10h**, ranking **#6 of 15** SEALED Shorts uploaded the same minute. Engagement floor: 2 likes (~3.2% like/view), zero comments.

**Read on appetite — MODERATE, with a packaging caveat, NOT a demand mandate:**
- It cleared the mid-pack — above the 7-Short zero/low tail, below the breakout (`tax-returns` at 299v). It is a **viable topic, not a proven breakout.** Treat as "audience will sit for it if packaged like a broken promise," not "audience is hungry for this."
- The batch's clearest pattern (baseline report §"Patterns visible in the top 4"): **the top 4 were all BROKEN verdicts**, and all used either (1) universal-norm + outlier callout ("every president… except one") or (2) a number/dollar-anchored receipt. **No KEPT and no PARTIAL cracked the top 5.**
- **Packaging flag for Stage 2:** the metadata JSON tags this piece `"verdict": "PARTIAL"`, but the live title frames it as flat BROKEN ("SAID NO"). The LF brief locks **BROKEN.** The data says BROKEN framing travels and PARTIAL does not — so keeping the BROKEN verdict is the right call, but the LF must *earn* BROKEN with the receipt, not soften to PARTIAL mid-script.
- **Why it under-performed the top 4 (inference, not measured):** its title leads with the promise/abstraction ("CAMPUS FREE SPEECH") and an opaque code ("EO 13899") rather than a concrete number or a universal-norm contrast. The top performers led with a number or an "everyone-except-one" frame. The campus Short has neither. This is a **packaging-shape gap, not a topic-demand gap** — the topic placed mid-pack despite the weakest hook structure in the cohort, which is mildly encouraging for the LF.

**Bottom line for Stage 2:** topic is greenlit and BROKEN-framed; demand is real but middling; the win is available if the LF finds a sharper, number-or-contrast hook than the Short used.

---

## 3. Concrete recommendations for the new LF

- **Radar "current hook" flag is binding (NOT optional).** The 2026-05-27 radar HELD this candidate pending a current peg. Stage 2 + Stage 6 MUST surface a 2025-2026 campus-speech news peg (recent Title VI investigations, IHRA-definition adoptions, or campus enforcement actions) with a rights-safe source, connecting the 2019 EO to a now-tension. A cold 2019 history lesson is the predicted failure mode here. If no clean current peg exists, surface to founder BEFORE render spend.
- **Fix the hook shape the Short missed.** Don't open on "campus free speech / EO 13899" (abstraction + code). Open on a number or a universal-norm-vs-outlier contrast, matching the batch's top-4 winners. The code "EO 13899" earns its place as the *receipt*, not the *hook*.
- **Keep the BROKEN verdict, earn it on screen.** PARTIAL framing did not travel in the cohort. Hold BROKEN; let the receipt (EO 13899, Dec 11 2019, IHRA → Title VI) do the work.
- **New Shorts from this LF must NOT duplicate `CNmFoUgK4ls`.** The existing live Short already owns the "promise → EO 13899 → BROKEN" punchline. Per the brief's Shorts plan, any carved Short must offer a DIFFERENT angle/punchline (e.g. the *current-peg* tension, or the IHRA-definition mechanism) — not re-cut the same beat. Flag to video-editor/copywriter at Shorts stage.
- **Jargon bridges are non-negotiable for retention.** EO 13899, Title VI, and IHRA each need an immediate "in other words" plain-English bridge (brief + 3rd-grade doctrine). On a long-form these three terms are the most likely mid-roll drop points; the Short was short enough to survive them, the LF is not.

---

## Verdict line

**STUDY → BUILD** — campus topic placed #6/15 (63v/10h, real Data-API number) with the cohort's weakest hook shape and a BROKEN frame that travels; LF is greenlit if Stage 2 lands a current peg and a number/contrast hook. **Retention metrics (CTR/AVD/traffic) are UNAVAILABLE — Analytics API 403, no snapshot script — so this is a views-and-packaging read, not a retention read.**
