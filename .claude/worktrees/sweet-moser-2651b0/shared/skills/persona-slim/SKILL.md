# Skill: persona-slim

**Version:** 1.0  
**Author:** Chief of Staff  
**Date:** 2026-05-05  
**Category:** Cost control  
**Applies to:** Any agent that wakes on a cadence (CoS, CEOs, periodic doers)

---

## What this skill does

Reduces token burn by making the **persona loaded on every wake** tiny, and moving the bulk of doctrine/templates/context into a separate reference file that is **only read on demand**.

**Why this matters:** Paperclip’s `claude_local` adapter injects the persona file content on every run. If that file is 300–800 lines, every wake pays a big cached-input cost even when the agent should exit quickly.

This skill pairs with:
- `shared/skills/idle-exit/SKILL.md` (exit immediately when there’s no assigned work)
- `shared/skills/delta-briefing/SKILL.md` (skip full brief when nothing changed)

---

## The pattern

For any heavy persona file `X.md`, split into:

1. `X.core.md` — **the only file Paperclip should inject every wake**
   - 40–120 lines max
   - STOP rules + exit conditions
   - `idle-exit` and (if applicable) `delta-briefing`
   - minimal API endpoints + what to do next
   - strict “do one thing, then exit” behavior

2. `X.reference.md` — everything else
   - long doctrine
   - verbose templates
   - historical context / rationale
   - long lists (anti-patterns, examples, etc.)

---

## Core file rules (non-negotiable)

In `X.core.md`, include a section like:

```markdown
## PERSONA-SLIM RULE

- Treat this file as your **only default memory**.
- Do NOT read `X.reference.md` unless one of these is true:
  1. You are about to make a strategic decision that would otherwise be a guess, OR
  2. You are writing a full brief because delta checks show a real state change, OR
  3. You hit a novel failure mode and need the longer doctrine/templates to respond correctly.
- If `idle-exit` triggers, exit without reading anything else.
```

---

## Reference read trigger

If you must read the reference file, do it deliberately:

1. State why: “Reading reference because <reason>”
2. Read only the smallest relevant section (not the entire file)
3. Continue work, then exit

This preserves the “cheap by default” posture.

---

## Integration steps (for CoS to apply)

1. Create `*.core.md` and `*.reference.md` for:
   - CoS: `companies/portfolio-hq/personas/chief-of-staff-hourly.*.md`
   - CEOs: `shared/personas/ceo-template.*.md`
2. Patch each Paperclip agent’s `adapterConfig.instructionsFilePath` to point to the new `*.core.md`.
3. Leave the reference file in the repo; agents will read it only when needed.

---

## Expected impact

- **Baseline per-wake tokens drop sharply** because the injected prompt is small.
- Combined with `idle-exit` + `delta-briefing`, most wakes become **sub-1K token no-ops**.

