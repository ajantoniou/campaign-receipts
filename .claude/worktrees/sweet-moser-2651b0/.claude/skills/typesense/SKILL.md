---
name: typesense
description: >
  Instant search for CampaignReceipts. 226 politicians, ~4500 promises,
  typo-tolerant, faceted, sub-10ms. Self-hosted on Render. Use when
  adding search features, rebuilding indexes, or tuning search relevance.
---

# Typesense (Instant Search)

**Status:** Deploy ready

## Why Typesense

CampaignReceipts' viral mechanic: "who promised to lower insulin prices?"
Needs instant, typo-tolerant search across politicians and promises.
Supabase full-text search works but Typesense gives faceted filtering
and sub-10ms results.

## Collections

### politicians
Fields: name, party, state, branch, ideology_label, scorecard_percentage_kept,
professional_background, profile_narrative

### promises
Fields: promise_text, verdict, category, politician_name, politician_slug,
case_study_narrative

## Deploy Checklist

1. Create Render Docker service: image `typesense/typesense:27.1`, starter plan with disk (~$7/mo)
2. Set env vars in root `.env`:
   - `TYPESENSE_API_KEY` (generate: `openssl rand -hex 32`)
   - `TYPESENSE_HOST` (Render service URL without https://)
   - `TYPESENSE_PROTOCOL=https`
3. Run indexing: `node companies/campaign-receipts/scripts/typesense-index.mjs`
4. Set up nightly re-index cron on Render (02:00 UTC)

## Files in campaign-receipts

- `scripts/typesense-index.mjs` — reads from Supabase, creates/updates collections
- `app/api/search/route.ts` — proxy to Typesense multi-search
- `app/components/SearchBar.tsx` — instant search UI in header

## Search API

```bash
# Multi-search across both collections
curl -X POST "https://TYPESENSE_HOST/multi_search" \
  -H "X-TYPESENSE-API-KEY: KEY" \
  -d '{"searches":[
    {"collection":"politicians","q":"healthcare","query_by":"name,profile_narrative"},
    {"collection":"promises","q":"healthcare","query_by":"promise_text,category"}
  ]}'
```

## Cost

~$7/mo on Render starter plan with persistent disk
