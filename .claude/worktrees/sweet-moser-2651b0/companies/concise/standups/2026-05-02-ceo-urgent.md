# CEO Urgent Flag — Saturday 2026-05-02

**Status:** BLOCKER — CON-6 (Inventory) cannot proceed without founder action

**Priority:** Critical (affects Week 1 EOD launch goal)

---

## Issue Summary

**CON-6 (Inventory existing books)** is marked critical and in_progress. Brand/Design has delivered a complete inventory template (`content/inventory.md`) with metadata structure, audience tags, and Top 3 ranking criteria.

**But:** Books are not accessible. The deliverable requires extracting metadata from 20+ PDFs + researching Amazon performance. **Cannot start without book files.**

---

## Dependency Chain

```
CON-6 (Inventory)
    ↓ blocks
CN-008 (Identify Top 3 books)
    ↓ blocks
CN-009 (Trump book cover variants)
CN-020 (Landing pages v1)
    ↓ blocks
Week 1 EOD launch goal (3 books live by Friday)
```

---

## What Founder Must Do (Saturday)

**Step 7 of FOUNDER_PROVISIONING_CHECKLIST.md — CONCISE Drive Folder Access (~10 min)**

- [ ] **Option A (recommended):** Go to Google Drive → CONCISE Reads folder
  - Right-click → Share
  - Share with CTO email address
  - Permissions: Viewer only

- [ ] **Option B:** Right-click CONCISE Reads folder → Get link
  - Set to "Viewer" (anyone with link can view)
  - Send link to CTO via Slack/email

**Outcome:** CTO downloads PDFs, uploads to Supabase Storage by Sunday morning.

**Why this is critical:** Once books land, Brand/Design can populate inventory in <2 hours (extract metadata, research Amazon, rank Top 3).

---

## Current Status

| Task | Owner | Status | Blocker |
|---|---|---|---|
| Provisioning checklist (Gmail, domain, Stripe, Resend, DB, Drive) | Founder | ❌ Not started | **CN-004: Drive access** |
| Inventory template (structure, framework, next-step checklist) | Brand/Design | ✅ Done | Waiting for books |
| Tech plan + database schema | CTO | ✅ Done | Waiting for provisioning |
| Brand name + Trump cover proposals | Brand/Design | 🟡 In progress | Waiting for founder decisions |

---

## CEO Next Actions

1. **Confirm founder ETA on provisioning.** (Goal: Saturday EOD per week-1-plan)
   - If ETA slips → adjust Week 1 timeline + flag to McKinsey/YC

2. **If founder can't complete provisioning Saturday:**
   - Identify blockers (too many tabs open? missing Stripe KYC? domain choice stuck?)
   - Offer support (CTO can help with Render setup; Brand can help with domain naming)
   - Escalate to founder with **clear time cost:** 2-3 hour delay in book launch if provisioning slips to Sunday morning

3. **Once books land (Target: Sunday 9 AM):**
   - CEO posts: "Books landed; inventory completion ETA: Sunday 2 PM"
   - CEO bundles Top 3 ranking + founder brand decisions into single Friday decision block

---

## Risk if This Slips

| Scenario | Impact | Mitigation |
|---|---|---|
| Books land Sunday evening (not morning) | Landing pages slip to Wednesday; Stripe config delayed | CEO escalates to founder Friday: must have books by Sunday 9 AM to stay on schedule |
| Founder can't decide Top 3 by Sunday | Brand can't design covers; week compresses | CEO enforces Sunday EOD decision deadline in founder calendar |
| Inventory incomplete by Sunday EOD | Monday deliverables stack: landing pages + brand book + cover redesigns all compete for bandwidth | Brand/Design pre-drafts landing page copy assuming MCAT bundle will be one of Top 3 (safe bet per vision.md) |

---

## Recommendation

**Post this in founder Slack/email immediately:**

> **Concise Week 1 Critical Path**
>
> Your provisioning step is the bottleneck for everything else. All of us are blocked on Step 7 (Drive folder share).
>
> **What you need to do Saturday (goal: by 3 PM ET so CTO can upload Sunday morning):**
> - Go to Google Drive → CONCISE Reads folder
> - Right-click → Share → share with [CTO email]
> - Permissions: Viewer only
>
> **Why:** Once we have the PDFs, Brand/Design completes inventory in 2 hours, we identify Top 3, and cover redesigns can start immediately.
>
> **If provisioning slips:** Every hour delay pushes landing pages and first sales out by ~1 day. We're aiming to ship by Friday EOD.
>
> Let me know if you hit any blockers or need help with Stripe KYC, domain choice, etc.

---

## CEO Checklist (This Heartbeat)

- [ ] Confirm founder ETA on provisioning (or identify blocker)
- [ ] If ETA is Saturday EOD → proceed to tracking Phase 1 timeline
- [ ] If ETA is Sunday morning → adjust Week 1 plan, flag to McKinsey/YC
- [ ] Post standup: "Waiting on founder Drive access to unlock inventory + downstream tasks"

---

**Status:** CON-6 is **READY TO EXECUTE** the moment books arrive. No re-planning needed. Just need founder to complete 10-minute task.

**Next check:** Sunday 9 AM (assume books uploaded; inventory completion by 2 PM same-day).
