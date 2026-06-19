# Plutus Street — HIBERNATING

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
- SEC/FTC compliance complexity high — needs careful Compliance
  Reviewer engagement before we burn budget on signal infrastructure
- Plutopath edge-protection adds dependency on founder weekly review
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
without rebuilding context. Compliance Reviewer persona is preserved
because it's the firewall between "data product" and "investment
advice" framing.

## How to wake up

Founder writes: "wake up plutus-street, $X/mo budget."

Chief of Staff:
1. Removes this `HIBERNATING.md` file
2. Updates `PORTFOLIO_BRIEF.md` budget table to the new cap
3. Updates Paperclip company budget via API: `PATCH /api/companies/<id>` `{"budgetMonthlyCents": <new>}`
4. Re-enables CEO heartbeat routine in Paperclip dashboard
5. Logs the wake decision in `SESSION_DECISIONS.md` and the next CoS briefing
6. **Plutus Street-specific:** before any signal infrastructure work
   resumes, Compliance Reviewer agent must do a fresh "data vs advice"
   audit of the proposed Phase-1 surface

## Saturday review checklist

Each Saturday, Chief of Staff posts a one-liner per hibernating company
in the briefing:

- "Plutus Street: still hibernating, no signal change. Continue."
- OR
- "Plutus Street: founder wants to revisit — flagging in
  FOUNDER_ACTIONS.md."
