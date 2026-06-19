# CON-15 Approval Gate — Domain Decision Required

**Issue:** CON-15 SEALED landing page — domain decision + scaffolding plan
**Plan Document:** `companies/concise/eng/sealed-landing-plan.md` (COMMITTED)
**Commit:** `15b9917` (2026-05-03 10:30 ET)
**Status:** ⏳ AWAITING FOUNDER APPROVAL

---

## Decision Point: Domain Recommendation

**Plan recommends:** `sealed.concise.enterprises` (subdomain)

### CTO → Founder Action Request

**Decision:** Approve subdomain (`sealed.concise.enterprises`) OR reject in favor of fresh domain?

**CTO recommendation:** Subdomain — $0 cost, 5-min DNS, email deliverability + trust transfer

**If approved:**
1. CTO configures Cloudflare DNS (CNAME to Render) — 5 min
2. SSL auto-issued by Render — 10 min
3. Unblocks: CON-15 build tasks (awaiting CON-14 copy lock)

**If rejected (fresh domain):**
1. Founder purchases domain (~$12-15/year + Whois privacy)
2. CTO configures DNS + Render pointing — 15 min
3. Timeline impact: +24-48h (domain registration + propagation)
4. Cost impact: +$50/year (within budget, but deferred)

---

## Execution Roadmap (Once Domain Approved)

### Phase 1: Infrastructure Setup (CTO, 30 min)
- [ ] Cloudflare DNS: Create `sealed.concise.enterprises` CNAME → Render
- [ ] Render: Confirm SSL certificate issued
- [ ] Test: `curl https://sealed.concise.enterprises/` → 200

### Phase 2: Landing Page Build (CTO, 18.5 hours)
**Blocked by:** CON-14 subtitle + copy lock (Friday EOD)
**Timeline:** Mon-Tue (once copy locked)
**Output:** Live landing page at `sealed.concise.enterprises`

**Build tasks from plan:**
1. Header navigation (1h)
2. Hero section + background image (2h)
3. Wedge explanation (1h)
4. Sample quotes (1.5h)
5. Trust signals (1h)
6. Email capture form (1h)
7. Buy section (1.5h)
8. FAQ section (1.5h)
9. Footer (1h)
10. Layout assembly + responsive QA (2.5h)

### Phase 3: Email Tool Setup (CTO + Mailchimp, parallel)
**When:** Once email list reaches 50+ subscribers (post-launch)
**Setup:** Mailchimp free tier + Zapier sync to Supabase
**Cost:** $0 (Phase 1), $20/mo (Phase 2 if list >500)

### Phase 4: Stripe Integration (CON-17 child issue, Week 2)
**Deferred:** Not in scope for CON-15 (landing page structure only)
**Will include:** Payment links, webhooks, PDF delivery via Resend
**Timing:** After email drip (CON-16) is drafted and deployed

---

## Blockers & Dependencies

### No blockers for CON-15 plan approval
- ✅ All infrastructure configured (Render, Supabase, Cloudflare)
- ✅ All credentials available in `.env`
- ✅ All cost estimates verified

### Soft dependencies (don't block plan, optimize execution)
- **CON-14 (Brand/Design):** Locks subtitle + copy (Friday EOD)
- **CON-16 (Growth):** Drafts email sequence (parallel, can start now)

---

## Next Action for Each Role

**Founder (Alex):**
- ✅ **DECISION NEEDED:** Approve `sealed.concise.enterprises` subdomain?
- ✅ **If approved:** Reply to CON-15 issue with approval
- ✅ **If rejected:** Specify preferred domain name

**CTO (once domain approved):**
- [ ] Configure Cloudflare DNS (5 min)
- [ ] Verify Render SSL (10 min)
- [ ] Await CON-14 copy lock (don't block on this, can prep components)
- [ ] Build landing page (Mon-Tue, 18.5h)
- [ ] Create CON-18 child issue (Stripe + Resend integration)

**CEO (Growth lead):**
- [x] Approved SEALED title (2026-05-03 13:25 ET)
- ✅ **Current:** Monitor CON-14 subtitle lock (Friday)
- ✅ **Current:** Approve CON-16 email sequence draft (parallel)

---

## Success Criteria

| Criterion | Status | Notes |
|---|---|---|
| Plan document committed | ✅ Done | `sealed-landing-plan.md` live |
| Domain recommendation explicit | ✅ Done | Subdomain with cost/timeline reasoning |
| Stack choice with cost | ✅ Done | Next.js on Render, $0/mo |
| Email tool recommendation | ✅ Done | Mailchimp (free → $20/mo) |
| Scaffolding plan with estimates | ✅ Done | 13 tasks, 18.5 hours |
| Founder approval gate documented | ✅ Done | This document |
| **Domain approval from founder** | ⏳ Pending | Waiting for response |
| Child issues created | ⏳ Pending | CON-18 (Stripe + Resend), will create after approval |

---

**Plan ready for founder decision. No further work on CON-15 until domain approved.**

*Report by CTO — 2026-05-03 10:35 ET*
