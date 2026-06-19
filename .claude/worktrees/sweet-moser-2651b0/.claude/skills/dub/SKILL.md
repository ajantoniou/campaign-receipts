---
name: dub
description: >
  Tracked short links via Dub.co for SEALED Press and CampaignReceipts.
  Know which channels drive conversions. SaaS free tier (1K links/mo).
  Status: READY — deploy when launching marketing campaigns.
---

# Dub.co (Link Tracking)

**Status:** Ready (deploy when marketing campaigns begin)

## Why Dub.co

- Track which channel drives your first $29 (SEALED) or Pro signup (CR)
- Click analytics with referrer data and UTM support
- API access on free tier (1K links/mo)
- Data syncs to Supabase `directory.link_clicks` via cron

## Deploy Checklist

1. Create Dub.co account → generate API key
2. Set env vars in root `.env`:
   - `DUB_API_KEY`
   - `DUB_WORKSPACE_ID`
3. Run Supabase migration: `003_link_clicks.sql`
4. Deploy sync cron on Render (daily at 04:00 UTC)

## API Usage

```bash
# Create a tracked link
curl -X POST "https://api.dub.co/links" \
  -H "Authorization: Bearer DUB_API_KEY" \
  -d '{"url":"https://campaignreceipts.com/politician/trump","domain":"dub.sh"}'

# Get click analytics
curl "https://api.dub.co/analytics?linkId=LINK_ID" \
  -H "Authorization: Bearer DUB_API_KEY"
```

## Supabase Table

`directory.link_clicks` — synced daily from Dub API:
- link_id, url, short_url, clicks_total, last_click_at, company, synced_at

## Cost

$0 (SaaS free tier: 1K links/mo, API included)
