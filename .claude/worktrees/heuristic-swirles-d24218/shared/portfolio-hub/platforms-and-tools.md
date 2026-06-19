# Platforms & tools — portfolio guide

**Purpose:** One map of **every spine vendor** the portfolio uses: what it is for, which **`.env` names** agents expect (values never in git), and **where the deep instructions** already live. This file does not replace vendor docs — it routes you to ours.

**Provisioning walkthrough:** [`infrastructure/SETUP.md`](../../infrastructure/SETUP.md)

---

## Spine platforms (one account each — shared across companies)

| Platform | Role in this repo | Key `.env` names (names only) | How-to / policy |
|----------|-------------------|-------------------------------|-----------------|
| **GitHub** | Source host, CI, PRs | `GITHUB_PAT` | PAT usage implicit in workflows; prefer fine-grained PAT per signup matrix |
| **Render** | Web apps, workers, cron | `RENDER_API_KEY` | [`infrastructure/SETUP.md`](../../infrastructure/SETUP.md) Part 1; Render Dashboard API key + Render MCP when configured in Cursor |
| **Supabase** | Postgres, Auth, multi-schema portfolio DB | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID` | [`infrastructure/SETUP.md`](../../infrastructure/SETUP.md) Part 3; [`shared/docs/supabase-backup-policy.md`](../docs/supabase-backup-policy.md); local migrations under `*/supabase/migrations/` per company |
| **Stripe** | Primary payments (multi-brand Products) | Company-specific `*_STRIPE_*` in `.env` lanes | Dashboard onboarding per company |
| **Cloudflare** | Registrar, DNS, email routing, Workers/D1 (analytics OSS) | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | [**cloudflare-platform.md**](cloudflare-platform.md); scripts: `infrastructure/scripts/buy-domain.py` |

---

## Email & comms

| Platform | Role | Key `.env` names | How-to / policy |
|----------|------|------------------|-----------------|
| **Resend** | Transactional email (portfolio + several web routes) | `RESEND_API_KEY`, `RESEND_FROM` | Verify sending domain in Resend dashboard; wire route handlers per company |
| **Gmail (SMTP + OAuth)** | Per-company digests; Gmail REST automation | `GMAIL_API_*`, per-company `*_GMAIL_*` | [**environment-and-secrets.md**](environment-and-secrets.md) |
| **Mailchimp** | Legacy / newsletter flows where still referenced | `MAILCHIMP_API_KEY`, `MAILCHIMP_DC_REGION`, `MAILCHIMP_AUDIENCE_ID` | Consolidation target — prefer **one** marketing ESP long-term |

---

## Payments & commerce (merchant-of-record)

| Platform | Role | Key `.env` names | How-to / policy |
|----------|------|------------------|-----------------|
| **Lemon Squeezy** | SEALED / legacy MoR flows — **do not** open duplicate payment companies | `LEMONSQUEEZY_*` (store, API, webhooks, sealed product IDs) | Extracted playbook notes: [`shared/knowledge/ls-creators-guide-insights.md`](../knowledge/ls-creators-guide-insights.md) |

---

## LLMs & media APIs

| Platform | Role | Key `.env` names | Notes |
|----------|------|------------------|-------|
| **Anthropic** | Strategy + coding agents | `ANTHROPIC_API_KEY` | Model overrides optional — see root `.env` comments |
| **DeepSeek** | Volume / execution | `DEEPSEEK_API_KEY` | |
| **xAI (Grok)** | A/B volume | `XAI_API_KEY` | |
| **ElevenLabs** | TTS where wired (e.g. NT pipeline) | `ELEVENLABS_API_KEY`, company-specific vars in SETUP | |

---

## Government / data APIs (no “signup” like SaaS)

| Platform | Role | Key `.env` names | Notes |
|----------|------|------------------|-------|
| **FEC** | Civic data experiments | `FEC_API_KEY` (`DEMO_KEY` ok for dev) | Rate limits — verify before production |

---

## Observability & analytics

| Platform | Role | Doc |
|----------|------|-----|
| **Agent Analytics** (OSS default) | Page/product analytics, agent-readable stats | **Sites:** [**agent-analytics-web-wiring.md**](agent-analytics-web-wiring.md); skill: [`shared/skills/agent-analytics/SKILL.md`](../skills/agent-analytics/SKILL.md) |
| **PostHog** (optional) | Session replay, feature flags, experiments — **not** required | Add **only** if you need capabilities Agent Analytics does not cover; otherwise avoid a second full-stack analytics vendor |
| **Sentry** (optional) | Error tracking | `PORTFOLIO_SENTRY_DSN` | When enabled per service |

**Agent Analytics vs PostHog:** The portfolio’s default product analytics is **Agent Analytics** (OSS or their cloud). **You do not need a PostHog account** for baseline funnels, page views, and agent/CLI access to stats. Consider PostHog later if you explicitly want **session replay**, **feature flags**, or **A/B testing** in one hosted product — and then decide whether to **replace** AA in the browser (avoid double-loading two trackers on every page).

---

## Slack / alerts

| Platform | Role | Key `.env` names |
|----------|------|------------------|
| **Slack** | Portfolio alerts (when wired) | `PORTFOLIO_SLACK_WEBHOOK_URL` |

---

## How to use this doc

1. **Agents:** Identify the vendor → confirm keys exist in **root `.env`** (names only in chat) → follow the linked repo doc → obey **`credentials-and-push-safety`** workspace rule.
2. **Founders:** Use **`infrastructure/SETUP.md`** for ordered provisioning.
3. **Gaps:** If a vendor is in `.env` but missing from this table, add a row here in the same PR as the new secret name documentation.

---

*Keep tables scoped to portfolio-wide spine; company-specific webhook URLs belong in each company's `permissions-and-configurations.md`.*
