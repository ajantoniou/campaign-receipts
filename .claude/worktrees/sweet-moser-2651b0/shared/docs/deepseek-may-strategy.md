# DeepSeek V4-Pro OR Grok (A/B test Saturday) Strategy — May 2026

**Status:** ACTIVE through May 31, 2026.
**Effective date:** 2026-05-01.
**Owner:** All Chief Accountant agents enforce. CEO agents approve role assignments.

## TL;DR

DeepSeek is running 75% off V4-Pro through May 2026. **All execution
work routes to V4-Pro** unless the role is explicitly Opus-tier. Save
~70-80% on portfolio LLM spend during May. Switch back to Claude Haiku
4.7 on June 1.

## Why DeepSeek V4-Pro OR Grok (A/B test Saturday) for execution

1. **Cost (May only):** ~75% cheaper than already-cheap baseline. Effective
   cost is dramatically below Claude Haiku 4.7.
2. **Quality on execution tasks:** Comparable to Haiku on:
   - Code generation
   - Routine writing (drafts, emails, social posts)
   - Data summarization
   - Customer support draft replies
3. **Speed:** Generally fast enough for batched async work.
4. **Founder verified production-ready:** From Plutopath memory, V4-Flash
   has full feature parity (commit ed0e0acc1) and ~13pp behind Opus on
   strategic/edge tasks. V4-Pro is the same family at higher capability.

## Why NOT DeepSeek for strategy roles

1. **Strategic drift risk:** ~13pp behind Opus on judgment-heavy tasks.
   For CEO/Advisor seats deciding business direction, that gap is too
   expensive to absorb.
2. **Editorial / compliance drift risk:** Theology Editor (NT Channel)
   carries deplatform risk. Compliance Reviewer (Trading Journal)
   carries SEC investment-advisor classification risk. Legal Compliance
   Watcher (Hyperlocal) carries anonymous-platform legal exposure.
   Cheap-model drift in any of these = founder reputational, license,
   or legal exposure. Not worth the savings.
3. **Legal/compliance reasoning:** Higher reasoning models make fewer
   compliance errors. Use Opus for any role that touches legal language,
   FTC/FDA claims, or regulatory exposure.

## Role assignment matrix

| Role | Model May 2026 | Model June 2026+ | Reasoning |
|---|---|---|---|
| CEO (any company) | Claude Opus 4.7 | Claude Opus 4.7 | Strategic decisions, no compromise |
| McKinsey Advisor | Claude Opus 4.7 | Claude Opus 4.7 | Strategic critique |
| YC Founder Advisor | Claude Opus 4.7 | Claude Opus 4.7 | Strategic critique |
| CTO | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Code + architecture |
| Head of Growth | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Marketing strategy + execution |
| Sales & Partnership | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Outreach drafting |
| Brand / Design / Marketing | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Creative drafting |
| Chief Accountant | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Routine ledger work |
| Theology Editor (NT) | Claude Opus 4.7 | Claude Opus 4.7 | Editorial judgment, deplatform risk |
| Compliance Reviewer (Trading Journal) | Claude Opus 4.7 | Claude Opus 4.7 | SEC investment-advisor classification risk |
| Community Moderator (Hyperlocal) | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Pre-screening + flag queue |
| Legal Compliance Watcher (Hyperlocal) | Claude Opus 4.7 | Claude Opus 4.7 | Anonymous-platform regulatory exposure |
| Content generation (NT, Concise) | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Volume play |
| Customer support draft | DeepSeek V4-Pro OR Grok (A/B test Saturday) | Claude Haiku 4.7 | Volume play |

## Quality smoke test protocol (Saturday morning kickoff)

**Before trusting V4-Pro at scale, every active company runs an A/B test.**

### Test design

For each active company (NT, Concise, Hyperlocal, Trading Journal),
CEO agent runs parallel A/B for 3 prompts:

1. **Strategic prompt** (judgment-heavy): Compare V4-Pro vs Opus 4.7.
   Expect: V4-Pro materially worse. Confirm Opus is needed for strategy.
2. **Execution prompt #1** (writing/drafting): Compare V4-Pro vs Haiku
   4.7. Expect: comparable quality.
3. **Execution prompt #2** (code/analysis): Compare V4-Pro vs Haiku 4.7.
   Expect: comparable quality.

### Pass/fail criteria

- **Pass:** V4-Pro output is within ~10% of Haiku quality on execution
  tasks (subjective judgment by CEO agent + founder spot-check).
- **Fail:** V4-Pro produces factual errors, slop, or off-brand content.
  Mark that task type as "Haiku required" regardless of cost.

### Documentation

Each company logs A/B results to `companies/<name>/pnl/llm-quality-log.md`
on Saturday and updates if drift observed in production.

## Ongoing drift watch

Chief Accountant agents spot-check **1 in every 30 V4-Pro outputs per week**.

### Spot-check criteria

1. Factual errors
2. Off-brand voice (compared to Brand/Design agent style guide)
3. Slop (generic, buzzword-laden, AI-flavored)
4. Compliance drift (medical claims, legal-adjacent content)
5. Repetition / formulaic output

### Hard fallback rule

**Any role producing slop or factual errors twice in a single week
auto-promotes to Haiku, regardless of cost.** Chief Accountant logs
the promotion in P&L and notifies CEO agent.

## Grok integration (NEW 2026-05-02)

**Founder added Grok API key (XAI_API_KEY) to .env Saturday.**

Grok positioning in the LLM tier:

| Tier | Use case | Models in priority order |
|---|---|---|
| Strategy | CEO, advisors, compliance | Opus 4.7 (no compromise) |
| Mid-tier execution | Engineering, content, drafting | DeepSeek V4-Pro (May 75% off) → Grok (A/B test winner) → Haiku 4.7 (fallback) |
| Volume execution | High-volume content + customer support | DeepSeek V4-Pro (May 75% off) → Grok |

### Saturday A/B test (mandatory)

Each active company runs Grok vs DeepSeek V4-Pro head-to-head on:
1. Engineering task ("write a Next.js API route for Stripe webhook
   handler")
2. Content drafting task ("draft a Reddit comment educating about
   [topic relevant to that company]")
3. Compliance-adjacent task ("rewrite this copy to be FTC-safe
   without losing the punch")

CEO agent + Chief Accountant log results to
`companies/<name>/pnl/llm-quality-log.md`.

### Decision criteria

**If Grok matches DeepSeek V4-Pro quality** at competitive price:
- Use Grok for engineering-heavy roles (xAI claims strong code
  performance)
- Keep DeepSeek for high-volume content (May discount makes it
  cheapest)

**If Grok significantly outperforms DeepSeek V4-Pro:**
- Switch most execution roles to Grok immediately
- Defer June 1 Haiku transition (Grok continues at full price)

**If Grok underperforms:**
- Stay with DeepSeek V4-Pro (May), transition to Haiku (June)
- Note Grok pricing for future re-evaluation

### Grok pricing (verify Saturday)

xAI publishes pricing at https://x.ai/api. Chief Accountant verifies
current Grok pricing matches notes:
- Grok-3 (or current latest): typically priced between Haiku and Opus
- Compare per-million-input-token + per-million-output-token to
  DeepSeek V4-Pro's discounted price

## June 1 transition

### May 28 alert

Chief Accountant agent of each active company posts a notification to
the founder's daily standup on **May 28**:

> "DeepSeek V4-Pro 75% discount ends May 31. Recommend switching
> execution roles (CTO, Head of Growth, Sales & Partnership, Brand,
> Chief Accountant, Content) to Claude Haiku 4.7 OR Grok (whichever
> won Saturday A/B test) effective June 1.
> Estimated cost change: $XX/mo → $YY/mo. Strategic roles unchanged."

### June 1 switch

CTO agents update model assignments in their company's Paperclip
configuration. New role assignments per the matrix above.

### Optional: extend V4-Pro past May

If DeepSeek extends the discount or offers competitive June pricing,
Chief Accountant flags this and CEO agent decides whether to extend
V4-Pro usage. Default action without intervention: revert to Haiku.

## Monthly LLM spend estimates

### May (V4-Pro discount active)

| Company | LLM spend (May) |
|---|---|
| NT Empire | ~$15/mo |
| Concise | ~$5/mo |
| Hyperlocal Matrix | ~$15/mo |
| Trading Journal | ~$10/mo |
| Prior Auth (FROZEN) | $0 |
| Physician Letters (FROZEN) | $0 |
| NT Films (research) | ~$3/mo (shared with NT) |
| **Portfolio total** | **~$48/mo** |

### June onward (Haiku for execution)

| Company | LLM spend (June+) |
|---|---|
| NT Empire | ~$35/mo |
| Concise | ~$15/mo |
| Hyperlocal Matrix | ~$40/mo |
| Trading Journal | ~$25/mo |
| Prior Auth (FROZEN) | $0 |
| Physician Letters (FROZEN) | $0 |
| NT Films (research) | ~$5/mo (shared with NT) |
| **Portfolio total** | **~$120/mo** |

**Net savings in May from V4-Pro substitution: ~$67/mo.** Use this to
fund product spend (ads, tools, domains) during the launch window.

## API endpoints + auth

- **DeepSeek API:** `https://api.deepseek.com` (OpenAI-compatible)
  - Auth: `DEEPSEEK_API_KEY` from `.env` (imported from Plutopath)
  - Model name: `deepseek-v4-pro` (verify with current DeepSeek docs)
- **Anthropic Claude API:** `https://api.anthropic.com`
  - Auth: `ANTHROPIC_API_KEY` from `.env`
  - Models: `claude-opus-4-7`, `claude-haiku-4-7`

## Caveats and verification (per founder rule)

This document quotes the 75% discount based on founder's verbal report.
**Chief Accountant must verify on Saturday morning by:**
1. Logging into DeepSeek dashboard
2. Confirming current pricing
3. Documenting actual % discount + end date in
   `companies/*/pnl/llm-cost-baseline.md`

**Do not assume the discount applies to all V4-Pro tiers.** Some
discounts are batch-only or time-window-limited. Verify before committing
production traffic.
