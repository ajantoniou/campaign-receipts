#!/usr/bin/env python3
"""
Fix model IDs across all agents.

Paperclip's claude_local adapter lists "claude-haiku-4-6" and "claude-opus-4-6"
in its model registry, but as of 2026-05-02 those don't exist on Anthropic's
API. The real available IDs are:
  - claude-opus-4-7      (works)
  - claude-haiku-4-5     (works; replaces non-existent 4-6)
  - claude-sonnet-4-5    (works)

This script PATCHes every agent's adapterConfig.model to a valid ID.

Usage:
    python3 fix-agent-models.py --dry-run
    python3 fix-agent-models.py
"""

import argparse
import json
import sys
from urllib import request, error

PAPERCLIP_API = "http://127.0.0.1:3100/api"

# Model substitutions: stale_id -> valid_id
MODEL_FIX_MAP = {
    "claude-haiku-4-6": "claude-haiku-4-5",
    "claude-opus-4-6": "claude-opus-4-7",
    # claude-opus-4-7 is already valid; no change needed
    # claude-sonnet-4-6 -> claude-sonnet-4-5 if encountered (Paperclip lists it)
    "claude-sonnet-4-6": "claude-sonnet-4-5",
}


def api_call(method, path, body=None):
    url = f"{PAPERCLIP_API}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    headers = {"Content-Type": "application/json"} if body else {}
    req = request.Request(url, data=data, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())
    except error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} {method} {path}: {body[:200]}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    companies = api_call("GET", "/companies")
    if not companies:
        print("No companies found")
        return

    print(f"Scanning {len(companies)} companies...\n")
    total_fixed = 0
    total_seen = 0

    for company in companies:
        agents = api_call("GET", f"/companies/{company['id']}/agents") or []
        for agent in agents:
            total_seen += 1
            cfg = agent.get("adapterConfig") or {}
            current_model = cfg.get("model", "")

            if current_model not in MODEL_FIX_MAP:
                continue

            new_model = MODEL_FIX_MAP[current_model]
            print(f"  {company['name']:25s} / {agent['name']:25s}  {current_model} → {new_model}")

            new_cfg = {**cfg, "model": new_model}
            if args.dry_run:
                continue

            result = api_call("PATCH", f"/agents/{agent['id']}", {"adapterConfig": new_cfg})
            if result and result.get("adapterConfig", {}).get("model") == new_model:
                total_fixed += 1
            else:
                print(f"    ✗ PATCH failed for {agent['name']}")

    print()
    print(f"Total agents seen: {total_seen}")
    if args.dry_run:
        # Recount agents needing fix
        would_fix = 0
        for company in companies:
            cid = company["id"]
            agents_again = api_call("GET", f"/companies/{cid}/agents") or []
            for a in agents_again:
                if a.get("adapterConfig", {}).get("model") in MODEL_FIX_MAP:
                    would_fix += 1
        print(f"Would fix: {would_fix}")
    else:
        print(f"Fixed: {total_fixed}")


if __name__ == "__main__":
    main()
