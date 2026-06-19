# Concise — Tech Stack & Architecture

**Status:** Week 1 planning (awaiting founder provisioning)
**Owner:** CTO
**Last updated:** 2026-05-02

---

## Stack Summary

| Component | Technology | Notes |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Single web service, SSR + static pages |
| Backend | Next.js API routes | /api/stripe, /api/resend, /api/orders |
| Database | Supabase Postgres | `concise` isolated schema |
| Storage | Supabase Storage | PDFs, covers, first-chapter leads |
| Payments | Stripe Payment Links | No custom checkout v1; links only |
| Email | Resend | Free tier (3K/mo); PDF delivery |
| Hosting | Render | $7/mo single web service (Oregon) |
| Monitoring | Sentry (free) | Error tracking post-launch |
| Analytics | Plausible (post-revenue) | Privacy-first when revenue justifies |

---

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│  Visitor → Next.js Landing Page (SSR)   │
│  concise.com/{book-slug}                │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   Email capture  Stripe Payment Link
   (form POST)     (external checkout)
        │             │
        └──────┬──────┘
               │
    Stripe Webhook (POST to /api/stripe)
               │
        ┌──────┴──────────────┐
        │                     │
   Store order in DB     Trigger Resend
   (Supabase)            Email + PDF
        │                 (secure link)
        │
    Resend API
    (email template → PDF download link)
        │
    Email delivered with 7-day secure link
    (Supabase Storage signed URLs)
```

---

## Database Schema

**Location:** Supabase `concise` schema

### `books` table
```sql
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL, -- store as cents (e.g., 1999 = $19.99)
  pdf_storage_path TEXT NOT NULL, -- path in Supabase Storage: "books/top-3/mcat-1.pdf"
  cover_storage_path TEXT NOT NULL, -- "covers/mcat-1.png"
  description TEXT,
  slug TEXT UNIQUE NOT NULL, -- URL-safe: "mcat-prep-book-1"
  status TEXT DEFAULT 'draft', -- 'draft' | 'live'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### `customers` table
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT -- 'landing_page' | 'email_signup' | 'reddit' | 'tiktok'
);
```

### `orders` table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  book_id UUID REFERENCES books(id), -- NULL for bundles
  bundle_id UUID REFERENCES bundles(id), -- NULL for single books
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL, -- total in cents
  status TEXT DEFAULT 'pending', -- 'pending' | 'completed' | 'refunded'
  ordered_at TIMESTAMPTZ DEFAULT now(),
  pdf_delivered_at TIMESTAMPTZ, -- when Resend email sent
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `email_subscribers` table
```sql
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source_book_id UUID REFERENCES books(id), -- which book they signed up from
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}', -- 'mcat' | 'trump-book' | 'general-advice'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `bundles` table (for MCAT bundle + future)
```sql
CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "MCAT 3-Book Bundle"
  book_ids UUID[] NOT NULL, -- array of book IDs
  price_cents INTEGER NOT NULL,
  stripe_product_id TEXT, -- Stripe product ID (once live)
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### `amazon_revenue_baseline` table (Chief Accountant)
```sql
CREATE TABLE amazon_revenue_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL, -- first day of month: 2026-05-01
  amount_cents INTEGER NOT NULL, -- $200/mo = 20000 cents
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Routes

### POST `/api/stripe/webhook`
- **Purpose:** Handle Stripe payment_intent.succeeded events
- **Flow:**
  1. Verify Stripe signature
  2. Extract customer email, book_id, stripe_session_id
  3. Store order in DB (status = 'completed')
  4. Call POST `/api/resend/deliver-pdf`
  5. Return 200 OK

### POST `/api/resend/deliver-pdf`
- **Purpose:** Send secure PDF download link via Resend
- **Inputs:** order_id, customer_email
- **Flow:**
  1. Fetch order + book from DB
  2. Generate Supabase Storage signed URL (7-day expiry)
  3. Render Resend email template with download link
  4. Call Resend API to send
  5. Update order.pdf_delivered_at timestamp
  6. Return 200 OK

### POST `/api/email/subscribe`
- **Purpose:** Handle email signup form on landing pages
- **Inputs:** email, first_name, source_book_id
- **Flow:**
  1. Create or update email_subscriber
  2. Send double-opt-in email via Resend (future: handle confirmation)
  3. Return 200 OK
- **Validation:** Sanitize email, check for duplicates

### GET `/api/orders/:order_id`
- **Purpose:** Customer status check (future: order page)
- **Inputs:** order_id, email
- **Returns:** order status, pdf_delivered_at, download_link (if delivered)

---

## Stripe Integration

### Products & Payment Links

#### Book 1 (MCAT Book A)
- **Product ID:** [founder creates; CTO stores in .env]
- **Payment Link:** Renders on `/books/mcat-a` landing page
- **Price:** $19.99
- **Metadata:** book_id = UUID, title = "MCAT Prep Book A"

#### Book 2 (MCAT Book B)
- **Product ID:** [TBD]
- **Payment Link:** Renders on `/books/mcat-b`
- **Price:** $19.99

#### Book 3 (Trump book OR top-performing general title)
- **Product ID:** [TBD]
- **Payment Link:** Renders on `/books/[book-3]`
- **Price:** $9.99 (Trump) or $14.99 (general advice)

#### MCAT Bundle (3 books at $49)
- **Product ID:** [TBD]
- **Payment Link:** Renders on `/bundles/mcat-trio`
- **Price:** $49.00
- **Savings message:** "Save $10 vs buying individually"

### Webhook Configuration
- **Endpoint:** `https://concise.onrender.com/api/stripe/webhook`
- **Events to listen:** `payment_intent.succeeded`, `charge.dispute.created` (future)
- **Signature verification:** Required (STRIPE_WEBHOOK_SECRET in .env)

---

## Resend Email Templates

### 1. Purchase confirmation + PDF delivery (transactional)
- Subject: "Your [Book Title] is ready to download"
- Contents:
  - Thank you message
  - Book title + author
  - 7-day download window
  - Prominent download button
  - Secure link (expires in 7 days)
  - CAN-SPAM footer: unsubscribe link, Demiurgic Labs LLC address

### 2. Welcome sequence (automated, day 1-5)
- **Email 1 (day 0):** Thank you for signing up → first chapter PDF
- **Email 2 (day 1):** "Why this topic matters" → excerpt
- **Email 3 (day 2):** Cross-sell related book
- **Email 4 (day 3):** Bundle offer (discount for multi-book purchase)
- **Email 5 (day 5):** Social proof + testimonial

---

## Frontend Pages

### `/` — Landing page (hero)
- Hero section: "Concise books by [author name/pseudonym]"
- 3-4 featured books (Top 3 + MCAT bundle highlight)
- Email signup form (below fold)
- Footer: Privacy Policy | ToS | Unsubscribe
- Responsive design (mobile-first)

### `/books/:slug` — Per-book landing page
- Book cover (large)
- Title, author, price
- Short description
- 3 key benefits (bullet points)
- First chapter PDF download (email gate OR free)
- Stripe Payment Link button ("Buy now")
- Email signup for updates
- Footer: Privacy Policy | ToS

### `/bundles/:slug` — Bundle landing page (MCAT trio)
- Bundle cover/visual
- "3-book bundle" positioning
- Individual book titles + covers
- Total price + savings messaging
- Stripe Payment Link button
- FAQ: "What's included?" etc.

### `/thank-you` — Post-purchase (redirect after Stripe)
- "Check your email for download link"
- Estimated delivery: "within 1-2 minutes"
- Link to [book] community (TikTok, Reddit)

### `/privacy` — Privacy Policy + ToS (footer link)
- GDPR/CCPA notice
- Data handling: emails stored for newsletter
- Email unsubscribe link
- Contact: [demiurgic-gmail@domain]

---

## Deployment & CI/CD

### Render Web Service

**Config:**
- Runtime: Node.js
- Build command: `npm run build`
- Start command: `npm start`
- Environment: Production (HTTPS auto-enabled)
- Auto-deploy: On git push to main
- Region: Oregon
- Plan: Free tier (suitable for Phase 1 traffic)

**Environment variables (in .env, added by founder):**
```
NEXT_PUBLIC_SITE_URL=https://concise.onrender.com
DATABASE_URL=postgres://...@db.supabase.com/concise
SUPABASE_SERVICE_ROLE_KEY=[secret]
STRIPE_SECRET_KEY=[secret]
STRIPE_WEBHOOK_SECRET=[secret]
RESEND_API_KEY=[secret]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[public]
```

### Database setup
1. Founder creates Supabase project + database
2. CTO runs migration scripts (SQL files in `/supabase/migrations/`)
3. Indices on `email` (customers, email_subscribers), `stripe_session_id` (orders)

### Local development
```bash
npm install
npm run dev
# http://localhost:3000
```

---

## Security & Compliance

### Required
- [x] HTTPS enforced (Render auto)
- [x] Stripe webhook signature verification
- [x] Resend API key rotation (post-launch)
- [x] PDF download links expire in 7 days (Supabase signed URLs)
- [x] Privacy Policy + ToS in footer
- [x] CAN-SPAM footer on all emails (Resend templates)
- [x] No health claims on MCAT book marketing copy

### Future (Phase 2+)
- [ ] PDF watermarking (prevent piracy)
- [ ] Rate limiting on /api/email/subscribe (prevent spam signup)
- [ ] Captcha on email form (if spam detected)
- [ ] Sentry integration (error tracking)

---

## Rollout Timeline

| Day | Task | Owner |
|---|---|---|
| Sat 5/2 | Founder provisions: domain, Stripe, Render, Supabase, Resend | Founder |
| Sun 5/3 | CTO creates schema, deploys stub app, configures Stripe webhook | CTO |
| Mon 5/4 | Landing page skeleton + Stripe Payment Links config | CTO |
| Tue 5/5 | Per-book pages live, email form functional | CTO |
| Wed 5/6 | PDF delivery automation + Resend integration tested | CTO |
| Thu 5/7 | MCAT bundle Stripe product + landing page | CTO |
| Fri 5/8 | Code review, QA, launch readiness | CTO |

---

## Cost & Budget

**Infrastructure (~$10/mo):**
- Render web service: $7/mo
- Supabase Postgres: $0 (free tier)
- Resend: $0 (free tier: 3K emails/mo)
- Stripe: 2.9% + 30¢ per transaction (variable)
- Sentry: $0 (free tier)

**Contingency:** $50-100 for domain, SSL cert renewal, edge cases

**Total Phase 1 budget (4 weeks):** Well under $250 cap

---

## Risks & Mitigation

| Risk | Mitigation |
|---|---|
| Stripe payment processing fails | Webhook retries; Gumroad as backup |
| PDF piracy (unauthorized sharing) | Signed URLs expire in 7 days; Phase 2: watermarking |
| CONCISE Drive folder revoked | Supabase Storage copy persists independently |
| Email delivery to spam | Resend reputation; SPF/DKIM setup; brand warmup |
| Controversial cover (Trump book) | Stripe usually approves; Gumroad backup |

---

## Success Metrics (by EOD Week 1)

- Web service live with HTTPS
- Top 3 books on landing pages
- PDF delivery tested (test purchase → email)
- Email capture functional
- 0 bugs found in QA (or documented for Phase 2)
- Zero cost overruns

---

## Next steps

1. **Founder:** Provision infrastructure (domain, Stripe, Render, Supabase, Resend)
2. **CTO:** Upon provisioning, execute rollout timeline above
3. **All:** Daily standups starting Sunday 5/3

---

**Questions?** See `/companies/concise/permissions-and-configurations.md` for API credentials + access.
