---
name: agent-analytics
description: >
  Portfolio-wide Agent Analytics: OSS Cloudflare Workers+D1 or managed cloud,
  Paperclip Live plugin binding per company, env vars in monorepo root `.env`,
  and CoS deployment smoke checks. Use when configuring analytics, Wrangler,
  D1, the `@agent-analytics/paperclip-live-analytics-plugin`, or interpreting
  `/tokens/verify` vs Workers API errors.
---

# Agent Analytics (portfolio)

## Canonical docs (read before changing infra)

- Brief (Paperclip plugin + OSS paths): [`companies/portfolio-hq/briefs/2026-05-07-agent-analytics-paperclip-plugin.md`](../../../companies/portfolio-hq/briefs/2026-05-07-agent-analytics-paperclip-plugin.md)
- Upstream OSS: [Agent-Analytics/agent-analytics](https://github.com/Agent-Analytics/agent-analytics)
- Paperclip plugin install (run from local Paperclip tree): `npx paperclipai plugin install @agent-analytics/paperclip-live-analytics-plugin`

## Where this skill lives

**Source of truth:** `shared/skills/agent-analytics/` (this folder).  
Portfolio HQ holds **briefs and coordination**, not duplicate skill bodies.  
**Cursor:** `.cursor/skills/agent-analytics` → `shared/skills/agent-analytics`.  
**Claude Code:** `.claude/skills/agent-analytics` → same folder.  
Author only under **`shared/skills/`**; keep both symlinks updated when renaming.

## Environment (monorepo root `.env`)

| Variable | Role |
|----------|------|
| `CLOUDFLARE_API_TOKEN` | Existing user token (`cfut_…`) — DNS / zones where scoped |
| `CLOUDFLARE_ACCOUNT_API_TOKEN` | Account API token (`cfat_…`) — account-level APIs, Workers/D1 deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Must match the account the token can act on |

Smoke (pick the path that matches token type):

- User-style token (`cfut_`): `GET /client/v4/user/tokens/verify`
- Account API token (`cfat_`): `GET /client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/tokens/verify`

Both use `Authorization: Bearer <token>`. Other account APIs live under `/accounts/{CLOUDFLARE_ACCOUNT_ID}/…`.

Do **not** commit `.env`; it stays gitignored.

## Per-company Paperclip work

Each Paperclip company picks its Agent Analytics **project** in plugin settings. Issues (configure/bind): **POR-211**, **HEA-136**, **CON-162**, **CAR-57**, **NTM-131**, **VOT-86**.

## Public websites (Next.js / marketing pages)

Wire **`tracker.js`** + env vars per [**`shared/portfolio-hub/agent-analytics-web-wiring.md`**](../../portfolio-hub/agent-analytics-web-wiring.md) so every live domain sends events to the same OSS or cloud collector (distinct `data-project` per site).

## When NOT to assume Supabase

Stock OSS Agent Analytics stores events in **D1 or SQLite**, not in the portfolio Supabase Postgres project unless you deliberately add a custom adapter.
