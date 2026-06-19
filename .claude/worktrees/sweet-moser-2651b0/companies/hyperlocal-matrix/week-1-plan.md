# Hyperlocal Matrix — Week 1 Day-by-Day Plan

**Week of 2026-05-02 (Saturday) through 2026-05-08 (Friday)**

Note: This is the largest engineering company. Week 1 focuses on
infrastructure + compliance + outreach research. The actual app
ships in week 4.

---

## Saturday 2026-05-02 — Provisioning + Foundations

### Founder (~2-3 hours, one-time)
1. Create Gmail (`hyperlocal.matrix@gmail.com`)
2. Cloudflare register 1 domain (after Brand approves Saturday afternoon)
3. Render: 1 web service + 1 background worker
4. Stripe account create + KYC verify + Connect Express application
5. Mapbox signup, generate API key
6. Resend signup + domain verify
7. NCMEC platform registration (Legal Compliance writes; founder signs)

### Agent Team (parallel)

#### CEO (Opus 4.7)
- Read all required files
- Post Week 1 plan
- Identify decisions for founder

#### Brand/Design (V4-Pro)
- **DELIVERABLE BY 2 PM:** 3-5 brand name proposals
- Mood boards for visual direction
- Avoid signaling "anonymous = adult/dating" (legal positioning)

#### Legal Compliance Watcher (Opus 4.7)
- **CRITICAL deliverables Saturday:**
  - `compliance/terms-of-service.md` v1
  - `compliance/privacy-policy.md` v1
  - `compliance/moderation-policy.md` v1
  - `compliance/incident-response-playbook.md` v1
  - `compliance/state-by-state-rules.md` (NC + 5 expansion candidates)
- These MUST exist before any public-facing surface goes live

#### Community Moderator (V4-Pro)
- Draft `moderation/policy.md` (banned categories, watch list,
  allowed content, workflow, escalations)
- Draft pre-screen prompt template for LLM moderation
- Coordinate with Legal Compliance on alignment

#### CTO (Opus 4.7 review, V4-Pro execution)
- Architecture decision document (`tech-plan/architecture.md`)
- Tech stack decisions documented
- Sprint plan for Week 1-4

#### Frontend Engineer (V4-Pro)
- Next.js 14 project structure (Tailwind, TypeScript strict)
- Component library scaffolding

#### Backend Engineer (V4-Pro)
- Once Supabase keys in `.env`: create `hyperlocal_matrix` schema
- Initial RLS policies (anonymous user identity protection is critical)
- Supabase Realtime enabled

#### DevOps Engineer (V4-Pro)
- Verify Render MCP works
- Plan deploy pipeline

#### QA Engineer (V4-Pro)
- Initial smoke test plan: `qa/smoke-test-plan.md`
- Critical path scenarios documented

#### Sales & Partnership (V4-Pro)
- Begin Plaza Midwood + NoDa + South End business research
- Goal: 500+ businesses identified by Sunday across 3 neighborhoods
  with LinkedIn URLs + decision-maker info

#### Head of Growth (V4-Pro)
- Charlotte SEO landscape: long-tail keywords for hyperlocal app
- Plan Reddit r/Charlotte engagement strategy

#### Chief Accountant (V4-Pro)
- Verify API keys
- DeepSeek discount confirmation
- Open ledger: $0 spent, $500 cap, weekly burn target $80
- Coordinate with NT Channel Chief Accountant on shared LinkedIn Sales
  Nav allocation

#### McKinsey + YC Advisors (Opus 4.7)
- Initial critique posts (300 words each)
- McKinsey focus: "What's the dumbest thing this anonymous-platform
  plan is about to do?"
- YC focus: "What scrappy thing would I do this weekend if I were
  founder of a hyperlocal app?"

### Saturday EOD checklist
- [ ] All API keys provisioned and verified
- [ ] Brand names approved by founder Saturday night
- [ ] Compliance docs v1 committed (ToS, Privacy, Moderation, Incident
      Response, State Rules)
- [ ] Moderation policy v1 committed
- [ ] Architecture decision document committed
- [ ] 500+ Charlotte business prospects identified
- [ ] DeepSeek A/B test results

---

## Sunday 2026-05-03

### Founder (~10 min)
- Approve brand name + domain
- Approve compliance docs (high level, McKinsey + Legal Compliance
  refine)
- Approve initial outreach templates

### Agent work

#### DevOps + CTO
- Register domain
- DNS to Render
- Deploy stub Next.js apps for both web service + worker

#### Frontend Engineer
- Stub landing page (hero + waitlist form for users + business preview
  CTA)
- Brand book v1 styling applied

#### Backend Engineer
- Resend domain verify (SPF, DKIM via Cloudflare)
- Supabase RLS policies for anonymous user table
- Initial seed data for testing

#### Legal Compliance Watcher
- Refine compliance docs based on McKinsey + YC critique
- Approve outreach templates from Sales & Partnership

#### Community Moderator
- Refine policy.md based on Legal Compliance review
- Document moderation pipeline expectations for Backend Engineer

#### Sales & Partnership
- Submit outreach templates (B1 LinkedIn DM, B2 cold email, AI-V1
  voice script) to Legal Compliance + Brand for review
- Once approved: send first 25 LinkedIn DMs (Sunday afternoon, low
  volume to test deliverability)

#### Brand/Design
- Brand book v1
- Logo wordmark v1
- Visual identity committed

#### Head of Growth
- Reddit r/Charlotte first comment posted (helpful, no link, no mention
  of platform yet — pure trust-building)

### Sunday EOD checklist
- [ ] Domain live with HTTPS
- [ ] Stub landing page live
- [ ] Brand book v1 + logo committed
- [ ] Compliance docs v2 (refined) committed
- [ ] Outreach templates approved by Legal Compliance + Brand
- [ ] First 25 LinkedIn DMs sent
- [ ] First Reddit r/Charlotte engagement

---

## Monday 2026-05-04

### Daily standup (9 AM ET)

#### Engineering team (CTO leads)

**Frontend Engineer:**
- Anonymous signup form wireframe (no submit yet)
- Username generator function (random adjective-noun-number patterns)

**Backend Engineer:**
- Anonymous user signup endpoint (no Stripe Identity yet, just
  random username + token)
- User session management

**DevOps Engineer:**
- Sentry integration for both services
- UptimeRobot monitors set up

**QA Engineer:**
- Test plan for anonymous signup flow
- Manual smoke test on stub landing page

#### Sales & Partnership
- 50 more LinkedIn DMs (cumulative 75)
- Track replies in CRM
- First cold email batch via Apollo (50 emails to test deliverability)

#### Head of Growth
- Reddit engagement (5 helpful comments)
- Charlotte SEO baseline measurement

#### CEO
- Compile Monday standup
- Identify decisions for founder

#### Chief Accountant
- Daily spot-check
- Yellow alert if cumulative >$30 by today

---

## Tuesday 2026-05-05

#### Engineering team

**Frontend Engineer:**
- Anonymous signup form connected to backend
- Browse-channels read-only UI placeholder

**Backend Engineer:**
- Channels table populated with seed data (placeholder Plaza Midwood
  channels)
- Initial geofencing logic (lat/long radius matching)

**DevOps:**
- Auto-deploy on push to main configured

**QA:**
- Smoke test Anonymous signup → see seed channels (not posting yet)

#### Sales & Partnership
- 50 more LinkedIn DMs (cumulative 125)
- 50 more cold emails (cumulative 100)
- Compile reply rate Day 2 vs Day 1

#### Brand/Design
- App UI design system v1 (consistent components for engineering)
- Verification flow UI mockups (Stripe Identity)

---

## Wednesday 2026-05-06

#### Engineering team

**Frontend Engineer:**
- Verification flow UI scaffolding (waiting on Stripe Identity backend)
- Channel browse UI improvements

**Backend Engineer:**
- Stripe Identity integration v1 (verification template, webhook
  handler, $0 hold flow)
- User can complete verification on test environment

**DevOps:**
- Stripe webhook routing configured
- Sentry alert rules for critical errors

**QA:**
- Test verification flow end-to-end (test card → 18+ confirmed →
  user can post status)

#### Sales & Partnership
- 50 more LinkedIn DMs (cumulative 175)
- 75 more cold emails (cumulative 175)
- AI voice script tested with 5 test calls (founder can review
  recordings)

#### McKinsey Advisor
- Mid-week pulse: are engineering velocity + outreach pacing on track?
- Post critique

---

## Thursday 2026-05-07

#### Engineering team

**Frontend Engineer:**
- Posting UI (gated on verification status)
- Real-time chat scaffold (using Supabase Realtime)

**Backend Engineer:**
- Posting endpoint with LLM pre-screen integration
- Moderation flag queue table + endpoint

**DevOps:**
- Background worker deployed for cron jobs (mod queue summarizer,
  trial-end reminders)

**QA:**
- Smoke test: verified user posts → LLM screens → publishes
  (or flags)

#### Community Moderator
- Test mod queue on synthetic flagged messages
- Refine pre-screen prompt for better accuracy

#### Sales & Partnership
- 50 more LinkedIn DMs (cumulative 225)
- 75 more cold emails (cumulative 250)
- Begin AI voice follow-ups on warm replies (10 calls)

---

## Friday 2026-05-08 — End of Week 1

### Daily standups

### CEO (mid-day)
- Week 1 retrospective
- Week 2 plan draft

### Chief Accountant (afternoon)
- Friday P&L review
- Cross-company summary

### McKinsey + YC Advisors
- Weekly reviews
- Specific focus: outreach pacing + engineering velocity

### Founder (Friday evening, ~15-20 min — slightly more this week
because of company complexity)
- Read summaries
- Approve Week 2 plan
- Make any escalated decisions

---

## Week 1 success criteria

By EOD Friday 2026-05-08:

### Infrastructure & compliance
- [x] Web service + worker live with HTTPS
- [x] Compliance docs v2 committed and approved
- [x] Brand book v1 committed
- [x] Architecture decision documented
- [x] Stripe Identity integration functional (test environment)
- [x] Anonymous user signup flow working

### Engineering velocity
- [x] Daily standups discipline established (no agent-to-agent debate
      threads)
- [x] Engineering team token usage <$50 for the week

### Outreach baseline
- [x] 225+ LinkedIn DMs sent
- [x] 250+ cold emails sent
- [x] 10+ AI voice warm follow-ups
- [x] CRM populated with replies

### Compliance
- [x] No legal escalations
- [x] No content policy violations in test environment
- [x] No PII leaks in agent-accessible logs

### Spend
- [x] Cumulative spend < $80 (well under $500 cap; outreach tools
      driving most cost)

---

## Week 2 preview

- Real-time chat working (verified users can post + see messages in
  geo channels)
- Business signup flow + Stripe Connect Express
- 400+ LinkedIn DMs cumulative
- 500+ cold emails cumulative
- First trial business signup

Detail in `plans/week-2026-05-09.md` (CEO writes Sunday Friday-Saturday).
