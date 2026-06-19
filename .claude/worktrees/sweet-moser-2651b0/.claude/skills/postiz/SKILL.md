---
name: postiz
description: >
  Social media auto-posting to 30+ platforms (X, LinkedIn, Reddit,
  Bluesky, etc). Schedule content and it fires unattended. Currently
  deferred — no social media marketing active. Status: EVALUATED.
---

# Postiz (Social Media Automation)

**Status:** Evaluated — not deploying (no social media marketing active)
**Repo:** `gitroomhq/postiz-app` (15k+ stars, Apache 2.0)

## What It Does

Schedule and auto-publish to X, LinkedIn, Reddit, Bluesky, YouTube,
TikTok, Instagram, Threads, Mastodon, Pinterest, Slack, Discord.
AI-assisted content creation. Template-based posting.

## When to Deploy

When any company begins social media marketing. Requires:
- OAuth connection to social accounts (~10 min founder time)
- 2GB+ RAM on Render (Standard plan ~$25/mo)

## Deploy Checklist (when triggered)

1. Create Render Docker service: image `gitroomhq/postiz-app`, standard plan (~$25/mo)
2. Set env vars: `POSTIZ_URL`
3. OAuth connect social accounts
4. Pre-load content: SEALED X thread, EstimateProof Reddit drafts, CR politician spotlights

## Cost

~$25/mo on Render standard plan (needs 2GB+ RAM)
