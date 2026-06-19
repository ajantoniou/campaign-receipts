# CON-18: SEALED Payment + PDF Delivery (Stripe + Resend Integration)

**Parent Issue:** CON-15 SEALED landing page
**Owner:** CTO
**Status:** Pending (blocked by CON-15 domain approval + CON-17 email sequence draft)
**Timeline:** Week 2 (after landing page live + email list >50 subscribers)
**Sprint:** Post-launch integration phase

---

## Context

CON-15 (landing page scaffold) focuses on **structure + email capture only**. This child issue implements **payment processing + PDF delivery**, the final link in the sales funnel.

Landing page will live before payment is integrated; users can sign up for free email + see "Coming Soon" for $22 purchase.

*Note: CON-17 is owned by Growth agent (email sequence). CON-18 (this issue) is CTO payment integration.*

---

## Deliverables

### 1. Stripe Connect Account Setup

**When:** Week 2, once email list has 50+ subscribers (proof of demand)

**Why defer:** CON-15 rule: "Stripe when revenue is real." Rushing account setup (24-48h review period) adds no value if no one is buying yet.

**Setup steps (CTO):**
- [ ] Create Stripe account linked to Concise business (personal account, not Express)
- [ ] Add Stripe API keys to `.env.local` (test mode first)
- [ ] Configure Stripe Dashboard: products, prices, webhooks

**Test credentials:**
- Test API key: `sk_test_...` (from Stripe Dashboard → API Keys)
- Test publishable key: `pk_test_...` (public, safe for frontend)
- Test card: `4242 4242 4242 4242` (expiry: any future date)

---

### 2. Product SKU Configuration (Stripe)

**Product 1: SEALED Book Bundle**
```
Name:        "SEALED: The 2016 Promises — Before the Deals"
Description: "PDF + ePub + Audiobook narration (included)"
Price:       $22.00 USD
Type:        One-time payment
Metadata:
  book_id: "sealed"
  formats: "pdf,epub,audio"
```

**Product 2: SEALED Bundle + Policy Tracking Spreadsheet**
```
Name:        "SEALED Bundle + Policy Tracking Spreadsheet"
Description: "$5 upsell: Add live Google Sheets template tracking
              promise vs. reality for all 130+ quotes"
Price:       $27.00 USD (vs. $22 base)
Type:        One-time payment
Metadata:
  book_id: "sealed"
  add_ons: "tracking_sheet"
```

**Configuration location:** Stripe Dashboard → Products
**Frontend integration:** Will link to Stripe Payment Links (no custom checkout UI in Phase 1)

---

### 3. Webhook Integration (Stripe → Supabase → Resend)

**Flow diagram:**

```
User clicks "BUY NOW" on sealed.concise.enterprises
        ↓
Stripe Payment Link (hosted checkout)
        ↓
User completes payment
        ↓
Stripe webhook: payment_intent.succeeded
        ↓
POST /api/webhooks/stripe (on Render)
        ↓
Webhook handler:
  1. Retrieve Stripe session ID + customer email
  2. Look up book in concise.books table (pdf_storage_path)
  3. Generate Supabase Storage signed URL (7-day expiry)
  4. Call Resend API: send PDF delivery email
  5. Log order in concise.orders table (status: completed)
  6. Return 200 to Stripe
        ↓
Customer receives email:
  "Your SEALED purchase is ready. Download here (link expires in 7 days)"
  + footer with tracking sheet upsell
```

**API Endpoint:** `POST /api/webhooks/stripe`

**Implementation steps:**
- [ ] Create webhook route file: `app/api/webhooks/stripe/route.ts`
- [ ] Import Stripe SDK: `stripe` npm package
- [ ] Verify webhook signature (Stripe webhook secret from Dashboard)
- [ ] Parse `payment_intent.succeeded` event
- [ ] Query Supabase: `SELECT pdf_storage_path FROM concise.books WHERE id = 'sealed'`
- [ ] Generate signed URL: `supabaseClient.storage.from('books').createSignedUrl(pdf_storage_path, 604800)`
- [ ] Call Resend: Send email with download link
- [ ] Insert row in `concise.orders` table
- [ ] Return JSON response

**Code skeleton:**
```typescript
// app/api/webhooks/stripe/route.ts

import { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(...);
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');

  // 1. Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  // 2. Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const customerEmail = paymentIntent.charges.data[0].billing_details.email;

    // 3. Get book PDF
    const { data: book } = await supabase
      .from('books')
      .select('pdf_storage_path')
      .eq('id', 'sealed')
      .single();

    // 4. Generate signed URL (7 days)
    const { data: signedUrl } = await supabase
      .storage
      .from('books')
      .createSignedUrl(book.pdf_storage_path, 604800);

    // 5. Send email via Resend
    await resend.emails.send({
      from: 'noreply@concise.enterprises',
      to: customerEmail,
      subject: 'Your SEALED download is ready',
      html: `
        <p>Thanks for your purchase! Download your copy:</p>
        <a href="${signedUrl}">${book.title}</a>
        <p>Link expires in 7 days.</p>
      `,
    });

    // 6. Log order
    await supabase
      .from('orders')
      .insert({
        customer_email: customerEmail,
        book_id: 'sealed',
        stripe_session_id: paymentIntent.id,
        total: paymentIntent.amount / 100,
        status: 'completed',
      });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
```

---

### 4. Email Delivery (Resend Integration)

**Why Resend (not Mailchimp):**
- Mailchimp handles **drip campaigns** (CON-16)
- Resend handles **transactional email** (order confirmation, PDF delivery)
- Combined: free tier covers both (3K emails/mo Resend + 500 contacts Mailchimp)

**Setup (CTO):**
- [ ] Create Resend account (free tier, 3K emails/mo)
- [ ] Add API key to `.env` (`RESEND_API_KEY`)
- [ ] Install npm package: `npm install resend`
- [ ] Configure sender domain: `noreply@concise.enterprises` (verify SPF/DKIM in Cloudflare)

**Email template:** See webhook handler above. Plain text for MVP (Phase 1).

**Metrics to track:**
- Delivery rate (should be >99% with Resend)
- Bounce rate (if >5%, review sender domain)
- Open rate (tracked via Resend dashboard)

---

### 5. Test Mode Execution

**Before going live:**
- [ ] Use Stripe test API keys (sk_test_..., pk_test_...)
- [ ] Create test webhook endpoint in Stripe Dashboard
- [ ] Trigger test payment using Stripe test card `4242 4242 4242 4242`
- [ ] Verify:
  - [ ] Webhook received (check Stripe Dashboard → Webhooks → Event log)
  - [ ] Email sent (check Resend dashboard or test inbox)
  - [ ] Order logged in Supabase `concise.orders` table
  - [ ] PDF download link works (click link in test email)
  - [ ] Link expires after 7 days (manual check later)

**Move to live:**
- [ ] Switch to Stripe live API keys (sk_live_...)
- [ ] Update webhook secret (Stripe Dashboard → live mode)
- [ ] Test with real payment (use founder test card with small amount)
- [ ] Verify email + order logging in production Supabase

---

### 6. Deployment Checklist

**Pre-deployment:**
- [ ] All code committed to git
- [ ] Webhook route tests passing
- [ ] Environment variables set in Render dashboard (.env)
- [ ] Resend and Stripe credentials verified

**Deployment:**
- [ ] Push to main branch (Render auto-deploys)
- [ ] Check Render logs: no errors in webhook endpoint
- [ ] Test health check: `curl https://concise.enterprises/api/health`

**Post-deployment:**
- [ ] Monitor Stripe webhook logs (Render + Stripe Dashboard)
- [ ] Monitor Resend email delivery (Resend Dashboard)
- [ ] Set up alerting: webhook failures → Slack/email to CTO

---

## Dependencies & Blockers

**Blocks:**
- ⏳ CON-15 domain approval (need live landing page URL)
- ⏳ CON-16 email sequence (timing: concurrent, not blocking)

**Does NOT block:**
- CON-14 copy lock (can build webhook scaffold now)

---

## Cost Summary

| Service | Phase 1 | Phase 2+ | Notes |
|---|---|---|---|
| **Stripe** | $0 | 2.9% + $0.30/transaction | Free until revenue |
| **Resend** | $0 | $0 (free tier 3K/mo) | Covers transactional email |
| **Supabase Storage** | $0 | $0 (free tier) | PDF storage already included |
| **Total** | **$0** | **2.9% + $0.30 per sale** | Compliant |

---

## Timeline

| Task | Owner | Depends On | Estimate |
|---|---|---|---|
| Stripe account setup | CTO | CON-15 approved | 1 hour |
| Product configuration | CTO | Stripe account | 30 min |
| Webhook implementation | CTO | Stripe products | 2 hours |
| Resend integration | CTO | Webhook route | 1 hour |
| Test mode execution | CTO | All above | 1 hour |
| Deployment + monitoring | CTO | Tests passing | 30 min |
| **TOTAL** | | | **6 hours** |

**Execution window:** 1 day (Week 2, after landing page live + email list >50)

---

## Success Criteria

- [ ] Stripe account created + live mode ready
- [ ] Product SKUs configured in Stripe Dashboard
- [ ] Webhook route deployed + logs clean
- [ ] Test mode: payment → email → PDF delivery → order logged (all working)
- [ ] Live mode: switched to live API keys, monitoring set up
- [ ] "BUY NOW" button on landing page links to Stripe payment
- [ ] Customer can complete purchase → receive PDF within 5 min
- [ ] CTO monitoring webhook logs for errors

---

## Next Steps (from CON-15)

1. **Founder approves domain** (CON-15)
2. **CTO builds landing page + email capture** (CON-15, Mon-Tue)
3. **CON-16 drafts email sequence** (parallel, Mon-Tue)
4. **Email list reaches 50+ subscribers** (end of Week 1)
5. **CON-17 executes Stripe setup** (Week 2 start)
6. **"BUY NOW" goes live** (Week 2 mid-week)

---

**Child issue ready for creation. Will be created after CON-15 domain approval.**

*Plan by CTO — 2026-05-03 10:50 ET*
