---
name: formbricks
description: >
  Micro-surveys and structured dispute forms. SEALED /sample intent
  capture, CampaignReceipts dispute submission with fact-check workflow.
  Self-hosted on Render. Status: READY — deploy when sites have traffic.
---

# Formbricks (Surveys + Dispute Forms)

**Status:** Ready (deploy when sites have traffic)

## Use Cases

### SEALED Press — Intent Capture
Embed on `/sample` page after PDF download:
- "What would you use this book for?" (teacher/journalist/debate prep/personal)
- Answers determine where to focus $0 marketing budget

### CampaignReceipts — Dispute Submission
Replace manual email workflow with structured form on politician pages:
- Formbricks webhook → `app/api/formbricks-webhook/route.ts` → `directory.disputes`
- Adds `fact_check_status` and `fact_check_result` columns
- Claude can query disputes table to fact-check claims against primary sources

## Deploy Checklist

1. Create Render Docker service: image `formbricks/formbricks`, starter plan (~$7/mo)
2. Set env vars in root `.env`:
   - `FORMBRICKS_URL`
   - `FORMBRICKS_API_KEY`
   - `FORMBRICKS_ENCRYPTION_KEY` (generate: `openssl rand -hex 32`)
3. First login → create surveys → configure webhook URL
4. Run migration: `004_disputes_enrichment.sql` (CampaignReceipts)
5. Embed JS snippet in layout files

## Fact-Check Workflow (CampaignReceipts)

1. User submits dispute via Formbricks form on politician page
2. Webhook inserts into `directory.disputes` with `fact_check_status = 'pending'`
3. Claude agent queries disputes, cross-references against:
   - Congress.gov votes
   - CBO scoring
   - Court records
   - Original promise sources in `directory.receipts`
4. Updates `fact_check_result` with findings + evidence URLs
5. Reviewer approves/rejects verdict change

## Cost

~$7/mo on Render starter plan
