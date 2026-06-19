# Prior-Piece Analytics Read — feeding Stage 1 of `cr-what-happened-to-trump`

**Compiled:** 2026-05-26
**Author:** analytics-tracker
**Purpose:** Stage 1 binding input for the LF "What Happened to Trump?" (cr-new-news, longform, disappointment-tone). Surfaces what is actually documented about prior @CampaignReceiptsYoutube uploads and converts it into operational carry-over for the new piece. Where data is missing, it is named missing — not guessed.

---

## Summary line

**STUDY** — the only documented signal across all prior pieces is from the SEALED Shorts batch (823 views / 15 shorts in 10h, BROKEN-verdict + universal-norm-outlier titles dominate); the three CR new-news long-forms (Bush MO-1, Massie KY-4, Rabb PA-3) have NO captured retention, CTR, or AVD data on disk. Carry-over for "What Happened to Trump?" is therefore drawn from (a) the SEALED title-pattern signal and (b) explicit founder-locked lessons from the Rabb PA-3 ship (3rd-grade lock, cadence-director, score-composer, in-world Remotion backgrounds, slowness-is-the-contract).

---

## 1. Headline metrics — what is actually documented

### CR new-news long-forms

| Slug | Title (live) | YouTube ID | Documented metrics |
|------|--------------|------------|---------------------|
| cr-bush-mo1 | $8 MILLION Beat Cori Bush — By Just 5 Points | `QP6rXu_bFDk` | **None on disk.** No `reports/episodes/cr-bush-*.md` exists. |
| cr-massie-ky4 | $35 MILLION Beat Thomas Massie — Most Expensive House Primary EVER | `7GpuZ0cfK1Y` | **None on disk.** No report file. |
| cr-rabb-pa3 | AOC Beat AIPAC's $3.5 Million Attack On Chris Rabb | `sodpDcNFUio` | **None on disk.** No 72h analytics report; only the founder-lock memory entries from the post-ship debrief (3rd-grade, council-gate kill, score-composer, cadence-director, in-world backgrounds). |

No CTR, AVD, retention curves, subs-gained, or traffic-source breakdowns have been captured for any of the three prior CR new-news LFs. This is a real gap — Stage 31 (analytics tracker) was not run on any of them. The next snapshot script (`youtube-analytics-snapshot.py`) is still TODO per the persona doc.

### SEALED Shorts batch (only quantitative data available)

15 SEALED shorts uploaded simultaneously 2026-05-24 23:31 UTC. 10h snapshot via YouTube Data API (Analytics API blocked, GCP project needs `youtubeanalytics.googleapis.com` enabled — also confirmed in the 11h JSON: all retention/AVD fields zero because the Analytics endpoint returned nothing).

| Metric | 10h value |
|--------|-----------|
| Total views (15 shorts) | **823** |
| Total likes | 16 |
| Total comments | 2 |
| Per-video average | ~55 views / 10h |
| Shorts cold-start floor (industry rule of thumb cited in baseline doc) | ~100v / 24h |
| Subscribers gained | **unknown** (Analytics API blocked) |
| Shares | 0 across all 15 (normal for 10h Shorts window per baseline doc) |

Top-4 by views: tax-returns (299), drain-the-swamp (150), term-limits (103), birthright (77). All four are **BROKEN** verdicts. Highest KEPT short ranks 5th (china-tariffs, 67v). Highest PARTIAL ranks 6th (aipac-campus, 63v).

---

## 2. Hook retention patterns

**Status: not measurable from current data.** The Analytics API is blocked; 11h JSON returns `avg_view_pct: 0` and `avg_view_dur_s: 0` for every row because no endpoint served those values. No first-8s / 15s drop-off can be cited.

What CAN be inferred indirectly:
- The Shorts that broke 100v are the ones whose **title alone** delivered the betrayal beat ("Every president since Nixon. Except one." / "Promise #1 never introduced"). Viewers reaching the verdict stamp is the only way Shorts get past the cold-start floor on this channel right now, but we have no curve to point to.

This gap is the most important thing for the next piece: **enable the Analytics API before "What Happened to Trump?" ships**, so this report has a real retention curve to feed Stage 1 of the piece after it.

---

## 3. Title patterns — what got the click

The only A/B-shaped signal in the documented data is in the SEALED Shorts batch:

**Pattern A — universal-norm + outlier callout** (rank 1, tax-returns, 299v + 2 comments):
> EVERY PRESIDENT SINCE NIXON RELEASED THEM. EXCEPT ONE.

The viewer is placed on the "everyone else" side. The outlier is the indicted party. Only short with comments.

**Pattern B — numbered/dollar-anchored receipt** (ranks 2-4):
> LOBBYING SPEND ROSE $400M WHILE HE DRAINED THE SWAMP
> PROMISE #1 NEVER INTRODUCED — TERM LIMITS FOR CONGRESS
> "I'LL SIGN IT NEXT WEEK" — 2 YEARS LATER, NO EO EVER FILED

The number, the quoted promise, or the named EO is the hook. The politician's name is not the lead.

**What did NOT get the click:**
- Any title leading with a KEPT verdict (highest KEPT = rank 5).
- Any title leading with a person's name.
- Any title structured as a question.

For the CR new-news LFs, the live titles are all dollar-anchored ($8M / $35M / $3.5M) but none has a documented CTR. The Bush vs. Massie comparison the brief asked for is not possible from the files on disk.

---

## 4. Thumbnail patterns

**Status: no CTR-per-thumbnail data on disk for any of the 6 published LFs.** The Rabb PA-3 ship debrief in memory notes a thumbnail-decision incident (orchestrator pre-filtered options to founder instead of letting the thumbnail-designer call it independently) — that is a process lesson, not a CTR signal.

The brief's proposed thumbnail for "What Happened to Trump?" (split-frame 2015 podium vs. 2020 Resolute-Desk EO signing, thin-red-seam, "145 PROMISES · GRADED" tag, no shocked face, no all-caps EXPOSED) is consistent with the audit/receipt brand. We have no comp data to validate it against. Thumbnail-designer should set composition based on the live title, independent of orchestrator pre-narrowing (per founder lock 2026-05-25).

---

## 5. Lessons for "What Happened to Trump?" — operational

1. **Opening 15s: lead with the betrayal beat in viewer's own words, not a stat.** The SEALED top-4 pattern is "the viewer's own assumption, then the exception." For this LF, open on a 2015 Trump clip saying "no more endless wars" (verbatim, sourced) — let the candidate's own voice be the hook — then cut to the date stamp Jan 3 2020 / Soleimani. The viewer hears the promise from the man's own mouth before any narrator speaks. NO abstract scene-setter. NO "in 2015, America was…" The voter's memory IS the cold open.

2. **Title: lead with the question OR the universal-norm outlier — not the dollar figure.** The brief's option 1 (*What Happened to Trump?*) matches the disappointment-not-rage frame and lets the thumbnail carry the receipt. The dollar-anchored variant ($82M AIPAC) is risky because § 7 of the brief flags that figure as `[NEEDS PRIMARY SOURCE]` — do not put an unverified dollar amount in the title. If the $82M cannot be pinned by Stage 6, the title pivots to the question form. Option 3 (*He Promised No More Wars. Then This Happened.*) is the universal-norm-outlier shape that worked on the tax-returns short — keep it as the test variant.

3. **Length: stay 10-13 min, not longer.** No retention data exists to argue for shorter or longer, but the brief is already targeting 10-13 and the prior three CR LFs ran in that range. The risk is the script padding past 13 min once Stage 6 fact-check returns with additional verified sourcing; cadence-director must defend the cuts, not allow stacking.

4. **Tone: disappointment, kitchen-table, second-person to the 2016 voter — and enforce 3rd-grade reading level end-to-end.** This is the Rabb PA-3 founder lock. Hook ≤12 words/sentence; body ≤18; verdict ≤10. The Cincinnati Mom watching with one ear is the listener. No Latinate abstractions. No "establishment foreign-policy apparatus" — say "the same people who sold the last war." The kitchen-table frame and the 3rd-grade lock are the same instruction said two ways.

5. **Pacing: cadence-director MUST run before TTS.** Effective wpm targets per section (hook 150-160, context 140-150, reveal setup 130-140, punchline 110-120, verdict 120-130, cold close 110-120). 600ms pause before each punchline. 1s after each reveal. 5-8s music-bed-alone tail after the last VO word before fade. Rabb PA-3 read at uniform 145wpm and the founder called it flat — this LF cannot repeat that.

6. **Score-composer + in-world Remotion backgrounds are non-negotiable.** Flat single-bed music under the whole episode was the Rabb PA-3 failure. The disappointment arc here especially needs the cinematic audio: opener cue, sinister rise into Soleimani date stamp, ta-da release on the verbatim 2024 "no more wars" callback to the verbatim 2016 "no more wars," verdict body, tail. Every Remotion explainer card renders OVER a period/context background at 40-60% opacity — never on a void.

---

## 6. KILL flags — do not repeat

1. **Do not ship without enabling YouTube Analytics API first.** Three LFs and 15 shorts have shipped with no retention curve, no CTR, no AVD. The persona doc says Stage 31 is binding for the NEXT piece's Stage 1; we are flying blind because the snapshot script is still TODO and the Analytics endpoint is 403. Pre-ship action item: get `youtubeanalytics.googleapis.com` enabled on GCP project 884808726991 before this LF uploads, so the 72h snapshot is real data instead of zeros.

2. **Do not lead the title with an unverified dollar figure.** The brief's § 7 names the $82M AIPAC figure as `[NEEDS PRIMARY SOURCE]`. Putting it in the title before Stage 6 pins it is a credibility kill. The Iran LF v7b memo also flags that bare "AIPAC" gets mis-pronounced; if the figure survives Stage 6, the on-screen text stays "AIPAC" and the VO uses "AY-pack" (A.I.P.A.C. in the script).

3. **Do not let the orchestrator pre-filter thumbnail or title options to the founder.** Rabb PA-3 lesson. Thumbnail-designer reads the live locked title and decides composition independently. Founder pushback = re-brief the specialist with new context, not a multiple-choice menu.

4. **Do not ship a flat single-bed music score.** Rabb PA-3 failure. Score-composer owns the 4-6 per-beat cue arc; sfx-specialist owns the hits and mix levels.

5. **Do not assume audience context.** Memory lock 2026-05-25: every viewer is treated as someone who has never heard of AIPAC, the Iran deal, Soleimani, Adelson, or the 2015 anti-war Trump speech. Name + place + year + felt-consequence for every claim. Re-anchor every 60-90s for late-arrivers. For this piece, that means the AIPAC explainer is one sentence, not three; the Iran deal is "the deal Obama signed in 2015 that traded sanctions relief for inspection of Iran's nuclear sites" before any "tear up" language; Soleimani is "the top general of Iran" before any tactical detail.

6. **Do not let the back half go static.** The 2026-05-23 Shorts regression (6 of 7 had 15-23s of frozen CTA card while VO kept delivering substance) is a Shorts driver bug, but the underlying lesson — viewer sees frozen frame, scrolls — applies to LF too. Every 30s scene gets its own render-spec; no scene runs past 60% of section runtime on one static image.

---

## What this report cannot tell the next piece

- **No CTR numbers, no AVD numbers, no retention curves** for any prior CR new-news LF.
- **No A/B comparison** between cr-bush-* and cr-massie-* — the brief asked for this; the data does not exist on disk.
- **No subscribers-gained figure** for the SEALED Shorts batch (Analytics API blocked).
- **No traffic-source breakdown** (Shorts shelf vs. browse vs. search).

The honest read: the strongest documented signal feeding "What Happened to Trump?" is the SEALED Shorts top-4 title pattern plus the founder-locked process lessons from Rabb PA-3. Everything else is structural inference. Fix the Analytics pipeline before the next 72h report — otherwise the channel keeps compounding ungrounded.
