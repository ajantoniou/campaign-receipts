# Portfolio hub — single entry point for Cursor & Claude

**Purpose:** Credentials rules, shared skills, and platform how-tos that apply across companies.

**Session start:** Follow **[`README.md`](../../README.md) → Regain context** (ordered list). This hub is **step 1** of that list. Company-specific specs stay under `companies/<company>/`.

### Platforms & tools (all vendors in one map)

**[`platforms-and-tools.md`](platforms-and-tools.md)** — Render, Supabase, Stripe, Cloudflare, Resend, Lemon Squeezy, Mailchimp, LLM keys, GitHub, etc.: **role → `.env` names → links** to setup guides.

**OSS default:** [**oss-first-engineering.md**](oss-first-engineering.md) (Open Design, Agent Analytics MIT stack, when to add SaaS).

---

## 1. Environment & secrets

| Doc | What |
|-----|------|
| [**environment-and-secrets.md**](environment-and-secrets.md) | Monorepo root `.env` (single vault), key names, Gmail OAuth, rotation |

**Rule:** Authoritative secrets live only in **repository root** `.env` (gitignored). Deployment env mirrors the same names.

---

## 2. Skills (Cursor, Claude Code, portfolio registry)

| Layer | Location |
|-------|----------|
| **Canonical skill bodies** | [`shared/skills/`](../skills/) — each `<name>/SKILL.md`; inventory in [`SKILLS_ROADMAP.md`](../skills/SKILLS_ROADMAP.md) |
| **Cursor auto-load** | `.cursor/skills/<name>/` → symlink to `shared/skills/<name>` where needed |
| **Claude Code auto-load** | `.claude/skills/<name>/` → same symlink pattern |

**Rule:** Edit skills under **`shared/skills/`** only; refresh symlinks in `.cursor/skills/` and `.claude/skills/` when adding a new shared skill.

---

## 3. Platforms & vendors

| Topic | Doc |
|-------|-----|
| **Master map (every spine vendor + env names)** | [**platforms-and-tools.md**](platforms-and-tools.md) |
| **Cloudflare** (tokens, verify, DNS, Workers/D1 pointers) | [**cloudflare-platform.md**](cloudflare-platform.md) |
| **Agent Analytics on public sites** (`tracker.js`, env vars) | [**agent-analytics-web-wiring.md**](agent-analytics-web-wiring.md) |
| **OSS-first build habits** | [**oss-first-engineering.md**](oss-first-engineering.md) |
| **Supabase backup / security** | [`shared/docs/supabase-backup-policy.md`](../docs/supabase-backup-policy.md), [`security-headers-baseline.md`](../docs/security-headers-baseline.md) |
| **Infrastructure setup** | [`infrastructure/SETUP.md`](../../infrastructure/SETUP.md) |

---

## 4. Strategy & governance (repo root)

| Doc | Role |
|-----|------|
| [`BIBLE.md`](../../BIBLE.md) | Hard rules (faceless, pseudonym, HIPAA, money caps, security) |
| [`PORTFOLIO_BRIEF.md`](../../PORTFOLIO_BRIEF.md) | Master strategy |
| [`FOUNDER_ACTIONS.md`](../../FOUNDER_ACTIONS.md) | Current founder-only TODOs |
| [`.claude/CLAUDE.md`](../../.claude/CLAUDE.md) | Portfolio operating principles (Claude sessions) |

---

## 5. Cursor rules (automatic)

Workspace rules under **`.cursor/rules/`** complement this hub — especially credential safety and env spine. They apply without opening this file; this hub is the **human/agent navigation index**.

---

*Update linked docs when processes change.*
