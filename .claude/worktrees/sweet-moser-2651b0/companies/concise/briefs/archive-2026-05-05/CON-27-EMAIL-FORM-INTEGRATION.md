# CON-27 — Email Form Integration & Automation

**Status:** `todo`
**Priority:** high
**Blocker:** CON-20 (landing page) — backend integration pending
**Owner:** CTO + Growth (CON-17)
**Created:** 2026-05-03 (from CEO review comment on CON-20)

---

## Objective

Complete email form integration to enable list-building automation. Currently, email capture form on SEALED landing page collects emails but doesn't trigger downstream automation (welcome email, drip sequence, etc.).

## Current State (CON-20)
- Email form: `/app/sealed/email-form.tsx`
- Backend: `/app/api/email/subscribe/route.ts`
- Database: Supabase `email_subscribers` table
- Status: Emails collected but NOT sent to email platform

## Scope

### Phase 1: Supabase Backend (CTO)
**What's Done:**
- Email form captures email + name
- Stores in Supabase via `/api/email/subscribe`
- Source tracking: `source_book_id='sealed'`

**What's Missing:**
1. **Webhook from Supabase → Mailchimp/Substack**
   - Trigger: New row in `email_subscribers` with source='sealed'
   - Action: Add subscriber to Mailchimp/Substack list
   - Retry logic for failed submissions

2. **Double opt-in flow (optional)**
   - Send confirmation email to new subscriber
   - Only add to list after confirmation click
   - Better deliverability + compliance

3. **Error handling & logging**
   - Log failed sync attempts
   - Alert if webhook fails 3× in a row

### Phase 2: Email Platform Setup (Growth / CON-17)
**What's Done:**
- CON-12 defines 10-week drip sequence (50 emails, 1 per weekday)

**What's Missing:**
1. **Create Mailchimp/Substack list**
   - List name: "SEALED Early Readers" (or similar)
   - Field mapping: email, first_name, source_book_id
   - Welcome email: "Intro + First 10 Quotes" (from free email capture)

2. **Import drip sequence emails**
   - 50 daily emails (weekdays only)
   - Structure:
     - Day 1: Welcome + Week 1 intro
     - Day 2-6: Foreign Policy quotes (5 emails)
     - Day 7: Transition email
     - Days 8-11: Trade & China (5 emails)
     - ... (continues through Week 10)

3. **Set up automation triggers**
   - Trigger 1: Welcome email on sign-up (immediate)
   - Trigger 2: Drip sequence (starts Day 1 after welcome)

4. **Configure CTAs**
   - Each email: Link to `/sealed` (hero landing page)
   - Buy CTA: $22 or $27 checkout links
   - Share CTA: Social share button (optional)

### Phase 3: Testing (CTO + Growth)
1. Submit test email via form
2. Verify Supabase captures email
3. Verify webhook triggers (check logs)
4. Verify Mailchimp receives subscriber
5. Verify welcome email sent
6. Verify drip sequence starts
7. Verify all CTAs work

## Acceptance Criteria
- [ ] Supabase webhook configured
- [ ] Mailchimp/Substack list created
- [ ] 50 drip sequence emails imported
- [ ] Welcome email sent on sign-up
- [ ] Drip sequence starts after welcome
- [ ] All links + CTAs functional
- [ ] Test email flows end-to-end
- [ ] Monitoring + alerting in place

## Dependencies
- **Blocker:** Growth (CON-17) must finalize email copy
- **Related:** CON-20 (landing page), CON-17 (email sequence)

## Estimates
- Supabase webhook: 45 min (CTO)
- Mailchimp list creation: 20 min (Growth)
- Email import: 30 min (Growth)
- Automation setup: 30 min (Growth)
- Testing: 30 min (CTO + Growth)
- **Total:** ~2.5 hours

## Timeline
- **Parallel:** Can start once CON-17 finalizes email copy
- **Blocking:** Email form won't work until webhook configured

## Architecture

```
Landing Page Form
  ↓
POST /api/email/subscribe
  ↓
Supabase `email_subscribers` table
  ↓
Supabase Webhook (on insert)
  ↓
Mailchimp API
  ↓
Mailchimp List + Automation
  ↓
Welcome Email (immediate)
  ↓
Drip Sequence (Day 1+)
```

## Notes
- Start with Mailchimp (cheaper, easier than Substack)
- Use list sync, not manual import (keeps data fresh)
- Test with `test@example.com` first
- Monitor bounce rates (aim for < 2%)
- Plan for 500+ early subscribers (founder revenue goal)

---

**Phase 1 Owner:** CTO (ac0726ce) (Supabase webhook)
**Phase 2 Owner:** Growth / CON-17 (email sequence + Mailchimp setup)
**Phase 3 Owner:** Both (testing)
**Status:** Awaiting CON-17 email copy finalization
