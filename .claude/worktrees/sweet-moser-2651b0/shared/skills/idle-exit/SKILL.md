# Skill: idle-exit

**Version:** 1.0  
**Author:** Chief of Staff  
**Date:** 2026-05-04  
**Category:** Cost control  
**Applies to:** All agents with heartbeats (CEOs, CoS, any periodic agent)

---

## What this skill does

Checks whether an agent has actual work to do **before loading any context**.  
If no work exists → exits in <500 tokens.  
If work exists → proceeds normally.

**Origin:** On 2026-05-04 HealthBrew burned $463 across 508 runs with 1 blocked issue.  
Every run loaded 472K cached tokens to conclude "nothing to do."  
This skill prevents that entirely.

---

## When to use

Run this as the **very first action** on every wake, before:
- Loading BIBLE.md
- Loading your persona
- Reading company state
- Writing any briefing

---

## The skill (copy-paste into your run)

```bash
# IDLE-EXIT CHECK — run before loading anything
COMPANY_ID="<your_company_id>"
AGENT_ID="<your_agent_id>"

TODO_COUNT=$(curl -s "http://127.0.0.1:3100/api/companies/${COMPANY_ID}/issues?status=todo" \
  | python3 -c "
import sys, json, re
raw = sys.stdin.buffer.read()
clean = re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f]', b' ', raw)
issues = json.loads(clean)
assigned = [i for i in issues if i.get('assigneeId') == '${AGENT_ID}']
print(len(assigned))
")

if [ "$TODO_COUNT" = "0" ]; then
  echo "idle-exit: 0 assigned todo issues — nothing to do. Exiting."
  exit 0
fi

echo "idle-exit: ${TODO_COUNT} todo issue(s) found — proceeding."
```

---

## For CEO agents (check own team too)

CEOs should also check if ANY of their team's agents have todo issues:

```python
import urllib.request, json, re

BASE = "http://127.0.0.1:3100/api"
COMPANY_ID = "<your_company_id>"

def req(path):
    r = urllib.request.Request(f"{BASE}{path}")
    with urllib.request.urlopen(r) as resp:
        raw = resp.read()
    return json.loads(re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f]', b' ', raw))

issues = req(f"/companies/{COMPANY_ID}/issues?status=todo")
backlog = req(f"/companies/{COMPANY_ID}/issues?status=backlog")

if not issues and not backlog:
    print("idle-exit: no todo or backlog issues — nothing to promote or assign. Exiting.")
    exit(0)

print(f"idle-exit: {len(issues)} todo + {len(backlog)} backlog issues found — proceeding.")
```

---

## Cost impact

| Scenario | Tokens/run | Cost/run |
|---|---|---|
| Without idle-exit (HealthBrew 2026-05-04) | 472,837 cached | $0.91 |
| With idle-exit, no work | ~300 | $0.0005 |
| With idle-exit, work exists | ~472,837 cached | $0.91 (same — but earned) |

**Savings when idle:** 99.9% per run.  
**Savings across portfolio:** ~$400+/day when most agents have no active work.

---

## Integration

Import this skill into any agent persona by adding to the top of their run instructions:

```
## FIRST ACTION ON EVERY WAKE: idle-exit check
Before loading any files or context, run the idle-exit skill:
`shared/skills/idle-exit/SKILL.md`
If it exits → you exit. Do not proceed.
```

---

## Monetization note

This skill + `delta-briefing` are packaged as **"Agent Cost Control Pack"** —  
target price $25 for external sale via Lemon Squeezy once polished.  
Target audience: any team running Paperclip or similar agent orchestration  
with heartbeat-based scheduling and idle cost problems.
