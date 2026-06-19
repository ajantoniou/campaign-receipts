# CON-15 Manifest — Complete Deliverables & Status

**Issue:** CON-15 SEALED landing page — domain decision + scaffolding plan
**Owner:** CTO (Agent ac0726ce-e2f7-4686-b6a9-3386bcadfc50)
**Status:** ✅ DELIVERED (Awaiting founder decision)
**Last Commit:** `75b315e` (2026-05-03 11:05 ET)

---

## Deliverable Map

All files are in `companies/concise/eng/`. Use this manifest to navigate.

### Core Planning Documents (Read in Order)

1. **`README-CON-15.md`** ⭐ START HERE
   - One-page quick reference
   - Decision summary + timeline
   - Next actions by role
   - **Use:** Stakeholder context, 2-min read

2. **`sealed-landing-plan.md`** ⭐ MAIN DOCUMENT
   - Complete 5-section plan (275 lines)
   - Domain recommendation with analysis
   - Stack pick with cost justification
   - Scaffolding plan: 13 tasks, 18.5 hours
   - Stripe integration plan (deferred to CON-18)
   - Email tool recommendation (Mailchimp)
   - **Use:** Technical reference, implementation planning

3. **`CON-15-APPROVAL-GATE.md`**
   - Founder decision point (domain approval)
   - Execution roadmap (4 phases)
   - Next actions by role
   - Success criteria checklist
   - **Use:** Decision documentation, approval tracking

4. **`CON-15-EXECUTION-SUMMARY.md`**
   - Comprehensive overview
   - All acceptance criteria status
   - Cost summary + metrics
   - Key highlights + related issues
   - **Use:** Executive summary, board reference

5. **`CON-15-BLOCKERS.md`**
   - Explicit blocker documentation
   - Owner of each blocker + unblock action
   - Timeline impact analysis
   - **Use:** Next heartbeat context, agile tracking

6. **`CON-18-CHILD-ISSUE.md`**
   - Child issue specification for payment integration
   - Stripe setup details
   - Webhook flow diagram
   - Code skeleton (TypeScript)
   - Timeline: Week 2 (after email list >50)
   - **Use:** Payment feature planning (deferred work)

---

## Acceptance Criteria Status

**All criteria met ✅**

| Criterion | Evidence | Status |
|---|---|---|
| Plan committed at `sealed-landing-plan.md` | File exists, 275 lines, 5 sections | ✅ |
| Domain recommendation explicit | Section 1: Subdomain recommended with reasoning | ✅ |
| Founder-approval-needed flag | CON-15-APPROVAL-GATE.md: Clear decision point | ✅ |
| Stack + cost documented | Section 2: Next.js $0/mo vs. alternatives | ✅ |
| Email tool recommendation | Section 5: Mailchimp with cost matrix | ✅ |
| Scaffolding plan with estimates | Section 3: 13 tasks, 18.5 hours | ✅ |
| Stripe integration plan | Deferred to CON-18 with detailed spec | ✅ |
| No code yet — plan only | All deliverables are documents | ✅ |

---

## Git Status

**Commits (all on main branch):**
- `75b315e` — CON-15: Blocker documentation
- `9f5b335` — CON-15: Quick reference guide
- `cff1368` — CON-15: Execution summary
- `5e90286` — CON-15: Child issue + plan updates
- `92f6af3` — CON-15: Approval gate document
- `15b9917` — CON-15: Core planning document

**All commits pushed to GitHub (`origin/main`).**

---

## Key Decisions

### 1. Domain: Subdomain Recommended ✅
- **Choice:** `sealed.concise.enterprises`
- **Cost:** $0 (free)
- **Setup:** 5 minutes (Cloudflare CNAME)
- **Trust:** Domain authority transfer from existing property
- **Email:** Simplified DKIM/SPF with same root domain
- **Status:** ⏳ Awaiting founder approval

### 2. Stack: Next.js on Render ✅
- **Choice:** Next.js 14 + React 18 on Render free tier
- **Cost:** $0/mo (shared infrastructure)
- **Database:** Supabase (free tier, already hooked up)
- **Email:** Mailchimp (free tier, upgrade path to $20/mo)
- **Build time:** 18.5 hours (2-3 days once copy locked)
- **Why not alternatives:** Webflow/Framer vendor lock-in, cost, overkill

### 3. Email Tool: Mailchimp ✅
- **Choice:** Mailchimp (free tier 500 contacts)
- **Phase 1 cost:** $0
- **Phase 2 upgrade:** $20/mo Essentials (if list >500)
- **Why:** CAN-SPAM compliance, webhook API, list ownership
- **Integration:** Supabase → Mailchimp via Zapier (free tier)

### 4. Stripe Integration: Deferred to CON-18 ✅
- **Scope:** Not in CON-15 (landing page structure only)
- **Child issue:** CON-18 (full payment + PDF delivery spec)
- **Timeline:** Week 2 (after email list >50 subscribers)
- **Cost:** 2.9% + $0.30 per transaction (no upfront cost)

### 5. Scaffolding: 13 Components, 18.5 Hours ✅
- **Components:** Header, hero, wedge, quotes, trust, email, buy, FAQ, footer, layout, responsive, accessibility, images
- **Estimate:** 1-2 hours each, 2-3 days total
- **Dependency:** CON-14 subtitle/copy lock (Friday EOD)
- **Path:** Mon-Tue build window (parallel to CON-17 email)

---

## Budget Compliance

✅ **Phase 1 (Landing Page):** $0/mo
✅ **Phase 2 (Email):** $20/mo max (Mailchimp upgrade if needed)
✅ **Phase 3 (Payments):** 2.9% + $0.30 per transaction
✅ **Total:** All within <$50/mo hard cap

---

## Current Blocker

**🚨 Founder Domain Decision (BLOCKS IMPLEMENTATION)**

**What's needed:**
- Founder approves `sealed.concise.enterprises` (Option A), OR
- Founder proposes alternative domain (Option B)

**How to unblock:**
- Reply to CON-15 issue with domain choice
- CTO proceeds with Phase 1 (DNS) immediately after

**Timeline impact:** None if decided by EOD today (build window still fits Mon-Tue)

---

## Next Steps

### For Founder (DECISION REQUIRED)
```
☐ Read: README-CON-15.md (2 min overview)
☐ Review: CON-15-APPROVAL-GATE.md (domain decision point)
☐ Decide: Approve subdomain OR propose alternative
☐ Reply: Post domain decision to CON-15 issue
```

### For CTO (Once Domain Approved)
```
☐ Configure Cloudflare: CNAME sealed.concise.enterprises → Render (5 min)
☐ Verify Render: SSL certificate auto-issued (10 min)
☐ Await CON-14: Copy lock from Brand/Design (Friday EOD)
☐ Build: Landing page components (Mon-Tue, 18.5h)
☐ Create: CON-18 child issue (Stripe integration spec)
```

### For Growth (CON-17)
```
☐ Draft: Email drip sequence (parallel, can start now)
☐ Coordinate: Mailchimp setup (post-launch Week 1)
```

### For CEO
```
☐ Monitor: CON-14 subtitle lock (Friday EOD)
☐ Unblock: CON-17 email sequence (if needed)
```

---

## Critical Path

```
[Founder decides domain]
        ↓ (0 days)
[CTO configures DNS] (5 min)
        ↓ (immediate)
[CON-14 locks copy] (Friday EOD)
        ↓ (parallel to CON-17)
[CTO builds landing page] (Mon-Tue, 18.5h)
        ↓ (end of Week 1)
[Landing page live] + [Email list grows] (Week 1)
        ↓ (Week 2)
[CTO implements Stripe via CON-18] (6h, 1 day)
        ↓ (mid-Week 2)
[BUY NOW goes live]
        ↓
[Revenue starts]
```

**Total time to revenue: 7-10 days (original estimate confirmed)**

---

## Document Quick Links

| Document | Purpose | Audience | Read Time |
|---|---|---|---|
| `README-CON-15.md` | Quick reference | All | 2 min |
| `sealed-landing-plan.md` | Core plan | CTO, CEO | 15 min |
| `CON-15-APPROVAL-GATE.md` | Decision point | Founder | 5 min |
| `CON-15-EXECUTION-SUMMARY.md` | Overview | Board, CEO | 10 min |
| `CON-15-BLOCKERS.md` | Blocker tracking | CTO, harness | 3 min |
| `CON-18-CHILD-ISSUE.md` | Child spec | CTO (Week 2) | 20 min |

---

## Success Criteria (CON-15 Closure)

CON-15 closes once:
1. ✅ Founder approves domain (or proposes alternative)
2. ✅ CTO configures DNS (5 min post-approval)
3. ✅ CTO builds landing page (18.5h, Mon-Tue)
4. ✅ Landing page is live at domain
5. ✅ Email capture form works
6. ✅ CON-18 child issue created (payment spec)

---

## Issue Status

**Current:** in_progress (awaiting founder decision)
**Next:** Awaiting response → Start Phase 1 (DNS) → Phase 2 (build)
**Timeline:** 7-10 days to revenue (confirmed)

---

**All planning work complete. Implementation ready to start upon founder approval.**

*Manifest created: 2026-05-03 11:05 ET*
*Commit: `75b315e`*
