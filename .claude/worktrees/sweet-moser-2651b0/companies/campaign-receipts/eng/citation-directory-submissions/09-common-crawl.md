# Common Crawl

**Status:** SUBMITTED (passive)
**Date:** 2026-05-19
**Submission method:** Common Crawl auto-discovers via sitemaps + public
backlinks; no submission API. Best practice = ensure `/sitemap.xml` is
exposed and linked from homepage.

## Verification

CR already exposes `app/sitemap.ts` (Next.js route handler). The sitemap
is served at `https://campaignreceipts.com/sitemap.xml` and will be
discovered on Common Crawl's next monthly crawl cycle (~30-45 days).

## No action required

Common Crawl is the upstream corpus that feeds Hugging Face's web datasets,
GPT-class training data, and academic NLP work. Inclusion = downstream
ripple effect we don't have to chase.
