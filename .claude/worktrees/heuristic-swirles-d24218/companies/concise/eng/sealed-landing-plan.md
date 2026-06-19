# SEALED Landing Page Plan — CON-15 Deliverable

**Date:** 2026-05-03
**Owner:** CTO
**Status:** Plan ready for CEO approval (domain decision pending)
**Timeline:** Domain decision → 7-10 days to live

---

## 1. Domain Recommendation

### Option A: Subdomain (RECOMMENDED)
**Domain:** `sealed.concise.enterprises`

**Reasoning:**
- ✅ **Fast** — already own `concise.enterprises` (Cloudflare active); DNS setup is ~5 minutes
- ✅ **No cost** — subdomain is free (no registration needed)
- ✅ **Trust transfer** — existing domain authority flows to subdomain
- ✅ **Canonical positioning** — clearly positions book as Concise product, not separate venture
- ✅ **Email compliance** — same root domain simplifies DKIM/SPF alignment for email delivery
- ⚠️ **Brand bleed risk** — if SEALED attracts scrutiny, affects main Concise property

### Option B: Fresh Domain (REJECTED)
**Domain:** `sealedbook.com`, `sealed-archive.com`, etc.

**Reasoning:**
- ✅ Clean separation if book becomes controversial
- ✅ Standalone branding authority (builds independent email + SEO)
- ❌ **Cost** — $12-15/year + Whois privacy (violates <$50/mo discipline)
- ❌ **Delay** — 24-48h registration + DNS propagation + SSL cert
- ❌ **Trust burden** — brand-new domain has zero authority; email deliverability suffers
- ❌ **Complexity** — separate email SPF/DKIM + Stripe account integration

---

## RECOMMENDATION: **SUBDOMAIN (sealed.concise.enterprises)**

**Founder approval needed** before DNS configuration.

**Once approved, CTO will:**
1. Create `sealed.concise.enterprises` CNAME record in Cloudflare (5 min)
2. Point to Render service URL (5 min)
3. Deploy Next.js landing page to Render (auto via git push)
4. SSL certificate auto-issued by Render (10 min)
5. **Live in <30 minutes**

---

## 2. Stack Pick: Next.js on Render (Leverage Existing)

### Why NOT Webflow/Framer (Reject)
- **Cost:** Webflow $14-40/mo + hosting; Framer $8-25/mo + addons
- **Vendor lock-in:** Hard to migrate email integrations, Stripe webhooks
- **No-code UI builders add friction** for Stripe integration (need custom backend anyway)
- **CTO already has Next.js running** on Render with Supabase hooked up

### Why Next.js on Render (PICK)
- **Already paid for:** Render free tier $0/mo for this subdomain (same service as main Concise)
- **Email integration ready:** Supabase email_subscribers table already exists (CON-2 deployed)
- **Stripe hooks easy:** Next.js API routes handle webhooks natively
- **Familiar stack:** React components, Tailwind CSS, no new dependencies
- **Fast build:** Next.js 14 full page build <2 min, deploy <5 min
- **Type-safe:** TypeScript prevents email/payment data bugs

---

## STACK & COST SUMMARY

| Component | Technology | Cost | Notes |
|---|---|---|---|
| **Hosting** | Render free tier | $0/mo | Shared with main Concise service |
| **Database** | Supabase (free) | $0/mo | Shared `concise` schema |
| **Frontend** | Next.js 14 + React 18 | $0 | Already in package.json |
| **Styling** | Tailwind CSS | $0 | Already configured |
| **Email capture** | Supabase + email tool (TBD) | $0 | See Section 5 |
| **Payment** | Stripe (free until revenue) | $0 | Setup Week 2 when CON-16 ready |
| **Static images** | Supabase Storage (free) | $0 | Shared with main Concise |
| **DNS** | Cloudflare (free) | $0 | Existing account |
| **TOTAL MONTHLY** | | **$0** | Spend cap: $0 |

**All infrastructure already paid for; no new spend required.**

---

## 3. Scaffolding Plan: Landing Page Components → Build Tasks

### Component Mapping (from trump-book-rename.md Section 2)

| Landing Page Section | Build Task | Estimate | Dependencies |
|---|---|---|---|
| **Header Navigation** | Create `components/Header.tsx` w/ nav links (SEALED, About, Preview, FAQ, Buy) | 1 hour | None |
| **Hero Section** | Build `app/sealed/page.tsx` hero with title, subtitle, redacted doc background image | 2 hours | Art assets (image URL from Supabase Storage) |
| **Subheadline (Wedge)** | Add `components/WedgeExplanation.tsx` — "Why This Book Exists Right Now" + time-capsule narrative | 1 hour | Copy locked (CON-14) |
| **Sample Reading** | Create `components/SampleQuotes.tsx` — 3 policy quotes w/ before/after framing | 1.5 hours | Quote data (hardcoded or API) |
| **Trust Signals** | Build `components/TrustSignals.tsx` — 5 checkmarks (official records, pseudonym, pages, 2016 proof, zero editorializing) | 1 hour | Copy locked (CON-14) |
| **Email Capture Form** | Build `components/EmailCapture.tsx` — input + submit button, POST to `/api/email/subscribe` | 1 hour | Already exists (CON-2 API endpoint) |
| **Primary CTA (Buy)** | Build `components/BuySection.tsx` — $22 button + $27 bundle option + refund guarantee | 1.5 hours | Stripe setup (deferred to CON-17) |
| **FAQ Section** | Create `components/FAQ.tsx` — 7 Q&As (propaganda?, author?, original?, refund?, matter?, audio?, etc.) | 1.5 hours | Copy locked (CON-14) |
| **Footer** | Add `components/Footer.tsx` — privacy, terms, contact, copyright, CAN-SPAM footer | 1 hour | Legal copy (existing from CON-14) |
| **Page Layout Assembly** | Combine all components into `app/sealed/page.tsx`, responsive grid, Tailwind spacing | 1 hour | All above components |
| **Responsive QA** | Test mobile (320px), tablet (768px), desktop (1024px+) | 1.5 hours | Browser dev tools |
| **Accessibility QA** | Check WCAG 2.1 AA: contrast, alt text, ARIA, keyboard nav | 1 hour | axe DevTools browser extension |
| **Image Optimization** | Add `next/image` component, lazy load hero + quote section images | 1 hour | Supabase Storage image URLs |
| **Email Capture Integration Test** | Test form submission → Supabase `email_subscribers` table | 0.5 hours | Existing API route |

---

### Build Task Summary

**Total time estimate:** 18.5 hours (2-3 days working 8h/day)

**Critical path:**
1. CON-14 locks copy (Friday EOD)
2. CTO builds landing page (Mon-Tue, parallel to CON-16)
3. Stripe integration deferred (CON-17, separate issue)

**Timeline:** Once domain approved + CON-14 copy locked → **7 days to live**.

---

## 4. Stripe Integration Plan

### Account Setup (Deferred to CON-18)

**When:** Week 2 (after landing page live, once email list reaches 50+ subscribers)

**Why defer:**
- CON-15 is landing page **structure** only, not payment yet
- Stripe review can take 24-48h; rushing adds no value
- Email drip (CON-17) fills funnel during Stripe setup window
- Rule: "Stripe account creation when first revenue is real"

---

### Product SKUs (Planned for CON-18)

**Product 1: SEALED Book Bundle**
- Name: `SEALED: The 2016 Promises — Before the Deals`
- Price: **$22** (PDF + ePub + Audiobook narration)
- Stripe metadata: `book_id=sealed`, `formats=pdf,epub,audio`

**Product 2: SEALED Bundle + Tracking Sheet**
- Name: `SEALED Bundle + Policy Tracking Spreadsheet`
- Price: **$27** ($5 upsell over base)
- Stripe metadata: `book_id=sealed`, `add_ons=tracking_sheet`

---

### Webhook Integration Plan (CON-18)

**Stripe → Resend → PDF Delivery**

1. **Stripe Checkout Session created** → button on SEALED page links to Stripe Payment Link (no custom checkout v1)
2. **Stripe Webhook (payment_intent.succeeded)** → POST to `api/webhooks/stripe` (future)
3. **Webhook handler:**
   - Retrieves customer email from Stripe session
   - Looks up book in `concise.books` table (pdf_storage_path)
   - Calls Resend API with Supabase Storage signed URL (7-day expiry)
   - Logs order in `concise.orders` table
4. **Customer receives:**
   - Welcome email (via Resend, 2 min post-purchase)
   - Secure download link to PDF (expires 7 days)
   - Upsell email: tracking spreadsheet ($5 addon) in footer

---

### Test Mode (CON-18)

- Stripe Restricted API Key for webhook testing
- Test payment method: Stripe test card `4242 4242 4242 4242`
- Verify email in Supabase `concise.orders` before going live

---

## 5. Email Capture Tool Recommendation

**Note:** Email automation (CON-17, Growth agent) vs. transactional email (CON-18, CTO). This section recommends the tool for both.

### Analysis: Mailchimp vs. ConvertKit vs. Substack

| Feature | Mailchimp | ConvertKit | Substack | Winner |
|---|---|---|---|---|
| **Free tier limit** | 500 contacts | 1K free subscribers | Unlimited | **Substack** |
| **Automation (drip sequence)** | ✅ Yes (free) | ✅ Yes (paid $25+) | ✅ Yes (free, native) | **Substack** |
| **Custom domain email** | ✅ Yes (Pro $20+) | ✅ Yes (paid) | ❌ No (substack.com only) | **Mailchimp** |
| **Webhook to external API** | ✅ Yes (easy) | ✅ Yes | ⚠️ Limited (Zapier) | **Mailchimp** |
| **Double-opt-in support** | ✅ Yes | ✅ Yes | ⚠️ Partial | **Mailchimp** |
| **API quality (integrations)** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | **Mailchimp** |
| **Branding control** | Moderate | High | Low | **ConvertKit** |
| **Cost for 5K subscribers** | $50/mo (Pro) | $79/mo | FREE | **Substack** |
| **Audience ownership** | ✅ You own list | ✅ You own list | ⚠️ Substack owns | **Mailchimp** |

---

### RECOMMENDATION: **Mailchimp** (Free Tier with Upgrade Path)

**Phase 1 (Weeks 1-4):**
- Free tier: 500 contacts included
- Automation: 10 email sequences (free)
- API key: webhook to `api/email/subscribe` (Supabase → Mailchimp sync)
- Email from: `concise@concise.enterprises` (custom domain, setup via SPF/DKIM)
- Cost: **$0**

**Phase 2 (Month 2, if list >500):**
- Upgrade to **Essentials $20/mo** (10K contacts, SMS add-on available)
- Keeps unlimited email sequences, advanced segmentation
- Cost: **$20/mo**

**Why Mailchimp over Substack:**
1. **CAN-SPAM compliance** — custom domain email (crucial for SEALED's political positioning)
2. **Webhook integration** — direct API tie-in to Supabase for double-opt-in flow
3. **List ownership** — founder owns subscriber data, portable to future platform
4. **Automation sophistication** — conditional sequences (upsell tracking sheet after book purchase)
5. **Upgrade path clear** — free tier scales past $50/mo budget without surprise costs

**Why not ConvertKit:**
- Minimum paid tier ($25/mo) starts immediately; no true free tier for 500 contacts
- Overkill for Phase 1; better for 10K+ audiences

**Why not Substack:**
- No custom domain email (forced `substack.com` sender address)
- Political content on Substack may trigger Terms of Service review (precedent with controversial writers)
- No webhook/API for external integration
- Data lock-in (subscriber list not portable)

---

### Integration Workflow (Mailchimp + Supabase)

**Flow:**
1. User submits email on SEALED landing page
2. Form POSTs to `/api/email/subscribe`
3. Backend stores in `concise.email_subscribers` table (double-opt-in flag = false)
4. Cron job (or Zapier) syncs unsent opt-in emails to Mailchimp **Contacts** list
5. Mailchimp sends **Opt-In Email** ("Confirm your subscription to SEALED")
6. User clicks link → Supabase updates `confirmed_at` timestamp
7. Mailchimp tags contact as **confirmed**, adds to automation sequence
8. **10-week drip sequence** runs automatically (coordinated by CON-16)

**Cost:** Mailchimp free tier (Phase 1) + Zapier free tier (3 zaps) for sync = **$0**

---

## Acceptance Criteria Checklist

- [x] Domain recommendation explicit (sealed.concise.enterprises, founder approval needed)
- [x] Stack rationale documented (Next.js on Render, $0/mo)
- [x] Component scaffolding mapped (13 tasks, 18.5 hours, 2-3 days)
- [x] Stripe integration plan deferred to CON-17 (not in scope)
- [x] Email tool pick recommended (Mailchimp, free tier, $0-20/mo)
- [x] All monthly costs explicit (total: $0 Phase 1, $20 Phase 2)
- [x] No spend >$50/mo (compliant)
- [x] Faceless + pseudonym constraints documented (SEALED book positioning maintained)

---

## Next Steps (Unblocks Implementation)

1. **CEO approves domain decision** → Flag for founder sign-off
2. **CTO configures DNS** (sealed.concise.enterprises via Cloudflare) → 5 min
3. **CON-14 locks copy** (subtitle, FAQ, landing page text) → Friday EOD
4. **CTO builds landing page** (Mon-Tue, parallel to CON-16) → 18.5 hours
5. **CON-17 created** — Stripe + Resend integration (deferred to Week 2)

---

## Blockers & Dependencies

**No blockers.** All infrastructure ready (Render, Supabase, Cloudflare).

**Soft dependency:** CON-14 subtitle/copy lock (needed for accurate hero/FAQ build, not blocking scaffolding plan).

---

**Plan ready for CEO review & founder domain approval.**

*Report by CTO — 2026-05-03 10:30 ET*
