# AgentCompanies

Founder's portfolio of small bets (Concise, NT Ministry, HealthBrew, CarStack/EstimateProof, Campaign Receipts / SEALED, Cliros, etc.). Founder ≤ 12 hrs/week, single Claude Code session per work block, subagent experts spawned on demand for second opinions.

## Regain context (new session)

Read in this order:

1. **[`BIBLE.md`](BIBLE.md)** — hard rules (faceless, pseudonym, HIPAA, money caps, security). Read §2 + §3 before shipping anything customer-facing.
2. **[`PORTFOLIO_BRIEF.md`](PORTFOLIO_BRIEF.md)** — what each company is, tier, budget, kill criteria.
3. **[`FOUNDER_ACTIONS.md`](FOUNDER_ACTIONS.md)** — current founder-only TODOs.
4. **[`shared/portfolio-hub/README.md`](shared/portfolio-hub/README.md)** — `.env` rules, platforms (Resend, Cloudflare, Supabase, Render, Lemon Squeezy), shared knowledge index.
5. **YouTube pipeline (all channels):** [`shared/portfolio-hub/youtube-production-pipeline.md`](shared/portfolio-hub/youtube-production-pipeline.md) — council lanes, 8-gate QC, MrBeast copy + production, viral Shorts splicer.

---

## Operating model

One Claude Code session per work block. When a decision needs critique or a second opinion, spawn subagent experts (architect, designer, compliance reviewer, etc.) via the Agent tool. No standing multi-agent framework, no cron heartbeats, no hourly briefings.

Work happens directly on `companies/<name>/`. Cross-cutting concerns (design tokens, security headers, shared skills) live in `shared/`.

> **Deprecated 2026-05-21:** The previous Paperclip + Chief-of-Staff + per-company-CEO multi-agent layer was removed. The orchestration overhead wasn't paying for itself.

---

## Repo map

| Path | Purpose |
|------|---------|
| `.env` (gitignored) | Single vault for API keys — never commit |
| [`shared/portfolio-hub/`](shared/portfolio-hub/README.md) | Central ops index |
| [`shared/skills/`](shared/skills/SKILLS_ROADMAP.md) | Shared Claude skills |
| [`companies/`](companies/README.md) | Per-company vision, briefs, source |
| [`infrastructure/`](infrastructure/SETUP.md) | Shared scripts |

**Stack cheat sheet:** [`shared/portfolio-hub/platforms-and-tools.md`](shared/portfolio-hub/platforms-and-tools.md).
