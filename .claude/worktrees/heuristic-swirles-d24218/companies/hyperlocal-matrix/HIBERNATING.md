# Hyperlocal Matrix — HIBERNATING

**Hibernation start:** 2026-05-05
**Hibernation end:** TBD (revisit Saturday or weekly)
**Decision authority:** Founder + Chief of Staff at portfolio review

## Why hibernating

Per founder direction 2026-05-05:

> "Some of the projects we want to do but don't want to spend money
> on them yet. We can revisit the hibernating ones on Saturday or
> next week."

Audit (2026-05-05) found:
- No `briefs/` cadence ever fired
- `issues-backlog.md` last touched 2026-05-01 (~5 days stale)
- Full engineering team persona footprint is heavy relative to dormant state
- Budget cap drift: PORTFOLIO_BRIEF.md said $100/mo, kickoff said $500;
  resolved by parking at $0/mo while paused

## What hibernation means operationally

- **Budget cap: $0/mo.** No agent spend. No Paperclip routines fire.
- **No CEO heartbeats.** CEO is paused.
- **No CoS auto-promote.** CoS does not promote Backlog → Todo.
- **No Founder time.** Not surfaced in daily/weekly briefings unless
  the founder asks.

## What's preserved

All persona files, vision, kickoff, issues-backlog, week-1-plan, and
permissions docs stay frozen-in-place so we can re-activate fast
without rebuilding context.

## How to wake up

Founder writes: "wake up hyperlocal-matrix, $X/mo budget."

Chief of Staff:
1. Removes this `HIBERNATING.md` file
2. Updates `PORTFOLIO_BRIEF.md` budget table to the new cap
3. Updates Paperclip company budget via API: `PATCH /api/companies/<id>` `{"budgetMonthlyCents": <new>}`
4. Re-enables CEO heartbeat routine in Paperclip dashboard
5. Logs the wake decision in `SESSION_DECISIONS.md` and the next CoS briefing

## Saturday review checklist

Each Saturday, Chief of Staff posts a one-liner per hibernating company
in the briefing:

- "Hyperlocal Matrix: still hibernating, no signal change. Continue."
- OR
- "Hyperlocal Matrix: founder wants to revisit — flagging in
  FOUNDER_ACTIONS.md."
