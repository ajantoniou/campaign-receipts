# CON-25 Execution Checklist (Triggered by Variant IDs)

**Use this checklist the moment founder posts variant IDs to CON-25.**

---

## STEP 1: Extract Variant IDs (2 min)

Founder will post IDs in this format:
```
Variant IDs ready:
- Standard: 456789
- Bundle: 456790
```

**Action:** Copy both numbers.

---

## STEP 2: Update Configuration File (1 min)

**File:** `config/sealed-products.json`

Replace:
- `PLACEHOLDER_STANDARD_ID` → actual standard variant ID
- `PLACEHOLDER_BUNDLE_ID` → actual bundle variant ID

Also update `checkoutUrl` fields with the real IDs.

Example:
```json
{
  "variants": {
    "standard": {
      "variantId": "456789",
      "checkoutUrl": "https://demiurgiclabs.lemonsqueezy.com/checkout/buy/456789"
    },
    "bundle": {
      "variantId": "456790",
      "checkoutUrl": "https://demiurgiclabs.lemonsqueezy.com/checkout/buy/456790"
    }
  }
}
```

---

## STEP 3: Wire Buy Buttons (5 min)

**File:** `app/sealed/page.tsx`

**Line 196 (Standard Edition button):**
```jsx
// OLD:
href="https://demiurgiclabs.lemonsqueezy.com/checkout/buy/sealed-standard"

// NEW (replace sealed-standard with ACTUAL variant ID):
href="https://demiurgiclabs.lemonsqueezy.com/checkout/buy/456789"
```

**Line 205 (Bundle button):**
```jsx
// OLD:
href="https://demiurgiclabs.lemonsqueezy.com/checkout/buy/sealed-bundle"

// NEW (replace sealed-bundle with ACTUAL variant ID):
href="https://demiurgiclabs.lemonsqueezy.com/checkout/buy/456790"
```

---

## STEP 4: Deploy to Staging (3 min)

```bash
cd /Applications/DrAntoniou\ Projects/AgentCompanies/companies/concise
git add config/sealed-products.json app/sealed/page.tsx
git commit -m "CON-25: Wire real LS variant IDs to buy buttons (sandbox testing)"
npm run build  # Verify no type errors
```

---

## STEP 5: Sandbox Checkout Test (20 min)

### 5a. Verify LS Sandbox Mode is Active
- Go to https://app.lemonsqueezy.com/dashboard
- Settings → Checkout
- Confirm **Sandbox Mode** is toggled ON (not live)
- Test Stripe account is connected (not live Stripe)

### 5b. Test Standard Edition ($22)
1. Navigate to deployed staging app (or local `npm run dev`)
2. Click "Buy Now — $22" button
3. Verify redirect to LS checkout page
4. Fill form with:
   - Email: `test@example.com`
   - Name: `Test Customer`
5. Select Stripe payment method
6. Enter test card: **4242 4242 4242 4242**
7. Expiry: any future date (e.g., 12/27)
8. CVC: any 3 digits (e.g., 123)
9. Click **Buy**

### 5c. Verify Order and Delivery
- ✅ Order appears in LS sandbox dashboard (NOT live)
- ✅ Order status shows "delivered" or "processing"
- ✅ Email delivery log shows PDF sent to test@example.com
- ✅ Check test@example.com inbox for PDF delivery email (within 60 seconds)

### 5d. Test Bundle Edition ($27)
Repeat 5b-5c but click "Bundle" button instead.

---

## STEP 6: Document Test Results (5 min)

Post comment on CON-25 with results:

```markdown
**Sandbox Checkout Test — PASSED**

Variant IDs: 456789 (standard), 456790 (bundle)

✅ Standard Edition ($22):
- Checkout link works
- Test purchase succeeded
- PDF delivery email received in 45 seconds
- LS dashboard shows order as "delivered"

✅ Bundle Edition ($27):
- Checkout link works
- Test purchase succeeded
- PDF delivery email received in 52 seconds
- LS dashboard shows order as "delivered"

**Next step:** Awaiting CEO + Chief Accountant approvals per `eng/sealed-launch-flip-checklist.md`
```

---

## STEP 7: Request Approvals (2 min)

Post comment on CON-25:

```markdown
**Approval Request — Ready for Live Mode**

Sandbox testing complete. See `eng/sealed-launch-flip-checklist.md` for pre-flip checklist.

@CEO: Confirm product-market alignment and go-to-market timing per flip checklist.
@ChiefAccountant: Verify payment compliance and revenue tracking per flip checklist.

Awaiting comments: "CON-25 CEO approval: Ready to go live" and "CON-25 CFO approval: Payments cleared for live"
```

---

## STEP 8: Execute Live Flip (1 min)

**Only after both approvals are posted:**

1. Go to https://app.lemonsqueezy.com/dashboard
2. Settings → Checkout
3. Toggle **Live Mode** ON
4. Verify Stripe account connected in LIVE mode (not sandbox)
5. Save
6. Post comment on CON-25: "Live mode activated — SEALED first-dollar funnel open"

---

## Timeline

| Step | Duration | Cumulative |
|------|----------|-----------|
| Extract IDs | 2 min | 2 min |
| Update config | 1 min | 3 min |
| Wire buttons | 5 min | 8 min |
| Deploy | 3 min | 11 min |
| Sandbox test | 20 min | 31 min |
| Document results | 5 min | 36 min |
| Request approvals | 2 min | 38 min |
| **(await approvals)** | TBD | TBD |
| Live flip | 1 min | 39 min |

**Total to first dollar (excluding approval wait):** ~40 minutes from variant IDs arrival.

---

## Rollback (If Needed)

If issues arise after live flip:
1. Go to LS dashboard → Settings → Checkout
2. Toggle **Live Mode** OFF
3. Revert `app/sealed/page.tsx` and `config/sealed-products.json` to previous commit
4. Deploy
5. Post incident summary to CON-25

---

**Ready. Waiting for founder variant ID comment.**
