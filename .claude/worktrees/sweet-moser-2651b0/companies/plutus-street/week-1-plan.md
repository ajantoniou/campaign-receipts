# Trading Journal — Week 1 Day-by-Day Plan

**Week of 2026-05-02 (Saturday) through 2026-05-08 (Friday)**

---

## Saturday 2026-05-02 — Provisioning + Foundations

### Founder (~100 min one-time + 30 min Plutopath spec)
1. Gmail account creation
2. Cloudflare register domain
3. Render: web service + background worker
4. Stripe products: Edge Scanner $29/mo + Pro Edge $99/mo
5. Resend signup + domain verify
6. **Plutopath signal export endpoint setup** (founder's infrastructure
   side — design the read-only endpoint that lags + aggregates signals
   for Trading Journal to consume)

### Agent Team (parallel)

#### CEO (Opus 4.7)
- Read all required files
- Post Week 1 plan
- Identify decisions for founder

#### Brand/Design (V4-Pro)
- DELIVERABLE BY 2 PM: 3-5 brand name proposals (data-driven,
  anti-guru aesthetic)
- Mood boards: Bloomberg-Terminal-meets-modern direction

#### Compliance Reviewer (Opus 4.7) — CRITICAL
- DELIVERABLES Saturday:
  - `compliance/data-product-positioning.md` — the "data vs advice" line
  - `compliance/banned-language.md` — "buy/sell/recommend/guaranteed"
    lexicon
  - `compliance/required-disclaimers.md` — exact text + placement rules
  - Review Plutopath integration spec for over-disclosure risk

#### CTO (Opus 4.7)
- Architecture decision document including Plutopath integration
- Sprint plan for Week 1-4

#### Engineering team

**Frontend Engineer (V4-Pro):**
- Next.js project structure (Tailwind, TypeScript strict, dark mode default)
- Component library scaffolding

**Backend Engineer (V4-Pro):**
- Once Supabase keys ready: `trading_journal` schema with all tables

**DevOps Engineer (V4-Pro):**
- Render MCP verification
- Plan deploy pipeline

**QA Engineer (V4-Pro):**
- Smoke test plan covering Plutopath integration safety

#### Head of Growth (V4-Pro)
- Reddit target sub list
- Twitter strategy aligned with founder's existing handle
- TikTok content style

#### Sales & Partnership (V4-Pro)
- Phase 1 dormant; track potential affiliate candidates only

#### Chief Accountant (V4-Pro)
- Verify API keys
- DeepSeek 75% discount confirmation
- Open ledger: $0 spent, $500 cap, weekly burn target $30-50

#### McKinsey + YC Advisors (Opus 4.7)
- Initial 300-word critiques

### Saturday EOD checklist
- [ ] All keys provisioned and verified
- [ ] Brand names approved by founder
- [ ] Compliance framework v1 committed (positioning, banned language,
      required disclaimers)
- [ ] Plutopath signal export endpoint specified
- [ ] Architecture document committed
- [ ] DeepSeek A/B test results

---

## Sunday 2026-05-03

### Founder (~10 min)
- Approve brand name + domain
- Approve Plutopath integration spec
- Approve Twitter strategy

### Agent work

#### DevOps + CTO
- Domain registered
- DNS to Render
- Stub Next.js apps deployed (web + worker)

#### Frontend Engineer
- Stub landing page (hero + email capture + free journal CTA)
- Brand book v1 styling applied

#### Backend Engineer
- Resend domain verify
- Supabase RLS policies (users only see own trades)
- Initial seed data for testing

#### Compliance Reviewer
- Refine compliance docs based on McKinsey + YC critique
- Approve Saturday/Sunday public-facing copy

#### Brand/Design
- Brand book v1 (anti-guru aesthetic)
- Logo wordmark v1
- Visual identity

#### Head of Growth
- First Reddit comment in r/Daytrading (helpful, no link)
- First Twitter post draft for founder approval

### Sunday EOD checklist
- [ ] Domain live with HTTPS
- [ ] Stub landing page live
- [ ] Brand book v1 + logo committed
- [ ] Compliance docs v2 committed
- [ ] First Reddit engagement
- [ ] Twitter post drafted (founder approval pending)

---

## Monday 2026-05-04

### Daily standup (9 AM ET)

#### Frontend Engineer
- Free journal trade entry form scaffold
- Trade list view scaffold

#### Backend Engineer
- Trade CRUD endpoints
- Initial metrics computation (win rate, avg R)

#### DevOps Engineer
- Sentry integration (with Plutopath-write-attempt alert rule)
- UptimeRobot configured

#### QA Engineer
- Smoke test of stub landing page
- Test plan for trade entry → metrics flow

#### Head of Growth
- 5 helpful Reddit comments
- Twitter post (after founder approval)

#### CEO
- Compile standup
- Identify decisions for founder

#### Compliance Reviewer
- Audit landing page after Frontend's polish

---

## Tuesday 2026-05-05

#### Frontend Engineer
- Trade entry form complete (date, instrument, side, prices, R-multiple,
  setup tags, notes)
- Trade list working (sortable)

#### Backend Engineer
- Equity curve endpoint
- Win rate by setup tag endpoint
- CSV export endpoint

#### Head of Growth
- 5 more Reddit comments
- First TikTok video script (Compliance approves)

#### Brand/Design
- TikTok template designed
- Email template designed

---

## Wednesday 2026-05-06

#### Frontend Engineer
- Equity curve chart (Recharts)
- Win rate by setup tag chart
- Mobile responsive polish

#### Backend Engineer
- Stripe products created (Edge Scanner $29, Pro Edge $99)
- Stripe checkout session endpoint
- Webhook handler scaffold

#### Compliance Reviewer
- Review Stripe checkout copy
- Review subscription confirmation email

#### Head of Growth
- First TikTok video posted
- 5 more Reddit comments
- Pin landing page to Reddit profile bio

#### McKinsey Advisor
- Mid-week pulse: are we on track for free journal launch by EOW?
- Critique posted

---

## Thursday 2026-05-07

#### Frontend Engineer
- Subscription management UI (cancel, update card)
- Edge Scanner UI scaffold (locked to free users)

#### Backend Engineer
- Stripe webhook handler complete (subscription created, cancelled,
  updated)
- Subscription state sync to user table
- Idempotent webhook handling

#### Backend Engineer (CRITICAL)
- Plutopath integration scaffold:
  - Background worker daily cron stub
  - HTTPS GET to Plutopath endpoint (using founder-provided URL)
  - Response validation (aggregate + lagged check)
  - Sentry alert rule for Plutopath write attempts

#### QA Engineer
- End-to-end test: signup → log trade → see metrics
- Smoke test Stripe checkout (test card)
- Smoke test Stripe webhook (signature-verified)
- Smoke test free user CANNOT access Edge Scanner

#### Brand/Design
- Welcome email sequence designed (5 emails)
- Customer testimonial display template (with "results not typical")

---

## Friday 2026-05-08 — End of Week 1

### Daily standups

### CEO (mid-day)
- Week 1 retrospective
- Week 2 plan draft

### Chief Accountant (afternoon)
- Friday P&L review
- Cross-company summary

### Compliance Reviewer (afternoon)
- Weekly audit of all public-facing pieces shipped
- Risk assessment (LOW/MEDIUM/HIGH)
- Recommendations for Week 2

### McKinsey + YC Advisors
- Weekly reviews

### Founder (Friday evening, ~10 min)
- Read summaries
- Approve Week 2 plan
- **CRITICAL: spot-check Plutopath integration spec** — confirm
  endpoint works as designed (15-min lag, aggregate-only, read-only)

---

## Week 1 success criteria

By EOD Friday 2026-05-08:

### Engineering
- [x] Web service + worker live
- [x] Free journal trade entry + metrics functional
- [x] Stripe checkout + webhook integrated (test mode OK if KYC pending)
- [x] Plutopath integration scaffold ready (real signals start Week 2)
- [x] All security tests passing

### Compliance
- [x] Compliance framework documented and committed
- [x] Every public-facing piece reviewed and approved
- [x] Disclaimer plumbing baked into layout (impossible to forget)
- [x] No "buy/sell/recommend" language anywhere

### Marketing
- [x] Landing page live with HTTPS
- [x] First Reddit organic engagement (15+ helpful comments)
- [x] First TikTok video posted
- [x] Twitter post under founder's handle (founder approved)
- [x] Brand book v1 committed

### Spend
- [x] Cumulative spend < $30 (Saturday provisioning + minimal infra)

---

## Week 2 preview

- Plutopath signal feed live (lagged, aggregate)
- Edge Scanner paid tier launches
- Email nurture sequence active
- 5+ TikTok videos
- 30+ Reddit comments accumulated
- 30+ free journal signups
- First (test) paid subscription via own dogfooding

Detail in `plans/week-2026-05-09.md` (CEO writes Sunday).
