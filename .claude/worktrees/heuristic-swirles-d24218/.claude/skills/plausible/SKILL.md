---
name: plausible
description: >
  Privacy-first web analytics via Plausible CE. Self-hosted on Render.
  Use for page view tracking, referrer source analysis, and feeding
  page_views_30d into CampaignReceipts for auto-upgrade logic.
  Status: READY — deploy when traffic justifies cost (~$14-21/mo).
---

# Plausible Analytics

**Status:** Ready (deferred until traffic/revenue justifies cost)

## Why Plausible

- Built-in referrer source dashboard (know who's linking to you)
- Stats API returns `referrers` and `pages` breakdowns natively
- No cookies → no cookie banner → one less friction point
- Can feed `page_views_30d` into CampaignReceipts' `directory.politicians` for auto-upgrade

## Deploy Checklist

1. Create ClickHouse Cloud account (free tier) → get connection string
2. Create Render Docker service: image `plausible/community-edition`, starter plan (~$7/mo)
3. Set env vars in root `.env`:
   - `PLAUSIBLE_BASE_URL`
   - `PLAUSIBLE_API_KEY` (from Plausible settings after first login)
   - `CLICKHOUSE_DATABASE_URL`
4. First login → create sites for all 3 companies
5. Add `<script>` tag to each company's `app/layout.tsx`:
   ```html
   <script defer data-domain="yourdomain.com" src="https://YOUR_PLAUSIBLE_URL/js/script.js"></script>
   ```
6. Set up daily cron to sync page views → `directory.politicians.page_views_30d`

## Stats API Usage

```bash
# Page views by page (last 30 days)
curl "PLAUSIBLE_BASE_URL/api/v1/stats/breakdown?site_id=DOMAIN&period=30d&property=event:page"

# Referrer sources
curl "PLAUSIBLE_BASE_URL/api/v1/stats/breakdown?site_id=DOMAIN&period=30d&property=visit:source"
```

## Cost

~$14-21/mo (Render service + ClickHouse Cloud free tier)
