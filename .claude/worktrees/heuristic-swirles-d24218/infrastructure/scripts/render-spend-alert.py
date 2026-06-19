#!/usr/bin/env python3
"""
Render spend alert script stub (API).

Task: Render spend alert script stub (TASK-093).

This script is a working skeleton for polling Render's billing/usage API,
formatting the latest spend vs. a configured threshold, and logging
when the budget is close to being exceeded. Fill in the TODOs once
the exact billing endpoint and JSON fields are confirmed.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

ROOT = Path("/Applications/DrAntoniou Projects/AgentCompanies")
ENV_PATH = ROOT / ".env"
LOG_PATH = Path("/tmp/render-spend-alert.log")
STATE_PATH = Path("/tmp/render-spend-alert-state.json")

SPEND_KEYS = (
    "currentPeriodSpend",
    "currentSpend",
    "totalSpend",
    "totalAmount",
    "amountDue",
    "balance",
    "usage",
    "amount",
)

LIMIT_KEYS = ("spendLimit", "limit", "amountLimit", "maxAmount")
WEIGHTED_CURRENCY_KEYS = ("currency", "currencyCode", "unit")

# This endpoint is a placeholder. Confirm the real billing/usage path.
BILLING_USAGE_TEMPLATE = "https://api.render.com/v1/owners/{owner_id}/billing/usage"


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_env_file() -> Dict[str, str]:
    env: Dict[str, str] = {}
    if not ENV_PATH.is_file():
        return env
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def env_get(env: Dict[str, str], key: str, default: Optional[str] = None) -> Optional[str]:
    if key in env and env[key]:
        return env[key]
    value = os.environ.get(key)
    if value:
        return value
    return default


def log(message: str) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    ts = utc_now()
    line = f"{ts} {message}"
    print(line)
    with LOG_PATH.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def http_json(
    url: str,
    *,
    headers: Optional[Dict[str, str]] = None,
    data: Optional[bytes] = None,
    method: Optional[str] = None,
    timeout: int = 30,
) -> Any:
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        if not raw:
            return {}
        return json.loads(raw)


def load_render_api_key(env: Dict[str, str]) -> str:
    key = env_get(env, "RENDER_API_KEY")
    if not key:
        raise RuntimeError("RENDER_API_KEY missing from AgentCompanies/.env")
    return key


def fetch_billing_snapshot(api_key: str, owner_id: str) -> Dict[str, Any]:
    url = BILLING_USAGE_TEMPLATE.format(owner_id=urllib.parse.quote(owner_id, safe=""))
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    try:
        payload = http_json(url, headers=headers)
        return payload if isinstance(payload, dict) else {}
    except urllib.error.HTTPError as exc:
        log(f"billing_http_error status={exc.code} reason={exc.reason}")
    except Exception as exc:  # pragma: no cover - best-effort stub
        log(f"billing_fetch_error {type(exc).__name__}")
    return {}


def recursive_search(payload: Any, keys: tuple[str, ...]) -> Optional[Any]:
    if isinstance(payload, dict):
        for key, value in payload.items():
            if key in keys and isinstance(value, (int, float, str)):
                return value
            candidate = recursive_search(value, keys)
            if candidate is not None:
                return candidate
    elif isinstance(payload, list):
        for element in payload:
            candidate = recursive_search(element, keys)
            if candidate is not None:
                return candidate
    return None


def find_spend(payload: Dict[str, Any]) -> Optional[float]:
    raw = recursive_search(payload, SPEND_KEYS)
    if isinstance(raw, (int, float)):
        return float(raw)
    if isinstance(raw, str) and raw.replace(".", "", 1).isdigit():
        return float(raw)
    return None


def find_limit(payload: Dict[str, Any]) -> Optional[float]:
    raw = recursive_search(payload, LIMIT_KEYS)
    if isinstance(raw, (int, float)):
        return float(raw)
    if isinstance(raw, str) and raw.replace(".", "", 1).isdigit():
        return float(raw)
    return None


def find_currency(payload: Dict[str, Any]) -> str:
    raw = recursive_search(payload, WEIGHTED_CURRENCY_KEYS)
    if isinstance(raw, str) and raw:
        return raw
    return "USD"


def load_state() -> Dict[str, Any]:
    if not STATE_PATH.is_file():
        return {}
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state: Dict[str, Any]) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state), encoding="utf-8")


def should_alert(spend: Optional[float], threshold: float, state: Dict[str, Any]) -> bool:
    if spend is None:
        return False
    if threshold <= 0:
        return False
    last_value = state.get("last_alert_value")
    if isinstance(last_value, (int, float)) and spend <= float(last_value):
        return False
    return spend >= threshold


def format_currency(amount: float, currency: str) -> str:
    return f"{currency} {amount:,.2f}"


def build_message(spend: Optional[float], threshold: float, limit: Optional[float], currency: str) -> str:
    if spend is None:
        return "Render spend unknown (billing response missing expected fields)."
    lines = [f"Render spend: {format_currency(spend, currency)}"]
    lines.append(f"Alert threshold: {format_currency(threshold, currency)}")
    if limit:
        pct = (spend / limit) * 100
        lines.append(f"Spending limit: {format_currency(limit, currency)} ({pct:.0f}%)")
    return " | ".join(lines)


def main() -> None:
    env = load_env_file()
    api_key = load_render_api_key(env)
    owner_id = env_get(env, "RENDER_WORKSPACE_ID") or env_get(env, "RENDER_OWNER_ID")
    if not owner_id:
        raise RuntimeError("Set RENDER_WORKSPACE_ID or RENDER_OWNER_ID in .env before running this script.")

    threshold_value = float(env_get(env, "RENDER_SPEND_ALERT_THRESHOLD", "5") or "5")
    snapshot = fetch_billing_snapshot(api_key, owner_id)
    spend = find_spend(snapshot)
    limit = find_limit(snapshot)
    currency = find_currency(snapshot)

    message = build_message(spend, threshold_value, limit, currency)
    log(f"billing_snapshot owner={owner_id} {message}")

    state = load_state()
    if should_alert(spend, threshold_value, state):
        log(f"alert owner={owner_id} spend={spend} threshold={threshold_value}")
        state["last_alert_value"] = spend
        state["last_alert_time"] = utc_now()
        state["owner_id"] = owner_id
        save_state(state)
        # TODO: wire this alert into Paperclip, email, or Slack once the delivery channel exists.
    else:
        log("no_alert threshold not reached or already reported")


if __name__ == "__main__":
    main()
