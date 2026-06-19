# SEALED Launch: Live Mode Flip Checklist

**Product:** SEALED: The 2016 Promises — Before the Deals
**Owner:** CEO + Chief Accountant (approval gate)
**Executor:** CTO (technical flip)
**Status:** Partial — infra + legal routes shipped without founder; LS variant IDs + approvals still required.

---

## Already complete (no founder — ops/CoS, 2026-05)

- [x] Terms + Privacy routes live on sealed-press (`/terms`, `/privacy`)
- [x] Waitlist-first UX when **`NEXT_PUBLIC_STORE_APPROVED`** is not `true` (banner + `#notify`)
- [x] Share metadata + `sitemap.xml` + `robots.txt` with Sitemap line
- [x] Manuscript draft + first-customer plan + copy-protection realism docs under `companies/concise-sealed/`

---

## Pre-Flip Requirements (Must Be Complete)

- [ ] **Variant IDs collected** from LS dashboard
  - Standard edition variant ID: `_____________`
  - Bundle variant ID: `_____________`

- [ ] **Sandbox checkout tested** and verified working
  - [ ] Click buy button → redirects to LS checkout
  - [ ] Complete test purchase with Stripe test card (4242 4242 4242 4242)
  - [ ] Order confirmation received in test LS dashboard
  - [ ] PDF delivery email arrives within 60 seconds

- [ ] **Code reviewed** by at least one other developer
  - [ ] `app/sealed/page.tsx` checkout links reviewed
  - [ ] No hardcoded test variant IDs remain
  - [ ] No test/debug code left in production build

- [ ] **Legal/compliance verified**
  - [ ] Pseudonym "We The People" confirmed as author in LS product
  - [ ] No securities advice language in product description
  - [ ] No telehealth claims
  - [ ] Terms of Service link functional (`/terms`)
  - [ ] Privacy Policy link functional (`/privacy`)

---

## Approval Gates (Required Before Flip)

### CEO Sign-Off
- **Responsibility:** Confirm product-market alignment and go-to-market timing
- **Questions:**
  - [ ] Is the landing page copy accurate and on-brand?
  - [ ] Are we ready for inbound customer inquiries?
  - [ ] Is there a customer support plan if PDF delivery fails?
- **Sign-off:** CEO must comment on this issue: "CON-25 CEO approval: Ready to go live"

### Chief Accountant Sign-Off
- **Responsibility:** Verify payment compliance and revenue tracking
- **Questions:**
  - [ ] Are Stripe webhook logs configured to track orders?
  - [ ] Has spend been approved? (LS is rev-share; confirm no surprise subscription charges)
  - [ ] Is there a revenue reconciliation process?
  - [ ] Are we compliant with the $500 spend cap per portfolio rules?
- **Sign-off:** Chief Accountant must comment on this issue: "CON-25 CFO approval: Payments cleared for live"

---

## Live Mode Flip (CTO Only After Approvals)

Once both CEO and Chief Accountant have approved:

1. **Update LS Dashboard Settings**
   - [ ] Log into https://app.lemonsqueezy.com/dashboard
   - [ ] Go to Settings → Checkout
   - [ ] Verify "Live Mode" is toggled ON
   - [ ] Confirm all payment methods enabled (Credit Card, PayPal, Apple Pay, etc.)
   - [ ] Verify stripe account is connected in live mode (not sandbox)

2. **Verify Checkout Links**
   - [ ] Visit app/sealed page in production
   - [ ] Click "Buy Now — $22" button
   - [ ] Verify redirect URL shows **live** checkout domain (not sandbox variant ID)
   - [ ] Confirm page is served over HTTPS

3. **Test Live Purchase** (Optional but recommended)
   - [ ] Complete small test purchase with real payment method
   - [ ] Verify order appears in LS live dashboard (not sandbox)
   - [ ] Confirm PDF delivery email received within 60 seconds
   - [ ] Check Stripe account for transaction

4. **Monitor First Hour**
   - [ ] Watch LS dashboard for any errors
   - [ ] Monitor customer support channel for complaints
   - [ ] Check email delivery logs (verify no bounces)

5. **Post-Flip Documentation**
   - [ ] Record final variant IDs in `companies/concise/config/sealed-products.json`
   - [ ] Log go-live timestamp in issue comment
   - [ ] Update team Slack: "SEALED live mode activated — first dollar path open"

---

## Rollback Procedure (If Issues Arise)

If critical issues are discovered after going live:

1. **Immediate actions:**
   - [ ] Toggle "Live Mode" OFF in LS dashboard (returns to sandbox)
   - [ ] Update app/sealed/page.tsx checkout links to sandbox variant IDs
   - [ ] Deploy hotfix to production
   - [ ] Post incident summary to #concise-team Slack channel

2. **Root cause analysis:**
   - [ ] Check LS error logs
   - [ ] Verify PDF delivery service status
   - [ ] Review customer support tickets
   - [ ] Identify fix required

3. **Re-stabilization:**
   - [ ] Fix issue in code or LS settings
   - [ ] Re-test sandbox flow
   - [ ] Request CEO/CFO re-approval if changes are significant
   - [ ] Flip back to live mode

---

## Success Metrics (First Week)

- [ ] **Revenue:** Track total $ received from SEALED sales
- [ ] **Conversion:** Monitor click-through rate (CTA → checkout)
- [ ] **Delivery:** Confirm 100% of customers receive PDF within 60 sec
- [ ] **Churn:** Monitor refund/dispute rate (target: <5%)
- [ ] **Support:** Zero critical issues reported

---

## Sign-Off Log

| Role | Name | Approval Date | Notes |
|------|------|---------------|-------|
| CEO | _____ | ___/___/___ | Comment: |
| Chief Accountant | _____ | ___/___/___ | Comment: |
| CTO (Executor) | _____ | ___/___/___ | Time: |

---

## Related Issues

- **CON-20:** SEALED landing page (parent, completed)
- **CON-25:** Payment wiring (current issue)
- **CON-27:** Hero image generation (parallel, independent)

---

**Next Action:** CTO completes sandbox test with real variant IDs → CEO + CFO review → CTO executes flip

**Timeline:** Estimated 2 hours after variant IDs provided (1 hr testing + 1 hr approval cycle)
