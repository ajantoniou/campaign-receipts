# Prior-Piece Analytics Read — feeding Stage 1 of `sealed-aipac-embassy-v2`

**Compiled:** 2026-05-28
**Author:** analytics-tracker (Stage 1)
**Purpose:** Stage 1 binding input for the SEALED longform remake `sealed-aipac-embassy-v2`, which will replace the currently-live Jerusalem embassy LF `SSuO2KOXr0Y` ("60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT", promise #74 KEPT) via `--replace-id` after QC. Surfaces what is actually documented about the live v1 and recent SEALED/CR comps, then converts it into operational carry-over for v2. Where data is missing, it is named missing — not guessed.

---

## Summary line

**STUDY** — there is **no real CTR, AVD, retention, or traffic-source data on disk** for the live embassy v1 (`SSuO2KOXr0Y`) or its companion SEALED short (`rT3G1VSV46g`, all-zero in the only snapshot that touches it); the YouTube Analytics API was blocked for the entire prior batch. v2 carry-over is therefore drawn from (a) the live v1's title/thumbnail/storyboard structure, (b) the SEALED Shorts batch title-pattern signal, and (c) the founder-locked pipeline lessons (empathy passes, cadence-director, score-composer, in-world Remotion) — all of which v1 predates and v2 is explicitly being built to add.

---

## 1. Data availability statement — what is real vs unavailable

**No snapshot script exists.** `scripts/pipeline/youtube-analytics-snapshot.py` is **not on disk** (still TODO per the persona doc, hard rule A). I did not call any paid or live API (cost cap $0.10, read-only).

**No analytics report references `SSuO2KOXr0Y`.** `grep -rl "SSuO2KOXr0Y" reports/` returns nothing. The video ID appears only in `eng/PUBLISHED-YOUTUBE.md`, the pending-queue/handoff/playbook docs, and the v2 topic brief — i.e. as a publishing record and a `--replace-id` target, never as captured metrics.

**The one snapshot that touches the embassy is all zeros.** The companion SEALED short `sealed-002-aipac-embassy` (vid `rT3G1VSV46g`, "60 DEAD / EMBASSY MOVED", KEPT) appears in `reports/episodes/sealed-shorts-batch-2026-05-24-analytics-11h.json` with `views: 0, avg_view_pct: 0, avg_view_dur_s: 0, subs_gained: 0, traffic: {}`. The prior 72hr-prior report (`cr-what-happened-to-trump-72hr-prior.md` §1) documents why: the Analytics API endpoint was 403 (GCP project needs `youtubeanalytics.googleapis.com` enabled), so every retention/AVD field in that batch returned zero. The embassy short was also outside the top-4 by raw Data-API views (top-4 were all BROKEN verdicts; the embassy short is a KEPT verdict, and the highest-ranked KEPT short in the batch was china-tariffs at 67v).

**What IS real and readable:**
- `eng/youtube-meta/sealed-aipac-embassy-v1.json` — locked title, alt titles, thumbnail spec, tags, description/chapters.
- `eng/storyboards/sealed-aipac-embassy-v1.json` — clip structure, durations (205s total), vendors, music cues.
- `eng/briefs/2026-05-28-sealed-aipac-embassy-v2-topic-brief.md` — the v2 mandate.
- The prior 72hr-prior report's documented Shorts title-pattern signal.

**Bottom line:** This is a **qualitative read of v1's packaging and structure**, not a metrics read. There is no retention curve, no CTR, no AVD, no traffic split to cite for the embassy LF. Treat every recommendation below as structural inference, not data-driven optimization.

---

## 2. Prior-piece signal (qualitative — no metrics available)

### 2a. Live v1 title / thumbnail (the click engine)

Live title: **"60 KILLED THE SAME DAY — JERUSALEM EMBASSY RECEIPT"**
Thumbnail: big **"60"**, subline "SAME DAY AS JERUSALEM / AY-PACK #2 KEPT", verdict stamp **KEPT**.

This title leads with a **number + the moral tension** ("60 killed" against "embassy moved"), which matches the strongest documented SEALED Shorts pattern (numbered/dollar-anchored receipt; the number is the hook, not the politician's name). That is a **keep**. The title does NOT lead with the KEPT verdict or with a person's name — both of which the Shorts data showed underperform. Also a keep.

One structural risk to flag for the thumbnail-designer (not a metrics finding): "60 KILLED" + the same-day Gaza framing sits close to the v1 monetization call of `ad_friendly_call: "yellow-expected"`. v2's safety boundary (no fabricated/graphic harm imagery, sourced framing only) is already in the brief — keep the receipt the claim, keep the number the hook, but do not let the thumbnail drift toward graphic shock to chase CTR.

### 2b. Live v1 structure (the retention engine) — the part v2 exists to fix

From `eng/storyboards/sealed-aipac-embassy-v1.json`:
- **205s total**, 11 clips. **10 of 11 clips are `text-card`**; only clip 1 is a Remotion `VerdictStamp`. There is **zero in-world Remotion explainer motion** and **zero b-roll** — the body is a slideshow of static text cards.
- Music is **3 flat beds** (tense 0–45s, investigative 45–150s, resolve 150–205s) — exactly the flat-single-bed failure mode the score-composer persona exists to kill. No per-beat cue arc, no punchline release, no documented 5–8s music-bed tail.
- Voice settings `stability 0.55 / style 0.15` — clinical, pre-cadence-director. No pause tokens.
- Cold open is a VerdictStamp + a "JERUSALEM / EMBASSY" text card — i.e. the verdict and the topic are stated before any human/emotional hook lands. The 22s "1995 WAIVER" card at s2-01 is the single longest clip and arrives ~20s in — a long static legal-mechanism card very early is a likely (unmeasured) early-drop risk for the Cincinnati Mom listener.

This is the core qualitative finding: **v1 is a competent static-card slideshow with flat music and no empathy/cadence layer.** Nothing in the packaging needs to change much; the entire upgrade is in pacing, audio arc, emotional framing, and motion — which is exactly what the v2 brief mandates.

### 2c. Comp context (recent SEALED/CR LFs)

Per `cr-what-happened-to-trump-72hr-prior.md`: the three CR new-news LFs (Bush `QP6rXu_bFDk`, Massie `7GpuZ0cfK1Y`, Rabb `sodpDcNFUio`) also have **no captured CTR/AVD/retention on disk** — Stage 31 was never run with a live Analytics endpoint. So there is no comp baseline either. The only quantitative SEALED signal remains the Shorts title patterns (universal-norm-outlier and numbered-receipt titles got the click; KEPT-led, name-led, and question-form titles did not).

---

## 3. Recommendations for the v2 remake — keep vs fix

### KEEP from v1
- **Title shape: number + moral tension, KEPT verdict carried by thumbnail not headline.** "60 KILLED THE SAME DAY" is on-pattern. Re-test the live headline against one alt; do not lead with the verdict word or a name.
- **Thumbnail: big "60" + KEPT stamp + same-day tension.** On-brand receipt look; let the thumbnail-designer reconfirm composition independently against the final locked title (founder lock 2026-05-25 — orchestrator does not pre-filter options).
- **The receipt and its sourcing.** Same six documented beats (1995 waiver → Proclamation 9683 Dec 6 2017 → ribbon cut May 14 2018 / AY-pack #2 → 60 dead same afternoon → UN 128–9 → promise #74 KEPT). Re-verify at Stage 6 per the brief; do not re-litigate the receipt.
- **205s ballpark length.** No data argues for shorter or longer; the brief targets the same receipt, so hold ~3.5 min and let cadence-director defend cuts if the empathy beats add runtime.

### FIX in v2 (this is the whole reason for the remake)
1. **Add the three empathy beats (hook-acknowledgment / why-this-matters pivot / cold-close warmth).** v1 opens cold on a verdict stamp. v2 must acknowledge what the viewer feels about Jerusalem before delivering the same-afternoon receipt — acknowledgment-then-answer, never answer-then-disclaimer (NTO empathy-pass pattern, confirmed working). Three named beats only; everything else stays clinical (per brief).
2. **Cadence-director pause tokens before TTS.** v1 has none. Apply per-section wpm targets (hook 150–160, context 140–150, reveal setup 130–140, punchline 110–120, verdict 120–130, cold close 110–120); 600ms before the same-day-60-dead punchline, 1s after the reveal, 300ms after "A-I-P-A-C", 5–8s music-bed-alone tail after the last VO word. Slowness IS the 3rd-grade contract.
3. **Score-composer per-beat audio arc — replace the 3 flat beds.** Opener → establishing → sinister rise into "same afternoon" → restrained hold on the 60-dead beat (no triumphant "ta-da" here; the tension is the point) → verdict body → resolve tail. sfx-specialist owns hits + mix.
4. **In-world Remotion explainers over period backgrounds — replace the static text-card slideshow.** v1 is 10/11 static cards. v2 should carry the waiver mechanism, the date chain, the AY-pack-priority link, and the UN 128–9 vote as Remotion motion (count-up / timeline / vote tally) rendered OVER a period/context background at 40–60% opacity, never on a void. This is the single biggest structural change and the most likely (unmeasured) retention lift, especially the 22s "1995 WAIVER" card that currently sits as dead text very early.
5. **Front-load the human stakes, defer the legal mechanism.** v1 puts the 22s 1995-waiver card at ~20s. For v2, the cadence/empathy layer should let the viewer feel why this afternoon matters before the legal-waiver explainer; mechanism is context, not cold-open.
6. **3rd-grade lock + audience-assumes-nothing.** Hook ≤12 words/sentence, body ≤18, verdict ≤10. Treat the viewer as never having heard of AIPAC, the embassy law, or the UN vote — one-sentence explainers, name+place+year+felt-consequence, re-anchor every 60–90s. "AY-pack" then "A-I-P-A-C" on first use; on-screen text stays "AIPAC".
7. **Hold the moral tension; do not resolve it for the viewer.** The brief's central tension ("If the promise was kept, what do you call the same afternoon?") is the comment trigger. v2 states both — KEPT grade AND 60 dead, both documented — and lets the viewer sit with it. No editorializing, no graphic imagery, nonpartisan same-standard framing.

---

## 4. KILL flags — do not repeat

1. **Do not ship v2 without trying to enable the YouTube Analytics API first.** Every prior LF and the whole Shorts batch shipped with zero retention/CTR/AVD captured (Analytics endpoint 403; `youtubeanalytics.googleapis.com` not enabled on the GCP project). The v2 72h snapshot will be zeros again unless this is fixed before/at upload, and Stage 31 → Stage 1 of the next piece stays ungrounded. This is the recurring channel-level kill flag from the prior report, still open.
2. **Do not rebuild v2 as another static-card slideshow.** That is v1, and it is the thing being replaced. Motion + in-world Remotion is the mandate.
3. **Do not ship a flat single-bed score.** v1's three flat beds are the documented failure mode; score-composer owns the per-beat arc.
4. **Do not chase CTR with graphic harm imagery.** "60 KILLED" is a number-hook, not a license for graphic content. Sourced framing only (brief safety boundary).
5. **Do not delete the live v1 first.** Build v2, pass QC, then `--replace-id SSuO2KOXr0Y`.
6. **Do not let the orchestrator pre-narrow title/thumbnail options to the founder.** Thumbnail-designer and title call read the live locked title and decide independently (founder lock 2026-05-25).

---

## What this report cannot tell the next stage

- **No CTR, AVD, retention curve, subs-gained, or traffic-source split** for the embassy LF `SSuO2KOXr0Y`, its companion short `rT3G1VSV46g` (all-zero snapshot), or any recent CR/SEALED LF comp.
- **No A/B comparison** of v1's title alts — none was ever measured.
- The honest read: v2's improvements (empathy, cadence, score, motion) are justified by **founder-locked pipeline doctrine and v1's visibly thin static structure**, not by retention data, because no retention data for this piece exists. Fix the Analytics pipeline before the v2 72h snapshot or the channel keeps compounding blind.
