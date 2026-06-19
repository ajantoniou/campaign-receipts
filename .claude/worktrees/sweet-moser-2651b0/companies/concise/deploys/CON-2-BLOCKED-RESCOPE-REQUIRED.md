# CON-2 Status: BLOCKED — Rescope Required After SEALED Pivot

**Issue:** CON-2 Initial infrastructure provisioning
**Status:** BLOCKED (was in_review)
**Blocker owner:** Founder (Alex)
**Date:** 2026-05-03 17:03 ET

---

## Why CON-2 Is Blocked

CON-2 was scoped **pre-pivot** (Stripe + Resend payment/email stack). The **SEALED launch pivot** (2026-05-03 afternoon) changed the tech stack:

| Component | Pre-Pivot | Post-Pivot |
|---|---|---|
| Payment | Stripe (CON-2.4/2.5 E2E test) | Lemon Squeezy (CON-25) |
| Email | Resend (CON-2.5 email delivery) | Mailchimp (CON-27) |
| Status | In-Progress | **Blocked** |

**Result:** Most of CON-2's Phase 2 acceptance criteria are now superseded by the pivot.

---

## What's Still Valid in CON-2

✅ **Supabase schema** (7 tables)
- Committed: `8ae4fd2` + `migrations/002-concise-schema.sql`
- Status: Complete, queryable

✅ **App stub** (Coming Soon landing page + email capture API)
- Committed: `companies/concise/app/` + `app/sealed/`
- Status: Complete, code ready for deployment

---

## What's Superseded (No Longer CON-2 Work)

❌ **CON-2.4: Stripe webhook configuration**
- Now: CON-25 (Lemon Squeezy payment setup)
- Owner: CTO (once founder sets up LS account)

❌ **CON-2.5: Stripe E2E test** (purchase → order created → email sent)
- Now: CON-25 + CON-27 (payment + email integration)
- Owner: CTO (once founder provides LS + Mailchimp keys)

---

## What's Unverified (Blocker)

⏳ **CON-2.3: Render deployment**
- **Issue:** No evidence the Render service for Concise actually exists
- **Assumption made by CON-30:** "Render auto-deploys from main" (but never verified service ID, public URL, or hook)
- **Blocker:** Render MCP workspace is unselected — founder hasn't connected this monorepo to a Render team yet
- **Impact:** Can't verify app is live; can't test landing page

---

## Founder Unblock Actions (Two Items, ~10 Min Total)

### Action 1: Confirm or Create Render Service

**What to do:**
1. Open https://dashboard.render.com
2. Check: Is there an existing `concise` Web Service pointed at this repo?
   - If **yes**: Post the service ID (e.g., `srv_...`) and public URL (e.g., `https://concise-abc123.onrender.com`) in this thread
   - If **no**: Create one:
     - Name: `concise`
     - Runtime: Node.js
     - Root directory: `companies/concise`
     - Build command: `npm install && npm run build`
     - Start command: `npm start`
     - Branch: `main`
     - Auto-deploy: Yes
     - Post the service ID + public URL once created

**Alternative (faster):**
- Grant Claude/MCP access to your Render workspace:
  - Render account → Settings → API Keys → Create key
  - Share the key in this thread
  - I'll list services directly via MCP + verify Concise service exists

**Why this matters:** Without confirmation, I can't verify the app is actually live or that auto-deploy is working.

### Action 2: Confirm Rescope

Reply with **one** of the following:

**Option A: `rescope: confirmed`**
- I will update CON-2 acceptance criteria to **drop CON-2.4/2.5 Stripe items** (those are now CON-25)
- New acceptance criteria: Supabase schema ✅ + app stub ✅ + Render service live + landing page 200 OK
- Once you post Render service ID in Action 1, I'll close CON-2 as done

**Option B: `keep stripe`**
- Keep original CON-2 spec (Stripe webhook + E2E test still in scope)
- I'll create **two separate child issues** for Stripe work:
  - CON-2.X: Stripe webhook configuration (blocked on CON-25 completion)
  - CON-2.Y: Stripe E2E test (blocked on CON-25 + CON-27 completion)
- These will require founder to pick up Stripe provisioning again (separate from Lemon Squeezy)

---

## Current Acceptance Criteria (Awaiting Rescope)

**If rescope confirmed:**
- [x] Supabase schema created (7 tables, indices)
- [x] App stub created (Coming Soon page + email API)
- [ ] Render service confirmed live (service ID + public URL posted)
- [ ] Landing page returns 200 OK (GET / test)
- [ ] Git commit: "CON-2: Infrastructure provisioning complete; schema + stub + Render verified"

**If keep stripe:**
- [x] Supabase schema created (7 tables, indices)
- [x] App stub created (Coming Soon page + email API)
- [ ] Render service confirmed live (service ID + public URL posted)
- [ ] Landing page returns 200 OK (GET / test)
- [ ] Stripe webhook configured (child issue, blocked on CON-25)
- [ ] Stripe E2E test passing (child issue, blocked on CON-25 + CON-27)

---

## Why This Is Blocked, Not In-Review

`in_review` implies CEO sign-off is the only remaining gate. That's not accurate. There are **two founder-action gates** above it:
1. Render service confirmation (unblock CON-2.3)
2. Rescope confirmation (unblock acceptance criteria update)

Per `.claude/CLAUDE.md`, blocking with named unblock owner + action is the accurate state.

---

## Timeline

| Action | Owner | Timeline |
|---|---|---|
| Action 1: Render service confirmation | Founder | Now |
| Action 2: Rescope confirmation | Founder | Now |
| CON-2 closure (once both confirmed) | CTO | <5 min after founder responds |

---

## Next Action

**Founder:** Reply in this thread with:
1. Render service ID + public URL (or grant MCP access)
2. Rescope direction (confirmed / keep stripe)

**CTO:** Standby. Once both confirmed, I will:
- Update CON-2 acceptance criteria
- Verify Render service live (curl landing page)
- Close CON-2 with final commit

---

**Status: BLOCKED — Awaiting founder responses on Actions 1 & 2**

*Documented by CEO triage — 2026-05-03 17:03 ET*
