#!/usr/bin/env python3
"""CoS portfolio sweep — read-only Paperclip status across all 6 companies.

Why: Cursor is now the founder's CoS for the portfolio. This script gives
a single tabular snapshot per company so we know where to push toward
Saturday-MVP without spamming the founder with raw JSON.

Reads `.env` from repo root for `PAPERCLIP_ADMIN_TOKEN`.
Hits `/api/companies`, then per company `/api/companies/{id}/issues`
and `/api/companies/{id}/agents`. Prints to stdout. No mutations.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent  # AgentCompanies/
ENV_PATH = REPO_ROOT / ".env"
API = os.environ.get("PAPERCLIP_API_URL", "http://127.0.0.1:3100/api")
TIMEOUT = 8


def load_env(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        out[k.strip()] = v
    return out


def api_get(path: str, token: str | None, params: dict | None = None) -> dict | list:
    url = f"{API}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    headers = {"Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return json.loads(resp.read())


def coerce_list(blob) -> list:
    if isinstance(blob, list):
        return blob
    if isinstance(blob, dict):
        for key in ("items", "issues", "agents", "data", "results"):
            v = blob.get(key)
            if isinstance(v, list):
                return v
    return []


def main() -> int:
    env = load_env(ENV_PATH)
    token = env.get("PAPERCLIP_ADMIN_TOKEN") or os.environ.get("PAPERCLIP_ADMIN_TOKEN")
    if not token:
        print(
            "WARN: PAPERCLIP_ADMIN_TOKEN is empty in root .env; "
            "localhost API does not enforce auth so reads will still work.",
            file=sys.stderr,
        )

    try:
        api_get("/health", token)
    except urllib.error.URLError as e:
        print(f"ERROR: control plane unreachable at {API} ({e})", file=sys.stderr)
        return 3

    companies = coerce_list(api_get("/companies", token))
    companies.sort(key=lambda c: (c.get("name") or "").lower())

    overall = Counter()
    print(f"# Portfolio sweep — {len(companies)} companies @ {API}\n")

    for company in companies:
        cid = company.get("id")
        name = company.get("name") or "(unnamed)"
        if not cid:
            continue

        try:
            agents = coerce_list(api_get(f"/companies/{cid}/agents", token))
        except urllib.error.HTTPError:
            agents = []

        try:
            issues = coerce_list(
                api_get(
                    f"/companies/{cid}/issues",
                    token,
                    {"status": "todo,in_progress,in_review,blocked"},
                )
            )
        except urllib.error.HTTPError as e:
            print(f"## {name}\n  issues fetch failed: HTTP {e.code}\n")
            continue

        by_status = Counter(i.get("status") for i in issues)
        for k, v in by_status.items():
            overall[k] += v

        active_agents = [a for a in agents if (a.get("status") or "").lower() not in ("archived", "disabled")]
        agent_total = len(agents)
        agent_active = len(active_agents)

        blocked = [i for i in issues if i.get("status") == "blocked"]
        in_progress = [i for i in issues if i.get("status") == "in_progress"]
        todo = [i for i in issues if i.get("status") == "todo"]
        in_review = [i for i in issues if i.get("status") == "in_review"]

        def short(issue: dict) -> str:
            ident = issue.get("identifier") or issue.get("issueNumber") or issue.get("id", "")[:8]
            title = (issue.get("title") or "").strip().replace("\n", " ")
            if len(title) > 90:
                title = title[:87] + "..."
            assignee = issue.get("assigneeAgentId") or issue.get("assigneeUserId") or "-"
            prio = issue.get("priority") or "-"
            return f"  - [{prio}] {ident} {title}  (assignee: {assignee})"

        print(f"## {name}  ({cid})")
        print(
            f"  agents: {agent_active}/{agent_total} active   |   "
            f"open: {len(issues)}  (in_progress {len(in_progress)} / "
            f"in_review {len(in_review)} / todo {len(todo)} / blocked {len(blocked)})"
        )

        if blocked:
            print("  TOP BLOCKED:")
            for i in blocked[:3]:
                print(short(i))
        if in_progress:
            print("  IN PROGRESS:")
            for i in in_progress[:3]:
                print(short(i))
        if not issues:
            print("  (no open issues — agents likely idle)")
        print()

    print("## Portfolio totals")
    for status in ("in_progress", "in_review", "todo", "blocked"):
        print(f"  {status}: {overall.get(status, 0)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
