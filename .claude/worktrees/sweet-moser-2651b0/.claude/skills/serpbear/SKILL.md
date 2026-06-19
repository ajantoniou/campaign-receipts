---
name: serpbear
description: >
  Keyword rank tracking for all portfolio companies. Daily Google rank
  checks, email alerts on position changes. Self-hosted on Render.
  Status: READY — deploy when SEO matters.
---

# SerpBear (SEO Rank Tracking)

**Status:** Ready

## What It Does

Daily keyword rank checks on Google. Unlimited domains/keywords.
Email alerts when positions change. Self-hosted, no data leaves your infra.

## Target Keywords

### SEALED Press
- "trump campaign promises 2016", "trump promise tracker", "campaign promise book"

### CampaignReceipts
- "politician promise tracker", "campaign receipts", "who kept their promises"
- "bipartisan promise tracking", "[politician name] promises"

### EstimateProof
- "mechanic vehicle report", "NHTSA recall check", "OEM maintenance schedule"
- "car repair estimate tool", "vehicle intelligence report"

## Deploy Checklist

1. Create Render Docker service: image `niciche/serpbear`, starter plan (~$7/mo)
2. Set env vars in root `.env`:
   - `SERPBEAR_URL`
   - `SERPBEAR_API_KEY`
   - `SERPBEAR_SECRET` (generate: `openssl rand -hex 32`)
3. First login → add 3 domains → seed keyword lists above

## Cost

~$7/mo on Render starter plan
