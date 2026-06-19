# Skills Roadmap — current 8 vs target 18+

**Created:** 2026-05-05 (audit-driven, founder request)
**Owner:** Chief of Staff
**Status:** Living document — update as skills are built/bought

**Portfolio hub:** [`shared/portfolio-hub/README.md`](../portfolio-hub/README.md) — how skills connect to Cursor, Claude Code, and Paperclip.

---

## Current state (8 skills: 7 operational/meta + 1 observability)

| Skill | Path | What it does |
|---|---|---|
| `agent-autonomy-doctrine` | [shared/skills/agent-autonomy-doctrine/](agent-autonomy-doctrine/) | When agents should act vs. ask vs. escalate |
| `delta-briefing` | [shared/skills/delta-briefing/](delta-briefing/) | How to write a brief that only covers what changed since last heartbeat |
| `goal-first-briefing-format` | [shared/skills/goal-first-briefing-format/](goal-first-briefing-format/) | Brief structure: goal first, then evidence, then asks |
| `idle-exit` | [shared/skills/idle-exit/](idle-exit/) | When all work is blocked, exit cleanly without burning budget |
| `image-generation-workflow` | [shared/skills/image-generation-workflow/](image-generation-workflow/) | OpenAI/Grok image generation with $5/day cap and JSONL cost log |
| `persona-slim` | [shared/skills/persona-slim/](persona-slim/) | Compact persona format (`<role>.core.md`) for low-context cold-starts |
| `recovery-loop-stop-pattern` | [shared/skills/recovery-loop-stop-pattern/](recovery-loop-stop-pattern/) | Silent-PATCH-to-done pattern for stuck recovery issues |
| `agent-analytics` | [shared/skills/agent-analytics/](agent-analytics/) | Agent Analytics OSS/D1, Paperclip Live plugin, Cloudflare env pattern |
| `watch` | [shared/skills/watch/](watch/) | `/watch` — download video, extract frames + transcript, hand to Claude. Used by council G9 video-QC loop. Source: github.com/bradautomates/claude-video (MIT) |
| `cinema-worldbuilder` | [shared/skills/cinema-worldbuilder/](cinema-worldbuilder/) | Seedance video prompt director. Five cinema modes (Narrative/Studio/Action/Performance/Atmospheric), each with locked ARRI+lens+filter+grade. Reads reference images, outputs production-ready Seedance prompts with diegetic-only audio. Imported 2026-05-24. |
| `banana-pro-director` | [shared/skills/banana-pro-director/](banana-pro-director/) | Higgsfield image prompt director — Banana Pro / Soul Cinema / GPT-2. Three asset types in strict order: single-image base on white seamless → 6-panel character sheet → scene plates. Hyperreal stack (Kodak Vision3, pores, fabric weave). Step 0 character-gate enforces locked character before any prompt. Imported 2026-05-24. |

**Coverage gap:** Seven are operational/meta; one is cross-cutting observability. We have **zero** executional
skills (web/frontend/database/DevOps/SEO/copywriting). Doer agents (CTO,
Brand-Design, Head-of-Growth, content-writer) are flying blind on the
*how* of building production software and content.

---

## Target 18 production skills (founder reference, 2026-05-05)

The founder pasted a list of 18 production-ready skills from (likely)
Paperclip's commercial Skills Manager. Mapping each to our state:

### Already covered (rough mapping)

| Target skill | Matches our | Status |
|---|---|---|
| Autonomous Operations Runtime | `agent-autonomy-doctrine` (partial) | Loose match — our doctrine is about authority, target is about runtime coordination. Probably need both |
| Agent Creation Kit | `persona-slim` (partial) | Loose match — `persona-slim` is for compact format, target is for full hire workflow. **Paperclip's `paperclip-create-agent` skill (already in upstream skills/) covers this fully.** |
| Shared Memory Architecture | `delta-briefing` (partial) | Briefing format is one piece of memory; full target is more |

### Missing — to build/buy (15 skills)

These are mostly **executional** — directly relevant to doer agents
shipping code, content, or pages.

| Target skill | Audience | Build vs Buy |
|---|---|---|
| Custom Tooling Framework | CTO | Buy (Paperclip Skills Manager if available) |
| Full-Stack Web App Conventions | CTO, dev agents | Buy |
| Frontend Performance Patterns | CTO, dev agents | Buy |
| Distinctive Frontend Design | Brand-Design, dev agents | Buy |
| Complete UI/UX System | Brand-Design, Designer | Buy |
| Database Performance Playbook | CTO, data-scientist | Buy |
| DevOps & Infrastructure Automation | CTO | Buy |
| End-to-End Test Playbook | CTO, QA | Buy |
| Live Web App Verification | QA, CoS | Buy |
| Browser Automation Toolkit | QA, growth | Buy |
| High-Conversion Copywriting | Head-of-Growth, content-writer | Buy |
| Search-Optimized Writing | content-writer | Buy |
| Technical SEO Foundation | CTO, growth | Buy |
| SEO Diagnostics & Recovery | growth | Buy |
| Scaled SEO Page Generation | growth, content-writer | Buy |

---

## Recommended path

### Phase 1 (this week — eval)

- **Eval Paperclip Skills Manager.** Check upstream
  `infrastructure/paperclip/skills/` for any of the 15 missing skills.
  Some may already exist in the upstream repo.
- **Eval the commercial 18-skill bundle.** If Paperclip sells this as
  a product, price-check vs. building 15 skills internally.

### Phase 2 (next 2 weeks — install skills the active companies need NOW)

Priority order (by what unblocks revenue-fast companies):

1. **High-Conversion Copywriting** + **Search-Optimized Writing** — for
   Concise (book sales pages) and Campaign Receipts (newsletter).
2. **Technical SEO Foundation** — for Campaign Receipts and CarStack
   (B2B inbound).
3. **Distinctive Frontend Design** + **Complete UI/UX System** — for
   Concise + concise-sealed launch sites.
4. **Live Web App Verification** + **Browser Automation Toolkit** —
   for CoS to verify deploys without involving founder.

### Phase 3 (month 2 — install for slow-burn companies)

- **Database Performance Playbook** — when HealthBrew dashboard scales.
- **DevOps & Infrastructure Automation** — when NT Ministry directory
  goes live.

### Phase 4 (deferred until needed)

- **Custom Tooling Framework**, **Full-Stack Web App Conventions**,
  **Frontend Performance Patterns**, **Database Performance Playbook**
  — install lazy. Doer agents currently use Cursor/Claude Code which
  bring some of this implicit.
- **End-to-End Test Playbook**, **SEO Diagnostics & Recovery**,
  **Scaled SEO Page Generation** — needed once companies have real
  traffic.

---

## How skills get installed in Paperclip

Per [infrastructure/paperclip/skills/paperclip-create-agent/SKILL.md](../../infrastructure/paperclip/skills/paperclip-create-agent/SKILL.md):

- Each agent's `desiredSkills` field at hire time names the skills the
  agent should have on day one.
- Paperclip resolves skills via the Skills Manager (upstream feature
  shipped per the 8 milestones list).
- For now (until we've evaluated Paperclip's Skills Manager), our
  `shared/skills/` folder serves as the local registry — agents read
  these during heartbeats via persona file pointers.

---

## Open decisions

- **Buy vs build** for the 15 missing skills — pending Paperclip Skills
  Manager eval.
- **Whether to keep our `shared/skills/` folder once Paperclip-native
  skills work** — likely keep both: ours as fallback / source-of-truth
  for our own agents' patterns; Paperclip-native for cross-instance
  reusable skills.
- **Skill versioning** — none of our 8 skills have version numbers.
  Paperclip-native skills may. Decide whether to adopt SemVer.
