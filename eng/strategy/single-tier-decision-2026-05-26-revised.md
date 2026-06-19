# Single-Tier Decision (Revised) — 2026-05-26

> Author: Monetization Architect
> Supersedes: `monetization-audit-2026-05-25.md` + `product-ladder-decision-2026-05-26.md`
> Founder constraint: ONE tier. Nothing is built. YouTube <100 views/video.

---

## 1. Acknowledgment — what my prior audits got wrong

I wrote both the 2026-05-25 audit and the 2026-05-26 ladder as if the
$45 Matrix Bundle and the $249 Desk License were **shipped products
with a temporary waitlist flag on top.** They are not. Verified tonight:

- `app/pricing/page.tsx:64` — `const WAITLIST_ONLY = true` (hardcoded).
  The whole page is price-discovery copy, not a real checkout.
- `app/donor-to-vote/page.tsx` — top of page says "Engine · waitlist."
  One static Manchin × Pharma receipt + an email form. No matrix.
- `app/donor-to-bill/page.tsx` — same shape. One H.R. 5376 sample +
  waitlist. No bill × industry coverage.
- `/for-journalists` + `/pricing` reference a Desk License with seat
  management, comp redemption, commercial license. None of that
  backend exists. `redeem/` route is a stub.
- `/tips-to-verdicts` exists as a route, never E2E-validated.
- Lemonsqueezy SDK is wired and ready, but it has nothing to sell.

I treated landing copy as a product. That is exactly the failure mode
a monetization architect is supposed to catch. The recommended
"$45 Bundle + $249 Desk" ladder was a **fiction-on-fiction stack**:
it assumed two products existed and then layered a third pricing tier
on top of them. Founder caught it. Reset below.

---

## 2. The single tier I recommend

**Option C — Single Federal Weekly Email tier, $5/mo (or $50/yr).**

One product. One price. One SKU in Lemonsqueezy. No free trial, no
seat tier, no upsell ladder. Annual is the only discount lever.

**Product:** *Friday Receipts Pro* — every Friday, one email that
connects a single donor → vote → bill story at the federal level,
written by Opus 4.7 over the existing Supabase + FEC cache, edited
to 3rd-grade readability, with the receipt embedded inline and a
permalink to a Pro-only deep-dive page on the site.

The free *Friday Receipts* newsletter keeps shipping (one teaser
story per week, plus the week's YouTube video). Pro is the
"second story + the receipt + the workings" — the thing a paying
reader gets that a free reader doesn't.

---

## 3. Why this beats A, B, D, E

| Option | Build weeks | 6-mo MRR est. (channel-realistic) | Defensibility | Cannibalization |
|---|---|---|---|---|
| **A — $9 D2C Chat** | 3-4 (Haiku agent, rate limits, abuse controls, eval harness) | $90-270 (10-30 subs × $9; chat converts at ~0.5% of free users, free users = YouTube viewers ÷ 20) | **Low.** "Chat over FEC" is a weekend project for any LLM-fluent journalist. No moat. | Risks gutting future B2B price. |
| **B — $99 Matrix** | 8-12 (matrix schema, scoring, dashboard UI, daily cron, QA on 585 politicians × ~40 industries × roll-calls) | $99-495 (1-5 subs at a price that requires institutional buyer; YouTube channel has zero institutional reach today) | **High** but irrelevant — no demand signal yet. | Founder-rate locked-in to an unbuilt product. |
| **C — $5 Weekly Email** ✅ | **2** (Opus pipeline, cron, Lemonsqueezy hookup, Pro post template, gated `/p/[slug]`) | **$150-600** (30-120 subs × $5; email converts at 5-8% of free-newsletter base, which compounds independent of YouTube view count) | **Medium.** The moat is the editorial voice + the proprietary scoring, not the data. Defensible enough at $5. | Zero — free side stays free, Pro is additive. |
| **D — Ads + sponsorships only** | 0 | **$0-30** (YouTube AdSense at <100 views/video is sub-$1/video; sponsors don't touch a channel under 10K subs) | None — pure channel bet. | N/A but ignores the SaaS infra already paid for. |
| **E — Bundle (chat + email + matrix)** | 12+ (sum of A+B+C) | Same as B realistically (bundle price = highest component price = buyer ceiling) | High but unbuildable in $500 cap | Maximum scope creep. |

**Why C wins on each axis:**

1. **Build cost.** 2 weeks vs. 3-12 for the others. We can ship in
   the next sprint and start measuring conversion in 14 days.
2. **Channel-fit.** YouTube <100 views/video means the funnel input
   is tiny. A $5 email converts a curious viewer; a $99 dashboard
   needs an institutional buyer who isn't watching the channel yet.
3. **Unit economics.** Opus 4.7 weekly run ≈ $0.10-0.30 per Pro
   issue at full coverage (one well-cached generation, ~30K input
   tokens of Supabase context, ~3K output). Email send via Resend
   free tier through 3K subs. **COGS per user ≈ $0.05/mo.** Well
   under the $1/user/mo cap.
4. **Cannibalization-free.** Free newsletter, free profiles, free
   leaderboard, free video — all stay free. Pro is the *workings*,
   not the data.
5. **Pricing-power preservation.** Shipping a $5 weekly email does
   NOT cap a future B2B SKU. Bloomberg Government sells $5K seats
   alongside free newsletters. A $99 Matrix can launch next year
   on top of demonstrated demand.
6. **3rd-grade-readability friendly.** "Get the Friday email that
   shows you who paid for this week's biggest vote — $5/month."
   Passes the web-ux-director checklist: verb-led, plain English,
   no jargon, one CTA.

---

## 4. Pricing + funnel math

**Price:** **$5/mo** or **$50/yr** (17% off — single discount lever).

**Why $5, not $9 or $25:**
- The free newsletter is the ceiling-setter. A reader getting one
  free email per week will pay $5 for a second one without thinking
  ($0.20 per delivered story). They will *think* about $9, and they
  will *negotiate* with themselves at $25.
- $5 puts us under every meaningful comparison anchor (Substack
  minimum $5, NYT $4/mo intro, Apple News $13). We are not asking
  the user to choose us over a peer — we are an add-on.
- At $5 we don't need an annual-discount pitch beyond the round
  number ($50/yr = 10 months pay 12). Simple.
- COGS at $0.05 → gross margin ~99% even after Lemonsqueezy's
  5% + 50¢. (At $5 the fixed 50¢ is painful — net is $4.25. Still
  ~$4.20/user/mo contribution margin.)

**Funnel math (conservative, channel-realistic):**

```
YouTube weekly views (today)       1,000   (best video × 1 week)
  → click site link                   80   (8% CTR from description)
  → land on /weekly                   80
  → free newsletter signup            12   (15% of landers — free is free)
  → Pro upgrade in 30 days             1   (8% free→paid on a single-
                                            insight weekly)
Monthly: +4 Pro subs from YouTube alone = +$20 MRR/mo run-rate add
```

```
YouTube weekly views (6 months out, assuming 5× growth from new
  pipeline + Wikimedia/Hedra video cadence)
                                    5,000
  → site link clicks                  400
  → free newsletter signup             60
  → Pro upgrade                         5/wk = 20/mo
Cumulative Pro subs at month 6:      ~60-120 (with ~15% churn/mo)
Month-6 MRR:                         $300-600
```

This is not a venture outcome. It is a **revenue-truth signal** — the
smallest possible test of "will anyone pay us anything." If month-6
MRR < $150 the answer is no and we kill the SaaS arm and go pure
ads/sponsorship. If month-6 MRR > $500 we have proof to underwrite
building the Matrix tier in 2027.

---

## 5. Build-to-ship plan (2 weeks, one owner)

**Owner:** the existing CR engineering persona (whoever owns
`scripts/pipeline/`). One person, no parallel workstreams.

**Week 1 — pipeline + storage**
- Day 1-2: New table `cr_pro_issues (id, slug, week_of, subject,
  markdown, donor_id, vote_id, bill_id, published_at)`. GRANT
  statements per Supabase rule.
- Day 2-3: `scripts/pipeline/generate-pro-issue.py` — Opus 4.7
  call over a single week's "best donor→vote→bill triplet" picked
  by a small scoring SQL (largest |donation| × closest-in-time
  vote × bill with named industry stakeholder). Cache the prompt
  (system + Supabase context block) for prompt-caching savings.
- Day 4: 3rd-grade readability pass — re-prompt with the
  web-ux-director checklist as the editor system prompt. Reject
  output if Flesch-Kincaid grade > 5.
- Day 5: Render cron, Fridays 7am ET. Writes row + emails Pro list
  via Resend.

**Week 2 — paywall + site + launch**
- Day 6-7: Flip `WAITLIST_ONLY` to false in `pricing/page.tsx`.
  Rewrite the page to ONE product: Friday Receipts Pro, $5/mo or
  $50/yr. Two checkout buttons. Nothing else.
- Day 7-8: `/p/[slug]` route — Pro-only render of the full issue.
  Free users see first 2 paragraphs + paywall card. Lemonsqueezy
  entitlement check via existing `lib/lemonsqueezy.ts`.
- Day 9: Free newsletter footer adds "Want the Friday workings?
  $5/mo →" link. Free YouTube video descriptions get same link.
- Day 10: Send the first Pro issue to a list of 5 friendlies as a
  smoke test. Fix what breaks.
- Day 11-12: Public launch. Announce in free newsletter + pinned
  YouTube comment + /pricing redirect.
- Day 13-14: Buffer / debugging / first-week monitoring.

**Cut from current site (see §6).**

**Total engineering cost:** 2 weeks of one engineer. API costs ~$10
for the first month of Pro issues. Well inside the $500 company cap.

---

## 6. What the founder kills today

These pages/copy blocks imply products that do not exist. They must
come down before launch — leaving them up after we flip Pro live
makes us look like we're hiding three products behind a $5 email.

**Pages to delete or redirect to `/pricing`:**

1. `app/donor-to-vote/page.tsx` — DELETE. The single Manchin sample
   can live as a free article (`/articles/manchin-pharma-receipt`)
   to retain the SEO/social value. Route returns 410 or 301 to the
   article.
2. `app/donor-to-bill/page.tsx` — DELETE. Same treatment — convert
   the H.R. 5376 sample to a free article, 301 the route.
3. `app/tips-to-verdicts/` — REMOVE FROM NAV + add "coming 2027"
   banner if we keep the route at all. Better: delete and unindex.
4. `app/redeem/` — DELETE. No Desk License → no redemption flow.
5. `app/for-journalists/page.tsx` — REWRITE to "Free for working
   journalists" (the comp policy on the existing free product).
   Strip every reference to Desk License, seat management,
   commercial license, API access tiers.

**Copy to strip from `/pricing` (when we flip live):**

- "Engines" language — there are no engines, there is an email.
- "$45 Bundle," "$249 Desk License," any reference to tiers.
- "API access (10,000 calls/mo)" — no public API exists.
- "Commercial-use license" — out of scope for $5/mo.
- "Pro exports" — nothing to export.
- The waitlist signup form — direct to checkout instead.

**Copy to strip from homepage + nav:**

- Any nav item pointing to donor-to-vote / donor-to-bill /
  tips-to-verdicts / for-journalists desk language.
- Homepage hero promises about "the engines" — replace with the
  single Pro pitch: *"Free politician receipts. $5/month for the
  Friday email that shows who paid for the week's biggest vote."*

**What stays exactly as-is:**

- All 585 politician profiles, leaderboard, directory, state pages,
  /trump scorecard, /weekly, free Friday Receipts newsletter,
  /articles, /foreign-donors, /dual-citizenship, /sources,
  /methodology, /corrections, /disclaimer, /privacy, /terms.
- The video-companion article template (it's the channel's funnel).
- Lemonsqueezy SDK + entitlement plumbing (we just point it at one
  product instead of three).

---

## Decision summary

**One tier. $5/mo Friday Receipts Pro. Ship in 2 weeks. Kill the
three fake-product pages today.** If month-6 MRR clears $500 we
earn the right to build the Matrix in 2027. If it doesn't, we know
the channel needs to grow before the SaaS arm is worth anything,
and we lose nothing but the 2 build-weeks.

The hardest part of this recommendation is psychological: $5 feels
too small for an "AgentCompanies" SaaS line item. It is the
correct price *because* the channel is small. Price for the funnel
you have, not the funnel you wish you had.
