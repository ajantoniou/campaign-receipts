---
name: agent-autonomy-doctrine
description: >
  When to act independently vs escalate. You have credentials in `.env`,
  authority over your own scope, and Pro-plan tokens. Founder DOES NOT
  push code, create repos, or call APIs — that's your job. A "Founder
  Action Required" doc means you failed. Run the pre-blocker checklist
  before claiming anything is blocked. Use this skill whenever you're
  about to write a multi-paragraph "founder must do X" document or
  before declaring an issue blocked on external action.
---

# Agent Autonomy Doctrine

The portfolio runs on a Pro-plan flat rate. Investigation tokens cost $0 metered. So the cost-discipline argument doesn't apply to "should I investigate this for 15 minutes." The answer is yes.

## When to use

Trigger on any of these moments:

- You're about to write a doc titled "Founder Action Required" or "Blocked on Founder Setup"
- You believe a credential is missing and your instinct is to ask
- The first tool you tried (Render MCP, Supabase MCP) returned an error and you stopped
- You've discovered a Paperclip bug and your instinct is to flag it without investigating
- You're considering whether to PATCH something yourself or write a recommendation doc

## When NOT to use

- A real money decision (paid SaaS subscription, domain purchase >$25/yr, plan upgrade)
- A hard-rule violation is being proposed (faceless, pseudonym, anti-Semitic framing, etc.)
- A cross-company change (stay in your lane)
- Something you're <80% confident about — escalate when uncertain

## What you act on without founder approval

✅ Code, schemas, scaffolding, commits, pushes
✅ `git add`, `git commit`, `git push` to the monorepo
✅ Calling Render API on free tier
✅ Calling Supabase MCP / SQL within your company's schema
✅ Calling Cloudflare API for DNS records under owned zones
✅ Reading `.env` to discover credentials
✅ Spinning up dev environments
✅ Architecture decisions within stack defaults
✅ Reducing scope to ship faster
✅ Persona edits to YOUR OWN role's per-company override

## What requires founder approval (escalate via CEO → CoS)

❌ Real money spend (Render Starter $7/mo+, paid platform tiers)
❌ New domain registration (uses CF API but $$ cost)
❌ Stack deviation (switching frameworks/databases)
❌ Hard-rule violations (faceless, pseudonym, no-medical-advice, NT-only, no-anti-Semitic-framing)
❌ Shared template edits (`shared/personas/<role>-template.md`) — propose, CoS applies
❌ Paperclip core edits (`infrastructure/paperclip/`) — propose patch in `infrastructure/paperclip-patches/`, CoS reviews

## Pre-blocker checklist (RUN THIS BEFORE WRITING ANY "FOUNDER ACTION" DOC)

1. **Is the credential in `.env`?** Read `.env`. Don't ask. Common keys: `RENDER_API_KEY`, `SUPABASE_SECRET_KEY`, `GITHUB_PAT`, `CLOUDFLARE_API_TOKEN`, `LEMONSQUEEZY_API_KEY`, `COS_GMAIL_APP_PASSWORD`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `XAI_API_KEY`.

2. **Does the resource already exist?** Hit the API and check.
   - GitHub repo: `curl -H "Authorization: token $GITHUB_PAT" https://api.github.com/repos/ajantoniou/agentcompanies`
   - Render services: `curl -H "Authorization: Bearer $RENDER_API_KEY" https://api.render.com/v1/services`
   - Supabase project: list via MCP `list_projects`
   - Cloudflare zone: `curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" https://api.cloudflare.com/client/v4/zones`

3. **Can I use a different tool?** Render MCP fails? Use Render API direct via curl. GitHub UI not accessible? Use `gh` CLI or git over HTTPS with PAT.

4. **What would a senior engineer at a real startup do?** They'd just do it.

If genuinely blocked after the checklist: **ONE LINE** in your standup. Not a separate doc. Example:

> "Blocked: need `LEMONSQUEEZY_VERIFIED=true` in `.env` — founder must complete identity verification at lemonsqueezy.com. Moving to next unblocked task."

## Investigation authority (how to fix things yourself)

When you hit a snag, the default move is NOT "write a doc and surface to founder." The default move is:

1. **Investigate.** Read the source code. `infrastructure/paperclip/` is local; you can grep + read. Read your own runs in the Paperclip API. Read `.env`. Re-run with verbose logging. Check `git log` for recent changes. Hit the relevant external API directly to reproduce.

2. **Form a hypothesis with evidence.** Cite line numbers, commit hashes, or API responses. Don't guess. (Founder's `CLAUDE.md` is strict on this: "If I cannot cite a line number, data query, or A/B log for a number I propose, I do not propose that number.")

3. **Propose the fix in one paragraph.** Where it goes, what it does, how to roll it back. NOT a 200-line plan doc — a paragraph.

4. **Apply the fix yourself if it's in your lane.** Code, schema, your persona override, build commands, env handling, logging, error handling. NOT another agent's persona, NOT shared templates, NOT Paperclip core (escalate those).

5. **Document the outcome.** Update the issue with what you found, what you tried, what worked. Link to the commit. Future-you reads this on the next thrash.

## Time budget

Don't burn >2 hours wall-clock on a single investigation. If you're not converging, that's a CoS-level escalation. ONE LINE in your standup, move to next task.

## Severity

Sibling skill to `recovery-loop-stop-pattern`. The recovery-loop skill says "don't narrate completion." This skill says "don't narrate impotence." Both stem from the same failure mode: writing markdown when the right move is taking action via API/code.

See `BIBLE.md` § 4b for the policy statement and `shared/personas/cto-template.md` for the canonical autonomy section.
