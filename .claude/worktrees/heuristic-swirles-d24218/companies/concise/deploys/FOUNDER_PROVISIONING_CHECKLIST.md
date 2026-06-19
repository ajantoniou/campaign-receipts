# Concise — Founder Provisioning Checklist

**Owner:** Founder (Alex)
**Timeline:** Saturday 2026-05-02 (Week 1 Day 1)
**Estimated time:** 1.5–2 hours

This is your complete provisioning checklist for Concise infrastructure. Complete these steps before CTO can deploy the web service on Sunday.

---

## 1. Gmail (~10 min)

- [ ] Create Gmail account (if not reusing existing):
  - Suggested: `concise.books@gmail.com` OR `books@demiurgiclabs.com` (if you own that domain)
  - Alternative: Use existing pseudonym Gmail
- [ ] Generate app password (2FA required):
  - Go to Google Account → Security → App passwords
  - Select "Mail" and "Windows Computer" (or custom)
  - Copy 16-character password
- [ ] Store in CTO .env:
  - `CONCISE_GMAIL_ADDRESS=concise.books@gmail.com`
  - `CONCISE_GMAIL_APP_PASSWORD=[16-char password from above]`

---

## 2. Cloudflare Domain Registration (~10 min)

- [ ] Go to Cloudflare Registrar
- [ ] Search for your domain (suggestions: `concisebooks.com`, `concisepress.com`)
- [ ] Register for 1 year (~$8–12)
- [ ] Nameservers: leave on Cloudflare default
- [ ] Add to .env:
  - `CONCISE_DOMAIN=concisebooks.com` (or your chosen domain)

**Note:** Cloudflare is cheaper than Namecheap. No markup.

---

## 3. Render Web Service (~5 min)

- [ ] Go to [render.com/dashboard](https://render.com/dashboard)
- [ ] Click "New" → "Web Service"
- [ ] Connect GitHub repo: `AgentCompanies` (concise folder)
- [ ] Configure:
  - **Name:** `concise`
  - **Runtime:** Node.js
  - **Build command:** `npm run build`
  - **Start command:** `npm start`
  - **Plan:** Free tier (upgrade to $7/mo if needed post-launch)
  - **Region:** Oregon (or nearest to you)
  - **Auto-deploy:** Yes
- [ ] Render auto-generates URL (e.g., `https://concise-abc123.onrender.com`)
- [ ] Once created, note the service ID for CTO
- [ ] Set environment variables (see section 8 below)

---

## 4. Stripe Account & Products (~30 min)

**Prerequisite:** You likely have a Stripe account from existing Amazon business. Reuse if possible.

### 4a. Stripe Connect (one-time)
- [ ] If new Stripe account, complete KYC (business verification)
  - You'll need: EIN (Demiurgic LLC) or SSN, business address, bank account
- [ ] If existing account, skip this step

### 4b. Create Stripe Products
Go to Stripe Dashboard → Products → Create Product

**Product 1: MCAT Bundle (3 books)**
- [ ] Name: `Concise MCAT Bundle (3 books)`
- [ ] Type: Standard (one-time)
- [ ] Price: $49.00 (founder approves — recommendation: $49-99)
- [ ] Note: "Bundle of MCAT Prep Books 1, 2, 3"
- [ ] Copy Product ID for CTO

**Product 2-4: MCAT Individual Books**
- [ ] Product 2: `Concise MCAT Book #1`
  - Price: $19.99
- [ ] Product 3: `Concise MCAT Book #2`
  - Price: $19.99
- [ ] Product 4: `Concise MCAT Book #3`
  - Price: $19.99
- [ ] Copy all three Product IDs for CTO

**Product 5: Trump/Top-3 Book**
- [ ] Name: `Concise [Book Title]` (e.g., "Grabit Nation")
- [ ] Price: $9.99–19.99 (founder approves)
- [ ] Copy Product ID for CTO

### 4c. Stripe API Keys
- [ ] Go to Stripe Dashboard → Developers → API keys
- [ ] Copy **Secret key** (starts with `sk_live_` or `sk_test_`)
- [ ] Copy **Publishable key** (starts with `pk_live_` or `pk_test_`)
- [ ] Store in .env:
  - `STRIPE_SECRET_KEY=[secret key]`
  - `STRIPE_PUBLISHABLE_KEY=[publishable key]`

### 4d. Webhook Secret (after CTO deploys Render)
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://concise-abc123.onrender.com/api/stripe/webhook`
- [ ] Events to listen: `payment_intent.succeeded`, `charge.dispute.created` (future)
- [ ] Copy signing secret (`whsec_...`)
- [ ] Store in .env:
  - `STRIPE_WEBHOOK_SECRET=[signing secret]`

---

## 5. Resend Email Service (~15 min)

- [ ] Go to [resend.com](https://resend.com)
- [ ] Sign up (use `CONCISE_GMAIL_ADDRESS` from step 1)
- [ ] Create API key:
  - Go to Settings → API Keys
  - Copy key (starts with `re_...`)
- [ ] Add domain verification:
  - Go to Domains → Add Domain
  - Enter your domain (e.g., `concisebooks.com`)
  - Resend will give you DNS records (TXT for SPF, CNAME for DKIM)
  - Go to Cloudflare → DNS → Add records
  - SPF: `TXT "v=spf1 sendingdomain.resend.dev ~all"`
  - DKIM: `CNAME _domainkey -> sendingdomain.resend.dev`
  - Wait 5–10 min for DNS to propagate
- [ ] Store in .env:
  - `RESEND_API_KEY=[api key]`

---

## 6. Supabase Database (~5 min)

**Note:** CTO will create the `concise` schema + tables. You just need to enable access.

- [ ] Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] If no Supabase project, create one:
  - Region: Oregon (closest to Render)
  - Plan: Free tier
- [ ] Go to Project Settings → Database
- [ ] Copy:
  - `Project URL` (e.g., `https://abc.supabase.co`)
  - `Service Role Secret` (under Settings → API)
- [ ] Store in .env:
  - `DATABASE_URL=postgres://[user]:[password]@db.supabase.co:5432/postgres`
  - `SUPABASE_SERVICE_ROLE_KEY=[service role secret]`

**CTO will create schema post-provisioning.**

---

## 7. CONCISE Drive Folder Access (~10 min)

**CRITICAL:** Your existing book files live in Google Drive. Give CTO access.

### Option A: Share folder (recommended)
- [ ] Go to Google Drive → CONCISE Reads folder
- [ ] Right-click → Share
- [ ] Share with CTO email address
- [ ] Permissions: Viewer only (CTO reads, doesn't modify)
- [ ] CTO downloads PDF files locally, uploads to Supabase Storage

### Option B: Provide download link
- [ ] Right-click CONCISE Reads folder → Get link
- [ ] Set to "Viewer" (anyone with link can view)
- [ ] Send link to CTO
- [ ] CTO downloads all PDFs, uploads to Supabase Storage

**Why manual instead of API:** Simpler setup, avoids service account complexity v1.

---

## 8. Environment Variables (.env)

Once you've completed steps 1–7, compile all keys into `.env` at the Render service:

**Render Environment Variables**

Go to Render Dashboard → concise service → Environment.

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://concise-abc123.onrender.com` (or custom domain) |
| `DATABASE_URL` | From Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase |
| `STRIPE_SECRET_KEY` | From Stripe (secret) |
| `STRIPE_PUBLISHABLE_KEY` | From Stripe (public) |
| `STRIPE_WEBHOOK_SECRET` | From Stripe (webhook secret, added after deploy) |
| `RESEND_API_KEY` | From Resend |
| `CONCISE_GMAIL_ADDRESS` | Your Gmail from step 1 |
| `CONCISE_GMAIL_APP_PASSWORD` | 16-char app password |
| `CONCISE_DOMAIN` | Your domain from step 2 |

---

## 9. Verify Deployment (Post-Deploy)

Once CTO deploys on Sunday:

- [ ] Visit `https://concise-abc123.onrender.com` (temporary Render URL)
  - Should see stub landing page (no 500 errors)
- [ ] Check Stripe webhooks:
  - Go to Stripe Dashboard → Webhooks
  - Verify endpoint is "Active" (no red X)
- [ ] Test email:
  - Go to Resend Dashboard
  - Send test email to yourself
  - Verify it arrives (check spam folder)

---

## 10. Brand Decisions (Owner: Founder)

**Do NOT skip these — CTO and Brand/Design need your input before proceeding.**

### 10a. Top 3 books for direct-sale launch
- [ ] **Book 1:** [MCAT Book A title]
- [ ] **Book 2:** [MCAT Book B title]
- [ ] **Book 3:** [Trump book OR top general advice title]

**Why:** Limits scope to Week 1. Other books follow in Week 2+.

### 10b. Pseudonym vs. real name strategy
- [ ] Keep pseudonym throughout (lower trust, simpler)
- [ ] Reveal MD credential on MCAT only (hybrid)
- [ ] Reveal real name everywhere (highest trust, ties controversial content to you)

**Implication:** Brand/Design will design covers + landing pages accordingly.

### 10c. Trump book cover direction
- [ ] Standard neutral cover (book content as-is)
- [ ] Palestine flag variant (your idea)
- [ ] Other political variants
- [ ] Do not ship Trump book without deciding this first

**Note:** Brand/Design proposes 3–5 variants Saturday afternoon. You decide.

### 10d. Refund policy
- [ ] 30-day no-questions-asked refunds (customer-friendly, Stripe handles)
- [ ] No refunds, all sales final (simpler, standard for digital products)

**CTO will add to Terms of Service.**

---

## Saturday EOD Checklist

Before standups end Saturday:

- [ ] Gmail account created + app password generated
- [ ] Domain registered on Cloudflare
- [ ] Render web service created
- [ ] Stripe products created (5x)
- [ ] Stripe API keys copied to CTO
- [ ] Resend account + domain verification started (may complete Sunday)
- [ ] Supabase project accessible
- [ ] CONCISE Drive folder shared with CTO
- [ ] Top 3 books identified
- [ ] Pseudonym/real-name strategy documented
- [ ] Trump book cover direction approved (Brand proposes 5 variants; you pick)
- [ ] Refund policy decided
- [ ] All .env variables sent to CTO

**Questions?** Ask CTO (tech), Brand/Design (brand), or CEO (decision process).

---

**Next:** Sunday standups start. CTO deploys stub app + schema. Brand/Design delivers logo + cover redesigns. Head of Growth starts Reddit presence.

**You're green for launch.** Let's ship.
