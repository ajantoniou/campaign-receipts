#!/usr/bin/env python3
"""
Gmail API — obtain OAuth refresh token (Desktop OAuth client).

Use this when your Google Cloud OAuth client type is **Desktop** (not Web).
No authorized redirect URIs are required in Cloud Console for the loopback flow.

Prereqs:
  python3 -m pip install google-auth-oauthlib google-auth-httplib2

Env (monorepo root .env):
  GMAIL_API_CLIENT_ID
  GMAIL_API_CLIENT_SECRET
  Optional: GMAIL_OAUTH_LOCAL_PORT (default 3000) — local loopback port only

Usage (from monorepo root):
  python3 infrastructure/scripts/gmail_oauth_refresh_token.py

Then add the printed line to root .env (never commit).
"""
from __future__ import annotations

import errno
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    print(
        "Missing dependency: python3 -m pip install google-auth-oauthlib google-auth-httplib2",
        file=sys.stderr,
    )
    sys.exit(1)

SCOPES = ["https://www.googleapis.com/auth/gmail.modify"]


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


def port_from_env() -> int:
    p = os.environ.get("GMAIL_OAUTH_LOCAL_PORT", "").strip()
    if p.isdigit():
        return int(p)
    redir = os.environ.get("GMAIL_API_REDIRECT_URI", "").strip()
    if redir:
        u = urlparse(redir)
        if u.port:
            return u.port
    return 3000


def main() -> None:
    load_root_env()
    client_id = os.environ.get("GMAIL_API_CLIENT_ID", "").strip()
    client_secret = os.environ.get("GMAIL_API_CLIENT_SECRET", "").strip()
    port = port_from_env()

    if not client_id or not client_secret:
        sys.exit(
            "Set GMAIL_API_CLIENT_ID and GMAIL_API_CLIENT_SECRET in AgentCompanies/.env"
        )

    # Desktop / installed app client config (not "web")
    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost", "urn:ietf:wg:oauth:2.0:oob"],
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        }
    }

    creds = None
    last_err = None
    for attempt in range(25):
        p = port + attempt
        flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
        try:
            print(
                f"Trying loopback http://localhost:{p}/ (Desktop OAuth — no redirect URI in Console).\n"
            )
            creds = flow.run_local_server(
                port=p,
                access_type="offline",
                prompt="consent",
                open_browser=True,
            )
            break
        except OSError as e:
            last_err = e
            if e.errno != errno.EADDRINUSE:
                raise
            print(f"Port {p} in use — retrying on {p + 1}…\n", file=sys.stderr)

    if creds is None:
        sys.exit(
            f"Could not bind a local port (tried {port}–{port + 24}). "
            f"Free a port or set GMAIL_OAUTH_LOCAL_PORT. Last error: {last_err}"
        )

    refresh = getattr(creds, "refresh_token", None)
    if not refresh:
        sys.exit(
            "No refresh_token returned. Revoke app access at "
            "https://myaccount.google.com/permissions and run again."
        )

    print("\nAdd this line to AgentCompanies/.env (do not commit):\n")
    print(f"GMAIL_API_REFRESH_TOKEN={refresh}")


if __name__ == "__main__":
    main()
