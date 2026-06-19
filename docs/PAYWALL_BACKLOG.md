# CampaignReceipts Pro — Paywall Product Backlog

**Last updated:** 2026-05-27
**Status:** Deferred. Infrastructure exists from prior work, but no new
paywall, paid-tier UI, or public paid-product promise should be built
until @CampaignReceiptsYoutube reaches 10,000 subscribers or the
founder explicitly overrides. Current conversion goal is free email
capture into `cr_free_subscribers`.

The historical backlog below describes the product the paywall may
eventually protect. Treat it as parked strategy, not active sprint work.

---

## Founder's Reframe (2026-05-14)

> "I need the 8,000 political journalists to use this as a resource and subscribe to it like they subscribe to any other journalistic platform to find content. Same with political influencers. We are the content aggregators/organizers for them producing screenshot-worthy graphs/images."

The Pro tier is **not** "a more expensive data lookup." It's a **content-generation subscription** — like Bloomberg Terminal, OpenSecrets API, or Muck Rack, but for political accountability storytelling.

### What a Pro subscriber gets that a free user doesn't (target experience):

1. **Daily-updated correlation engines** — fresh stories every morning, not weekly refresh
2. **Pre-rendered screenshot-worthy graphs** — they don't have to make their own; we generate them
3. **Commercial-use license** — they can publish anything they see, no asks
4. **Push notifications when stories break** — "a senator just voted against their top donor industry"
5. **CSV / API export** — bulk feeds for newsroom workflows

The free user sees enough to share *one stat per politician*. The Pro user sees enough to build *a weekly story rotation*.

---

## Two flagship paywall products

### 1. Donor → Vote Correlation Engine (WS3 in build plan)

**What it does:** For each senator/rep, scores every roll-call vote as "aligned with top 5 donor industries" or "broke from them." The output: a ranked list of bills where the politician's vote aligned with — or rejected — the money behind them.

**Story format it generates:**
- "Senator X voted with their pharma donors 87% of the time across 23 healthcare votes — except on Bill Y."
- "These 6 Democrats took $X from oil & gas and then voted against the Inflation Reduction Act."

**Free tier shows:** Top 3 aligned + top 3 broke-from per politician (the headline). Maybe a "see all 47 →" link.

**Pro tier shows:** Full ranked list, filter by industry / chamber / Congress / vote, CSV export of any filtered view, per-row links to Congress.gov primary source, alert subscriptions per industry.

**Data dependency status:**
- ✅ FEC donor data: clean, classified (502 industry-rollup rows, 10 industries, 5,229 donors). Just shipped.
- ❌ Bills + roll-call votes: NOT YET INGESTED. Needs `scripts/seed-bills.mjs` against Congress.gov API (~5,000 bills, ~500 roll-call votes/senator, ~3hr scrape, $0 API spend).
- ❌ Bill-industry positions: hybrid hand-tag + Haiku classification (~100 hand-tagged bills + 4,900 auto-classified at ~$25 Haiku spend).
- ❌ Compute job: nightly cron writing to `cr_donor_vote_alignment`.

**Eng time:** 8-12 hours.

### 2. Donor → Bill-Sponsor Money Trail (WS4 in build plan)

**What it does:** For each active bill, surfaces the **money behind the sponsor + co-sponsors**. "This Medicare-cut bill is backed by 8 Republicans whose top combined donor industries are pharma and insurance."

**Story format it generates:**
- "The 12 senators co-sponsoring SB 1234 took a combined $4.2M from defense contractors last cycle."
- "Bill X is being pushed by reps whose donor pools are 73% real estate."

**Free tier shows:** Top-3 industries behind any given bill.

**Pro tier shows:** Full co-sponsor table with each co-sponsor's top 5 industries inline; CSV; "alert me when this bill changes status."

**Founder explicitly called this out in the May 14 reframe** as critical (originally from his "Voting Citizen" project idea — voters subscribing to local/state/federal bills that matter to them, getting updates when the bill moves).

**Data dependency status:**
- Inherits WS3's bill ingestion.
- ❌ Sponsor + co-sponsor relationships: from Congress.gov bill metadata.
- ❌ Industry money aggregation per sponsor: cross-join over `cr_top_donors` × `cr_industry_breakdown` × bill sponsors.
- ❌ Status-change alert cron: daily diff against Congress.gov bill status field.

**Eng time:** 4-6 hours after WS3 is done (most of the bill ingestion is reused).

---

## Historical infrastructure already shipped

Do not add public CTAs to these surfaces during the 10k-subscriber
growth phase. The active public funnel is the free newsletter.

| Feature | Status | Notes |
|---|---|---|
| $150/mo + $1,500/yr Lemon Squeezy products | ⏳ founder must create product in LS dashboard | Wired in code, waiting on variant IDs in .env |
| `/api/checkout?variant=monthly|annual` | ✅ | Redirects signed-in user to LS prefilled checkout |
| `/api/lemon-squeezy/webhook` subscription lifecycle | ✅ | Handles created/updated/cancelled/expired/payment-failed |
| `/redeem/[code]` trial code flow | ✅ | Mints 30d (journalist) / 90d (influencer) Pro access |
| `lib/entitlement.ts` → `getEntitlement()` | ✅ | Server-side tier resolver for any page |
| `commercial_license` flag on subscribers | ✅ | Defaults true; surfaces as "Commercial license active" badge on `/dashboard` |
| 7-day cohort sequencer with trial codes embedded | ✅ | `scripts/run-outreach.mjs --day=N` |
| Inbound reply webhook + Haiku sentiment | ✅ | Auto-replies on positive, flags neutral/question/negative |

---

## Paywall-protected surfaces (current + planned)

| Surface | Free | Pro | Status |
|---|---|---|---|
| Politician profile (current) | Full scorecard, top 3 donors | Top 3 donors + full donor list | Half-shipped (free works, Pro view not gated yet) |
| `/politician/[slug]/donors` | Top 5 donor breakdown | Full list, CSV, industry deep-dive | Free shipped; Pro upgrade not gated |
| `/politician/[slug]/correlations` (WS3) | Top 3 aligned + top 3 broke-from | Full filterable list, CSV, alerts | ❌ Not built |
| `/bill/[congress]/[number]` (WS4) | Top 3 industries behind sponsor set | Full co-sponsor table + alerts | ❌ Not built |
| `/leaderboard?tab=*` | All tabs visible | + CSV export, + industry-specific tabs | Free shipped; Pro CSV/alerts not gated |
| `/weekly` (Worst Broken Promise) | All historical picks | + RSS push, + email digest | Free shipped (RSS already public) |
| Industry-specific leaderboard tabs ("biggest pharma recipients") | First 5 rows | Full list, CSV | ❌ Not built (waiting on WS3) |
| API access (10k calls/mo) | — | Yes | ❌ Not built |
| Daily FEC refresh (vs weekly) | Weekly | Daily | Weekly cron shipped; daily Pro-only path not built |

---

## ✅ Design agent verdict (2026-05-14)

**Stance: Inflection-point (B) with a single fade-row "(A) tail."**

Quote: *"Journalists smell row-fade-blur instantly and reach for OpenSecrets instead. Our free surface must be a complete, citeable, screenshot-worthy unit of journalism — the headline graph + the one stat that fits in a tweet. The paywall lives at the workflow boundary: filters, CSV, alerts, the full table behind the graph, daily refresh. Free = 'I can publish this.' Pro = 'I can build my Monday column off this every week.'"*

**Core rule (the "danger zone" warning):**
> Do NOT blur the headline number or the graph. Blur only ever touches table rows below the visible top-3, never the chart. The chart is the gift; the table is the product.

### Wireframe: `/politician/[slug]/correlations` (dark surface)

```
┌─ HERO STAT ─────────────────────────────────────────┐
│   Voted with pharma donors                          │
│   ┌──────┐                                          │
│   │ 87%  │  of 23 healthcare roll-calls  [KEPT]     │
│   └──────┘                                          │
└─────────────────────────────────────────────────────┘

ALIGNMENT-BY-INDUSTRY  (horizontal bar, screenshot card)
 Pharma     ████████████████░░  87%  kept-500
 Oil & Gas  ██████████████░░░░  76%  kept-500
 Defense    █████████░░░░░░░░░  52%  partial-500
 Tech       ████░░░░░░░░░░░░░░  24%  broken-500
 Finance    ██░░░░░░░░░░░░░░░░  11%  broken-500
                                campaignreceipts.com (wm)

── TOP 3 ALIGNED ───────────────  ── TOP 3 BROKE ──
HR 4521  Medicare neg. block  KEPT   SB 88  Oil subs  BROK
SB 1102  Pharma R&D credit    KEPT   HR 901 EV cred   BROK
HR 7733  Patent ext.          KEPT   SB 41  Wind PTC  BROK

░░ HR 2210 ░░ Insulin cap ░░ KEPT  ░░  ← faded row #4
┌─────────────────────────────────────────────────────┐
│  + 43 more votes · filter by industry · CSV export  │
│  [ Unlock with Pro — $150/mo · 7-day free trial ]   │
└─────────────────────────────────────────────────────┘
```

**Pro view** swaps the gate-card for: sticky filter bar (Industry · Chamber · Congress · Verdict chips), full sortable table, `[Download CSV]` outline button top-right, `[Set alert ↗]` per-industry-row, "Updated 4h ago" timestamp.

### Wireframe: `/bill/[congress]/[number]` (dark surface)

```
SB 1234 · Medicare Advantage Reform Act · 119th
Status: In committee · 12 sponsors

┌─ HERO STAT ─────────────────────────────────────────┐
│   $4.2M from pharma + insurance                     │
│   to the 12 senators backing this bill (last cycle) │
└─────────────────────────────────────────────────────┘

MONEY BEHIND THE SPONSORS  (stacked donut, authority-500)
       42% Pharma
       31% Insurance       Total: $4.2M / 12 sponsors
       18% Hospitals
       9%  Other
                                campaignreceipts.com (wm)

── TOP 3 SPONSORS BY MONEY ─────────────
Sen. A (R-FL)   $612k pharma   profile →
Sen. B (R-TX)   $548k pharma   profile →
Sen. C (D-NJ)   $401k insur.   profile →

░░ Sen. D (R-PA)  $389k pharma  ░░  ← faded row #4
┌─────────────────────────────────────────────────────┐
│  See all 12 co-sponsors · industry × sponsor matrix │
│  CSV · Alert me on status change                    │
│  [ Unlock with Pro — $150/mo ]                      │
└─────────────────────────────────────────────────────┘
```

**Pro view:** full co-sponsor table (12 rows) with inline top-5-industries pills per row, sortable by money/industry/state, CSV, `[Watch this bill ↗]` (alerts on status change) pinned top-right.

### Implementation notes (dev-ready)

1. **Files:** `app/politician/[slug]/correlations/page.tsx` + `app/bill/[congress]/[number]/page.tsx`; gate via `getEntitlement()` server-side, render `<ProGate />` shell when `tier !== 'pro'`.
2. **Hero stat block:** `bg-ink-900/60 border border-ink-700 rounded-2xl p-6`, hero number `text-6xl font-mono tabular-nums text-kept-500` (or `broken-500` if verdict-negative).
3. **Bars / donut:** Recharts; pass `fill` from verdict tokens (`kept-500`, `broken-500`, `partial-500`) — money-only series uses `authority-500`. **Never amber on these pages** (amber is reserved for live-tracking).
4. **Watermark:** shared `<GraphWatermark />` absolute-positioned `bottom-2 right-3 font-mono text-[10px] text-ink-400/50 select-none`; renders inside every chart `<div>` AND baked into the OG-image route so screenshots-of-screenshots still carry it.
5. **The fade-row:** real `<tr>` with real data, `opacity-30 blur-[1.5px] pointer-events-none`; gate-card sits immediately below in the same table container — visually it's the 4th row dissolving into the CTA, not a wall.
6. **Gate-card:** `bg-gradient-to-b from-ink-900 to-ink-950 border border-authority-500/30 rounded-xl`, CTA button `bg-authority-500 hover:bg-authority-400 text-ink-950 font-medium`. framer-motion fade-up 200ms on scroll-into-view, once. No pulsing/shimmer.
7. **Pro view affordances:** filter chips top-sticky `sticky top-16 backdrop-blur bg-ink-950/80`; CSV button outline `border-authority-500/40 text-authority-300` — solid authority-500 reserved for "convert to Pro" CTAs only.

---

## (archived) Design positioning question

**The hard design problem:** how do we structure each paywall surface so that:

1. The free user feels they got *real value* (so they share/refer/come back)
2. The free user sees *exactly* what they're missing (so they convert)
3. We don't feel scammy or "fake-paywall-y" (that kills credibility with journalists who can smell it)

Two opposing models:

**(A) "Tasting menu"** — Free shows top 3, gray-blurred or fade-cut row #4 onward with "Unlock full list → $150/mo" CTA. Used by: LinkedIn search results, Crunchbase. Risk: looks cheap; journalists hate it.

**(B) "Inflection point"** — Free is the headline + the screenshot graph; Pro is the **action workflow** (CSV, alerts, API, filtering). Free user can't say "I'd publish this if I had the data" — they CAN publish what they see. Pro user can build their own stories. Used by: PolitiFact (free reads, paid API), OpenSecrets (free data, paid exports), Bloomberg (free articles, paid Terminal).

Founder's instinct from May 14: **"the viewer gets a taste but the subscriber gets the full view"** — sounds like (A) but the social-proof angle ("Same with influencers. We are the content aggregators/organizers for them producing screenshot-worthy graphs/images") sounds like (B).

**My read:** Hybrid. Free = full graph + headline number, ALL screenshot-worthy. Pro = the **table behind the graph** + CSV + filtering + alerts + daily refresh. The graph is the *summary statistic*; the table is the *story-generator*. Journalists need both, but the table is what they can't build themselves.

Open question for design agent (next session): given the journalist + influencer personas, exactly which UI element on each surface flips from free → "unlock"? With wireframes for `/politician/[slug]/correlations` and `/bills`.

---

## 🛑 Anti-paywall rule (2026-05-14)

**`/sources` stays 100% free forever.** Reaffirmed by external design-strategist
review. Reasoning:

- The primary-source archive is **citation infrastructure**. Journalists, LLM
  crawlers, and researchers cite us *because* it's free and durable. Paywalling
  it kills the LLM-citation flywheel and the journalist-trust flywheel — the
  two engines that drive every other surface's traffic.
- The right paywall is the **analysis layer** (donor-to-vote, bill money trail,
  alignment-over-time time series, CSV exports). That's where journalists,
  opposition-research staff, foundation analysts, and political-data firms
  pay for the *join* — not the raw inputs.
- Same model: PolitiFact's articles are free; PolitiFact Pro API is paid.
  OpenSecrets' summary data is free; their bulk data + API is paid. Bloomberg's
  articles are free-ish; the Terminal is paid.

If anyone (us included) is tempted to gate `/sources`, refer them here first.

## Second design agent's gating rule (2026-05-15)

The vault-expansion agent surfaced an even sharper formulation than the design-lead's "chart vs table":

> **Free = lookup. Paid = cross-cut.**
>
> Free shows "industry X donated $Y to politician Z this cycle." Paywall "show me every politician where industry X's donations rose ≥25% in the quarter before a Yes vote on bill type Z." This is the LLM-uncitable analytical surface — exactly the right place to gate, because the citation flywheel doesn't depend on it. The underlying FEC + roll-call data is public; **the JOIN is the product.**

Concrete v2 product ideas this unlocks (after time-series snapshots accumulate):

1. **"Donor-vote correlation deltas under 'what flipped on this vote'"** — `/politician/[slug]/donors` free shows top-5 industries by aggregate donation. Paywall the per-bill correlation breakdown ("Pharma donors gave $X to Sanders the quarter before he voted Y on PBM reform").
2. **"Industry hot-list" cross-cut** — paywall "every politician where industry X's donations rose ≥25% in the quarter before a Yes vote on bill type Z."
3. **Alignment-shift time series** — once we have ≥2 weekly snapshots: "Senator X aligned with Pharma 87% in 2024 → 64% in 2026" trend chart.

These are all v2 (post time-series accumulation, ≥90 days of snapshots). Captured here so the next session doesn't re-derive.

## Pro-tier conversion funnel (current)

```
Cold outreach email (200 sends D1-D7)
  ↓ ~50% open
  ↓ ~10% click /redeem/[code]
  ↓ ~70% complete magic-link sign-in
  ↓ → 30-day comp activated
  ↓ → 14 days in, "your trial ends in 14 days" reminder email (NOT YET BUILT)
  ↓ → 7 days in, "your trial ends in 7 days" reminder email (NOT YET BUILT)
  ↓ → expires → "convert at $150/mo or downgrade" email (NOT YET BUILT)
  ↓ → expected ~20% trial-to-paid conversion at $150 (industry standard for B2B SaaS pro tools)
```

Expected per 100 cold-outreach sends: ~5-10 trial activations → 1-2 paid conversions. So ~200 sends → 2-4 paid users → **$300-600 MRR from launch week**.

This is small. The real volume must come from:
- SEO traffic to `/politician/[slug]/correlations` once that's built (programmatic SEO comparison-pairs are already seeded — 157 pairs)
- Pickup by 1-2 large content creators citing the data (compounding referral)
- Renewals + annual conversions at the 30-day cliff

---

## Open follow-ups (prioritized for the next session)

| # | Pri | Item | Eng time |
|---|---|---|---|
| 1 | P0 | **Spawn design agent** for paywall positioning — wireframes for `/correlations` + `/bills` showing exactly where free → Pro flips. Reference this doc. | 1hr agent + 2hr impl |
| 2 | P0 | **WS3 donor-to-vote engine** — Congress.gov bill ingestion + alignment compute + UI | 8-12hr |
| 3 | P0 | **WS4 bill-sponsor money trail** — depends on WS3's bill data | 4-6hr |
| 4 | P1 | **Industry-specific leaderboard tabs** ("biggest pharma/defense/oil-gas recipients") | 1-2hr |
| 5 | P1 | **Trial expiration email cadence** — 14-day / 7-day / expired reminders via Resend cron | 2-3hr |
| 6 | P1 | **Pro entitlement gating on existing surfaces** — `/politician/[slug]/donors` full list, `/leaderboard` CSV export, etc. | 2-3hr |
| 7 | P2 | **Daily FEC refresh cron** (vs current weekly) — for Pro freshness claim | 30min (just change schedule) |
| 8 | P2 | **API endpoint** (`/api/v1/...`) with key-based auth + 10k/mo rate limit | 4-6hr |
| 9 | P2 | **Push/email alerts** — "alert me when senator X votes against their top donor industry" | 4-6hr |

---

## What we DON'T do at $150/mo

- No "team seats" or "enterprise" SKU yet. Single-seat. Revisit at 100 paid users.
- No annual auto-renew billing yet — Lemon Squeezy handles it natively, but the email cadence + cancel-portal isn't built.
- No state-level legislators or city councilmembers in the correlation engine. Federal only at v1.
- No PAC-to-PAC tracking ("which PACs fund which other PACs"). Out of scope until v2.

---

## Pricing iteration triggers

| Trigger | Action |
|---|---|
| <5 paid conversions in first 30 days | Drop to $99 + relaunch comp campaign |
| >20 paid conversions in first 30 days | Hold $150; consider $250 enterprise SKU |
| Multiple journalist replies asking for team pricing | Add 5-seat team SKU at $500/mo |
| Pickup by major newsroom (NYT, WaPo, ProPublica) cites us | Hold pricing, lean into "trusted source" positioning |
