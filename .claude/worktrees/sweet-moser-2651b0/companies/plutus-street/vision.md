# Plutus Street — Trading Platform Vision Document

**Working name:** Plutus Street (Brand/Design finalizes Saturday from
candidates: Plutus Street, Plutoship, Retail Alpha, Solo Edge, etc.)
**Domain:** plutoship.com (founder owns) OR new domain TBD by Brand
**Status:** Active (Tier 3 long-burn, launching weekend 2026-05-02)
**Budget cap:** $100/mo (revised down from $500 — community-build mode)
**Founder time/wk:** <1 hr (Plutopath generates signals already;
weekly signal-output review ~10 min for edge protection)

**Pluto Family architecture:** This company is part of the founder's
Pluto-family financial product line. Plutopath (founder's private
trading system) is parent. Plutus Street is the consumer-facing
trading platform under this family.

**Pivot history:** Originally conceived as "Trading Live" spectator-
sport platform (DELETED 2026-05-01 — too expensive, securities/
gambling legal complexity). Re-conceived as Trading Journal + Paid
Signals (lower cost, no legal complexity). **Live trader video
streams now ADDED BACK as a Phase 2 feature** (not a separate
company — feature inside Plutus Street).

## What this company is

A two-tier trading SaaS:

1. **Free trading journal** — competes with Tradervue ($20/mo),
   Edgewonk ($169/yr), TraderSync ($30/mo), Chartlog ($45/mo). Free
   tier builds audience.

2. **Paid signal alerts** — Plutopath-powered data product. Two paid
   tiers ($29/mo Edge Scanner, $99/mo Pro Edge). Aggregate, lagged,
   educational signals. NOT investment advice.

## Why this company exists in portfolio

### Founder's unfair advantages

- **Plutopath generates signals daily.** Marginal cost ≈ $0 to surface
  them as a paid product. The compute already happens for founder's
  own trading.
- **Verifiable edge.** Founder is real MD trading real money daily, not
  unverifiable Discord guru. Trust signal that competitors can't fake.
- **Proprietary research:** A+ patterns, MFE distributions, Markov
  chain transitions, rolling percentile gates, exit-rule research. All
  documented in PlutoBible.
- **Existing trading audience presence on Twitter.** Distribution
  channel ready.

### Market reality

- **Trading journal market:** crowded but proven. Tradervue, Edgewonk,
  TraderSync, Chartlog all profitable. $20-150/mo pricing range.
- **Signal/scanner market:** also proven. Trade Ideas $99-228/mo,
  Benzinga Pro $77/mo, Discord rooms $35-99/mo.
- **Wedge:** No one combines free journal + paid signals well. Most
  journals are paid-only, no signals. Most signal services have
  terrible track records (no proof-of-trade, anonymous gurus). This
  company combines both with verifiable founder credibility.

## Free tier (lead magnet)

**Trade journal features:**
- Manual trade entry via CSV upload (saves users $45/mo vs
  competitors — they download from their broker once a week and
  upload to Plutus Street)
- System remembers prior uploads by account number (so user only
  uploads incremental data each week)
- Tag setups, strategies, time-of-day, instrument
- Computed metrics: win rate, R-multiple, expectancy, MAE/MFE,
  drawdown, max winning streak, max losing streak
- Equity curve charts
- Win rate by setup tag
- Drawdown analysis
- Calendar heatmap of P&L
- CSV export (for user's own records)
- Mobile-responsive web app (no native v1)

**Hard rule:** free tier is genuinely useful. Not a crippled free
trial. Hook is "free + better than $45/mo competitors at the basics."

## Optional auto-broker pull — $1 per pull (Phase 2 SnapTrade)

For users who want auto-pull instead of weekly manual upload:
- $1 charged per data pull (typically once per trading day)
- Powered by SnapTrade (covers ~20 brokers via one API)
- User can switch back to free manual upload anytime
- Activates Phase 2 when SnapTrade integration justifies the
  $300-1000/mo SnapTrade cost (need 100+ paying users on this tier)

## Paid Tier #1: Edge Scanner — $29/mo

**Daily Plutopath signal feed (delayed 5-15 min):**
- Pattern alerts: "BROKEN_SUPPORT_ACCEL pattern firing in tech today"
- Sector / regime indicators
- Aggregate market signals (e.g., "model rates SPY 7/10 today")
- A+ pattern occurrences (anonymized — no specific entry/exit)
- Weekly summary email of patterns observed

**What Edge Scanner is NOT:**
- Real-time signals (lagged 5-15 min to protect Plutopath edge)
- Specific trade calls ("BUY NVDA $500c" — never)
- Personalized to user's portfolio (illegal without advisor reg)
- Profit-promising (compliance disaster)

**What it IS:**
- Educational research-grade insights
- "Here's what our model sees and why"
- Helps users develop pattern recognition over time
- A pro version of "what's working in markets today"

## Paid Tier #2: Pro Edge — $99/mo

**Everything in Edge Scanner, plus:**
- **Backtest tools:** run hypothesis against historical data
- **Advanced journal analytics:**
  - Cohort analysis (by setup, time, instrument)
  - Setup-by-setup edge detection (which strategies actually work
    for this user)
  - Leak finder (which setups consistently lose)
  - Risk-adjusted returns
- **API access** (Phase 2): traders integrate with own tools
- **Priority support**

## Phase 2 Feature: Live Trader Video Streams

**Founder direction 2026-05-02:** "Keep the live trader youtube
version in the Trading platform that has journal and signals."

This was originally a separate "Trading Live" company concept that
was deleted. It returns as a FEATURE inside Plutus Street, not a
separate company.

**Mechanic:**
- Other traders (creators) stream live trading via OBS → RTMP
- Audience pays subscription per creator (creator sets price, $5-99/mo)
- Free 30-second preview; paywall after
- **Platform takes 10%** (vs YouTube's ~49% on mobile)
- Creator keeps ~87% after Stripe fees

**Why this works:**
- Same infrastructure already exists (Stripe Connect, RTMP via
  Cloudflare Stream, web player)
- Same audience (retail traders) pays for this
- Cross-sells with Edge Scanner / Pro Edge tiers
- Low marginal cost to add
- Differentiates Plutus Street from generic trading journals

**Phase 2 timing:** Activate after free journal has 200+ users +
first 5 paid Edge Scanner subscribers prove the platform.

**Compliance:** creators stream their own trades, NOT recommendations
to viewers. Disclaimer "this is entertainment + education, not
investment advice for viewers" baked into every stream.

**Not v1.** v1 is journal + Edge Scanner + Pro Edge scaffolded.
Live video streams Phase 2 (months 4-6).

## Critical legal positioning (LOCKED, NON-NEGOTIABLE)

This is a **DATA PRODUCT**, not investment advice.

**Acceptable language:**
- "Our scanner shows X"
- "A+ pattern detected in Y sector"
- "Model rates S&P 500 6/10 today based on Markov transitions"
- "Educational research-grade insights"

**Forbidden language:**
- "Buy X" / "Sell Y"
- "I recommend..."
- "You should..."
- "This will profit..."
- "Guaranteed..."

**Required disclaimers** (every paid product page, email, signal):
- "Past performance does not guarantee future results."
- "This is educational data, not investment advice."
- "Consult a licensed financial advisor before making investment
  decisions."
- "Not personalized to your portfolio or financial situation."

This positioning lets the company operate WITHOUT investment advisor
registration, similar to how Trade Ideas, Benzinga Pro, and
educational trading platforms operate.

**Legal review cost:** $1-2K for securities attorney to review data
product framing + ToS + Privacy Policy.

## Plutopath data protection (CRITICAL)

Founder's edge comes from Plutopath. Publishing signals publicly risks
front-running and edge erosion. Mitigation strategy:

1. **Lag the data 5-15 min** — show signals delayed (not real-time)
2. **Aggregate not specific** — sector/regime/pattern-class signals,
   not specific entry/exit ticker calls
3. **Pattern-class not real-time setup** — describe the pattern
   firing, not the exact ticker entry/exit timestamps
4. **Educational framing** — explain what the model sees and why,
   building user understanding rather than action-driven dependency

This protects Plutopath's live edge while giving paid users
research-grade insights they can't get elsewhere.

**Founder review:** Founder spot-checks signal output weekly (~10
min) to ensure no over-disclosure of live edge.

## Sales channels (agent-driven)

**Channel A: Reddit organic (PRIMARY)**

Target subs:
- r/Daytrading (~1M+ subs)
- r/Options (~1M+ subs)
- r/Wallstreetbets (~16M subs — promotional bans common)
- r/StockMarket
- r/Trading_Journal (small, niche, high-intent)

Discipline:
- Helpful comments first (no links, build karma)
- Soft-link in profile bio
- Free journal as lead magnet (not paid)
- Paid signals only mentioned after trust established

**Channel B: TikTok / YouTube trading content**

Format:
- 60-second educational clips on patterns
- Founder Plutopath insights (anonymized) repurposed
- Brand: data product, not "I'm a guru" content

**Channel C: Twitter trading community**

Founder's existing presence helps. Agents draft tweets; founder
approves before posting (founder's voice matters here).

**Channel D: Affiliate program (Phase 2)**

10-20% rev share with existing trading creators. Activates after
proving funnel works (50+ paid users).

**Channel E: SEO**

Long-tail keywords:
- "Best trading journal"
- "Free trading journal alternative to Edgewonk"
- "Trading edge backtest"
- Setup-specific: "trading [pattern name]"

Slow but compounds over months.

## 90-day target

| Tier | Price | Realistic count by day 90 | MRR |
|---|---|---|---|
| Free journal users | $0 | 200-500 | $0 |
| Edge Scanner subscribers | $29/mo | 20-50 | $580-1,450 |
| Pro Edge subscribers | $99/mo | 5-15 | $495-1,485 |
| **Total** | | | **~$1,000-3,000/mo MRR** |

**Year 1 ceiling:** $10-30K/mo MRR realistic if free-to-paid
conversion holds. Higher with affiliate growth or institutional data
expansion.

## Engineering scope

**v1 (week 1-4):**
- Web app (Next.js + Supabase)
- Free journal: trade entry, metrics, charts
- Stripe subscription billing for Edge Scanner + Pro Edge
- Email capture + nurture sequences
- Daily signal feed integration with Plutopath data export

**v2 (months 2-3):**
- Backtest tools
- Advanced analytics (cohort, leak finder)
- Email signal alerts (daily summary)

**v3 (months 4-6):**
- SnapTrade broker import (~$300-1000/mo SnapTrade cost; activate when
  paid users justify)
- API access (Pro Edge tier)
- Mobile app (web first; native if usage justifies)

## Org chart

| Role | Model | Owner |
|---|---|---|
| CEO | Opus 4.7 | Strategy, signal product positioning |
| **Engineering team (full):** | | |
| CTO | Opus 4.7 review, V4-Pro execution | Architecture, sprint plan |
| Frontend Engineer | V4-Pro / Haiku | Journal UI, scanner UI, charts |
| Backend Engineer | V4-Pro / Haiku | Stripe, journal data model, signal feed integration |
| DevOps Engineer | V4-Pro / Haiku | Render deploys, Plutopath data sync |
| QA Engineer | V4-Pro / Haiku | Smoke tests, payment flow tests |
| Head of Growth | V4-Pro / Haiku | Reddit, TikTok, SEO, affiliate program |
| Sales & Partnership | V4-Pro / Haiku (limited) | Affiliate creator outreach (Phase 2) |
| Brand/Design | V4-Pro / Haiku | Voice, visual, no-slop trading aesthetic |
| Chief Accountant | V4-Pro / Haiku | $100/mo cap, P&L |
| **Compliance Reviewer** (company-specific) | Opus 4.7 | Data product positioning, FTC truth-in-advertising on edge claims, "advice vs data" line enforcement |
| McKinsey + YC Advisors (shared) | Opus 4.7 | Weekly review |

## Risks

1. **SEC investment-advisor classification** — mitigated by data
   product framing + legal review.
2. **Plutopath edge erosion** — mitigated by lag + aggregate-only +
   pattern-class signals.
3. **Trading journal market crowded** — mitigated by free + signal
   bundle wedge.
4. **Customer acquisition slow** — content-driven funnel; not paid-ad-
   friendly market.
5. **Founder's existing trading audience expects "calls"** — manage
   expectations with disclaimers + clear positioning.
6. **Plutopath dependency** — if Plutopath stops working, paid signals
   stop. Mitigation: build journal product so users stay even if
   signals pause.

## Kill criteria

- $50 spend (50% of $100/mo cap) AND <50 free users AND $0 paid by day 30 = orange
- $80 spend (80%) AND <100 free users AND <5 paid by day 60 = red
- 90 days post-launch with <10 paid subscribers = research-only mode
- $375 spend (75%) AND <100 free users AND <5 paid by day 60 = red
- 90 days post-launch with <10 paid subscribers = restructure pivot
  evaluation

## Locked rules (NEVER violate)

1. Position as **DATA PRODUCT**, NEVER as investment advice
2. Lag Plutopath signals 5-15 min always
3. Aggregate not specific (no real-time ticker calls)
4. Disclaimer on every paid product page, email, signal:
   "Past performance does not guarantee future results. Educational
   use only."
5. No paid testimonials without "results not typical" labeling
6. No claim of profitability for the user
7. Founder reviews signal output weekly to prevent edge over-disclosure
