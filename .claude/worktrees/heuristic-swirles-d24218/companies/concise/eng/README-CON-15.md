# CON-15: SEALED Landing Page Plan — Quick Reference

**Status:** ✅ PLAN DELIVERED | ⏳ Awaiting founder domain approval
**Commit:** `cff1368` (2026-05-03 10:50 ET)
**Owner:** CTO

---

## 📋 What Was Delivered

**4 planning documents** (all committed to git, no code):

1. **`sealed-landing-plan.md`** — Core 5-section plan (domain, stack, scaffolding, Stripe, email tool)
2. **`CON-15-APPROVAL-GATE.md`** — Founder decision point + execution roadmap
3. **`CON-18-CHILD-ISSUE.md`** — Child issue spec for payment integration (Week 2)
4. **`CON-15-EXECUTION-SUMMARY.md`** — Overview + acceptance criteria checklist

**All files:** `companies/concise/eng/`

---

## ✅ All Acceptance Criteria Met

| Criterion | Status | Detail |
|---|---|---|
| Plan at `sealed-landing-plan.md` | ✅ | 275 lines, all 5 sections |
| Domain recommendation explicit | ✅ | Subdomain with cost/timing reasoning |
| Founder-approval-needed flag | ✅ | Clear in approval gate doc |
| Stack + cost documented | ✅ | Next.js $0/mo vs. Webflow/Framer rejected |
| Email tool recommendation | ✅ | Mailchimp ($0→$20/mo) |
| Scaffolding plan + estimates | ✅ | 13 tasks, 18.5 hours |
| No code yet — plan only | ✅ | All deliverables are documents |

---

## 🎯 Quick Decisions

### Domain
- **Recommendation:** `sealed.concise.enterprises` (subdomain)
- **Cost:** $0 (free)
- **Setup time:** 5 minutes (Cloudflare DNS)
- **Status:** ⏳ Awaiting founder approval

### Stack
- **Pick:** Next.js 14 on Render (existing free tier)
- **Cost:** $0/mo (shared infrastructure)
- **Build time:** 18.5 hours (2-3 days)
- **Why not Webflow/Framer:** Vendor lock-in, cost, overkill for scope

### Email Tool
- **Pick:** Mailchimp
- **Phases:** Free tier (Phase 1) → Essentials $20/mo (Phase 2 if list >500)
- **Why:** CAN-SPAM custom domain, webhook API, list ownership

### Stripe Integration
- **Status:** Deferred to CON-18 (child issue, Week 2)
- **Why:** Landing page structure first, payment after email list >50

---

## 📅 Timeline

| Phase | Owner | Duration | Status |
|---|---|---|---|
| **Domain approval** | Founder | 1 day | ⏳ Pending |
| **DNS setup** | CTO | 5 min | Ready (blocked on domain approval) |
| **CON-14 copy lock** | Brand/Design | Friday EOD | In progress |
| **Landing page build** | CTO | 18.5h (Mon-Tue) | Ready (blocked on copy lock) |
| **Email sequence draft** | Growth (CON-17) | 3-5 days | In progress (parallel) |
| **Stripe setup (CON-18)** | CTO | 6 hours (Week 2) | Planned |
| **Revenue launch** | All | Week 1-2 | Tracking |

**Total to revenue:** 7-10 days (confirmed with original timeline)

---

## 💰 Cost Summary

| Component | Phase 1 | Phase 2+ | Notes |
|---|---|---|---|
| **Hosting (Render)** | $0 | $0 | Shared free tier |
| **Database (Supabase)** | $0 | $0 | Shared free tier |
| **Email (Mailchimp)** | $0 | $20/mo | Upgrade if list >500 |
| **Payments (Stripe)** | $0 | 2.9% + $0.30 | Only on revenue |
| **TOTAL** | **$0** | **$20-50/mo** | Compliant |

---

## 🚀 Next Actions

### Founder
```
☐ Review domain recommendation (sealed.concise.enterprises)
☐ Approve domain OR propose alternative
☐ Reply to CON-15 issue
```

### CTO (once approved)
```
☐ Configure Cloudflare DNS (5 min)
☐ Verify Render SSL (10 min)
☐ Build landing page (18.5h, Mon-Tue)
☐ Create CON-18 child issue (Stripe)
```

### Growth (CON-17)
```
☐ Draft email sequence (parallel, start now)
☐ Coordinate Mailchimp setup (post-launch)
```

---

## 📚 Document Map

```
companies/concise/eng/
├── sealed-landing-plan.md         [START HERE — core 5-section plan]
├── CON-15-APPROVAL-GATE.md        [Decision point + execution roadmap]
├── CON-18-CHILD-ISSUE.md          [Child issue: payment integration]
├── CON-15-EXECUTION-SUMMARY.md    [Overview + acceptance criteria]
└── README-CON-15.md               [This file — quick reference]
```

---

## ✨ Key Highlights

✅ **$0 cost** for landing page (everything on existing free tier)
✅ **5-min DNS setup** once domain approved
✅ **18.5 hours** to live landing page (2-3 days)
✅ **Clear approval gate** (founder decision on domain)
✅ **No surprises** (all costs + timelines documented)
✅ **Payment deferred** (launched Week 2 after email list grows)
✅ **Faceless + pseudonym** (compliant with hard rules)

---

## 🔗 Related Issues

- **CON-12:** Book rebranding (approved title: SEALED)
- **CON-14:** Subtitle finalization ("Before the Deals" — locked)
- **CON-17:** Email drip sequence (Growth, parallel)
- **CON-18:** Payment + PDF delivery (CTO, Week 2)

---

**Plan ready for implementation. Awaiting founder domain approval to proceed.**

*CTO — 2026-05-03 10:50 ET*
