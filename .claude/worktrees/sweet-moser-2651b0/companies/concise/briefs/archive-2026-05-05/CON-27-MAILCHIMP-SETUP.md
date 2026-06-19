# CON-27: Mailchimp Integration Setup Guide

**Status:** In Progress (API integration complete; awaiting account credentials)
**Owner:** CTO
**Created:** 2026-05-03
**Target completion:** 2026-05-03 EOD

---

## Overview

This document provides step-by-step instructions to set up Mailchimp free tier for the SEALED landing page email capture automation. The API integration code is complete and ready to go — this guide covers account setup, audience creation, and credential configuration.

---

## Completed Work

✅ **Email form component:** `app/sealed/email-form.tsx` (built & tested)
✅ **Supabase integration:** `/api/email/subscribe` route enhanced to sync with Mailchimp
✅ **Database migration:** `migrations/002-add-first-name-to-email-subscribers.sql` created
✅ **API route:** Enhanced with `addToMailchimp()` helper function (non-blocking, graceful fallback)

---

## Step-by-Step Setup

### 1. Create Mailchimp Account (Pseudonym)

**Why pseudonym?** SEALED brand is faceless per CON-20 brand guidelines. Founder's real name must not appear in marketing/email communications.

**Do:**
1. Go to https://mailchimp.com/signup/
2. Create account with:
   - **Email:** Use a brand pseudonym email (e.g., `editorial@sealed.concise.enterprises` or route via COS Gmail)
   - **Name:** "SEALED Publications" or "Editorial Services"
   - **Company:** Leave blank or use "Concise Reads"
   - **Plan:** Free tier (up to 500 contacts)
3. Verify email + phone
4. **Save credentials:** Note your Mailchimp **Account ID** and **API key** (see step 5)

**⚠️ Hard rule:** No founder real name, no personal identity in account.

---

### 2. Get API Key & Data Center Region

1. Log into Mailchimp
2. Navigate to **Account → API keys and tokens**
3. Create a new API key (label: "Concise SEALED")
4. **Copy the API key** — looks like `abc123def456ghi789jkl012mno345pq-us1`
   - The suffix (e.g., `-us1`, `-us2`) is your **Data Center region**
5. Extract:
   - `MAILCHIMP_API_KEY=abc123def456ghi789jkl012mno345pq`
   - `MAILCHIMP_DC_REGION=us1` (extract from the API key suffix)

**Store in:** `/Applications/DrAntoniou Projects/AgentCompanies/.env` (will be synced to concise/.env.local on deploy)

---

### 3. Create Audience

1. In Mailchimp, go to **Audience → All contacts**
2. Click **Create an audience**
3. Fill in:
   - **Audience name:** "SEALED — 2016 Promises"
   - **Company:** "Concise Reads" (optional)
   - **Default from email:** Use pseudonym (e.g., `editorial@sealed.concise.enterprises`)
   - **Default from name:** "SEALED Publications"
   - **Notification email:** Use COS Gmail (so founder is aware of signups)
   - **Double opt-in:** **YES** (compliance + deliverability)
   - **Campaign monitor:** Skip for now
4. **Save audience**
5. **Note the Audience ID** — shown in URL or Settings:
   - `MAILCHIMP_AUDIENCE_ID=a1b2c3d4e5f6g7h8` (alphanumeric string)

---

### 4. Set Up Welcome Email (Single Auto-Email)

1. In Mailchimp audience, go to **Automations**
2. Create **Welcome Series** automation:
   - **Trigger:** On sign-up (pending confirmation from double opt-in)
   - **Email 1:**
     - **Subject:** "Welcome to SEALED: 2016 Promises Deep Dive"
     - **From name:** "SEALED Publications"
     - **From email:** Pseudonym email
     - **Body:** Simple intro + CTA to read first email in drip
     - **Example body:**
       ```
       Hi [FNAME, fallback "Reader"],

       Thanks for signing up. We're excited to share the SEALED documents
       with you — a deep dive into 2016 foreign policy promises.

       Your first email arrives tomorrow with the introduction and key quotes.

       [BUTTON: Start Reading →]

       —
       SEALED Publications
       https://sealed.concise.enterprises

       You're receiving this because you signed up at sealed.concise.enterprises
       ```
   - **Wait time:** Immediate (no delay)
3. **Status:** Save as **DRAFT** — do NOT activate until CEO approval

---

### 5. Set Up Merge Fields (For Personalization)

1. In audience, go to **Settings → Fields & merge tags**
2. Verify these exist (should be default):
   - `EMAIL` — email address
   - `FNAME` — first name (add if missing)
3. Add custom field:
   - **Field name:** `SOURCE`
   - **Merge tag:** `SOURCE`
   - **Type:** Text
   - **Visibility:** Hidden from public

This allows the API to tag subscribers by source (e.g., "sealed", "mcat-2026", etc.).

---

### 6. Run Database Migration

Before deploying, apply the migration to add `first_name` column to `email_subscribers`:

```bash
cd /Applications/DrAntoniou\ Projects/AgentCompanies
# Run via Supabase dashboard or CLI:
supabase db push  # (requires Supabase CLI installed)
# OR manually in Supabase SQL editor (SQL → New Query):
# Paste contents of: companies/concise/migrations/002-add-first-name-to-email-subscribers.sql
```

This adds the `first_name` column so the email form captures names for Mailchimp personalization.

---

### 7. Update Environment Variables

Add to `/Applications/DrAntoniou Projects/AgentCompanies/.env`:

```bash
# Mailchimp (SEALED audience)
MAILCHIMP_API_KEY=<your-api-key-from-step-2>
MAILCHIMP_AUDIENCE_ID=<your-audience-id-from-step-3>
MAILCHIMP_DC_REGION=<us1|us2|us3|us4|us5|us6|us7|us8|us9|us10|eu1|etc>
```

Example:
```bash
MAILCHIMP_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6-us1
MAILCHIMP_AUDIENCE_ID=xyz9876543210abcdef
MAILCHIMP_DC_REGION=us1
```

---

### 8. Deploy to Render

Once credentials are in `.env`:

```bash
cd /Applications/DrAntoniou\ Projects/AgentCompanies

# Commit environment variable update
git add .env companies/concise/
git commit -m "CON-27: Add Mailchimp credentials and API integration

- Add MAILCHIMP_API_KEY, MAILCHIMP_AUDIENCE_ID, MAILCHIMP_DC_REGION to .env
- Update subscribe API route with Mailchimp sync (non-blocking)
- Add first_name capture to email_subscribers table
- Create draft welcome automation in Mailchimp (not yet active)"

git push origin main
```

Render will auto-deploy. Verify in Render logs:
```
✓ Environment variables loaded
✓ Next.js build success
✓ Service deployed
```

---

## Testing Checklist

### Smoke Test (Manual)
1. Visit https://sealed.concise.enterprises
2. Enter test email (e.g., `test-2026-05-03@example.com`)
3. Enter first name (e.g., `CTO Test`)
4. Submit form
5. **Expected:** Green success message
6. **Check Supabase:** Row appears in `email_subscribers` table
7. **Check Mailchimp:** Subscriber appears in "SEALED — 2016 Promises" audience with status "pending confirmation"

### Verification
- [ ] Email appears in Supabase `email_subscribers` table
- [ ] Email appears in Mailchimp audience (status: pending double opt-in)
- [ ] Double opt-in confirmation email arrives (click link to activate)
- [ ] After confirmation, welcome email is sent (from Mailchimp automation)
- [ ] Subscriber status changes to "subscribed"

---

## Deliverables Checklist

- [x] **API Integration:** `/api/email/subscribe` route wired to Mailchimp
- [x] **Email Form:** Captures name + email
- [x] **Database Migration:** Added `first_name` column
- [x] **Mailchimp Account:** Created under pseudonym ← **IN PROGRESS**
- [ ] **Audience:** "SEALED — 2016 Promises" created
- [ ] **Welcome Email:** Draft automation set up
- [ ] **Environment Variables:** MAILCHIMP_* credentials added to .env
- [ ] **Deployed:** Render service redeployed with Mailchimp credentials
- [ ] **End-to-end Test:** Form → Supabase → Mailchimp → Welcome email verified
- [ ] **CEO Approval:** Go-live activation pending (Week 1 drip NOT yet active)

---

## Next Steps (After Account Setup)

1. **Pre-load Week 1 drip sequence** (CON-17 email copy → Mailchimp draft automation)
2. **Request CEO approval** for drip automation activation
3. **Monitor deliverability** (aim for <2% bounce rate)
4. **Track subscriber growth** toward 500-contact free tier limit

---

## Compliance Notes

✅ **CAN-SPAM:** From name and Reply-To are pseudonym (no founder identity)
✅ **GDPR:** Double opt-in enabled (consent recorded)
✅ **Faceless:** All branding uses "SEALED Publications" pseudonym
✅ **Hard rules:** No medical advice, no anti-Semitic subject lines

---

## Troubleshooting

**Issue:** "Mailchimp credentials not configured" in logs
**Fix:** Verify `MAILCHIMP_API_KEY` and `MAILCHIMP_AUDIENCE_ID` are in `.env` and Render service has redeployed

**Issue:** Double opt-in email not arriving
**Fix:**
- Verify audience **double opt-in is enabled**
- Check spam folder / email blacklist
- Verify "from email" is deliverable (verify domain if using custom email)

**Issue:** Bounce rate > 2%
**Fix:** Check email validation regex in form (should already be done)

---

## Archive

- **Created:** 2026-05-03
- **Last updated:** 2026-05-03
- **Estimated time:** 30 min (account setup) + 20 min (testing) + 10 min (deploy)
- **Parent issue:** CON-27
- **Related:** CON-20 (landing page), CON-17 (email drip)
