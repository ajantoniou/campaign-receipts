---
name: goal-first-briefing-format
description: >
  How to write briefings that lead with goals + progress, not raw issue
  lists. Bucket every issue under a goal. The portfolio has 24+ active
  goals across 4 companies + Portfolio HQ; 61+ issues already linked.
  CEO Q4hr briefs and CoS hourly briefings BOTH lead with "this week's
  goal + progress through it" — issues are sub-bullets. Use this skill
  whenever you're about to write a briefing or status report.
---

# Goal-First Briefing Format

Founder direction (paraphrased): "Bucket issues under goals. 1000 issues is confusing; 10 goals × 100 issues each is clear. CEO checks in on the goals and reports back."

The Paperclip data model already supports this — every issue has a `goalId` field, and 24 goals are active across the portfolio. What was missing was the briefing format that surfaces it.

## When to use

Trigger on:

- Writing a CoS hourly briefing
- Writing a CEO Q4hr brief (whether triggered by routine or heartbeat)
- Writing a McKinsey or Paperclip Feedback strategic brief
- Writing the morning `FOUNDER_ACTIONS.md`
- Any status report intended for upward consumption

## When NOT to use

- A doer agent's standup (those are personal-todo lists, not status reports)
- A deploy log or technical writeup (those are work artifacts, not briefings)
- An issue comment (those track per-issue progress, not goal-level)

## The format (per company section)

Every per-company section in any briefing leads with this block:

```markdown
### {Company name}

**This week's goal:** {goal title}
({issues in flight: X, issues done: Y, total linked: Z, M% complete})

**Progress this cycle:**
- {1-2 lines on what advanced toward the goal in the last hour/4hr}

**Issues in flight (tied to this goal):**
- {issue identifier} — {one-line status} — {agent}

**Issues in flight (NOT tied to this goal — ad hoc):**
- {issue identifier} — {one-line status} — {agent}

**Blockers / decisions needed:**
- {if any}
```

If the company has multiple active goals at the same priority, list 2-3 (not all 6). Pick by:
1. **Critical-priority goals first**
2. **Goals with active in-flight issues**
3. **Goals nearest to deadline**

Drop "achieved" goals from the briefing — they're done, surface in a one-line "Recently achieved" footer instead.

## How to compute progress

For each goal, query:

```bash
# Get all issues linked to this goal
curl -s "http://127.0.0.1:3100/api/companies/<co_id>/issues" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); [print(i['identifier'], i['status']) for i in (d.get('items',[]) if isinstance(d,dict) else d) if i.get('goalId')=='<goal_id>']"
```

Then count by status:
- `done` → completed
- `in_progress`, `in_review` → in flight
- `todo`, `backlog` → pending
- `blocked` → blocked
- `cancelled` → exclude from count

Progress % = `done / (done + in_progress + in_review + todo + backlog + blocked) × 100`

## Why this matters

A briefing that opens with "33 issues in flight across the portfolio" is useless. A briefing that opens with:

> **Campaign Receipts — This week's goal: Ship first Tuesday newsletter by 2026-05-13** (3 in flight, 2 done, 5 pending, **40% complete**)
> Progress this cycle: CR CTO completed Resend integration; Editorial drafted issue #1 with 4 bills.

…tells the reader exactly what matters. Same data, different framing. Founder can act on the second; they get lost in the first.

## The 24 active goals (reference, as of 2026-05-03)

Each company has 6 active company-level goals + Portfolio HQ has 6:

- **Concise:** First $100 in direct-PDF revenue by 2026-06-15; 100 free email subscribers by 2026-06-15; First $200/mo direct MRR sustained ≥30 days by 2026-08-01; <$30/mo non-Pro spend; CEO + 4 reports work autonomously; Ship 3 growth experiments per month.
- **Campaign Receipts:** First Tuesday newsletter by 2026-05-13; 100 free email subscribers by 2026-06-15; First Patreon subscriber by 2026-07-01; First $5 PDF sale by 2026-07-15; <$25/mo non-Pro spend; Editorial+CTO ship newsletters weekly without founder edits.
- **NT Ministry:** First 10 YouTube videos by 2026-06-15; First Patreon supporter by 2026-07-15; 100 subs + 1000 cumulative views by 2026-07-15; <$50/mo non-Pro spend; Hire 4 content-production agents within 24h of approval; Self-improving content pipeline.
- **HealthBrew:** 100 active users with at least one lab upload by 2026-07-15; First lab upload completes parsing successfully by 2026-05-30; Biological age methodology v1 by 2026-06-15; <$15/mo non-Pro spend; Compliance Reviewer rejects 0 medical-advice violations; First feedback loop with 10 active users by 2026-07-15.
- **Portfolio HQ:** Daily FOUNDER_ACTIONS.md filed every morning; Hourly briefings without thrash; McKinsey 4-hr brief; Auto-promote keeps companies working; Cross-portfolio cost discipline <$50/mo; SESSION_DECISIONS stays current within 1 hour.

These rotate as they're achieved. New goals get added by CEOs (under pivot authority) or CoS.

## Anti-pattern: list-of-issues briefings

Don't write briefings that look like:

> **Concise has 12 issues in flight:** CON-3, CON-5, CON-7, CON-8...

That's a database dump, not a briefing. The reader can't tell which issues matter.

Instead always answer "what goal are we trying to hit, and how close are we?"

## Related skills

- `agent-autonomy-doctrine` — when to act vs escalate (briefings should make escalation needs visible)
- `recovery-loop-stop-pattern` — banned thrash patterns that ALSO show up in goal-progress (a goal with 3 recovery-loop issues = thrash)

## Severity

This is a **founder-comprehension skill.** If briefings don't lead with goals, founder sees noise instead of signal. The morning email digest is the most-visible application — every URGENT item should be tied to a goal it unblocks.

See `BIBLE.md` § 9 for the policy statement and `companies/portfolio-hq/personas/chief-of-staff-hourly.md` "Briefing format" section for the canonical CoS application.
