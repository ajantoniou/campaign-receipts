#!/usr/bin/env python3
"""
Portfolio token usage report — reads from Paperclip costs/by-biller API.

Usage:
    python3 infrastructure/scripts/token-report.py          # print to stdout
    python3 infrastructure/scripts/token-report.py --email  # send to founder
    python3 infrastructure/scripts/token-report.py --save   # append to .token-log.jsonl

Triggered by:
    - agentcompanies-token-watch scheduled task (daily at 08:00 + 20:00)
    - Manual: any time
"""

import json
import os
import re
import sys
import smtplib
import ssl
import datetime as dt
import urllib.request
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")

COMPANIES = {
    "Concise":       "8e22d2c6-5c57-491a-9864-40a79c4a0d49",
    "NT Ministry":   "66ba66fa-871d-4918-b2c3-787aee9a6064",
    "HealthBrew":    "c920ce4e-bb21-410b-a56a-63865c1ae3ce",
    "Portfolio HQ":  "0ad0833e-5c8b-41f5-b181-488c49bb7263",
}

# Anthropic pricing (per million tokens) — update if rates change
PRICE = {
    "input_uncached": 15.00,   # Opus 4.5 uncached input
    "input_cached":    1.50,   # Opus 4.5 cache read
    "output":         75.00,   # Opus 4.5 output
}

# Alert thresholds
ALERT_RUNS_PER_HOUR = 20       # >20 runs/hr across portfolio = something looping
ALERT_DAILY_COST_USD = 10.00   # >$10/day estimated = email founder immediately

LOG_FILE = REPO / "infrastructure/scripts/.token-log.jsonl"


def fetch_costs():
    rows = []
    for co, cid in COMPANIES.items():
        url = f"http://127.0.0.1:3100/api/companies/{cid}/costs/by-biller"
        try:
            with urllib.request.urlopen(url, timeout=5) as r:
                raw = r.read()
            clean = re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f]', b' ', raw)
            billers = json.loads(clean)
            if isinstance(billers, dict):
                billers = [billers]
            for b in billers:
                if b.get('biller') == 'anthropic':
                    rows.append({
                        "company": co,
                        "runs": b.get('subscriptionRunCount', 0),
                        "input": b.get('inputTokens', 0),
                        "cached": b.get('cachedInputTokens', 0) or b.get('subscriptionCachedInputTokens', 0),
                        "output": b.get('outputTokens', 0),
                    })
        except Exception as e:
            rows.append({"company": co, "error": str(e)})
    return rows


def estimate_cost(rows):
    totals = {"runs": 0, "input": 0, "cached": 0, "output": 0}
    for r in rows:
        if "error" in r:
            continue
        for k in totals:
            totals[k] += r.get(k, 0)
    uncached = max(0, totals["input"] - totals["cached"])
    cost = (
        uncached / 1e6 * PRICE["input_uncached"] +
        totals["cached"] / 1e6 * PRICE["input_cached"] +
        totals["output"] / 1e6 * PRICE["output"]
    )
    return totals, cost


def load_previous():
    """Load the most recent snapshot from log to compute delta."""
    if not LOG_FILE.exists():
        return None
    lines = LOG_FILE.read_text().strip().splitlines()
    if not lines:
        return None
    try:
        return json.loads(lines[-1])
    except Exception:
        return None


def format_report(rows, totals, cost, prev=None):
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M ET")
    lines = [f"# Portfolio Token Report — {now}", ""]

    lines.append(f"{'Company':<16} {'Runs':>6}  {'Input':>12}  {'Cached':>18}  {'Output':>10}")
    lines.append("-" * 70)
    for r in rows:
        if "error" in r:
            lines.append(f"{r['company']:<16}  ERROR: {r['error']}")
        else:
            lines.append(
                f"{r['company']:<16} {r['runs']:>6}  {r['input']:>12,}  {r['cached']:>18,}  {r['output']:>10,}"
            )

    lines.append("-" * 70)
    lines.append(
        f"{'TOTAL':<16} {totals['runs']:>6}  {totals['input']:>12,}  {totals['cached']:>18,}  {totals['output']:>10,}"
    )
    lines.append("")
    lines.append(f"Estimated lifetime cost: ${cost:,.2f}")
    lines.append(f"  Cached reads : {totals['cached']:,} tokens × $1.50/M = ${totals['cached']/1e6*1.5:,.2f}")
    lines.append(f"  Output       : {totals['output']:,} tokens × $75/M  = ${totals['output']/1e6*75:,.2f}")
    lines.append(f"  Uncached in  : {max(0,totals['input']-totals['cached']):,} tokens × $15/M  = ${max(0,totals['input']-totals['cached'])/1e6*15:,.2f}")

    if prev:
        delta_runs = totals['runs'] - prev.get('total_runs', 0)
        delta_cached = totals['cached'] - prev.get('total_cached', 0)
        delta_output = totals['output'] - prev.get('total_output', 0)
        delta_cost = (
            delta_cached / 1e6 * PRICE["input_cached"] +
            delta_output / 1e6 * PRICE["output"]
        )
        elapsed_hrs = (dt.datetime.now().timestamp() - prev.get('ts', dt.datetime.now().timestamp())) / 3600
        lines.append("")
        lines.append(f"Since last snapshot ({elapsed_hrs:.1f}h ago):")
        lines.append(f"  +{delta_runs} runs  +{delta_cached:,} cached tokens  +{delta_output:,} output tokens")
        lines.append(f"  Estimated spend this period: ${delta_cost:,.2f}")
        if elapsed_hrs > 0:
            runs_per_hr = delta_runs / elapsed_hrs
            lines.append(f"  Run rate: {runs_per_hr:.1f} runs/hr  {'⚠️ HIGH' if runs_per_hr > ALERT_RUNS_PER_HOUR else '✅ OK'}")
        if delta_cost > ALERT_DAILY_COST_USD:
            lines.append(f"  ⚠️ ALERT: ${delta_cost:.2f} spent since last check — above ${ALERT_DAILY_COST_USD} threshold")

    return "\n".join(lines)


def send_email(subject, body):
    env_path = REPO / ".env"
    env = {}
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()

    gmail_addr = env.get("COS_GMAIL_ADDRESS", "")
    gmail_pass = env.get("COS_GMAIL_APP_PASSWORD", "")
    founder_email = "alex@antoniou.net"

    if not gmail_addr or not gmail_pass:
        print("ERR: COS_GMAIL_ADDRESS or COS_GMAIL_APP_PASSWORD not set in .env")
        return

    from email.message import EmailMessage
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = gmail_addr
    msg["To"] = founder_email
    msg.set_content(body)

    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as s:
        s.login(gmail_addr, gmail_pass)
        s.send_message(msg)
    print(f"Email sent to {founder_email}")


def main():
    send_email_flag = "--email" in sys.argv
    save_flag = "--save" in sys.argv or "--email" in sys.argv

    rows = fetch_costs()
    totals, cost = estimate_cost(rows)
    prev = load_previous()
    report = format_report(rows, totals, cost, prev)

    print(report)

    if save_flag:
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        snapshot = {
            "ts": dt.datetime.now().timestamp(),
            "ts_str": dt.datetime.now().isoformat(),
            "total_runs": totals["runs"],
            "total_cached": totals["cached"],
            "total_output": totals["output"],
            "estimated_lifetime_cost_usd": round(cost, 2),
        }
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(snapshot) + "\n")
        print(f"Snapshot saved to {LOG_FILE}")

    if send_email_flag:
        # Check if alert threshold crossed
        if prev:
            delta_cached = totals["cached"] - prev.get("total_cached", 0)
            delta_output = totals["output"] - prev.get("total_output", 0)
            delta_cost = delta_cached / 1e6 * 1.5 + delta_output / 1e6 * 75
            elapsed_hrs = (dt.datetime.now().timestamp() - prev.get("ts", 0)) / 3600
            run_rate = (totals["runs"] - prev.get("total_runs", 0)) / max(elapsed_hrs, 0.01)
            alert = delta_cost > ALERT_DAILY_COST_USD or run_rate > ALERT_RUNS_PER_HOUR
            subject = f"[CoS Token Alert] ${delta_cost:.2f} in {elapsed_hrs:.1f}h — {run_rate:.0f} runs/hr" if alert else f"[CoS Token Report] ${cost:,.0f} lifetime est."
        else:
            subject = f"[CoS Token Report] Lifetime est. ${cost:,.0f}"
        send_email(subject, report)


if __name__ == "__main__":
    main()
