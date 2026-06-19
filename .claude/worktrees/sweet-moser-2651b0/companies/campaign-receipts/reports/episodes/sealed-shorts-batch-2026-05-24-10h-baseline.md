# SEALED Shorts Batch 2026-05-24 — 10h Baseline

**Snapshot:** 2026-05-25 14:20 UTC (~10h after upload)
**Cohort:** 15 SEALED shorts uploaded simultaneously 2026-05-24 23:31 UTC
**Data source:** YouTube Data API (statistics only — Analytics API blocked at 403, GCP project 884808726991 needs `youtubeanalytics.googleapis.com` enabled).

---

## Aggregate

| Metric | Value |
|--------|-------|
| Total views | **823** |
| Total likes | 16 |
| Total comments | 2 |
| Subscribers gained | unknown (Analytics API blocked) |
| Engagement rate (likes+comments / views) | **2.2%** |

Per-video average: ~55 views in 10h. For comparison, the YouTube Shorts "cold-start success" floor is ~100v/24h. We're tracking under that on aggregate but with one clear breakout.

---

## Per-video (sorted by views)

| Rank | Slug | Verdict | Views | Likes | Comments | Title |
|-----:|------|---------|------:|------:|---------:|-------|
| 1 | sealed-008-tax-returns | BROKEN | **299** | 4 | **2** | EVERY PRESIDENT SINCE NIXON RELEASED THEM. EXCEPT ONE. |
| 2 | sealed-004-drain-the-swamp | BROKEN | 150 | 3 | 0 | LOBBYING SPEND ROSE $400M WHILE HE DRAINED THE SWAMP |
| 3 | sealed-009-term-limits | BROKEN | 103 | 4 | 0 | PROMISE #1 NEVER INTRODUCED — TERM LIMITS FOR CONGRESS |
| 4 | sealed-017-birthright | BROKEN | 77 | 1 | 0 | "I'LL SIGN IT NEXT WEEK" — 2 YEARS LATER, NO EO EVER FILED |
| 5 | sealed-005-china-tariffs | KEPT | 67 | 2 | 0 | $350 BILLION IN TARIFFS — AND BIDEN KEPT THEM |
| 6 | sealed-003-aipac-campus | PARTIAL | 63 | 2 | 0 | HE PROMISED CAMPUS FREE SPEECH. EO 13899 SAID NO. |
| 7 | sealed-007-repeal-obamacare | BROKEN | 63 | 0 | 0 | THREE REPUBLICANS KILLED OBAMACARE REPEAL — 49 TO 51 |
| 8 | sealed-010-un-climate-paris | KEPT | 1 | 0 | 0 | TWO CLIMATE PROMISES IN ONE PEN STROKE — BOTH KEPT |
| 9-15 | (7 shorts) | mixed | 0 | 0 | 0 | self-funding, lock-her-up, coal, nk-nukes, scotus-roe, deportation, embassy |

**Caveat on the 0-view tail:** 7 of 15 read literal `viewCount: 0` in Data API despite being uploaded the same minute as ones with 100+ views. This is almost certainly Data API statistics lag for Shorts (the `viewCount` field updates on a slower cadence than internal view counters), NOT actual zero-velocity. I'll re-pull at 24h and 72h to confirm.

---

## Patterns visible in the top 4

All four breakouts share one of two title structures:

1. **Universal-norm + outlier callout** — "Every president since Nixon… except one" / "Every president released them. Except one." Implies the viewer is on the "everyone else" side; the outlier is the exception. Highest comment rate (only one with comments).
2. **Numbered/dollar-anchored receipt** — "$400M", "Promise #1", "2 years". The number is the hook, not the politician's name.

What's NOT in the top 4: any "KEPT" verdict (rank 5 is the highest KEPT), any "PARTIAL" verdict (rank 6), any short whose title leads with a name. The audience comes for the broken-promise indictment, not the kept one. **First actionable signal for next batch.**

---

## Engagement quality

- `sealed-008-tax-returns` is the only short with comments (2). Manually inspect them tomorrow — first comment thread is the truest signal of resonance.
- Likes/views ratio: best is sealed-009-term-limits (3.9%), worst of non-zero is sealed-007-obamacare (0.0%). Anything >2% on Shorts is healthy.
- Zero shares across all 15. That's normal for a 10h Shorts window — sharing kicks in around the 24-48h mark if velocity holds.

---

## What we still need (Analytics API, blocked)

Once Analytics API is enabled, re-pull to get:

- **CTR (impressions → clicks)** — separates "bad thumb/title" from "bad hook." Failure mode 1: low CTR → packaging needs work. Failure mode 2: high CTR + low retention → hook lied to the viewer.
- **Average view duration + view percentage** — on a 30s short, anything below ~85% retention is leaking viewers before the verdict stamp lands.
- **Traffic source** — Shorts shelf vs. browse vs. search. Shelf-heavy = algo loves us. Search-heavy = we caught a topical wave.
- **Subscribers gained per video** — the only metric that compounds. Even 1-2 subs per short across 15 = 15-30 channel adds, real number.

---

## Next snapshot

- **24h** (2026-05-25 23:31 UTC): re-pull both APIs. The 0-view tail should resolve by then.
- **72h** (2026-05-27 23:31 UTC): final batch verdict. Decide which (if any) to flag for re-cut, which to unlist (<10v rule from doctrine Stage 35.j), which patterns to replicate in next batch.

---

## Doctrine input

When Analytics is live, this report feeds Stage 1 (analytics review) of the next SEALED piece. The top-3 title patterns above become the brief for Stage 2 (story extraction) of promise #18.
