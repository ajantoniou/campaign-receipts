---
name: refferq
description: >
  Open-source referral/affiliate program for SaaS. Deploy at 10+ paying
  customers. EstimateProof: "refer a shop, get a free month." SEALED:
  "share link, get 20% off research bundle." Status: READY (milestone-gated).
---

# Refferq (Referral Program)

**Status:** Ready — deploy at 10+ paying customers
**Repo:** `Refferq/Refferq` (MIT)

## What It Does

Real-time referral tracking, flexible commissions (percentage + fixed),
38+ API endpoints, automated payouts, admin panel. Next.js 15 + PostgreSQL.

## Company Strategies

### EstimateProof
- "Refer a shop → get 1 month free" ($49 value)
- Tracked via unique referral link per customer
- Commission: credit-based (not cash)

### SEALED Press
- "Share your receipt link → get 20% off research bundle"
- Tracked via Dub.co short link + Refferq
- Commission: discount code

## Deploy Checklist (when triggered)

1. Create Render Docker service: image from `Refferq/Refferq`, starter plan (~$7/mo)
2. Connect to Supabase PostgreSQL
3. Configure commission rules per company
4. Embed referral widget in post-purchase/dashboard pages

## Cost

~$7/mo on Render starter plan (only when deployed)
