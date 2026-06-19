# SEALED Payment Setup Guide

**Status:** Awaiting manual LS dashboard setup
**Owner:** Founder/CEO (manual LS setup); CTO (wiring once variant IDs provided)
**Related:** CON-25, CON-20

---

## Quick Start (For Founder)

### 1. Log into Lemon Squeezy Dashboard
- **URL:** https://app.lemonsqueezy.com/dashboard
- **Store:** Demiurgic Labs (ID: 363520)

### 2. Create Product
- Click **Products** → **New Product**
- **Product Name:** `SEALED: The 2016 Promises — Before the Deals`
- **Description:** A historical archive of Trump's 2015-2016 campaign promises. PDF, ePub, and Audiobook formats included.
- **Status:** Published
- **Save**

### 3. Create Variant 1 (Standard Edition)
- In the product, click **Add Variant**
- **Name:** `Standard Edition - $22`
- **Price:** `$22.00 USD`
- **Subscription:** Off
- **Save**
- **COPY VARIANT ID** (numeric, e.g., "456789") and save to notes

### 4. Create Variant 2 (Bundle)
- Click **Add Variant** again
- **Name:** `Bundle + Tracking Sheet - $27`
- **Price:** `$27.00 USD`
- **Subscription:** Off
- **Save**
- **COPY VARIANT ID** (e.g., "456790") and save to notes

### 5. Upload Digital Product File
**In the same product:**
- Go to **Digital Products** section
- Click **Upload File**
- **File:** Upload `SEALED — The 2016 Promises Before the Deals.pdf`
- **Delivery Method:** Email (automatic)
- **Save**

### 6. Associate File with Variants
- Ensure the PDF is set to deliver for **both variants**
  - Standard Edition: PDF only
  - Bundle: PDF + companion files (if available)

### 7. Share Variant IDs with CTO
Post comment on CON-25:
```
Variant IDs:
- Standard: 456789
- Bundle: 456790
```

---

## Why Manual?

Lemon Squeezy **does not support programmatic product creation** via API. All products must be created through the dashboard UI. This is by design—LS treats products as merchant inventory, not API resources.

The Concise codebase includes a helper library (`lib/lemonsqueezy.ts`) that can:
- ✅ Read/list products
- ✅ Generate checkout links from variant IDs
- ❌ Create products or variants

Once products are created and IDs are shared, the CTO can:
- Wire the checkout links in `app/sealed/page.tsx`
- Test end-to-end in sandbox mode
- Document the live-mode flip process

---

## Timeline

**Step 1-6 (manual setup):** ~10 min
**Step 7 (share IDs):** 1 min
**CTO wiring + testing:** ~30 min
**Total to first sandbox checkout:** ~45 min

---

## Troubleshooting

**Q: Where do I find variant IDs?**
A: In the LS dashboard, go to Products → (click product) → Variants → click any variant → URL bar shows `/products/{product_id}/variants/{variant_id}`. Copy the variant ID portion.

**Q: Can I use a test PDF?**
A: Yes, for sandbox testing use any PDF. Switch to the real SEALED PDF before going live.

**Q: What if I need to change the price later?**
A: You can edit variant prices in the LS dashboard without touching the code.

---

## Next Steps (CTO)

Once variant IDs are provided:

1. Update `app/sealed/page.tsx` lines 176 & 185:
   ```jsx
   // Before:
   href="https://demiurgiclabs.lemonsqueezy.com/checkout/buy/sealed-standard"

   // After:
   href="https://demiurgiclabs.lemonsqueezy.com/checkout/buy/VARIANT_ID_1"
   ```

2. Test in sandbox mode
3. Document live-mode flip checklist (`eng/sealed-launch-flip-checklist.md`)
4. Await CEO + Chief Accountant approval before flipping to live

---

**Questions?** See CON-25-BLOCKER-REPORT.md for detailed technical findings.
