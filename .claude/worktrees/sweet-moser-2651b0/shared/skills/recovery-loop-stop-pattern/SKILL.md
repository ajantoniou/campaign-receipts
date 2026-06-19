---
name: recovery-loop-stop-pattern
description: >
  Stop the recovery-loop / markdown-narration anti-pattern. When you self-block
  on an issue, do NOT spawn child "Recover stalled X" issues, do NOT write
  multiple `_CLOSURE.md`/`_VERIFICATION.md`/`_FINAL.md`/`_RECOVERY.md` files,
  do NOT mark blocked then re-run as if the blocker resolves itself. Issue
  closure happens via `PATCH /api/issues/<id>` with `{"status":"done"}` —
  not by writing markdown. Use this skill whenever you find yourself about
  to write a closure document or spawn a recovery sub-issue.
---

# Recovery-Loop Stop Pattern

A portfolio-wide ban on the recovery-loop / markdown-narration anti-pattern. This skill exists because multiple agents have repeatedly burned tokens, polluted the issue tree, and confused their own future selves by narrating completion in markdown instead of acting via the API.

## Reference incidents

- **Repo-setup thrash (2026-05-02 evening):** a portfolio company CTO wrote 5 thrash docs claiming GitHub-repo creation was a founder action — when GITHUB_PAT was already in `.env`. All 5 marked SUPERSEDED on 2026-05-03 00:35 ET.
- **NTM-2/5/6/7 (2026-05-03 morning):** NT Ministry CTO wrote 9 closure/verification/recovery files for separate issues without ever PATCHing status. Files moved to `companies/nt-ministry/_thrash-archive-2026-05-03/`.

## When to use

Trigger on any of these moments:

- You're about to create a file with `_CLOSURE`, `_VERIFICATION`, `_FINAL`, `_RECOVERY`, `_INDEX`, `_BLOCKER`, `_HANDOFF`, or similar suffix in its name
- You're about to create a child issue with title starting "Recover stalled..."
- You self-blocked an issue and your next instinct is to spawn a follow-up issue to track the recovery
- You wrote a markdown file describing what you did and now want to update its status — that's narration; the API is the action
- You completed work but the platform's stranded-recovery system pinged you again

## When NOT to use

- You're writing a normal deploy log or work artifact (`tech-plan.md`, `inventory.md`, `landing-page-spec.md`). Those are work product, not status narration.
- You're documenting a real platform bug. Then write to `briefings/escalations/` — that's not a recovery loop, it's an escalation channel.

## The contract

### 1. Issue closure happens via API PATCH, not via markdown

```bash
curl -X PATCH http://127.0.0.1:3100/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}'
```

Verify the response is HTTP 200 with `"status":"done"`. The PATCH IS the closure. The markdown is noise.

### 2. If the API returns an error, escalate — don't narrate

If the PATCH returns 4xx/5xx:
- Read `infrastructure/paperclip/server/src/routes/issues.ts` for what could fail
- File the bug at `briefings/escalations/<short>.md` with: API request, response, expected, actual
- Propose a patch at `infrastructure/paperclip-patches/` if you can identify the fix
- Surface to Chief of Staff in your standup as a one-line item

You DO NOT have authority to write 9 markdown files about the same problem.

### 3. Real blocker semantics

When you self-block:
- ONE LINE in your standup: `"Blocked: <reason>. Moving to next task."`
- PATCH the issue to `status: blocked` with that one-line description
- Move to the NEXT unblocked task in your backlog
- Trust Chief of Staff to surface real blockers to founder

### 4. NO child recovery issues

Don't create issues like "Recover stalled issue X." That's the platform's stranded-recovery system, not yours. If the harness creates one anyway and assigns it to you, immediately PATCH it to `cancelled` with a comment "duplicate of <X>; X is the source of truth."

## How to detect you're about to violate this rule

Before writing ANY markdown file, ask:

1. Does this file's name end in `_CLOSURE`, `_VERIFICATION`, `_FINAL`, `_RECOVERY`?
2. Is this file primarily ABOUT an issue's status rather than work product?
3. Will the next CoS run see N+1 of these files for the same issue?
4. Could this content be a one-line standup item + a PATCH instead?

If yes to ANY of these — STOP. Don't write the file.

## Related skills

- `agent-autonomy-doctrine` — covers when you should fix things yourself vs escalate
- `diagnose-why-work-stopped` (existing Paperclip skill) — for board-approved forensics, NOT for self-narration of your own stuck issues

## Severity

This is a **portfolio-wide hard rule.** Violations show up immediately in CoS hourly briefings as "thrashing detected on <agent>." Repeat violations trigger a persona STOP-section patch. See `shared/personas/cto-template.md` line 8 for the canonical STOP rule, and `BIBLE.md` § 4a for the policy statement.
