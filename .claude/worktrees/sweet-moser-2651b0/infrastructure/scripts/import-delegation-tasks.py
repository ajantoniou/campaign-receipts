#!/usr/bin/env python3
"""
Import TASK-xxx rows from companies/portfolio-hq/delegations/*100-task*.md
into Paperclip, with assigneeAgentId resolved from agent display name + role.

Also appends extra API/automation follow-up tasks (TASK-101+).

Usage:
  python3 import-delegation-tasks.py --dry-run
  python3 import-delegation-tasks.py
  python3 import-delegation-tasks.py --limit 20   # first N tasks only
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from pathlib import Path
from urllib import error, parse, request

PAPERCLIP_API = "http://127.0.0.1:3100/api"
ROOT = Path(__file__).resolve().parent.parent.parent
DELEGATION_GLOB = "2026-05-06-100-task-worker-delegation.md"


def api_call(method: str, path: str, body: dict | None = None):
    url = f"{PAPERCLIP_API}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except error.HTTPError as e:
        txt = e.read().decode("utf-8", errors="replace")
        print(f"  HTTP {e.code} {method} {path}: {txt[:400]}", file=sys.stderr)
        return None


def norm(s: str) -> str:
    return " ".join(s.lower().split())


def find_delegation_file() -> Path:
    base = ROOT / "companies" / "portfolio-hq" / "delegations"
    p = base / DELEGATION_GLOB
    if p.exists():
        return p
    matches = sorted(base.glob("*100-task*.md"))
    if matches:
        return matches[-1]
    raise FileNotFoundError(f"No delegation file under {base}")


def parse_task_rows(text: str) -> list[tuple[str, str, str, str, str]]:
    """Returns list of (task_id, persona, company_slug, task, acceptance)."""
    rows: list[tuple[str, str, str, str, str]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line.startswith("| TASK-"):
            continue
        parts = [c.strip() for c in line.split("|")]
        parts = [p for p in parts if p != ""]
        if len(parts) < 5:
            continue
        tid, persona, co, task, accept = parts[0], parts[1], parts[2], parts[3], parts[4]
        if not re.match(r"^TASK-\d{3}$", tid):
            continue
        rows.append((tid, persona, co, task, accept))
    return rows


def company_display_name(slug: str, pc_names: set[str]) -> str | None:
    slug = slug.strip().lower()
    aliases = {
        "portfolio-hq": "Portfolio HQ",
        "concise-sealed": "Concise",
        "concise": "Concise",
        "carstack": "CarStack",
        "nt-ministry": "NT Ministry",
        "healthbrew": "HealthBrew",
        "_shared_": "Concise",  # engineering defaults to Concise CTO / repo owner
    }
    name = aliases.get(slug)
    if name and name in pc_names:
        return name
    return None


def agents_by_company(companies: list[dict]) -> dict[str, list[dict]]:
    out: dict[str, list[dict]] = {}
    for c in companies:
        cid = c["id"]
        agents = api_call("GET", f"/companies/{cid}/agents") or []
        out[cid] = agents
    return out


def pick_agent(persona: str, agents: list[dict], company_display: str) -> str | None:
    """Resolve persona label to assignee UUID for this company's agent list."""
    if "+" in persona:
        persona = persona.split("+")[0].strip()

    pl = norm(persona)
    name_map = [
        ("chief of staff", lambda n: "chief of staff" in n),
        ("paperclip feedback", lambda n: "paperclip" in n),
        ("mckinsey", lambda n: "mckinsey" in n),
        ("yc advisor", lambda n: "yc advisor" in n),
        ("lead counsel", lambda n: "lead counsel" in n),
        ("theology editor", lambda n: "theology" in n),
        ("literary agent", lambda n: "literary" in n),
        ("head of growth", lambda n: "head of growth" in n),
        ("sales agent", lambda n: "sales agent" in n),
        ("book illustrator", lambda n: "illustrator" in n),
        ("video producer", lambda n: "video producer" in n),
        ("content writer", lambda n: "content writer" in n),
        ("brand manager", lambda n: "brand manager" in n),
        ("sales partnership", lambda n: "sales" in n and "partnership" in n),
        ("compliance reviewer", lambda n: "compliance" in n),
        ("data scientist", lambda n: "data scientist" in n),
        ("pipeline validator", lambda n: "pipeline" in n),
        ("editorial", lambda n: "editorial" in n),
        ("research agent", lambda n: "research agent" in n),
        ("engineering team", lambda n: "engineering team" in n),
    ]

    for persona_kw, pred in name_map:
        if persona_kw not in pl:
            continue
        for a in agents:
            n = norm(a.get("name") or "")
            if pred(n):
                return a["id"]

    role_map = [
        ("chief accountant", "cfo"),
        ("cto", "cto"),
        ("designer", "designer"),
        ("ceo", "ceo"),
    ]
    for kw, role in role_map:
        if kw in pl:
            for a in agents:
                if a.get("role") == role:
                    return a["id"]

    if "brand design" in pl or pl.strip() == "brand design":
        for a in agents:
            if a.get("role") == "cmo" and "brand" in norm(a.get("name") or ""):
                return a["id"]

    return None


def resolve_assignment(
    slug: str,
    persona: str,
    pc_by_name: dict[str, dict],
    pc_names: set[str],
    cache: dict[str, list[dict]],
) -> tuple[str, str | None, str, str]:
    """
    Paperclip requires assignees to belong to the issue's company.
    If Portfolio HQ has no matching agent (no CFO, Brand, etc.), retry on Concise.

    Returns (company_id, agent_id, routing_note_markdown, log_label).
    """
    display = company_display_name(slug, pc_names)
    if not display:
        return "", None, "", ""
    cid = pc_by_name[display]["id"]
    agents = cache[cid]
    aid = pick_agent(persona, agents, display)
    if aid:
        return cid, aid, "", display

    if display == "Portfolio HQ":
        cid2 = pc_by_name["Concise"]["id"]
        agents2 = cache[cid2]
        aid2 = pick_agent(persona, agents2, "Concise")
        if aid2:
            note = (
                "Created under **Concise** in Paperclip (cross-company routing): "
                "Portfolio HQ has no agent matching this persona; scope stays portfolio-wide "
                f"per delegation slug `{slug}`."
            )
            return cid2, aid2, note, f"{display}→Concise"

    return cid, None, "", display


def issue_exists(company_id: str, task_id: str) -> bool:
    q = parse.quote(task_id, safe="")
    issues = api_call("GET", f"/companies/{company_id}/issues?q={q}")
    if not issues:
        return False
    prefix = f"[{task_id}]"
    for it in issues:
        t = it.get("title") or ""
        if t.startswith(prefix):
            return True
    return False


def extra_tasks() -> list[tuple[str, str, str, str, str, str]]:
    """
    Additional automation-ready tasks (TASK-101+).
    Tuple: task_id, persona, company_slug, task, acceptance, notes
    """
    return [
        (
            "TASK-101",
            "CTO",
            "_shared_",
            "Render API smoke: list services for one production service (verify RENDER_API_KEY)",
            "Paste truncated JSON or line count in issue comment; no secrets.",
            "Uses root .env RENDER_API_KEY.",
        ),
        (
            "TASK-102",
            "CTO",
            "healthbrew",
            "Supabase: confirm waitlist table + RLS matches migration (service role read check)",
            "One-paragraph note + any migration PR link.",
            "",
        ),
        (
            "TASK-103",
            "CTO",
            "concise",
            "Lemon Squeezy API: GET /v1/users/me or stores list — verify LEMONSQUEEZY_API_KEY scopes",
            "200 response noted in comment; never paste token.",
            "",
        ),
        (
            "TASK-104",
            "CTO",
            "_shared_",
            "Cloudflare API: verify token lists zones (CLOUDFLARE_API_TOKEN)",
            "Zone count or 'ok' in comment; redact IDs if needed.",
            "",
        ),
        (
            "TASK-105",
            "CTO",
            "healthbrew",
            "Resend: verify domain / API key with domains endpoint (RESEND_API_KEY)",
            "Comment with pass/fail only.",
            "",
        ),
        (
            "TASK-106",
            "Chief of Staff Hourly",
            "portfolio-hq",
            "GitHub PAT: confirm repo access via gh api user or curl github with GITHUB_PAT",
            "Exit 0 + username only in comment.",
            "",
        ),
        (
            "TASK-107",
            "CTO",
            "carstack",
            "CarStack: replace any remaining Stripe-test wording with Lemon Squeezy test-checkout path in docs",
            "PR or SESSION_DECISIONS line; MoR is LS.",
            "Corrects delegation Stripe drift.",
        ),
        (
            "TASK-109",
            "CTO",
            "nt-ministry",
            "NT web: single curl smoke for nt-content + nt-directory staging URLs from README",
            "HTTP codes in comment.",
            "",
        ),
        (
            "TASK-110",
            "Paperclip Feedback",
            "portfolio-hq",
            "Document Paperclip base URL + no-auth local POST pattern in shared/docs (one paragraph)",
            "PR to shared/docs or portfolio-hq research note.",
            "",
        ),
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="Max delegation rows (0=all)")
    parser.add_argument("--skip-extra", action="store_true", help="Skip TASK-101+ block")
    args = parser.parse_args()

    path = find_delegation_file()
    text = path.read_text()
    rows = parse_task_rows(text)
    extra = [] if args.skip_extra else extra_tasks()

    companies = api_call("GET", "/companies")
    if not companies:
        print("Cannot reach Paperclip GET /companies", file=sys.stderr)
        sys.exit(1)

    pc_by_name = {c["name"]: c for c in companies}
    pc_names = set(pc_by_name.keys())

    cache = agents_by_company(companies)
    id_to_name = {c["id"]: c["name"] for c in companies}

    created = 0
    skipped = 0
    unassigned = 0

    def create_issue(
        task_id: str,
        persona: str,
        company_slug: str,
        task: str,
        acceptance: str,
        notes: str = "",
    ):
        nonlocal created, skipped, unassigned
        if not company_display_name(company_slug, pc_names):
            print(f"  skip {task_id}: unknown company slug {company_slug!r}")
            return

        cid, aid, route_note, log_label = resolve_assignment(
            company_slug, persona, pc_by_name, pc_names, cache
        )
        if not cid:
            return

        if issue_exists(cid, task_id):
            print(f"  skip {task_id}: already exists in {id_to_name.get(cid)}")
            skipped += 1
            return

        title = f"[{task_id}] {task[:200]}"
        desc_parts = [
            f"**Delegation:** `{path.relative_to(ROOT)}`",
            f"**Worker persona:** {persona}",
            f"**Company (slug):** {company_slug}",
            "",
            f"**Acceptance:** {acceptance}",
        ]
        if notes:
            desc_parts.extend(["", f"**Notes:** {notes}"])
        if route_note:
            desc_parts.extend(["", route_note])
        description = "\n".join(desc_parts)

        payload = {
            "title": title,
            "description": description,
            "status": "todo",
            "priority": "medium",
        }
        if aid:
            payload["assigneeAgentId"] = aid
        else:
            unassigned += 1

        assignee = (aid[:8] + "…") if aid else "(none)"
        co_label = id_to_name.get(cid, "?")
        print(f"  {task_id} → {co_label} ({log_label}) {assignee} — {title[:65]}…")

        if args.dry_run:
            return

        resp = api_call("POST", f"/companies/{cid}/issues", payload)
        if resp and resp.get("id"):
            created += 1
            time.sleep(0.05)
        else:
            print(f"    ✗ failed POST {task_id}", file=sys.stderr)

    all_rows: list[tuple] = []
    for row in rows:
        all_rows.append(row + ("",))

    for ex in extra:
        tid, persona, slug, task, acc, note = ex
        all_rows.append((tid, persona, slug, task, acc, note))

    if args.limit:
        all_rows = all_rows[: args.limit]

    print(f"\nPaperclip import — source {path.name} — {len(all_rows)} issue(s) {'(dry-run)' if args.dry_run else ''}\n")

    for item in all_rows:
        if len(item) == 5:
            tid, persona, slug, task, acc = item
            note = ""
        else:
            tid, persona, slug, task, acc, note = item
        create_issue(tid, persona, slug, task, acc, note)

    print()
    print(f"Done. created={created} skipped_duplicates={skipped} unassigned_missing_agent={unassigned}")


if __name__ == "__main__":
    main()
