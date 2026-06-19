#!/usr/bin/env python3
"""
Claude process + token watchdog.

Checks:
1. Zombie Claude Code processes (running >2h, flags >6h, kills >12h)
2. Today's token usage vs 5-hour session limit (buddy-tokens.json)
3. Weekly token burn rate estimate
4. Paperclip agent run rate (anomaly detection)

Usage:
    python3 claude-watchdog.py           # check + print report
    python3 claude-watchdog.py --email   # email if any alerts
    python3 claude-watchdog.py --kill    # auto-kill zombies >12h (use with caution)

Scheduled: every 2 hours via agentcompanies-claude-watchdog routine.
"""

import json, os, re, sys, subprocess, smtplib, ssl, datetime as dt, urllib.request
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")

# ── Limits (Claude Max / Pro plan, adjust if your plan differs) ──────────────
# Claude Code Pro: ~88K tokens/5hr window, ~1M tokens/week (approximate)
# These are soft thresholds for alerting, not hard API limits
TOKEN_5HR_WARN   = 500_000   # Max plan ~1M/5hr window    # warn at 70K (80% of ~88K 5hr limit)
TOKEN_5HR_CRIT   = 800_000   # 80% of Max 5hr window    # critical at 85K (nearly at cap)
TOKEN_DAILY_WARN = 1_000_000  # Max plan daily budget   # warn if today > 200K
PROCESS_WARN_HRS = 2         # flag processes older than 2h
PROCESS_KILL_HRS = 12        # kill processes older than 12h (with --kill flag)
PAPERCLIP_RATE_WARN = 15     # warn if >15 new Paperclip runs since last check

BUDDY_TOKENS = Path("/Users/drantoniou/Library/Application Support/Claude/buddy-tokens.json")
LOG_FILE = REPO / "infrastructure/scripts/.watchdog-log.jsonl"

COMPANIES = {
    "Concise":       "8e22d2c6-5c57-491a-9864-40a79c4a0d49",
    "NT Ministry":   "66ba66fa-871d-4918-b2c3-787aee9a6064",
    "HealthBrew":    "c920ce4e-bb21-410b-a56a-63865c1ae3ce",
    "Portfolio HQ":  "0ad0833e-5c8b-41f5-b181-488c49bb7263",
}


# ── 1. Process check ──────────────────────────────────────────────────────────
def check_processes():
    result = subprocess.run(
        ["ps", "aux"], capture_output=True, text=True
    )
    now = dt.datetime.now()
    today = now.strftime("%Y")  # just used for year context

    procs = []
    for line in result.stdout.splitlines():
        if "claude.app/Contents/MacOS/claude" not in line:
            continue
        if "grep" in line:
            continue

        parts = line.split()
        pid = int(parts[1])
        cpu = float(parts[2])
        started_str = parts[8]  # e.g. "Sat07PM" or "10:23AM" or "Wed10AM"

        # Parse start time
        age_hrs = None
        try:
            if ":" in started_str and len(started_str) <= 7:
                # Today: "10:23AM" or "4:05PM"
                t = dt.datetime.strptime(started_str, "%I:%M%p").replace(
                    year=now.year, month=now.month, day=now.day
                )
                age_hrs = (now - t).total_seconds() / 3600
                if age_hrs < 0:
                    age_hrs += 24
            else:
                # Older: "Sat07PM", "Wed10AM", "FriXXPM"
                # Estimate by CPU time (column 10 = cumulative CPU time "h:mm.ss")
                cpu_time_str = parts[9]  # e.g. "120:29.63" or "8:09.20"
                cpu_parts = cpu_time_str.split(":")
                cpu_hrs = float(cpu_parts[0]) + float(cpu_parts[1].split(".")[0]) / 60
                age_hrs = cpu_hrs  # lower bound — actual wall time >= CPU time
        except Exception:
            age_hrs = None

        # Extract model
        model = "unknown"
        if "--model" in line:
            m = re.search(r'--model\s+(\S+)', line)
            if m:
                model = m.group(1)

        effort = "default"
        if "--effort" in line:
            m = re.search(r'--effort\s+(\S+)', line)
            if m:
                effort = m.group(1)

        resume = None
        if "--resume" in line:
            m = re.search(r'--resume\s+(\S+)', line)
            if m:
                resume = m.group(1)[:8]

        procs.append({
            "pid": pid, "cpu": cpu, "model": model, "effort": effort,
            "resume": resume, "age_hrs": age_hrs, "started": started_str,
        })

    return procs


# ── 2. Token usage ────────────────────────────────────────────────────────────
def check_tokens():
    data = {}
    if BUDDY_TOKENS.exists():
        try:
            raw = json.loads(BUDDY_TOKENS.read_text())
            today_str = dt.datetime.now().strftime("%Y-%m-%d")
            entry = raw.get("tokens-today", {})
            if entry.get("date") == today_str:
                data["today"] = entry.get("tokens", 0)
            else:
                data["today"] = 0  # new day, not yet written
        except Exception:
            data["today"] = 0
    return data


# ── 3. Paperclip run rate ─────────────────────────────────────────────────────
def check_paperclip():
    total = 0
    try:
        for co, cid in COMPANIES.items():
            url = f"http://127.0.0.1:3100/api/companies/{cid}/costs/by-biller"
            with urllib.request.urlopen(url, timeout=3) as r:
                raw = r.read()
            clean = re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f]', b' ', raw)
            d = json.loads(clean)
            billers = d if isinstance(d, list) else [d]
            for b in billers:
                if b.get('biller') == 'anthropic':
                    total += b.get('subscriptionRunCount', 0)
    except Exception:
        return None, None  # Paperclip offline

    # Load previous snapshot
    prev_runs = None
    prev_ts = None
    if LOG_FILE.exists():
        lines = LOG_FILE.read_text().strip().splitlines()
        for line in reversed(lines):
            try:
                snap = json.loads(line)
                if 'paperclip_runs' in snap:
                    prev_runs = snap['paperclip_runs']
                    prev_ts = snap['ts']
                    break
            except Exception:
                continue

    delta = None
    rate = None
    if prev_runs is not None and prev_ts is not None:
        delta = total - prev_runs
        elapsed_hrs = (dt.datetime.now().timestamp() - prev_ts) / 3600
        rate = delta / max(elapsed_hrs, 0.1)

    return total, rate


# ── 4. Build report ───────────────────────────────────────────────────────────
def build_report(procs, tokens, paperclip_runs, paperclip_rate):
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M ET")
    alerts = []
    lines = [f"# Claude Watchdog Report — {now}", ""]

    # Processes
    lines.append("## Running Claude Code Processes")
    this_pid = os.getpid()
    for p in procs:
        age_str = f"{p['age_hrs']:.1f}h" if p['age_hrs'] is not None else "age unknown"
        flag = ""
        if p['age_hrs'] is not None:
            if p['age_hrs'] >= PROCESS_KILL_HRS:
                flag = " 🔴 ZOMBIE >12h — should be killed"
                alerts.append(f"ZOMBIE PROCESS: PID {p['pid']} {p['model']} running {age_str}")
            elif p['age_hrs'] >= PROCESS_WARN_HRS:
                flag = f" ⚠️ old ({age_str})"
        if "4-6" in p['model'] or "4-1" in p['model']:
            flag += " ⚠️ OLD MODEL"
            alerts.append(f"OLD MODEL: PID {p['pid']} still running {p['model']}")
        lines.append(f"  PID {p['pid']:6}  {p['model']:<30} effort={p['effort']:<6} age={age_str:<8}{flag}")

    if not procs:
        lines.append("  (no Claude Code processes found)")

    # Tokens
    lines.append("")
    lines.append("## Token Usage Today")
    today_tokens = tokens.get("today", 0)
    pct = today_tokens / TOKEN_5HR_WARN * 100
    status = "✅ OK"
    if today_tokens >= TOKEN_5HR_CRIT:
        status = "🔴 CRITICAL — near 5hr limit"
        alerts.append(f"TOKEN CRITICAL: {today_tokens:,} tokens today (>{TOKEN_5HR_CRIT:,})")
    elif today_tokens >= TOKEN_5HR_WARN:
        status = "⚠️ WARNING — approaching 5hr limit"
        alerts.append(f"TOKEN WARNING: {today_tokens:,} tokens today (>{TOKEN_5HR_WARN:,})")
    lines.append(f"  Today: {today_tokens:,} tokens  {status}")
    lines.append(f"  5hr warn threshold: {TOKEN_5HR_WARN:,} | critical: {TOKEN_5HR_CRIT:,}")

    # Paperclip
    lines.append("")
    lines.append("## Paperclip Agent Runs")
    if paperclip_runs is None:
        lines.append("  (Paperclip offline — skipped)")
    else:
        rate_str = f"{paperclip_rate:.1f}/hr" if paperclip_rate is not None else "first run"
        rate_flag = ""
        if paperclip_rate is not None and paperclip_rate > PAPERCLIP_RATE_WARN:
            rate_flag = f" 🔴 HIGH — possible loop (>{PAPERCLIP_RATE_WARN}/hr)"
            alerts.append(f"HIGH PAPERCLIP RATE: {paperclip_rate:.1f} runs/hr")
        lines.append(f"  Lifetime runs: {paperclip_runs:,}  Rate: {rate_str}{rate_flag}")

    # Alert summary
    lines.append("")
    if alerts:
        lines.append("## ⚠️ ALERTS")
        for a in alerts:
            lines.append(f"  • {a}")
    else:
        lines.append("## ✅ All Clear — no anomalies detected")

    return "\n".join(lines), alerts


# ── 5. Kill zombies ───────────────────────────────────────────────────────────
def kill_zombies(procs):
    killed = []
    for p in procs:
        if p['age_hrs'] is not None and p['age_hrs'] >= PROCESS_KILL_HRS:
            try:
                os.kill(p['pid'], 9)
                killed.append(p['pid'])
                print(f"  Killed PID {p['pid']} ({p['model']}, {p['age_hrs']:.1f}h old)")
            except Exception as e:
                print(f"  Failed to kill {p['pid']}: {e}")
    return killed


# ── 6. Email ──────────────────────────────────────────────────────────────────
def send_email(subject, body):
    env = {}
    env_path = REPO / ".env"
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    addr = env.get("COS_GMAIL_ADDRESS", "")
    pwd  = env.get("COS_GMAIL_APP_PASSWORD", "")
    if not addr or not pwd:
        print("ERR: Gmail creds not in .env")
        return
    from email.message import EmailMessage
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = addr
    msg["To"] = "alex@antoniou.net"
    msg.set_content(body)
    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as s:
        s.login(addr, pwd)
        s.send_message(msg)
    print(f"  Alert emailed to alex@antoniou.net")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    email_flag = "--email" in sys.argv
    kill_flag  = "--kill"  in sys.argv

    procs = check_processes()
    tokens = check_tokens()
    paperclip_runs, paperclip_rate = check_paperclip()
    report, alerts = build_report(procs, tokens, paperclip_runs, paperclip_rate)

    print(report)

    if kill_flag:
        killed = kill_zombies(procs)
        if killed:
            print(f"\nKilled {len(killed)} zombie processes: {killed}")

    # Save snapshot (with rotation: cap at last LOG_KEEP_LINES entries)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    snapshot = {
        "ts": dt.datetime.now().timestamp(),
        "ts_str": dt.datetime.now().isoformat(),
        "tokens_today": tokens.get("today", 0),
        "paperclip_runs": paperclip_runs,
        "alerts": alerts,
        "process_count": len(procs),
    }
    # Rotation added 2026-05-05 (audit fix): script appended forever before this.
    LOG_KEEP_LINES = 1000  # ~5.5 days at 8 runs/day; bounded forever
    new_line = json.dumps(snapshot) + "\n"
    if LOG_FILE.exists():
        existing = LOG_FILE.read_text().splitlines()
        kept = existing[-(LOG_KEEP_LINES - 1):] if len(existing) >= LOG_KEEP_LINES else existing
        LOG_FILE.write_text("\n".join(kept) + ("\n" if kept else "") + new_line)
    else:
        LOG_FILE.write_text(new_line)

    # Email only if alerts or explicitly requested
    if email_flag and alerts:
        subject = f"[Claude Alert] {len(alerts)} issue(s) — {dt.datetime.now().strftime('%H:%M ET')}"
        send_email(subject, report)
    elif email_flag and not alerts:
        print("  No alerts — skipping email")


if __name__ == "__main__":
    main()
