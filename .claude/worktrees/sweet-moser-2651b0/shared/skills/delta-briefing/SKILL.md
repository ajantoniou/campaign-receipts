# Skill: delta-briefing

**Version:** 1.0  
**Author:** Chief of Staff  
**Date:** 2026-05-04  
**Category:** Cost control  
**Applies to:** Chief of Staff, Company CEOs, any periodic briefing agent

---

## What this skill does

Before writing a briefing, checks whether **anything actually changed** since the last run.  
If nothing changed → writes a one-line "no delta" entry and exits.  
If something changed → proceeds with a full briefing, loading only changed files.

**Origin:** CoS wrote 33 briefings on 2026-05-04, most containing identical state.  
Cost: ~$367 for 33 nearly-identical documents.  
This skill eliminates the redundant runs entirely.

---

## When to use

Run immediately after `idle-exit` passes (i.e., work may exist).  
This determines whether a full briefing is warranted.

---

## The skill

### Step 1 — Git delta check

```bash
REPO="/Applications/DrAntoniou Projects/AgentCompanies"
LAST_BRIEFING_TIME=$(ls -t "$REPO/briefings/" | head -1 | grep -oP '\d{4}-\d{2}-\d{2}-\d{4}' | head -1)

# Convert briefing timestamp to git --since format
# e.g. "2026-05-04-1400" → "2026-05-04 14:00"
SINCE=$(echo $LAST_BRIEFING_TIME | sed 's/-\([0-9]\{4\}\)$/ \1/' | sed 's/\([0-9]\{2\}\)$/:\1/')

CHANGED=$(git -C "$REPO" log --since="$SINCE" --name-only --pretty=format: | sort -u | grep -v "^$")

echo "Files changed since last briefing:"
echo "${CHANGED:-NONE}"
```

### Step 2 — Issue state delta check

```python
import urllib.request, json, re, os
from pathlib import Path

BASE = "http://127.0.0.1:3100/api"
REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
SNAPSHOT_FILE = REPO / "infrastructure/scripts/.briefing-snapshot.json"

COMPANIES = {
    "Concise":       "8e22d2c6-5c57-491a-9864-40a79c4a0d49",
    "NT Ministry":   "66ba66fa-871d-4918-b2c3-787aee9a6064",
    "HealthBrew":    "c920ce4e-bb21-410b-a56a-63865c1ae3ce",
}

def req(path):
    r = urllib.request.Request(f"{BASE}{path}")
    with urllib.request.urlopen(r) as resp:
        raw = resp.read()
    return json.loads(re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f]', b' ', raw))

# Build current state snapshot
current = {}
for name, cid in COMPANIES.items():
    issues = req(f"/companies/{cid}/issues")
    current[name] = {
        "todo": len([i for i in issues if i["status"] == "todo"]),
        "in_progress": len([i for i in issues if i["status"] == "in_progress"]),
        "in_review": len([i for i in issues if i["status"] == "in_review"]),
        "blocked": len([i for i in issues if i["status"] == "blocked"]),
    }

# Compare to previous snapshot
if SNAPSHOT_FILE.exists():
    prev = json.loads(SNAPSHOT_FILE.read_text())
    delta = {k: v for k, v in current.items() if v != prev.get(k)}
    if not delta:
        print("delta-briefing: NO STATE CHANGE since last run — skipping full brief.")
        # Update snapshot timestamp only
        SNAPSHOT_FILE.write_text(json.dumps(current, indent=2))
        exit(0)  # EXIT — no briefing needed
    else:
        print(f"delta-briefing: Changes detected in: {list(delta.keys())} — proceeding with briefing.")
        print(f"Delta: {json.dumps(delta, indent=2)}")
else:
    print("delta-briefing: No prior snapshot — cold start, proceeding with full briefing.")

# Save new snapshot
SNAPSHOT_FILE.write_text(json.dumps(current, indent=2))
```

### Step 3 — Decision

| Condition | Action |
|---|---|
| No git changes AND no issue state delta | Write one line to briefing file: `"[timestamp] No state change since last run — skipping."` Exit. |
| Git changes only (e.g. persona edits) | Write briefing section on changed files only. Skip full company state read. |
| Issue state delta | Write full briefing for changed companies only. Skip unchanged companies. |
| Cold start (no snapshot) | Full briefing, all companies. |

---

## One-line briefing format (no-delta case)

```
# CoS Briefing — 2026-05-04 14:00 ET
No state change since last run (2026-05-04 13:00 ET). No actions taken.
```

That's it. Costs ~200 tokens. Saves ~192K cached tokens vs a full briefing.

---

## Cost impact

| Scenario | Tokens | Cost |
|---|---|---|
| Full briefing (current) | ~192K cached + 2K output | $0.44 |
| No-delta skip | ~200 total | $0.0003 |
| Savings per skipped run | | $0.44 |
| CoS runs 24/day, 20 have no delta | | **$8.80/day saved** |
| Monthly | | **~$264/month saved on CoS alone** |

---

## Integration

Add to CoS persona and CEO personas after the idle-exit check:

```
## SECOND ACTION: delta-briefing check
After idle-exit passes, run the delta-briefing skill:
`shared/skills/delta-briefing/SKILL.md`
If it exits (no delta) → write one-line briefing entry and exit.
Only proceed to full briefing if delta detected.
```

---

## Monetization note

This skill + `idle-exit` are packaged as **"Agent Cost Control Pack"** —  
target price $25 for external sale via Lemon Squeezy once polished.  
Target audience: any team running Paperclip or similar agent orchestration  
burning money on periodic agents that mostly have "nothing to do."

Estimated value to buyer: $200-500+/month in saved API costs.  
$25 price point = <1 week payback. High-conversion offer.
