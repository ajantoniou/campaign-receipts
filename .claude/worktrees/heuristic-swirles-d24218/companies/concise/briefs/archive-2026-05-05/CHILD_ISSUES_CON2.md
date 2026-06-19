# CON-2 Child Issues — Phase 2 Execution Tasks

**Parent issue:** CON-2 Initial infrastructure provisioning
**Status:** Created (awaiting Phase 1 completion to begin execution)
**Created:** 2026-05-03 07:15 ET

---

## Overview

These child issues represent the Phase 2 (CTO) work that will execute once the founder completes Phase 1 provisioning. They are created now to clarify the work breakdown, but execution is blocked until Phase 1 signals completion.

---

## CON-2.1: Verify Infrastructure Services

**Owner:** CTO
**Status:** BLOCKED (waiting on Phase 1 completion)
**Acceptance criteria:**
- [ ] Stripe products exist (verify via Stripe API: curl with STRIPE_SECRET_KEY)
- [ ] Resend API key is valid (test email delivery)
- [ ] Domain is registered and DNS is live (curl domain)
- [ ] Cloudflare records configured (SPF/DKIM for Resend)
- [ ] Render service exists (verify dashboard + service ID)

**Estimated time:** 30 min
**Blocker:** Need STRIPE_SECRET_KEY, RESEND_API_KEY, CONCISE_DOMAIN in `.env`
**Next action:** Once Phase 1 complete, CTO runs verification curl commands and documents results

---

## CON-2.2: Create Supabase Schema

**Owner:** CTO
**Status:** BLOCKED (waiting on Phase 1 completion)
**Acceptance criteria:**
- [ ] `concise` schema created in Supabase
- [ ] `books` table created with all columns
- [ ] `customers` table created
- [ ] `orders` table created
- [ ] `email_subscribers` table created
- [ ] `bundles` table created
- [ ] `amazon_revenue_baseline` table created
- [ ] All RLS policies disabled (public schema for now)
- [ ] Tables are queryable via Supabase client

**Estimated time:** 45 min
**Dependencies:** SUPABASE_SERVICE_ROLE_KEY (already in `.env` ✅)
**Blocker:** None (can proceed immediately once Phase 1 signals)
**Next action:** Once Phase 1 complete, CTO executes schema migration script

---

## CON-2.3: Deploy Next.js Stub to Render

**Owner:** CTO
**Status:** BLOCKED (waiting on Phase 1 completion)
**Acceptance criteria:**
- [ ] Render service linked to GitHub repo (AgentCompanies)
- [ ] Build command configured: `npm run build`
- [ ] Start command configured: `npm start`
- [ ] Environment variables passed to Render service
- [ ] Auto-deploy enabled
- [ ] Service deploys successfully (no build errors)
- [ ] Service is accessible at public URL (e.g., `https://concise-abc123.onrender.com`)
- [ ] Health check endpoint responds (GET /)

**Estimated time:** 20 min
**Dependencies:**
- RENDER_API_KEY (already in `.env` ✅)
- CONCISE_DOMAIN (from Phase 1)
- STRIPE_PUBLISHABLE_KEY (from Phase 1)
- NEXT_PUBLIC_SITE_URL (will be auto-generated Render URL or custom domain)

**Blocker:** Need CONCISE_DOMAIN + STRIPE keys in `.env`
**Next action:** Once Phase 1 complete, CTO pushes Next.js code and triggers Render deploy

---

## CON-2.4: Configure Stripe Webhook

**Owner:** CTO
**Status:** BLOCKED (waiting on Phase 1 completion + Phase 2.3)
**Acceptance criteria:**
- [ ] Stripe webhook endpoint registered: `/api/stripe/webhook`
- [ ] Webhook URL is: `https://[CONCISE_DOMAIN]/api/stripe/webhook`
- [ ] Events subscribed: `payment_intent.succeeded`, `charge.dispute.created`
- [ ] Webhook secret copied from Stripe dashboard
- [ ] STRIPE_WEBHOOK_SECRET added to `.env`
- [ ] Test event successfully delivered to endpoint (verify in Stripe logs)

**Estimated time:** 15 min
**Dependencies:**
- Phase 2.3 complete (Render service live with public URL)
- STRIPE_SECRET_KEY (from Phase 1)

**Blocker:** Need live Render service URL to register webhook
**Next action:** Once Phase 2.3 complete, CTO registers webhook and tests

---

## CON-2.5: Upload Sample Data & Test End-to-End

**Owner:** CTO
**Status:** BLOCKED (waiting on Phases 2.1-2.4 complete)
**Acceptance criteria:**
- [ ] Sample book added to `books` table (test data)
- [ ] Stripe Payment Link generated for test book
- [ ] Resend email template configured
- [ ] Test purchase initiated via Stripe (use test card: 4242 4242 4242 4242)
- [ ] Webhook fires and creates order in Supabase
- [ ] PDF download link generated
- [ ] Email delivered with download link
- [ ] Test download link works (PDF is accessible)

**Estimated time:** 1 hour
**Dependencies:** All of Phase 2 (verification, schema, deploy, webhook)
**Blocker:** None after prior phases complete
**Next action:** Once all prior phases complete, CTO executes end-to-end test

---

## Execution Sequence

```
Phase 1 (Founder) — BLOCKING
  └─ Complete provisioning checklist
  └─ Add keys to .env
  └─ Post confirmation

Phase 2 (CTO) — Executes in parallel once Phase 1 signals:
  ├─ CON-2.1: Verify services (30 min)
  ├─ CON-2.2: Create schema (45 min)
  ├─ CON-2.3: Deploy Render stub (20 min)
  ├─ CON-2.4: Configure webhook (depends on 2.3, 15 min)
  └─ CON-2.5: Test end-to-end (depends on all prior, 1 hour)

Total Phase 2 time: ~2-3 hours (with parallelization where possible)
Target completion: Sunday 8:30 AM - 12 PM ET
```

---

## Blocker & Unblock Path

**Current blocker:** Phase 1 provisioning (founder)

**Unblock condition:** Founder completes all 7 sections of FOUNDER_PROVISIONING_CHECKLIST.md and adds keys to `.env`

**Unblock owner:** Founder (Alex)

**Monitoring:** CTO will check `.env` for key presence. When all required keys appear, CTO will immediately begin Phase 2 execution (starting with CON-2.1).

---

## Phase 2 Execution Trigger

Once founder posts "Phase 1 complete" or CTO detects all Phase 1 keys in `.env`, execution will proceed:

```bash
# CON-2.1: Verify services
curl -H "Authorization: Bearer $STRIPE_SECRET_KEY" \
  https://api.stripe.com/v1/products

# CON-2.2: Create schema
psql -h db.supabase.co -U postgres -d postgres \
  -c "CREATE SCHEMA concise;" \
  -c "CREATE TABLE concise.books (...);" \
  # ... rest of schema

# CON-2.3: Deploy Render
git push origin main
# Render auto-deploys via webhook

# CON-2.4: Register webhook
curl -X POST https://api.stripe.com/v1/webhook_endpoints \
  -u $STRIPE_SECRET_KEY: \
  -d url="https://$CONCISE_DOMAIN/api/stripe/webhook" \
  -d enabled_events='["payment_intent.succeeded","charge.dispute.created"]'

# CON-2.5: Test end-to-end
# Create test book, generate Payment Link, test purchase
```

---

## Success Criteria for CON-2 Phase 2 Completion

- [x] All Phase 1 items complete (founder checklist done, keys in `.env`)
- [x] All child issues (CON-2.1 through CON-2.5) marked done
- [x] Schema live in Supabase with all tables created
- [x] Render service live at public URL
- [x] Stripe webhook registered and tested
- [x] Sample data uploaded
- [x] End-to-end test passing (purchase → order created → email sent → download works)
- [x] Git commit: "CON-2: Phase 2 complete; infrastructure ready for landing pages"

---

## Notes

- Child issues are created now for clarity, but have no urgency until Phase 1 complete
- Execution is not speculative — all steps are deterministic once Phase 1 keys are provided
- No decisions needed; all technical choices are documented in TECH_PLAN.md
- CTO has no further work until Phase 1 signals completion

---

**Status:** CREATED (awaiting Phase 1 completion to begin)
**Next checkpoint:** When founder posts Phase 1 complete confirmation

*Created by CTO — 2026-05-03 07:15 ET*
