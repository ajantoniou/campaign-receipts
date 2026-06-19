#!/usr/bin/env python3
"""
Import P0 issues from each company's issues-backlog.md into Paperclip.

Founder direction (2026-05-02): incremental kanban, not bulk import.
We import as status="backlog" so agents don't auto-trigger. Chief of
Staff promotes to "todo" manually when ready for work.

Usage:
    python3 import-issues.py --dry-run
    python3 import-issues.py
    python3 import-issues.py --companies concise,nt-ministry
"""

import argparse
import json
import re
import sys
from pathlib import Path
from urllib import request, error

PAPERCLIP_API = "http://127.0.0.1:3100/api"
PORTFOLIO_ROOT = Path(__file__).resolve().parent.parent.parent

# Map of "owner phrase" → agent role (Paperclip role enum)
# When a P0 entry says "Owner: Brand/Design" we want to find the
# agent whose role matches.
OWNER_TO_ROLE = [
    # Specific role keywords first (longest match wins)
    ("brand/design", "cmo"),
    ("brand & marketing", "cmo"),
    ("brand", "cmo"),
    ("chief accountant", "cfo"),
    ("compliance reviewer", "researcher"),
    ("theology editor", "researcher"),
    ("editorial agent", "researcher"),
    ("editorial", "researcher"),
    ("backend engineer", "engineer"),
    ("frontend engineer", "engineer"),
    ("devops engineer", "engineer"),
    ("engineering team", "engineer"),
    ("engineer", "engineer"),
    ("head of growth", "general"),
    ("growth", "general"),
    ("sales & partnership", "general"),
    ("sales", "general"),
    ("ceo", "ceo"),
    ("cto", "cto"),
    ("founder", None),  # founder issues = no agent assignment; left for human
]

def api_call(method, path, body=None):
    url = f"{PAPERCLIP_API}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        print(f"  HTTP {e.code} {method} {path}: {body_text[:200]}", file=sys.stderr)
        return None


def get_companies():
    return api_call("GET", "/companies") or []


def get_agents(company_id):
    return api_call("GET", f"/companies/{company_id}/agents") or []


def find_agent_for_owner(owner_text, agents):
    """Returns agent_id or None if no match (or founder-only issue)."""
    if not owner_text:
        return None
    owner_lower = owner_text.lower()
    for keyword, role in OWNER_TO_ROLE:
        if keyword in owner_lower:
            if role is None:
                return None  # Explicit founder-only
            # Find first agent with this role
            for a in agents:
                if a.get("role") == role:
                    return a["id"]
            # Fallback: log unmatched
            print(f"    ⚠ owner={owner_text!r} maps to role={role} but no agent has that role", file=sys.stderr)
            return None
    return None


def parse_p0_issues(backlog_path):
    """Returns list of (code, title, owner_text, body)."""
    if not backlog_path.exists():
        return []
    text = backlog_path.read_text()
    m = re.search(r'## P0[^\n]*\n(.*?)(?=\n## P[123]|\n## DO NOT|\n## CEO grooming|\Z)', text, re.DOTALL)
    if not m:
        return []
    section = m.group(1)
    # Match: ### CODE: Title \n body (until next ### or end)
    pattern = re.compile(r'###\s+([A-Z]+-\d+):\s+(.+?)\n(.*?)(?=\n###|\Z)', re.DOTALL)
    issues = []
    for match in pattern.finditer(section):
        code = match.group(1).strip()
        title = match.group(2).strip()
        body = match.group(3).strip()
        # Extract Owner from body
        owner_match = re.search(r'\*\*Owner:\*\*\s*(.+?)(?:\n|$)', body)
        owner_text = owner_match.group(1).strip() if owner_match else ""
        issues.append((code, title, owner_text, body))
    return issues


# Companies in this portfolio (slug → directory name match)
COMPANY_SLUGS = ["concise", "nt-ministry", "healthbrew"]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--companies", default="", help="comma-separated slugs")
    parser.add_argument("--limit", type=int, default=10, help="max P0s per company")
    args = parser.parse_args()

    filter_slugs = set(s.strip() for s in args.companies.split(",") if s.strip())

    paperclip_companies = get_companies()
    pc_by_name = {c["name"]: c for c in paperclip_companies}

    # Map our slug → Paperclip company
    slug_to_pc_name = {
        "concise": "Concise",
        "nt-ministry": "NT Ministry",
        "healthbrew": "HealthBrew",
    }

    total_created = 0
    for slug in COMPANY_SLUGS:
        if filter_slugs and slug not in filter_slugs:
            continue
        pc_name = slug_to_pc_name[slug]
        pc_company = pc_by_name.get(pc_name)
        if not pc_company:
            print(f"⚠ {slug}: no Paperclip company found for {pc_name!r}", file=sys.stderr)
            continue

        company_id = pc_company["id"]
        agents = get_agents(company_id)
        print(f"\n=== {pc_name} ({len(agents)} agents) ===")

        backlog_path = PORTFOLIO_ROOT / "companies" / slug / "issues-backlog.md"
        issues = parse_p0_issues(backlog_path)
        print(f"  Found {len(issues)} P0 issues in {backlog_path.name}")
        issues = issues[:args.limit]

        for code, title, owner_text, body in issues:
            # Skip if owner is purely founder-only
            agent_id = find_agent_for_owner(owner_text, agents)

            # Build description: keep our markdown body + reference code
            description = f"**Source:** `{slug}/issues-backlog.md` ({code})\n\n**Owner per spec:** {owner_text or '(unspecified)'}\n\n---\n\n{body}"

            payload = {
                "title": title,
                "description": description,
                "status": "backlog",  # IMPORTANT: backlog, not todo (avoids auto-trigger)
                "priority": "critical",  # P0 == critical in Paperclip
            }
            if agent_id:
                payload["assigneeAgentId"] = agent_id

            assignee_label = "(no agent: founder/manual)" if not agent_id else f"agent={agent_id[:8]}..."
            print(f"  [{code}] {title[:50]:50s}  →  {assignee_label}")

            if args.dry_run:
                continue

            resp = api_call("POST", f"/companies/{company_id}/issues", payload)
            if resp and resp.get("id"):
                total_created += 1
            elif resp is None:
                print(f"    ✗ Failed (see HTTP error above)")

    print()
    if args.dry_run:
        print(f"Dry-run complete. Would create issues across companies (run without --dry-run to apply).")
    else:
        print(f"Created {total_created} issues in backlog status.")
        print()
        print("Next steps:")
        print("  - Open dashboard: http://127.0.0.1:3100")
        print("  - Each company → Issues tab → see backlog populated")
        print("  - Promote 1-2 issues per company from 'backlog' to 'todo' to start work")
        print("  - Or use: curl -X PATCH http://127.0.0.1:3100/api/issues/<id> -d '{\"status\":\"todo\"}'")


if __name__ == "__main__":
    main()
