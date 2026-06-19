#!/usr/bin/env python3
"""
Verify Gmail API credentials from monorepo root .env (refresh token flow).

Usage (from AgentCompanies root):
  python3 infrastructure/scripts/gmail_smoke.py

Requires:
  pip install google-auth requests
  (google-auth-oauthlib already installed if you ran gmail_oauth_refresh_token.py)

Exit 0 if Gmail API returns label list; nonzero on failure.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    import requests
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
except ImportError:
    print(
        "pip install google-auth requests",
        file=sys.stderr,
    )
    sys.exit(1)

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]
GMAIL_LABELS = "https://gmail.googleapis.com/gmail/v1/users/me/labels"


def load_root_env() -> None:
    root = Path(__file__).resolve().parents[2]
    env_path = root / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        if k and k not in os.environ:
            os.environ[k] = v


def main() -> int:
    load_root_env()
    cid = os.environ.get("GMAIL_API_CLIENT_ID", "").strip()
    sec = os.environ.get("GMAIL_API_CLIENT_SECRET", "").strip()
    rt = os.environ.get("GMAIL_API_REFRESH_TOKEN", "").strip()
    if not all([cid, sec, rt]):
        print(
            "Missing GMAIL_API_CLIENT_ID / GMAIL_API_CLIENT_SECRET / GMAIL_API_REFRESH_TOKEN in .env",
            file=sys.stderr,
        )
        return 1

    creds = Credentials(
        token=None,
        refresh_token=rt,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=cid,
        client_secret=sec,
        scopes=SCOPES,
    )
    creds.refresh(Request())
    if not creds.token:
        print("Failed to obtain access token", file=sys.stderr)
        return 1

    r = requests.get(
        GMAIL_LABELS,
        headers={"Authorization": f"Bearer {creds.token}"},
        timeout=30,
    )
    if r.status_code != 200:
        print(f"Gmail API error {r.status_code}: {r.text[:500]}", file=sys.stderr)
        return 1

    data = r.json()
    labels = data.get("labels") or []
    print(f"OK — Gmail API reachable; {len(labels)} labels returned.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
