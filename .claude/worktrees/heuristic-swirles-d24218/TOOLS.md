# Portfolio Tool Stack — Research & Deployment Guide

Reference for all open-source tools evaluated for the AgentCompanies portfolio.
Tools are grouped by category. Status: **Deployed**, **Ready** (skill exists, deploy when triggered), or **Evaluated** (documented, not yet skill-ified).

---

## Analytics & Observability

### Plausible CE (privacy-first web analytics)
- **Repo:** `plausible/analytics` (28k+ stars, Apache 2.0)
- **What:** Page views, referrer sources, UTM tracking, Stats API. No cookies, GDPR-compliant.
- **Why Plausible over Umami:** Built-in referrer source dashboard. Stats API returns `referrers` and `pages` breakdowns natively — can feed `page_views_30d` into CampaignReceipts for auto-upgrade logic.
- **Infra:** Docker (`plausible/community-edition`) + ClickHouse (free cloud tier or self-host). ~$14-21/mo on Render.
- **Companies:** All three (SEALED, CampaignReceipts, EstimateProof)
- **Skill:** `.claude/skills/plausible/SKILL.md`
- **Status:** Ready (deploy when traffic justifies cost)
- **Founder setup:** Create ClickHouse Cloud account, first Plausible login to create sites + generate API key (~10 min)

### Langfuse (LLM observability)
- **Repo:** `langfuse/langfuse` (10k+ stars, MIT)
- **What:** Traces every LLM call with cost, latency, tokens. Alerts on budget thresholds.
- **Why:** EstimateProof calls Claude API in `synthesize.mjs` with a $100/mo cap. Without observability, one edge-case VIN could eat the budget.
- **Infra:** Docker (`langfuse/langfuse`) + Postgres. ~$7/mo on Render.
- **Companies:** EstimateProof
- **Skill:** `.claude/skills/langfuse/SKILL.md`
- **Status:** Deployed
- **Founder setup:** First login to get project keys (~3 min)

### PostHog (product analytics + A/B testing)
- **Repo:** `PostHog/posthog` (25k+ stars, MIT)
- **What:** Analytics, session replay, feature flags, A/B testing, surveys, CDP. All-in-one.
- **Infra:** Docker/K8s. Heavy — prefers K8s. Not ideal for Render starter plans.
- **Status:** Evaluated. Use Plausible for analytics + GrowthBook for A/B if needed.

### GrowthBook (A/B testing + feature flags)
- **Repo:** `growthbook/growthbook` (6k+ stars, MIT)
- **What:** Feature flags + experimentation. Warehouse-native. Lighter than PostHog.
- **Infra:** Docker. ~$7/mo on Render.
- **Status:** Evaluated. Deploy when any site hits 1,000+ monthly visitors.

---

## Link Tracking & Attribution

### Dub.co (short links + analytics)
- **Repo:** `dubinc/dub` (19k+ stars, AGPL)
- **What:** Tracked short links with click analytics, referrer data, UTM support, API access.
- **Why:** Know which channel drives conversions. Essential for SEALED launch content and CampaignReceipts politician share links.
- **Infra:** SaaS free tier recommended (1K links/mo, API included). Self-hosting requires Redis + multi-worker — too heavy for Render.
- **Companies:** SEALED Press, CampaignReceipts
- **Skill:** `.claude/skills/dub/SKILL.md`
- **Status:** Ready (deploy when launching marketing campaigns)
- **Founder setup:** Create account, generate API key (~3 min)
- **Data pipeline:** Cron syncs click data to `directory.link_clicks` in Supabase

---

## Search

### Typesense (instant search)
- **Repo:** `typesense/typesense` (21k+ stars, GPL-3.0)
- **What:** Typo-tolerant, faceted, sub-10ms search. Perfect for structured data (politicians + promises).
- **Why:** CampaignReceipts' viral mechanic — "who promised to lower insulin prices?" — needs instant, forgiving search.
- **Infra:** Docker (`typesense/typesense`) with persistent disk. ~$7/mo on Render.
- **Companies:** CampaignReceipts
- **Skill:** `.claude/skills/typesense/SKILL.md`
- **Status:** Deployed (full install in campaign-receipts)
- **Founder setup:** None

---

## Surveys & Forms

### Formbricks (micro-surveys + dispute forms)
- **Repo:** `formbricks/formbricks` (9k+ stars, AGPL)
- **What:** Embeddable surveys, NPS, exit intent. Self-hostable. Webhook integrations.
- **Why:** SEALED `/sample` page needs intent capture. CampaignReceipts needs structured dispute submission that Claude can fact-check.
- **Infra:** Docker (`formbricks/formbricks`) + Postgres. ~$7/mo on Render.
- **Companies:** SEALED Press, CampaignReceipts
- **Skill:** `.claude/skills/formbricks/SKILL.md`
- **Status:** Ready (deploy when sites have traffic)
- **Founder setup:** First login, configure webhook URL (~2 min)

---

## SEO

### SerpBear (keyword rank tracking)
- **Repo:** `towfiqi/serpbear` (2k+ stars, MIT)
- **What:** Daily keyword rank checks on Google. Unlimited domains/keywords. Email alerts.
- **Infra:** Docker (`niciche/serpbear`). ~$7/mo on Render.
- **Companies:** All three
- **Skill:** `.claude/skills/serpbear/SKILL.md`
- **Status:** Ready
- **Founder setup:** First login, add 3 domains + seed keywords (~5 min)

---

## Social Media Automation

### Postiz (auto-posting to 30+ platforms)
- **Repo:** `gitroomhq/postiz-app` (15k+ stars, Apache 2.0)
- **What:** Schedule and auto-publish to X, LinkedIn, Reddit, Bluesky, YouTube, TikTok, etc. AI-assisted content creation.
- **Infra:** Docker (PostgreSQL + Redis + Temporal). Needs 2GB+ RAM — Standard plan on Render (~$25/mo).
- **Companies:** All three (when social media marketing begins)
- **Status:** Evaluated. Deploy when social media GTM starts.
- **Founder setup:** OAuth connect social accounts (~10 min)

---

## Referral & Affiliate

### Refferq (SaaS referral program)
- **Repo:** `Refferq/Refferq` (MIT)
- **What:** Open-source referral/affiliate tracking. Real-time, flexible commissions, 38+ API endpoints, admin panel.
- **Infra:** Docker (Next.js 15 + PostgreSQL). ~$7/mo on Render.
- **Companies:** EstimateProof ("refer a shop, get a free month"), SEALED ("share link, get 20% off research bundle")
- **Skill:** `.claude/skills/refferq/SKILL.md`
- **Status:** Ready (deploy at 10+ paying customers)
- **Founder setup:** None beyond Render service

---

## Customer Support

### Chatwoot (bot-first support)
- **Repo:** `chatwoot/chatwoot` (22k+ stars, MIT)
- **What:** Live chat widget with bot-first FAQ deflection + email fallback. Maintains EstimateProof's zero-human support rule.
- **Infra:** Docker. ~$7/mo on Render.
- **Companies:** EstimateProof
- **Skill:** `.claude/skills/chatwoot/SKILL.md`
- **Status:** Ready (deploy at 10 paying shops)

---

## Outbound & Email Automation

### Dittofeed (event-driven email journeys)
- **Repo:** `dittofeed/dittofeed` (3k+ stars, MIT, YC-backed)
- **What:** Visual journey builder — email, SMS, push, WhatsApp. Event triggers, branching, drip.
- **Status:** Evaluated. **Not needed** — we have paid Resend + custom drip in EstimateProof. Infra redundancy.

### Listmonk (newsletter manager)
- **Repo:** `knadh/listmonk` (15k+ stars, AGPL)
- **What:** High-performance mailing list manager. Single Go binary.
- **Status:** Evaluated. **Not needed** — Resend handles transactional + drip. No newsletters planned.

---

## CRM

### Twenty CRM (Salesforce alternative)
- **Repo:** `twentyhq/twenty` (45k+ stars, AGPL)
- **What:** Modern CRM with workflow engine, API, native MCP server for Claude integration.
- **Status:** Evaluated. **Not needed now.** EstimateProof has `subscribers` table + `/dashboard/customers` + Resend drip. CRM enrichment columns added to Supabase instead. Revisit if pipeline tracking becomes complex.

---

## Design

### Open Design (design platform + 100+ skills)
- **Repo:** `nexu-io/open-design` (cloned at `open-design/`)
- **Skill:** `.claude/skills/open-design/SKILL.md`
- **Status:** Deployed

### UI UX Pro Max (design system generator)
- **Repo:** `nextlevelbuilder/ui-ux-pro-max-skill`
- **What:** 161 industry-specific rules, 67 UI styles, 161 color palettes, 57 font pairings, design system generator.
- **Location:** `open-design/skills/ui-ux-pro-max/` (full upstream installed)
- **Status:** Deployed

---

## Cost Summary

| Tool | $/mo | Status |
|------|------|--------|
| Plausible + ClickHouse | $14-21 | Ready (needs traffic) |
| Langfuse | $7 | Deployed |
| Typesense | $7 | Deployed |
| Dub.co | $0 | Ready (SaaS free tier) |
| Formbricks | $7 | Ready |
| SerpBear | $7 | Ready |
| Postiz | $25 | Evaluated (no social media yet) |
| Refferq | $7 | Ready (milestone-gated) |
| Chatwoot | $7 | Ready (milestone-gated) |
| **Active total** | **~$14** | Langfuse + Typesense |
| **Full deploy total** | **~$60/mo** | Well under $500 cap |

---

## Supabase Note

**Breaking change (Oct 30, 2026):** New tables in `public` schema won't auto-grant to `anon`/`authenticated`/`service_role`. All migrations in this portfolio now include explicit `GRANT` statements. See proactive migration files in each company's `supabase/migrations/`.
