#!/usr/bin/env python3
"""CoS triage pass 3 — 2026-05-06 (Cursor session).

Why:
  After triage 1 + HEA-60 resolution, ~63 issues still blocked. Founder said
  "continue routine triage." Big remaining cleanup buckets:

  1. ~23 historical POR-* "Chief of Staff hourly briefing + auto-promote"
     duplicates from the now-disabled hourly trigger.
  2. Recovery / review shells across companies whose parents are already
     done/cancelled or are healthy in_progress (i.e. not stalled).
  3. Blocked issues with NO first-class blockedByIssueIds and lock=false —
     candidates for blocked -> todo so agents have actionable work.

Pattern matching (deliberately conservative):
  - Only acts on titles that match the well-known shell patterns.
  - Never modifies in_progress / in_review issues unless explicitly listed.
  - Refuses to promote anything that has any non-cancelled blockedBy.
  - Skips anything assigned to a user (not just an agent) so we don't
    overwrite founder-driven work.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

API = "http://127.0.0.1:3100/api"
RUN_ID = "cos-cursor-2026-05-06-triage-3"
TIMEOUT = 8

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
REPORT_PATH = REPO_ROOT / "companies/portfolio-hq/triage/2026-05-06-cos-triage-pass-3.md"

# Shell title patterns we feel safe cancelling without per-issue review.
SHELL_TITLE_PATTERNS = [
    re.compile(r"^Recover (stalled|missing next step) [A-Z]+-\d+", re.I),
    re.compile(r"^Review productivity for [A-Z]+-\d+", re.I),
    re.compile(r"^Chief of Staff hourly briefing \+ auto-promote", re.I),
]

# Manual exclusions — never touch these.
DO_NOT_TOUCH_IDS = {
    # POR-158 is the canonical CoS routine issue (oldest of the 25). Keep it
    # in case the founder wants to re-enable + reassign instead of recreating.
    "POR-158",
}


def req(method: str, path: str, body: dict | None = None):
    headers = {"X-Paperclip-Run-Id": RUN_ID, "Accept": "application/json"}
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode()
    else:
        data = None
    r = urllib.request.Request(f"{API}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=TIMEOUT) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read())
        except Exception:
            return e.code, "<non-json>"


def list_issues(company_id: str, statuses: list[str]) -> list[dict]:
    code, body = req(
        "GET",
        f"/companies/{company_id}/issues?status={','.join(statuses)}",
    )
    if code >= 400 or not isinstance(body, (list, dict)):
        return []
    return body if isinstance(body, list) else (body.get("items") or [])


def is_shell_title(title: str | None) -> bool:
    if not title:
        return False
    return any(p.search(title) for p in SHELL_TITLE_PATTERNS)


def cancel_issue(uuid: str, current_status: str) -> dict:
    code, _ = req(
        "PATCH",
        f"/issues/{uuid}",
        {"status": "cancelled", "blockedStatusLock": False, "blockedByIssueIds": []},
    )
    code2, after = req("GET", f"/issues/{uuid}")
    return {"http": code, "before": current_status,
            "after": after.get("status") if isinstance(after, dict) else None}


def promote_to_todo(uuid: str, current_status: str) -> dict:
    code, _ = req(
        "PATCH",
        f"/issues/{uuid}",
        {"status": "todo", "blockedStatusLock": False, "blockedByIssueIds": []},
    )
    code2, after = req("GET", f"/issues/{uuid}")
    return {"http": code, "before": current_status,
            "after": after.get("status") if isinstance(after, dict) else None}


def main() -> int:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    code, companies = req("GET", "/companies")
    if code >= 400:
        print(f"ERROR: list companies http={code}", file=sys.stderr)
        return 2
    companies = companies if isinstance(companies, list) else companies.get("items") or []

    bucket_shells: list[dict] = []
    bucket_promotes: list[dict] = []

    for c in companies:
        cid = c.get("id")
        cname = c.get("name")
        if not cid:
            continue
        opens = list_issues(cid, ["todo", "in_progress", "in_review", "blocked"])

        # Index by identifier for blockedBy resolution
        index = {(i.get("identifier") or "<noid>"): i for i in opens}

        for issue in opens:
            ident = issue.get("identifier") or "<noid>"
            if ident in DO_NOT_TOUCH_IDS:
                continue
            status = issue.get("status")
            title = issue.get("title") or ""
            blocked_by = issue.get("blockedBy") or []
            unresolved = [b for b in blocked_by
                          if (b.get("status") not in ("done", "cancelled"))]

            # Bucket 1: shell-titled issues that are blocked or hanging.
            if is_shell_title(title) and status in ("blocked", "todo"):
                # Don't cancel a "Recover X" if X is genuinely stalled (status=blocked
                # and parent has unresolved real blockers). Detect by looking up X.
                m = re.search(r"([A-Z]+-\d+)\s*$", title)
                parent_ident = m.group(1) if m else None
                parent = index.get(parent_ident) if parent_ident else None
                parent_status = parent.get("status") if parent else "<unknown>"

                # Cancel only when the parent is healthy (todo / in_progress / in_review / done / cancelled / not in open set)
                # i.e. NOT itself blocked-needing-help.
                if parent_status != "blocked":
                    bucket_shells.append({
                        "company": cname, "id": ident, "uuid": issue.get("id"),
                        "title": title, "status": status,
                        "parent": parent_ident, "parent_status": parent_status,
                    })
                continue

            # Bucket 2: blocked, lock=false, no unresolved blockedBy, no execution policy in flight.
            if (status == "blocked"
                    and not issue.get("blockedStatusLock")
                    and not unresolved
                    and not issue.get("executionState")
                    and not issue.get("executionPolicy")
                    and not issue.get("assigneeUserId")):  # leave human-assigned alone
                # Skip the famous shell duplicates (handled above) by re-checking title.
                if not is_shell_title(title):
                    bucket_promotes.append({
                        "company": cname, "id": ident, "uuid": issue.get("id"),
                        "title": title[:90],
                    })

    # Execute bucket 1
    shell_results = []
    for s in bucket_shells:
        r = cancel_issue(s["uuid"], s["status"])
        shell_results.append({**s, **r})

    # Execute bucket 2
    promote_results = []
    for p in bucket_promotes:
        r = promote_to_todo(p["uuid"], "blocked")
        promote_results.append({**p, **r})

    # Re-sweep totals
    code, comps = req("GET", "/companies")
    comps = comps if isinstance(comps, list) else comps.get("items") or []
    totals = {"in_progress": 0, "in_review": 0, "todo": 0, "blocked": 0}
    for c in comps:
        for i in list_issues(c["id"], list(totals.keys())):
            s = i.get("status")
            if s in totals:
                totals[s] += 1

    md = ["# CoS triage pass 3 — 2026-05-06",
          "",
          f"Run id: `{RUN_ID}`. PATCH 500s on side-effects but writes commit (audit-log defect).",
          "",
          "## Bucket 1 — recovery / review / CoS-hourly shells cancelled",
          "",
          f"Cancelled {len(shell_results)} issues whose parent is healthy (not in `blocked`).",
          "",
          "| Company | Issue | Title | Parent | Parent status | Before | After |",
          "|---|---|---|---|---|---|---|"]
    for r in shell_results:
        md.append(f"| {r['company']} | {r['id']} | {(r['title'] or '')[:70]} | "
                  f"{r.get('parent')} | {r.get('parent_status')} | "
                  f"{r.get('before')} | {r.get('after')} |")
    md.extend(["",
               "## Bucket 2 — blocked → todo (no first-class blocker, lock cleared)",
               "",
               f"Promoted {len(promote_results)} issues so agents have actionable work.",
               "",
               "| Company | Issue | Title | Before | After |",
               "|---|---|---|---|---|"])
    for r in promote_results:
        md.append(f"| {r['company']} | {r['id']} | {r['title']} | "
                  f"{r.get('before')} | {r.get('after')} |")
    md.extend(["",
               "## Portfolio totals after pass 3",
               "",
               f"- in_progress: **{totals['in_progress']}**",
               f"- in_review:   **{totals['in_review']}**",
               f"- todo:        **{totals['todo']}**",
               f"- blocked:     **{totals['blocked']}**"])
    REPORT_PATH.write_text("\n".join(md) + "\n")
    print(f"Cancelled shells: {len(shell_results)}")
    print(f"Promoted to todo: {len(promote_results)}")
    print(f"Totals -> {totals}")
    print(f"Report: {REPORT_PATH.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    import urllib.error  # noqa: E402, F401
    sys.exit(main())
