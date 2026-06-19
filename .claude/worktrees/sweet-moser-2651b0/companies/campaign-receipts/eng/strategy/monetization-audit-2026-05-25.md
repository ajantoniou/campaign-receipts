# CampaignReceipts — Monetization Audit (2026-05-25)

**Author:** Monetization Architect (persona: `shared/personas/monetization-architect.md`)
**Inputs read:** `app/page.tsx`, `app/pricing/page.tsx`, `app/donor-to-vote/page.tsx`,
`app/donor-to-bill/page.tsx`, `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`,
`render.yaml`, `supabase/migrations/001..005`, YouTube channel state
(3 LF + 6 shorts live, <1K subs).
**Binding on:** revenue-mix recommendation (Section 3) and free-vs-paywall lock
(Section 4). Advisory on UI/UX implementation (defer to designer).

---

## Section 1: Current state (what's actually built)

### Public free routes (channel referral targets)
- `/` — homepage, 585+ politician directory, paper-token design
  (`app/page.tsx`, `force-dynamic`)
- `/politician/[slug]` — politician profile + scorecard (free)
- `/politician/[slug]/donors` — donor breakdown (free)
- `/politician/[slug]/correlations` — top-3 industry correlations (free hook)
- `/bill/[congress]/[number]` — bill page (free)
- `/race/...`, `/state/...`, `/leaderboard`, `/directory`, `/compare`
- `/trump`, `/2024-trump-campaign-promises`, `/foreign-donors`,
  `/dual-citizenship`, `/weekly` (newsletter archive)
- `/articles` + `/articles/[slug]` — race-funding + Friday Receipts archive
- `/r/[id]` — stable receipt permalinks (citation surface)
- `/embed/p/[slug]` — embeddable widget (free; revenue lever — see §3)
- `/methodology`, `/sources`, `/corrections`, `/disclaimer`,
  `/privacy`, `/terms`, `/for-journalists`

### Paid / paywall routes (currently **waitlist-only**)
- `/donor-to-vote` — full Donor→Vote alignment engine (waitlist; Bundle $45/mo)
- `/donor-to-bill` — full Bill money-trail engine (waitlist; Bundle $45/mo)
- `/tips-to-verdicts` — AI Tips→Verdicts engine ($25 one-shot or Bundle)
- `/pricing` — canonical pricing surface ($0 free / $45 Bundle / $249+ Desk)
- `/redeem/[code]`, `/dashboard`

### Pricing (confirmed from `app/pricing/page.tsx` lines 1-12, 64)
- **$0** Free forever — profiles, scorecards, foreign-tied funding,
  active-race tracker, newsletter, leaderboards, top-3 correlations.
- **$45/mo Bundle** ($399/yr — "save $141") — all 4 paid engines + daily
  FEC refresh + CSV/JSON/TSV export + watchlists/alerts + API 10K
  calls/mo + commercial license. **Pre-launch waitlist only** —
  `WAITLIST_ONLY = true` (line 64). No billing live yet.
- **$25** Tip → Report — one-shot transactional (~$22 margin).
- **$249+/mo Desk License** — Contact Sales, gated, B2B anchor.
- **Free 30-day comp** for working journalists via `/for-journalists`.

### YouTube channel state (`@CampaignReceiptsYoutube`)
- 3 LF: Bush ($8M), Massie ($35M), Rabb (AOC×AIPAC×$3.5M). 1 SEALED LF.
- 6+ shorts (Massie x3, Bush x3, SEALED 001/006).
- **<1K subs, <100 views/video.** Channel cannot yet monetize
  (YPP threshold = 1K subs + 4K watch hours). Sponsorships uneconomic
  (<50K subs = $0-50/video — see persona "hates" list).

### Critical observation
Every page that lands a YouTube viewer (`/politician/...`, `/bill/...`,
`/`, `/leaderboard`) is `export const dynamic = 'force-dynamic'; export
const revalidate = 0;` — Section 6 fix needed.

---

## Section 2: Cost model at scale

### Fixed monthly (today)
| Item | Plan | Cost | Notes |
|---|---|---|---|
| Render web | starter | **$7** | `render.yaml` line 12 |
| Render crons (10) | starter × 10 | **$70** | spot-audit, d1-d3, d6, d7, daily-digest, fec-weekly, alignment, bill-money-trail, bills-weekly, weekly-pick (counted in `render.yaml`) — **5 of these are GTM outreach crons that should be killed after Day 14** per the comment block (lines 73-74, 87, etc.) |
| Supabase | free→Pro | $0 → **$25** | flips at ~50K MAU |
| Lemonsqueezy | per-txn | 5% + $0.50 | only on paid |
| Resend | free tier | $0 | 100/day free, $20 at 50K/mo |
| Anthropic (Tips→Verdicts) | metered | ~$0.10/report | capped at 20/mo per Pro user → $2/Pro/mo COGS |
| FEC API | free | $0 | rate-limited; cron-batched (good) |
| Domain | annual | ~$1/mo | Cloudflare Registrar |

### Projected at scale (post-cron-cleanup: 5 crons, not 10)
| MAU | Render web | Crons | Supabase | Egress | **Total/mo** |
|---|---|---|---|---|---|
| 0 (today) | $7 | $70 (10) | $0 | $0 | **~$78** |
| 10K | $7 starter | $35 (5) | $0 free | ~$0 | **~$43** |
| 100K | $25 standard | $35 (5) | $25 Pro | ~$5 | **~$90** |
| 1M | $85 pro | $35 (5) | $25 Pro | ~$50 (with cache) or $400+ (without) | **~$200 (cached) / ~$550 (uncached)** |

**Cost per visitor at 1M MAU (cached):** $0.0002. **Per-visitor revenue
needed to break even:** $0.0002. Anything above that is margin.

### Break-even unit count
At 5% take-rate of 100K MAU on a $45/mo bundle =
5,000 subs × $45 × 0.93 (after LS) = **$209K/mo gross**. Conservative
2% take-rate = **$83K/mo gross**. Even 0.5% = **$20K/mo**.
Cost base ~$90/mo. Break-even = **3 paid subs/mo**.

The unit economics are not the problem. **Traffic** is the problem.

---

## Section 3: Revenue mix recommendation (ranked $/mo at 100K MAU)

| Rank | Lever | Action | Expected $/mo @ 100K MAU | Time-to-rev | Maint |
|---|---|---|---|---|---|
| 1 | **Bundle paywall ($45/mo)** | Flip `WAITLIST_ONLY = false` once 3 engines render real data end-to-end. Target 1.5% MAU conversion (mid-range for data products per persona). | 100K × 1.5% × $45 × 0.93 = **$62.7K/mo** | 4 wks (data backfill) | low |
| 2 | **Desk License ($249-$999/mo)** | Productize for 5-10 newsrooms (ProPublica, Sludge, OpenSecrets, state-level investigative desks, AP statehouse pool). 10× consumer price for same product. | 8 desks × $499 = **$4K/mo** | 6 wks (outbound + 1 anchor logo) | med |
| 3 | **Tip → Report ($25 one-shot)** | Already priced. Push from `/for-journalists` + every blog post CTA. Target 0.3% of MAU. | 100K × 0.3% × $25 × 0.93 = **$7K/mo** (lumpy) | live now | low |
| 4 | **YouTube AdSense** | Floor: only viable once 1K subs + 4K hrs. Political-content RPM $2-8 CPM **if green-flagged**. At 100K MAU on site + 50K YT views/mo: 50 × $5 = **$250/mo** | 8-16 wks (sub growth) | nil |
| 5 | **Embed/affiliate band on `/embed/p/[slug]`** | Sell sponsorship of the embeddable receipt widget (newsletters, blogs embed CR receipts → footer credit slot). Single sponsor at $500/mo when embeds >500. | **$500-2K/mo** | 12 wks (after distribution) | low |
| 6 | **Newsletter sponsorship (Friday Receipts)** | Wait until subs >5K (persona rule). At 5K subs, $30 CPM = **$150/issue × 4 = $600/mo** | 16+ wks | low |
| 7 | **API tier ($99-$499/mo)** | Already implied in Bundle (10K calls/mo). Split out as standalone for devs/civic-tech at $99/mo. 5 customers = **$495/mo** | 8 wks | med |

**Total target at 100K MAU (months 6-9):** **~$75K/mo gross**, **~$60K/mo net** after LS + COGS. Bundle is 83% of the mix. Everything else is a hedge.

**Total realistic at TODAY's traffic (<5K MAU):** $0-200/mo. The lever right now is **growth, not pricing**.

### LTV / CAC math
- **Bundle LTV:** $45/mo × 5-month median retention (political-content
  paywall norm per persona) = **$225 gross / ~$200 net**.
- **Annual ($399) LTV:** $399 × 1.2× renewal = **$479 gross / ~$430 net**
  → why the annual upsell exists (lifts LTV ~2× vs monthly).
- **Allowable CAC at 3:1 LTV:CAC:** **$65-150 per Bundle subscriber**.
- **YouTube → site conversion:** assume 1% of viewers click through,
  1.5% of site visitors subscribe → **0.015% video-view-to-sub**. Need
  ~6,700 views per Bundle sub. At current ~100 views/video, that's 0
  subs/video. Need **the 10x video** (50K+ views) to make this loop
  pay — or change the loop (see §5: blog architecture).

---

## Section 4: Free-vs-paywall lock (founder Q3)

> "Do we still provide an improved UI/UX director of donor influence
> on bills, on votes, and on campaigns... behind a paywall or do we
> just build it and offer it free and then make money off youtube?"

### Answer: **(d) Hybrid — current $45 Bundle architecture is correct. Keep it. Do NOT flip to all-free + ad-supported.**

### Why not all-free + YouTube ads
- At <1K subs, YouTube revenue is **$0**. At 100K subs (12-18 months
  optimistic), political content RPM $2-8 × ~500K monthly views =
  **$1-4K/mo**. That is the entire ad business at success.
- The Bundle at the SAME audience size grosses **$60K+/mo** (§3).
- "Make money off YouTube" is **15× worse** than "make money off the
  paywall that the YouTube videos drive to."
- Persona rule violated: "Newsletter-only / ad-only monetization for
  video-first channels — newsletter conversion is downstream of YouTube;
  if YouTube isn't growing, newsletter doesn't either." Same applies
  to ads.

### Why the current hybrid is right
The site already does the right thing structurally:
- **Free:** every politician page, every bill page, top-3 correlations,
  foreign-tied funding, leaderboards, /weekly. These are the pages
  YouTube viewers land on. **The receipt the video showed is free.**
  (Persona: "Paywalls that hide the receipt the channel JUST showed
  for free" → instant brand-killer. We avoid this.)
- **Paid:** the **matrix** — every politician × every industry ×
  every vote (Donor→Vote engine), every bill × every donor industry
  (Donor→Bill), and AI Tips→Verdicts. These are **producer tools**,
  not consumer lookups. Journalists/researchers/staffers have
  willingness-to-pay; casual viewers don't.
- This is the textbook **Bloomberg-Government-lite** play: free
  individual lookups, paid bulk/matrix/export/alerts. Validated
  conversion bands on data products: 1-3% MAU → paid.

### One adjustment to current architecture
The `/donor-to-vote` and `/donor-to-bill` landing pages today are
**100% waitlist**. Convert them to **(a) one free politician × industry
cell rendered fully** (Manchin × Pharma is already the sample — make
it a real interactive view, not a Receipt mockup), then **(b) blur or
"Pro" all 584 other politicians × all other industries**. This is the
"free preview of paid tier" pattern. Expected lift on Bundle conversion:
**1.5% → 2.2%** based on freemium SaaS norms (Tomasz Tunguz benchmarks).

### LTV math for the lock
- All-free + ads: LTV per visitor = $0.005-0.04. 100K MAU = $500-$4K/mo.
- Hybrid (current): LTV per visitor = $0.50-1.20 (blended free + paid).
  100K MAU = **$50K-120K/mo**. 100× difference. Not close.

**Owner:** product + design (don't touch this without designer +
agent-companies-design). **Verdict:** KEEP HYBRID. Ship the free
preview cell within 2 weeks (§7).

---

## Section 5: Blog-post-around-each-video architecture

> "How do we beef up our website with our latest campaign news videos?
> Do we create a blog post and link the video to blog and blog to video?"

**Answer: yes. Every LF video gets a companion blog post.** Use the
existing `cr_articles` table + `/articles/[slug]` route (already built,
`force-dynamic` — see Section 6 for cache fix). Add `kind = 'video_companion'`.

### URL pattern
`/articles/[slug]` where slug is `video-<topic>-<yyyymmdd>`. Example:
`/articles/aoc-vs-aipac-rabb-20260525`. Description video URL goes in
description + `/r/[id]` permalink in pinned comment so YT comments link
back to receipts.

### Template (8 sections, in order)
1. **Hero block** — h1 (matches YT title), 1-sentence dek,
   publish date, byline. SEO h1.
2. **Embedded YouTube player** (iframe, lazyload). Above the fold.
3. **TL;DR receipt** — re-render the video's marquee Receipt
   (e.g. `RCPT-AIPAC-RABB-3.5M`) using existing `<Receipt>` component.
   Clickable rows link to FEC source URLs. **This is the receipt the
   video showed — free.**
4. **The money trail** — 3-5 receipts breaking down each
   FEC filing referenced in the video. Each row links to
   `https://www.fec.gov/data/...` and to `/r/[id]` permalinks.
5. **Linked CR DB pages** — tile grid linking to: politician profile,
   donor breakdown, correlations page, race page, bill pages mentioned.
   This is the **free → paid funnel hop**: viewer reads blog, clicks
   politician page, sees "Full donor→vote matrix — Bundle" tile.
6. **Full transcript** (collapsible `<details>`) — SEO + accessibility
   + LLM-citation-bait. Pulled from the existing VO transcript file
   in `eng/longform-scripts/`.
7. **CTAs** (two, placed):
   - **After the TL;DR receipt:** "Get one of these every Friday —
     subscribe to Friday Receipts" (newsletter).
   - **After the linked DB tiles:** "See every politician × every
     donor industry — free preview of the Pro Bundle".
8. **Methodology + corrections footer** — auto-included site-wide.

### Structured data (critical for SEO + Google video carousel)
- `Schema.org/Article` (headline, datePublished, author, image)
- `Schema.org/VideoObject` (name, description, thumbnailUrl,
  uploadDate, embedUrl, duration, transcript) — **this gets the video
  into Google's "key moments" + Discover video carousel**. Massive
  organic surface; almost no political-accountability site uses it.

### Implementation
- Schema already supports `kind`; add 'video_companion' enum value
  (`supabase/migrations/006_video_companion.sql` — 1 migration).
- `app/articles/[slug]/page.tsx` already renders articles; extend the
  template to conditional-render the YT embed + VideoObject schema
  when `kind = 'video_companion'`.
- Add a small `scripts/seed-video-companion.mjs` cron OR (better)
  generate the markdown manually per video — the bottleneck is video
  output (1-3/wk), not template generation, so manual is fine.

**Owner:** Head of Growth template persona (acquisition) + designer
(template) + video-producer (transcript hand-off). **Cost:** ~1 day
of build + 30 min/video to publish. **Expected:** 2-5× organic traffic
per video (transcript indexing + Google video carousel + per-video
permanent URL is a *much* better long-tail surface than YouTube alone).

---

## Section 6: Data cost lock (founder Q4)

> "Important that the FEC data we scraped and bill data and vote data
> stays in our DB for cheap retrieval and that we're not paying much
> to maintain website EVEN if a million people visit per month right?"

### Current state: GOOD on data, BAD on caching

**Live request path per-call vendor audit:**
| Vendor | In live page render? | Notes |
|---|---|---|
| FEC API | **No** ✅ | called only in `cr-fec-weekly` cron + `cr-bills-weekly` cron (`render.yaml` lines 226-301). Data lands in Supabase tables. |
| Congress.gov API | **No** ✅ | cron only (`seed-bills.mjs`). |
| OpenSecrets | **No** ✅ | scraped/seeded, stored in `cr_industry_breakdown`. |
| Anthropic | **Yes, but only on POST** ⚠️ | `app/api/inbound-reply/route.ts:43` — only fires on inbound webhook (not on GET page renders). Safe. Tips→Verdicts also hits Anthropic but is rate-capped to 20/Pro/mo. |
| Supabase | **Yes — every page** ⚠️ | every `force-dynamic` page hits Supabase per request. At 1M MAU this is the cost driver. |

**Verdict on data acquisition: locked.** No per-call vendor scales
with traffic. ✅

### The actual problem: NO PAGE-LEVEL CACHE

Every politician page, bill page, leaderboard, and even homepage is
declared `export const dynamic = 'force-dynamic'; export const
revalidate = 0;` (32 files confirmed via grep). That means **every
page render hits Supabase**, regardless of how stale the answer is.

At 1M MAU × (say) 4 pageviews avg = **4M Supabase queries/mo**. Even
indexed queries at ~5-20ms add up to egress + connection-pool pressure
and force a Render upgrade.

### Fix: ISR + edge cache (≤2 days of work, owner: an engineer subagent)

Replace `force-dynamic; revalidate=0` with `revalidate = 3600` (1 hour)
on read-only pages:
- `/politician/[slug]` — 1h ISR (data changes nightly anyway)
- `/politician/[slug]/donors` — 1h ISR
- `/politician/[slug]/correlations` — 1h ISR (compute runs nightly at
  03:00 ET per `cr-alignment-nightly`)
- `/bill/[congress]/[number]` — 1h ISR
- `/leaderboard` — 1h ISR
- `/directory` — 1h ISR (already-cacheable)
- `/foreign-donors`, `/dual-citizenship`, `/trump`, `/2024-trump-...`
  — 6h ISR (rarely change)
- `/articles/[slug]` — 24h ISR (published articles don't mutate)
- `/r/[id]` — 24h ISR (receipt permalinks are immutable)

Keep `force-dynamic` only on: `/`, `/dashboard`, `/pricing`,
`/redeem/...`, `/admin/...`, anything entitlement-gated. Maybe 5 routes.

Add `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`
headers via `next.config` or middleware on the ISR routes. Render's
edge caches the response; Supabase sees only the **revalidation**
request (1/hour/page) instead of every visitor.

### Cache math at 1M MAU with ISR
- 585 politician pages × 24 revalidations/day = **14,040 queries/day**
- 1,000 bill pages × 24 = 24,000/day
- Long tail: ~50K queries/day total **regardless of MAU**
- = **~1.5M queries/mo, flat** vs. 4M+ scaling with traffic.
- Supabase Pro ($25/mo) handles this trivially. Render web at
  standard ($25) handles 1M MAU because almost everything is served
  from the edge cache.

### Egress / bundle
- Politician scorecards have OG share images (`opengraph-image.tsx`).
  Confirm these are stored to Supabase Storage and not regenerated
  per request (separate audit).
- JS bundle: not measured here; flag to designer + Next.js maintainer
  to run a Lighthouse pass post-ISR-flip.

### Crons to kill
The 5 GTM outreach crons (`cr-outreach-d1` through `d7`) cost
**$35/mo of the $70 cron total**. Per `render.yaml` comment block
(lines 73-74): "After Day 14, manually disable in Render dashboard."
We are past Day 14 of the May launch window. **Kill these 5 today.**
Savings: **$35/mo immediately**.

### Cost at 1M MAU with the recommended cache strategy
**~$200/mo total.** Per-visitor cost: **$0.0002**. Founder's
requirement satisfied: "1M people visit per month" costs ~$200,
which 4-5 Bundle subs cover.

---

## Section 7: Top 3 actions this week

### Action 1 — Flip ISR + kill 5 GTM crons (Section 6)
**Owner:** existing engineer / Claude code session
(not a new persona). **What:** PR that converts 20+ `force-dynamic`
read-only routes to `revalidate = 3600` (or 24h for `/articles`,
`/r`). Disable cr-outreach-d1/d2/d3/d6/d7 in render.yaml (comment
out, don't delete — re-enabled in Sept for next launch wave).
**Cost:** 1 dev-day. **Revenue:** saves $35/mo immediately + unlocks
1M-MAU scaling without infra upgrade. **Deadline:** Wednesday.

### Action 2 — Ship the video-companion blog post template + 3 backfills (Section 5)
**Owner:** `companies/campaign-receipts/personas/video-producer.md`
(transcript handoff) + designer (template) + Head of Growth
(`shared/personas/head-of-growth-template.md`) for CTA placement.
**What:** Migration 006 adds `kind = 'video_companion'`. Extend
`/articles/[slug]` to render YT embed + Schema.org VideoObject when
kind matches. Backfill posts for Bush ($8M), Massie ($35M), Rabb
(AOC×AIPAC). **Cost:** 1.5 dev-days + 90 min/post manual writing.
**Revenue:** 2-5× organic traffic per video; permanent SEO surface
that compounds vs. ephemeral YouTube discovery. **Deadline:** Friday.

### Action 3 — Convert `/donor-to-vote` + `/donor-to-bill` from waitlist-only to "free preview of one cell" (Section 4)
**Owner:** designer (per persona rule: implementation specifics defer
to designer + agent-companies-design) + product. **What:** Render the
Manchin × Pharma sample as a real interactive table (filter by Congress,
sort, show row-level FEC links) for **all logged-out users**. Then
gate the politician dropdown / industry dropdown / export behind the
Bundle paywall. Keep `WAITLIST_ONLY = true` on `/pricing` for now
(billing not flipped), but **add a "Join waitlist — first 100 get
50% off year 1"** anchor on the gated controls. **Cost:** 2 dev-days.
**Revenue:** lifts pricing-page → waitlist conversion (current
estimate ~3%) to ~8-12%, building the launch list. **Deadline:**
end of next week.

### Out of scope this week (deferred, not abandoned)
- **YouTube monetization toggle** — defer to
  `personas/viral-panel/07-youtube-monetization.md`; needs 1K subs first.
- **Sponsorship outreach** — uneconomic <50K subs (persona hard rule).
- **API tier productization** — wait for first 50 Bundle subs to
  validate which API calls actually matter.
- **Newsletter sponsorship** — wait for >5K newsletter subs.

---

## Appendix A — Sister persona handoffs

- **Chief Accountant** (`shared/personas/chief-accountant.md`): take
  §2 cost table + §3 revenue table into Friday P&L. Note: kill 5
  crons this week = -$35/mo into runway.
- **McKinsey Advisor** (`shared/personas/mckinsey-advisor.md`):
  kill/scale signal — Bundle conversion test cannot run until
  `WAITLIST_ONLY = false`. Recommend setting a 90-day post-flip
  kill threshold: <50 paid Bundle subs by day 90 → re-evaluate
  pricing/positioning, not the company.
- **YC Advisor** (`shared/personas/yc-advisor.md`): red-team on
  conversion math — my 1.5% MAU → Bundle assumption is the load-
  bearing claim. Real political-data paywalls (Sludge, Popular
  Information) cluster at 0.5-2%. If we land at 0.5%, revenue at
  100K MAU is **$21K/mo** not $63K. Still a business; not a 10×.
- **Head of Growth** (`shared/personas/head-of-growth-template.md`):
  own the video-companion-blog acquisition loop in §5 + §7 Action 2.
- **YouTube Monetization** (`personas/viral-panel/07-youtube-monetization.md`):
  no work this audit cycle; revisit when channel crosses 1K subs.
- **Analytics Tracker** (`personas/analytics-tracker.md`): after ISR
  ships, instrument cache-hit-ratio + Supabase QPS in the 72h post-
  ship analytics — this is the proof-of-lock for the founder's Q4.
