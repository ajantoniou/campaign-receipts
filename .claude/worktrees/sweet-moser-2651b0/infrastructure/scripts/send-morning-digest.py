#!/usr/bin/env python3
"""
Send the morning founder digest via Gmail SMTP.

Reads /Applications/DrAntoniou Projects/AgentCompanies/FOUNDER_ACTIONS.md
and emails it from antonioualfred@gmail.com (Chief of Staff inbox)
to alex@antoniou.net.

Usage:
    python3 infrastructure/scripts/send-morning-digest.py

Env vars (from .env):
    COS_GMAIL_ADDRESS       — antonioualfred@gmail.com
    COS_GMAIL_APP_PASSWORD  — 16-char Gmail app password (no spaces)

Triggered by:
    - CoS hourly cron, only between 06:00-09:00 ET on the FIRST run
      of the day (one digest per day, idempotent)
    - Manual: `python3 send-morning-digest.py`
"""

import os
import sys
import smtplib
import ssl
import datetime as dt
from pathlib import Path
from email.message import EmailMessage

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
ENV_FILE = REPO / ".env"
ACTIONS = REPO / "FOUNDER_ACTIONS.md"
SENT_MARKER_DIR = REPO / "briefings" / ".digest-sent"
TO_ADDR = "alex@antoniou.net"
SUBJECT_PREFIX = "[CoS Action Needed]"


def load_env():
    """Tiny .env parser — handles KEY=value, KEY="quoted value", comments."""
    env = {}
    if not ENV_FILE.exists():
        return env
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip()
        if v.startswith('"') and v.endswith('"'):
            v = v[1:-1]
        elif v.startswith("'") and v.endswith("'"):
            v = v[1:-1]
        env[k.strip()] = v
    return env


def already_sent_today():
    today = dt.date.today().isoformat()
    SENT_MARKER_DIR.mkdir(parents=True, exist_ok=True)
    marker = SENT_MARKER_DIR / today
    return marker.exists()


def mark_sent_today():
    today = dt.date.today().isoformat()
    SENT_MARKER_DIR.mkdir(parents=True, exist_ok=True)
    marker = SENT_MARKER_DIR / today
    marker.write_text(dt.datetime.now().isoformat())


def main():
    force = "--force" in sys.argv

    if not force and already_sent_today():
        print(f"already sent today; skipping (use --force to override)")
        return 0

    env = load_env()
    sender = env.get("COS_GMAIL_ADDRESS")
    app_pw = env.get("COS_GMAIL_APP_PASSWORD")

    if not sender or not app_pw:
        print(f"ERROR: COS_GMAIL_ADDRESS or COS_GMAIL_APP_PASSWORD missing in .env", file=sys.stderr)
        return 1

    if not ACTIONS.exists():
        print(f"ERROR: {ACTIONS} not found", file=sys.stderr)
        return 1

    body_md = ACTIONS.read_text()
    today = dt.date.today().strftime("%a %b %d, %Y")

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = TO_ADDR
    msg["Subject"] = f"{SUBJECT_PREFIX} {today}"
    msg.set_content(body_md)

    # Send via Gmail SMTP
    context = ssl.create_default_context()
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context, timeout=30) as smtp:
            smtp.login(sender, app_pw.replace(" ", ""))
            smtp.send_message(msg)
        print(f"sent: {SUBJECT_PREFIX} {today} → {TO_ADDR}")
        mark_sent_today()
        return 0
    except Exception as e:
        print(f"ERROR: SMTP failure: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
