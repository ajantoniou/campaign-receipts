# Internet Archive — Wayback Machine

**Status:** SUBMITTED
**Date:** 2026-05-19
**Submission method:** `GET https://web.archive.org/save/{URL}` (public, no auth required)

## URLs submitted

1. https://campaignreceipts.com
2. https://campaignreceipts.com/trump
3. https://campaignreceipts.com/2024-trump-campaign-promises
4. https://campaignreceipts.com/methodology
5. https://campaignreceipts.com/sources
6. https://campaignreceipts.com/directory
7. https://campaignreceipts.com/leaderboard
8. https://campaignreceipts.com/for-journalists

## Confirmed snapshots (queried via Wayback Availability API, 2026-05-19)

- /methodology → http://web.archive.org/web/20260520020328/https://campaignreceipts.com/methodology
- /sources → http://web.archive.org/web/20260520020505/https://campaignreceipts.com/sources
- /directory → http://web.archive.org/web/20260520020614/https://campaignreceipts.com/directory
- /leaderboard → http://web.archive.org/web/20260520020713/https://campaignreceipts.com/leaderboard
- /trump (redirected) → http://web.archive.org/web/20260520020216/https://campaignreceipts.com/politician/donald-trump-2016
- /politician/donald-trump-2016 → same snapshot above

In-flight (submitted, awaiting Wayback indexer to surface):
- /, /trump (canonical), /2024-trump-campaign-promises, /for-journalists,
  /politician/{donald-trump, joe-biden, kamala-harris, jd-vance}

Wayback's Save Page Now sometimes accepts a job and indexes it 5-15 minutes
later. The in-flight submissions should appear by 2026-05-19 EOD.

## Verification command

```bash
curl -sS "https://archive.org/wayback/available?url=https://campaignreceipts.com/methodology"
```

## Notes

Wayback is the canonical citation backend; once a URL is here, journalists
can cite the snapshot and it persists permanently. No human action needed
to maintain.
