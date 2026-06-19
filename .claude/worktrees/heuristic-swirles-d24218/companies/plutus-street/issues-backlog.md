# Trading Journal + Paid Signals — Issues / Backlog

**Status legend:** TODO / IN PROGRESS / BLOCKED / DONE
**Priority legend:** P0-P3

---

## P0 (Saturday/Sunday)

### TJ-001: Initial infrastructure provisioning
- **Owner:** Founder → CTO verification
- **Status:** TODO

### TJ-002: Brand name proposals
- **Owner:** Brand/Design
- **Output:** 3-5 candidates with domain + USPTO check. Avoid:
  "trading guru," "signals," "alerts" — too commodity. Choose:
  evokes data + edge + journal.
  Suggested seeds: "EdgeJournal," "PlutoJournal," "Pattern Edge,"
  "Edgewise," "EdgeBook," "Tradebook"
- **Status:** TODO

### TJ-003: Compliance Reviewer initial framework
- **Owner:** Compliance Reviewer
- **Output:** `compliance/data-product-positioning.md` (the line
  between "data" and "advice"); `compliance/banned-language.md`
  (no "buy/sell/recommend" lexicon); `compliance/required-disclaimers.md`
- **Status:** TODO

### TJ-004: Domain registration + DNS
- **Owner:** DevOps
- **Status:** TODO

### TJ-005: Render infrastructure
- **Owner:** DevOps
- **Output:** 1 web service + 1 background worker live with stub
- **Status:** TODO

### TJ-006: Supabase schema
- **Owner:** Backend Engineer
- **Output:** `trading_journal` schema with `users`, `trades`,
  `setups`, `signals`, `subscriptions` tables
- **Status:** TODO

### TJ-007: Plutopath signal export endpoint design
- **Owner:** Founder + CTO
- **Output:** Founder-side spec for the read-only, lagged,
  aggregated signal export endpoint. Contract: what fields
  exposed, what NOT exposed, lag time, format
- **Status:** TODO

### TJ-008: Architecture decision document
- **Owner:** CTO
- **Output:** `tech-plan/architecture.md` with stack decisions,
  Plutopath integration approach, billing flow
- **Status:** TODO

### TJ-009: Brand book v1
- **Owner:** Brand/Design
- **Output:** Voice + visual + banned phrases (pro-trader aesthetic,
  not guru aesthetic; data-driven not motivational)
- **Status:** TODO

### TJ-010: DeepSeek vs Haiku A/B test
- **Owner:** CEO + Chief Accountant
- **Status:** TODO

---

## P1 (Week 1)

### TJ-020: Landing page v1
- **Owner:** Frontend Engineer
- **Output:** Hero + free journal signup + email capture + paid
  preview
- **Acceptance:** Compliance Reviewer approved; clear "data product"
  positioning

### TJ-021: Free journal MVP
- **Owner:** Frontend + Backend
- **Output:** User can sign up, manually log trades, see basic
  metrics (win rate, R-multiple)

### TJ-022: Stripe products + checkout
- **Owner:** Backend
- **Output:** Edge Scanner $29/mo + Pro Edge $99/mo Stripe
  products, checkout flow tested

### TJ-023: First Reddit comments
- **Owner:** Head of Growth
- **Output:** 5 helpful comments in r/Daytrading, r/Options
  (no links, build trust)

### TJ-024: Twitter founder handle setup
- **Owner:** Brand/Design + Head of Growth + Founder approval
- **Output:** Twitter strategy that respects founder's existing
  presence (founder approves all draft tweets v1)

### TJ-025: Compliance review of all v1 copy
- **Owner:** Compliance Reviewer
- **Output:** Every public-facing piece reviewed and approved

---

## P2 (Week 2)

### TJ-030: Plutopath signal feed integration
- **Owner:** Backend Engineer
- **Output:** Daily cron pulls from Plutopath read-only endpoint,
  writes to `signals` table with lag + aggregation enforced

### TJ-031: Edge Scanner UI (paid product)
- **Owner:** Frontend Engineer
- **Output:** Daily signal display, locked behind subscription

### TJ-032: Signal email digest
- **Owner:** Backend + Brand/Design
- **Output:** Daily/weekly email with patterns observed
  (paid users only)

### TJ-033: 15+ Reddit comments accumulated
- **Owner:** Head of Growth

### TJ-034: First TikTok video
- **Owner:** Head of Growth + Brand/Design
- **Output:** 60-sec educational clip on a trading pattern;
  Compliance approved

### TJ-035: Free journal: equity curve chart
- **Owner:** Frontend Engineer

### TJ-036: Free journal: setup tagging + win-rate-by-setup
- **Owner:** Frontend + Backend

---

## P2-P1 (Week 3)

### TJ-040: First paid customer acquisition
- **Owner:** Whole team
- **Acceptance:** First $29 payment for Edge Scanner

### TJ-041: 50+ free journal users
- **Owner:** Head of Growth

### TJ-042: 30+ Reddit comments accumulated
- **Owner:** Head of Growth

### TJ-043: Customer support inbox
- **Owner:** CTO + Brand/Design

### TJ-044: 3+ TikTok videos posted
- **Owner:** Head of Growth + Brand/Design

---

## P0 — Week 4 Hardening

### TJ-050: Pro Edge tier launched
- **Owner:** Backend + Frontend
- **Output:** $99/mo Pro Edge tier with backtest tools placeholder
  (basic backtest in v2)

### TJ-051: Email nurture sequence
- **Owner:** Brand/Design + Head of Growth
- **Output:** 5-email sequence: signup → free journal value → soft-
  pitch Edge Scanner → testimonial / proof → hard-sell

### TJ-052: 100+ free journal users
- **Owner:** Head of Growth

### TJ-053: 5+ paid Edge Scanner subscribers
- **Owner:** Whole team

### TJ-054: Compliance audit
- **Owner:** Compliance Reviewer
- **Output:** Quarterly audit of all live content for advice/data
  line drift

---

## Week 5-12

- TJ-060: Backtest tools functional (Pro Edge value-add)
- TJ-061: 200+ free users
- TJ-062: 20+ Edge Scanner subs ($580/mo from this tier alone)
- TJ-063: 5+ Pro Edge subs ($495/mo from this tier alone)
- TJ-064: Affiliate program launched (10-20% rev share)
- TJ-065: First 3 affiliate creators recruited
- TJ-066: Cohort analysis feature (Pro Edge)
- TJ-067: Leak finder feature (Pro Edge)
- TJ-068: Stripe high-risk merchant review passed (if challenged)

---

## Backlog (no priority)

### Phase 2 (post-revenue)
- SnapTrade broker import (~$300-1000/mo)
- Mobile app (web first)
- API access for Pro Edge users
- Live signal alerts (push notifications)
- Setup-specific deep dives (paid mini-courses)

### Phase 3 (post-Phase 2 stable)
- Institutional data tier ($999+/mo for hedge funds, RIAs)
- Custom backtest service (one-off $500-2000)
- White-label for trading creators
- Educational content library

### Speculative
- Discord integration (read-only signal alerts)
- Telegram bot (read-only signal alerts)
- TradingView indicator marketplace
- Newsletter expansion (long-form weekly)

---

## DO NOT DO

- Make specific ticker calls ("BUY NVDA $500c") — VIOLATES data
  product positioning
- Promise profitability — FTC violation
- Personalize advice to user portfolios — requires advisor reg
- Real-time signals — destroys Plutopath edge
- Copy-trading features — securities + gambling complexity
- "Guru" branding (motivational, lifestyle-marketing) — wrong audience

---

## CEO grooming weekly

Sunday evening:
1. Move completed items to DONE
2. Re-prioritize based on conversion data (not just velocity)
3. Add issues from McKinsey/YC reviews
4. Add issues from Compliance Reviewer audits
5. Kill stale issues
