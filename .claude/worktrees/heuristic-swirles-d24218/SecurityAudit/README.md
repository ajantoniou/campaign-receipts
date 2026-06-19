# Security Audit

**Date:** 2026-05-12
**Scope:** estimateproof.com, sealed2016.com, campaignreceipts.com
**Method:** External black-box adversarial recon (no credentials, no source code initially), followed by source-level review and remediation.

## Documents

| File | Purpose |
|------|---------|
| [FINDINGS.md](FINDINGS.md) | All findings by severity with fix status |
| [SELF_AUDIT_CHECKLIST.md](SELF_AUDIT_CHECKLIST.md) | Reusable weekend self-audit checklist |
| [HARDENING_GUIDE.md](HARDENING_GUIDE.md) | Ongoing security hardening patterns |

## Running a future audit

Use the **security-auditor** persona at [`companies/portfolio-hq/personas/security-auditor/SOUL.md`](../companies/portfolio-hq/personas/security-auditor/SOUL.md). It contains the full methodology (external recon → source review → remediation → documentation), the priority checklist, hard rules, and the services inventory. Paste the SOUL.md as system prompt or reference it when starting a new audit session.

## Architecture overview

All three sites are Next.js 14 apps deployed on Render.com with a shared Supabase backend.

- **estimateproof.com** (`companies/estimateproof/site`) — SaaS vehicle intelligence reports. Auth via Supabase magic links. Payments via LemonSqueezy.
- **sealed2016.com** (`companies/concise-sealed`) — Book sales landing page. Payments via LemonSqueezy.
- **campaignreceipts.com** (`companies/campaign-receipts`) — Public politician promise-tracking directory. No auth, no payments.

Shared infrastructure:
- `shared/config/security-headers.js` — HSTS, X-Frame-Options, CSP, etc.
- Single `.env` at monorepo root (gitignored)
- Supabase project with per-app schemas + RLS

## What was already secure

- Webhook HMAC-SHA256 signature validation with `timingSafeEqual`
- `SUPABASE_SERVICE_ROLE_KEY` never exposed in frontend bundles
- Report PDF endpoint validates `owner_id === user.id` (no IDOR)
- Dashboard routes gated by Supabase session middleware

## What was fixed (2026-05-12)

1. Health endpoints stripped of buildId, service name, and env inventory
2. robots.txt and sitemap.ts no longer leak Render origin URL
3. CSP header added to shared security headers
4. Security headers applied to campaignreceipts (was missing)
5. LemonSqueezy products admin endpoint now requires API key
6. Rate limiting added to all subscribe/waitlist endpoints
7. Auth callback fixed: open redirect prevention + correct server-side Supabase client
8. Webhook replay protection (timestamp validation) added to both webhook handlers
9. PII stripped from webhook response bodies
