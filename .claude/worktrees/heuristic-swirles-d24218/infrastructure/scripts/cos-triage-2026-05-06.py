#!/usr/bin/env python3
"""CoS triage pass — 2026-05-06 (Cursor session).

Why: Portfolio sweep showed 71 of 115 open issues blocked, recovery loops,
and a routine misfire creating 25 duplicate "CoS hourly briefing" issues.
This script does the explicit subset the founder approved with "go":
  A. Close 5 recovery-loop shells.
  B. Cancel POR-163 + POR-164 (only 2 of the 25 dupes; rest pending founder OK).
  C. HEA-111 - clear blockedStatusLock, set to todo, drop board-action note in audit.
  D. CON-25 - clear blockedStatusLock, set to todo.
  E. VOT-9  - clear blockedStatusLock, set to todo.
  F. CarStack pipeline: CAR-19 + CAR-21 - clear lock + promote if no first-class blockedBy.

Implementation note: comments via POST /api/issues/:id/comments 500 when
acting as local_implicit board (authorId resolves to literal "board" which
isn't a real user FK). Status PATCH succeeds (write commits before the
audit-log side-effect throws). So we mutate state via PATCH and capture
the human-readable rationale in a markdown report instead.
"""
from __future__ import annotations

import json
import sys
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path

API = "http://127.0.0.1:3100/api"
RUN_ID = "cos-cursor-2026-05-06-triage"
TIMEOUT = 8

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
REPORT_PATH = REPO_ROOT / "companies/portfolio-hq/triage/2026-05-06-cos-triage-pass-1.md"

ACTIONS: list[dict] = [
    # (kind, identifier, target_status, lock_clear, why)
    {"kind": "A", "id": "CAR-39", "status": "cancelled", "clear_lock": True,
     "why": "Recovery shell for CAR-19. Recovery clones cause infinite loops; "
            "diagnose-why-work-stopped invariant: only real blockers stop work. "
            "Cancel; CAR-19 itself is targeted for direct triage."},
    {"kind": "A", "id": "CAR-41", "status": "cancelled", "clear_lock": True,
     "why": "Recovery shell for CAR-31. Same rationale as CAR-39."},
    {"kind": "A", "id": "CON-153", "status": "cancelled", "clear_lock": True,
     "why": "Recovery shell for CON-112 (RLS migration). Recovery clones cause "
            "infinite loops; CON-112 unblock requires Supabase service-role key "
            "(already in root .env) - not a recovery problem."},
    {"kind": "A", "id": "VOT-64", "status": "cancelled", "clear_lock": True,
     "why": "Recovery shell for VOT-52 (which is itself blocked). Cancel; "
            "VOT-52 needs direct triage if priority."},
    {"kind": "A", "id": "NTM-89", "status": "cancelled", "clear_lock": True,
     "why": "Recovery shell for NTM-37 (which is in_progress, NOT stalled). "
            "Bogus recovery target. Cancel."},
    {"kind": "B", "id": "POR-163", "status": "cancelled", "clear_lock": True,
     "why": "Duplicate of POR-158 (same title, identical description, hourly "
            "routine misfire). 25 such dupes exist; cancelling 2 per founder "
            "'go' on initial plan; remainder awaits explicit confirmation."},
    {"kind": "B", "id": "POR-164", "status": "cancelled", "clear_lock": True,
     "why": "Already cancelled in probe; re-asserting blockedStatusLock=false."},
    {"kind": "C", "id": "HEA-111", "status": "todo", "clear_lock": True,
     "why": "Title says 'no CLI PAT' for Supabase migration, but Supabase "
            "service-role key is in root .env. Not actually founder-blocked. "
            "Promote to todo so an agent can apply via service-role key."},
    {"kind": "D", "id": "CON-25", "status": "todo", "clear_lock": True,
     "why": "SEALED Lemon Squeezy buy button + PDF delivery. High priority, "
            "direct revenue. LEMONSQUEEZY_* keys are in root .env. Promote to "
            "todo; if agent identifies a true blocker, agent can re-block with "
            "named blockedByIssueIds."},
    {"kind": "E", "id": "VOT-9", "status": "todo", "clear_lock": True,
     "why": "Newsletter landing page with lead-magnet capture. High priority. "
            "Same protocol as CON-25 - promote to todo, require named blocker "
            "if it should remain blocked."},
    {"kind": "F", "id": "CAR-19", "status": "todo", "clear_lock": True,
     "why": "Hero asset export. CarStack has 0 todo vs 16 blocked - agents are "
            "starved. Promote so a designer/copy agent can pick it up."},
    {"kind": "F", "id": "CAR-21", "status": "todo", "clear_lock": True,
     "why": "USPTO TESS rows paste. Same rationale as CAR-19; agents need "
            "actionable work."},
]


def http_request(method: str, path: str, body: dict | None = None) -> tuple[int, dict | str]:
    url = f"{API}{path}"
    data = None
    headers = {"Accept": "application/json", "X-Paperclip-Run-Id": RUN_ID}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.status, json.loads(resp.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            payload = json.loads(e.read())
        except Exception:
            payload = "<non-json>"
        return e.code, payload


def find_issue_by_identifier(identifier: str, company_index: dict) -> dict | None:
    return company_index.get(identifier)


def build_company_index() -> dict[str, dict]:
    code, companies = http_request("GET", "/companies")
    if code >= 400:
        raise RuntimeError(f"failed to list companies: {code}")
    items = companies if isinstance(companies, list) else companies.get("items") or []
    out: dict[str, dict] = {}
    for c in items:
        cid = c.get("id")
        if not cid:
            continue
        code, issues_blob = http_request(
            "GET",
            f"/companies/{cid}/issues?status=todo,in_progress,in_review,blocked",
        )
        if code >= 400:
            continue
        issues = issues_blob if isinstance(issues_blob, list) else issues_blob.get("items") or []
        for i in issues:
            ident = i.get("identifier")
            if ident:
                out[ident] = i
    return out


def main() -> int:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)

    code, _ = http_request("GET", "/health")
    if code != 200:
        print("ERROR: /api/health not 200", file=sys.stderr)
        return 2

    index = build_company_index()
    print(f"Indexed {len(index)} open issues across portfolio")

    rows: list[dict] = []
    for action in ACTIONS:
        ident = action["id"]
        target_status = action["status"]
        clear_lock = action["clear_lock"]
        why = action["why"]
        kind = action["kind"]
        issue = index.get(ident)
        if not issue:
            rows.append({**action, "result": "NOT_FOUND", "before": None, "after": None})
            continue

        issue_id = issue["id"]
        before_status = issue.get("status")
        before_lock = issue.get("blockedStatusLock")
        blocked_by = [b.get("identifier") for b in issue.get("blockedBy") or []]

        if target_status == "todo" and before_status == "blocked" and blocked_by:
            rows.append({**action, "result": "SKIP_HAS_REAL_BLOCKERS",
                         "before": before_status, "after": before_status,
                         "blocked_by": blocked_by})
            continue

        body: dict = {"status": target_status}
        if clear_lock:
            body["blockedStatusLock"] = False

        code, _resp = http_request("PATCH", f"/issues/{issue_id}", body)

        code_get, after = http_request("GET", f"/issues/{issue_id}")
        after_status = after.get("status") if isinstance(after, dict) else None
        after_lock = after.get("blockedStatusLock") if isinstance(after, dict) else None
        result = (
            "OK" if after_status == target_status
            else f"PARTIAL_HTTP_{code}_AFTER_{after_status}"
        )
        rows.append({
            "kind": kind, "id": ident, "issue_id": issue_id,
            "before": {"status": before_status, "lock": before_lock,
                       "blocked_by": blocked_by},
            "after": {"status": after_status, "lock": after_lock},
            "patch_http": code, "result": result, "why": why,
        })

    md = ["# CoS triage pass 1 — 2026-05-06",
          "",
          f"Run id: `{RUN_ID}`  |  Actor: Cursor session, local_implicit board.",
          "",
          "Comments via POST `/api/issues/:id/comments` 500 when actor is "
          "local_implicit board (authorId resolves to literal `\"board\"` which "
          "isn't a real user FK). Status PATCH commits before the audit-log "
          "side-effect throws, so state changes are reliable; rationale captured "
          "here instead of inline comments.",
          "",
          "## Results",
          "",
          "| Kind | Issue | Before | After | HTTP | Result | Why |",
          "|---|---|---|---|---|---|---|"]
    for r in rows:
        before = r.get("before")
        after = r.get("after")
        before_s = (
            f"{before['status']} (lock={before['lock']}, blockedBy={before['blocked_by']})"
            if isinstance(before, dict) else str(before)
        )
        after_s = (
            f"{after['status']} (lock={after['lock']})"
            if isinstance(after, dict) else str(after)
        )
        md.append(
            f"| {r.get('kind')} | {r.get('id')} | {before_s} | {after_s} | "
            f"{r.get('patch_http','-')} | {r.get('result','-')} | "
            f"{(r.get('why') or '').strip()} |"
        )
    md.extend([
        "",
        "## Open follow-ups for founder confirmation",
        "",
        "- **23 more duplicate Portfolio HQ 'CoS hourly briefing' issues** are "
        "still blocked (POR-107 .. POR-169 minus the 2 cancelled here). Awaiting "
        "founder OK to bulk-cancel, AND fix the routine that spawns them.",
        "- **Comment posting is broken for board-admin actor** "
        "(`local_implicit` -> authorId=\"board\" -> FK violation). Either seed a "
        "founder user row in the DB and use that, or patch the comments service "
        "to allow null authorId for local_implicit. Filed as a portfolio platform "
        "issue, not a per-company issue.",
        "- **CON-112, VOT-52, CAR-31** parents of the recovery shells we just "
        "closed: still blocked. Decide separately whether each is worth direct "
        "triage or should be cancelled too.",
    ])

    REPORT_PATH.write_text("\n".join(md) + "\n")
    print(f"\nReport written: {REPORT_PATH.relative_to(REPO_ROOT)}")
    summary = {
        "ok": sum(1 for r in rows if r.get("result") == "OK"),
        "partial": sum(1 for r in rows if str(r.get("result", "")).startswith("PARTIAL")),
        "skipped": sum(1 for r in rows if r.get("result") == "SKIP_HAS_REAL_BLOCKERS"),
        "missing": sum(1 for r in rows if r.get("result") == "NOT_FOUND"),
    }
    print("Summary:", json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
