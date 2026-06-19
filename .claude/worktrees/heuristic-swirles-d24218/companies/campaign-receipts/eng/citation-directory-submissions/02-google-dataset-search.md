# Google Dataset Search

**Status:** SUBMITTED (auto-indexed via JSON-LD)
**Date:** 2026-05-19
**Submission method:** schema.org `Dataset` JSON-LD injected into page `<head>`

## Implementation

Added `<script type="application/ld+json">` to:

- `app/politician/[slug]/page.tsx` — per-politician Dataset block (graded count,
  primary-source attribution, CC-BY-4.0 license, SEALED Press publisher)
- `app/trump/page.tsx` — Trump 2016 corpus Dataset block (145 promises, 81
  linking to primary source)

## Why this is the highest-leverage SEO win

Google Dataset Search is the canonical citation directory for academic
researchers. Auto-crawled, no manual submission, no maintainer review.
A correctly-structured Dataset JSON-LD = inclusion within ~4-8 weeks of next
crawl.

## Verification (post-deploy)

```bash
curl -sS https://campaignreceipts.com/trump | grep -o 'schema.org/Dataset' | head -1
curl -sS https://campaignreceipts.com/politician/donald-trump | grep -o 'schema.org' | head -1
```

Then confirm at https://datasetsearch.research.google.com/ search for
"CampaignReceipts" — listing should appear after next Google crawl cycle.
