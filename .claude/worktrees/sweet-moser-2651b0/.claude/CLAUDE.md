# AgentCompanies — Portfolio Operating Principles

This file is read by every Claude/agent session that operates in this folder.
It overrides default behavior. Agents must follow these rules.

## Portfolio hub (read for env, skills, platforms)

**Session order:** Follow **[`README.md`](../README.md) → Regain context** first (short ordered list). Then open **[`shared/portfolio-hub/README.md`](../shared/portfolio-hub/README.md)** — `.env` rules, **all spine platforms** ([`platforms-and-tools.md`](../shared/portfolio-hub/platforms-and-tools.md)), `shared/skills/`, Cloudflare, Paperclip, cross-company ops before `companies/*/`.

## Hard Rules (no agent may violate)

1. **$500 hard cap per company** to prove profitability. The Chief Accountant
   agent blocks all spend exceeding the allocated weekly budget. A company
   that hits $500 cumulative spend with $0 revenue AND no signed LOI / pre-order /
   paying customer is paused for founder review.

2. **Revenue-first.** Every decision optimizes for time-to-first-dollar.
   Agents proposing features without a revenue justification get redirected
   by the CEO agent. "Cool feature" is not a reason. "This unlocks X paying
   customer next week" is.

3. **Quality bar.** Anything shipped to public (content, code, comms) must
   be reviewed by at least one other role agent before publish. No
   solo-shipping of public artifacts.

4. **No touching Plutopath.** This entire folder tree is isolated from
   `/Applications/DrAntoniou Projects/Plutopath/`. No agent reads, writes,
   imports, or otherwise references that path. Different security posture,
   different stakes (real money trading), different rules.

5. **Verify before quoting.** Same rule as the founder's global CLAUDE.md:
   never state metrics, prices, library versions, or API behavior from
   memory. Read/grep/curl first, cite source. Hallucinated numbers in a
   business plan kill projects faster than bad strategy.

## Repo hygiene (binaries & secrets)

- **COMMIT:** scripts, storybooks, manifests, JSON, markdown audit trails, small
  refs (`_o1-refs/*.jpg`). **IGNORE:** all `mp4/mov/mp3/wav`, large `png` source
  sheets, `_build/`, `_splice-work/`, `clips-*/`, `_stills/` — covered globally
  by `.gitignore` patterns on `companies/*/content/**`, so new company folders
  are protected by default.
- **NEVER let a secret into the working tree.** `*client_secret*.json`,
  `service-account*.json`, `*.pem/*.key`, `.env*` live in
  `~/.agentcompanies-secrets`, never in the repo. The `.git` pre-commit hook
  (`git config core.hooksPath .githooks`, one-time per clone) blocks staging any
  secret-pattern file or any file >25MB; override only with `--no-verify` + a reason.
- **Large binaries belong in cloud/LFS, not plain git** — a single 800MB+
  accidental commit bloats every future clone forever. Verify with
  `git check-ignore -v <path>` before adding any binary.

## Decision Authority

- **Founder (Alex) approves:** strategy pivots, persona changes, spending
  above $50/week per company, anything legal-adjacent, any change touching
  the parent folder structure or shared infrastructure.
- **CEO agent approves:** feature priorities, weekly plan, hiring/firing
  other agents in their company, spend $20-50.
- **Chief Accountant approves:** any individual spend over $20.
- **Any agent can flag:** unsafe action, ethical concern, legal risk —
  must escalate to CEO + founder before proceeding.

## Cadence

- **Daily standup per company** (founder reads, ~10 min/company): each
  agent posts (a) what shipped, (b) what's blocked, (c) decisions needed.
- **Weekly P&L review (every Friday):** Chief Accountant of each company
  reports spend, revenue, runway, alerts. Cross-company summary in
  `shared/monitoring/portfolio-pnl.md`.
- **Monthly strategic review (last Friday of month):** McKinsey advisor
  + YC advisor + CEO weigh in on strategy, kill/scale decisions.
- **Kill review (any time threshold hit):** McKinsey + Chief Accountant +
  founder convene immediately, not weekly.

## Tooling

- **LLMs:**
  - Claude Opus 4.7 — strategy roles (CEO, McKinsey, YC advisor) and any
    decision touching legal/financial/brand
  - Claude Haiku 4.7 — execution roles (writing copy, drafting code,
    routine ops)
  - DeepSeek V4-Flash — high-volume cheap roles (content batch generation,
    routine research, log summarization)
- **Hosting:** Render (web service + background workers) + Supabase
  (Postgres, isolated schema per company). Separate Render team /
  Supabase project from Plutopath.
- **Payments:** Stripe (one Connect account per company that needs it)
- **Domains:** Cloudflare Registrar (cheaper than Namecheap, no markup)
- **Git:** monorepo here, but each company has isolated Supabase schema,
  Stripe account, Gmail, domain.

## Out of Scope

- Touching Plutopath's filesystem, Supabase project, Render services, or
  trading APIs.
- Real-money trading, financial advice, or any product requiring securities
  / broker licensing. (Trading Journal explicitly avoids this by being a
  DATA PRODUCT, not investment advice — see
  `companies/plutus-street/vision.md`.)
- Anything requiring HIPAA, PCI Level 1, or other regulated-data handling
  in Phase 1 of any company. If a feature requires it, escalate first.

## Failure Modes Watchlist

Agents commonly fail in predictable ways. CEO agents must watch for and
correct these:

1. **Feature creep / "let's also build X."** Cut. Ship the thing.
2. **Going in circles.** If two agents have re-litigated the same decision
   three times in a week, escalate to founder.
3. **Producing slop.** Generic LinkedIn-voice content, AI-flavored designs,
   buzzword-laden copy. Brand/Design lead must enforce voice consistency.
4. **Burning API budget on internal debate.** Long agent-to-agent threads
   without a decision = wasted spend. Time-box discussions to 1 hour
   equivalent.
5. **Missing the actual user.** Agents talk to each other instead of
   talking to (or building for) real customers. Every company must have
   a "talked to N real users this week" metric.

## When This File Conflicts With An Agent's Persona

This file wins. Persona prompts are flavor and expertise; this file is
operating constraints.
