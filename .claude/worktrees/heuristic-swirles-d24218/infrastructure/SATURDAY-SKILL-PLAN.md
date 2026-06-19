# Saturday Skill-First Restart Plan
**Filed:** 2026-05-04 ~20:30 ET
**Goal:** Cut token cost 70-80% before re-enabling any agents

---

## The Real Numbers (measured 2026-05-04)

| Company | Runs | Cached/run | Output/run | Cost/run | Total cost |
|---|---|---|---|---|---|
| HealthBrew | 508 | 472,837 | 2,704 | **$0.91** | ~$463 |
| Concise | 359 | 367,333 | 2,589 | **$0.75** | ~$268 |
| Portfolio HQ | 825 | 192,448 | 2,078 | **$0.44** | ~$367 |
| NT Ministry | 413 | 129,356 | 998 | **$0.27** | ~$111 |
| **TOTAL** | **2,105** | | | **avg $0.58** | **~$1,209** |

**Key finding:** HealthBrew burned $463 with only 1 active issue (HEA-3, blocked on founder mood board pick). Every run was loading 472K cached tokens to conclude "nothing to do." Pure waste.

**CoS wrote 33 briefings today** — one per hour plus extras. Each briefing loads the full 662-line persona + reads all company state. At $0.44/run × 825 runs = $367 for briefings alone.

---

## Root Cause

The 472K-192K cached tokens per run = **the persona file being loaded every single wake**, regardless of whether there's work to do.

A 662-line persona = ~8,000 tokens. Cached at $1.50/M = $0.012 per load.
But Paperclip appears to be loading much more — full conversation history, all prior context, all company state files. 

**The pattern:** Agent wakes → loads everything → reasons "nothing to do" → sleeps → repeats. The reasoning step is the expensive part, not the conclusion.

---

## The Fix: Skills as Pre-Compiled Logic

A skill replaces the reasoning step with a deterministic script. The agent doesn't think — it executes.

### Target: 5 skills before re-enabling anything

#### Skill 1: `delta-briefing`
**Replaces:** CoS full company state load every hour
**How:** Store a snapshot hash after each run. Next run: only load issues/goals that changed since last snapshot. If nothing changed → exit in <500 tokens.
**Estimated savings:** 90% of CoS runs have no meaningful delta. $0.44 → $0.04/run on no-change runs.
**Files:** `shared/skills/delta-briefing/SKILL.md`

#### Skill 2: `idle-exit`  
**Replaces:** Agents loading full persona when they have no active issues
**How:** Before loading anything else, check `GET /api/companies/:id/issues?status=todo&assigneeId=:agentId`. If 0 results → exit immediately. No persona load needed.
**Estimated savings:** HealthBrew had 50 done + 1 blocked issue. 508 runs × $0.91 = $463. With idle-exit: most runs cost ~$0.01. Saves ~$450.
**Files:** `shared/skills/idle-exit/SKILL.md`

#### Skill 3: `goal-progress`
**Replaces:** CEO Q4hr brief loading full company context to compute progress
**How:** `GET /api/companies/:id/goals` → for each goal, count linked issues by status. Format as 5-line summary. Total input: ~200 tokens. Total output: ~100 tokens. Cost: $0.00001/run.
**Files:** `shared/skills/goal-progress/SKILL.md`

#### Skill 4: `issue-pickup`
**Replaces:** CTO reasoning about what to work on next
**How:** Deterministic — take the oldest `todo` issue assigned to this agent. No reasoning. Just GET + PATCH status to `in_progress`. If nothing assigned → idle-exit.
**Files:** `shared/skills/issue-pickup/SKILL.md`

#### Skill 5: `cost-snapshot`
**Already built** as `token-report.py`. Wrap as Paperclip skill so agents can call it.
**Files:** `shared/skills/cost-snapshot/SKILL.md`

---

## Saturday Execution Order

### Step 1: Measure per-agent (not per-company) breakdown (30 min)
Paperclip task-sessions API doesn't store per-run token counts (nulls confirmed).
Alternative: check JSONL run logs if Paperclip writes them locally.
```bash
find "/Applications/DrAntoniou Projects/AgentCompanies/infrastructure/paperclip" -name "*.jsonl" | head -5
```
If no logs → instrument one agent manually for 3 runs before building skills.

### Step 2: Build Skill 2 first (`idle-exit`) — biggest ROI (45 min)
HealthBrew alone = $463 wasted. Idle-exit would have saved ~$450 of that.
This skill applies to ALL agents across ALL companies.

### Step 3: Build Skill 1 (`delta-briefing`) (60 min)
CoS is the highest-frequency agent (825 runs). Even 50% savings = $183 back.

### Step 4: Re-enable agents ONE company at a time (30 min)
- Start with Concise only (most active, LS approval likely by Saturday)
- Watch cost for 2 hours before enabling others
- HealthBrew stays OFF until HEA-3 mood board is picked (no active work = no reason to run)

### Step 5: Hard rules going forward
- No agent gets a heartbeat unless it has ≥1 active assigned issue
- Minimum heartbeat interval: 3600s (1 hour)
- HealthBrew, NT Ministry: manual trigger only until founder unblocks them
- CoS: 3600s max, delta-briefing skill required before re-enabling

---

## Projected Cost After Skills

| Scenario | Cost/day estimate |
|---|---|
| Current (before pause) | ~$300/day |
| After idle-exit skill only | ~$50/day |
| After idle-exit + delta-briefing | ~$20/day |
| After all 5 skills + pruned agents | **~$10/day** |

These are estimates. Measure after Step 1 to confirm.

---

## What NOT to do Saturday

- ❌ Don't re-enable all agents at once
- ❌ Don't set heartbeats below 3600s
- ❌ Don't re-enable HealthBrew until HEA-3 is resolved
- ❌ Don't build all 5 skills before validating the first one saves money
- ❌ Don't replace Paperclip — it's open source, free, and the API is already wired

---

## Files to build Saturday

1. `shared/skills/idle-exit/SKILL.md`
2. `shared/skills/delta-briefing/SKILL.md`
3. `shared/skills/goal-progress/SKILL.md`
4. `shared/skills/issue-pickup/SKILL.md`
5. Update CoS persona to use delta-briefing skill
6. Update all company personas to check idle-exit before loading context
