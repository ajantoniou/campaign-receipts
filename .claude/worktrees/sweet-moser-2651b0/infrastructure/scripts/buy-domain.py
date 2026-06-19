#!/usr/bin/env python3
"""
Buy a domain via the Cloudflare Registrar API.

Usage:
    # Check price + availability (no purchase):
    python3 buy-domain.py --domain example.com

    # Confirm + purchase:
    python3 buy-domain.py --domain example.com --confirm

Hard money rules:
- Max $25/yr per domain (script aborts if quote exceeds)
- Without --confirm: prints quote and exits 0 (no charge)
- With --confirm: charges Cloudflare's saved payment method on file
- Logs every purchase to `infrastructure/scripts/.domain-purchases.jsonl`

Env vars (from `.env`):
    CLOUDFLARE_API_TOKEN — needs Domain:Edit + Account:Read permissions
    CLOUDFLARE_ACCOUNT_ID — account UUID

Founder agreed to these guardrails 2026-05-03 (BIBLE.md § 3, hard money rules).
"""

import argparse
import datetime as dt
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
ENV_FILE = REPO / ".env"
PURCHASE_LOG = REPO / "infrastructure" / "scripts" / ".domain-purchases.jsonl"
MAX_PRICE_USD = 25.00


def load_env() -> dict:
    env = {}
    if not ENV_FILE.exists():
        return env
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip()
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        env[k.strip()] = v
    return env


def cf_request(method: str, path: str, token: str, body: Optional[dict] = None) -> dict:
    """Call Cloudflare API and return parsed JSON. Raises on HTTPError."""
    url = f"https://api.cloudflare.com/client/v4{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        # Try to parse the error body
        try:
            err_body = json.loads(e.read())
        except Exception:
            err_body = {"errors": [{"message": str(e)}]}
        return err_body


def log_purchase(domain: str, price_usd: float, period_years: int, ok: bool, note: str = "") -> None:
    PURCHASE_LOG.parent.mkdir(parents=True, exist_ok=True)
    row = {
        "ts": dt.datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "domain": domain,
        "price_usd": round(price_usd, 2),
        "period_years": period_years,
        "ok": ok,
    }
    if note:
        row["note"] = note[:200]
    with PURCHASE_LOG.open("a") as f:
        f.write(json.dumps(row) + "\n")


def main() -> int:
    ap = argparse.ArgumentParser(description="Buy a domain via Cloudflare Registrar.")
    ap.add_argument("--domain", required=True, help="Domain to buy, e.g. example.com (no http://)")
    ap.add_argument("--confirm", action="store_true", help="Actually purchase. Without this flag, only prints the quote.")
    ap.add_argument("--years", type=int, default=1, help="Registration period in years (default 1)")
    args = ap.parse_args()

    env = load_env()
    token = env.get("CLOUDFLARE_API_TOKEN")
    account_id = env.get("CLOUDFLARE_ACCOUNT_ID")
    if not token or not account_id:
        print("ERROR: CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID missing from .env", file=sys.stderr)
        return 1

    domain = args.domain.lower().strip()

    # Step 1: Check availability + price
    print(f"=== Checking availability + price for {domain} ===")
    avail = cf_request("GET", f"/accounts/{account_id}/registrar/domains/{domain}", token)
    if not avail.get("success"):
        # Domain may not exist yet — that's expected for an unowned domain.
        # Cloudflare's check endpoint is `domains/check`; try that.
        check = cf_request(
            "POST",
            f"/accounts/{account_id}/registrar/domains/check",
            token,
            body={"domain": domain},
        )
        if not check.get("success"):
            errs = check.get("errors", [])
            print(f"ERROR: availability check failed:", file=sys.stderr)
            for e in errs[:3]:
                print(f"  code={e.get('code')} message={e.get('message','')}", file=sys.stderr)
            return 2
        result = check.get("result", {})
    else:
        result = avail.get("result", {})

    available = result.get("available")
    transfer_in = result.get("supported_transfer_in", False)
    transferable = result.get("supported_transferable", False)
    pricing = result.get("registry_premium_pricing", None)
    price_usd = result.get("price")
    if price_usd is None:
        # try alternate keys
        price_usd = result.get("registry_premium_price") or result.get("price_usd") or 0.0
    try:
        price_usd = float(price_usd)
    except Exception:
        price_usd = 0.0

    print(f"  available: {available}")
    print(f"  price (1yr): ${price_usd:.2f}")
    if pricing:
        print(f"  premium pricing: {pricing}")
    if available is False and not transfer_in:
        print(f"  ❌ {domain} is NOT available and not transferable. Pick another.")
        return 3

    # Step 2: Money guard
    if price_usd > MAX_PRICE_USD:
        print(f"  ❌ price ${price_usd:.2f} exceeds cap ${MAX_PRICE_USD:.2f} — refusing without explicit founder approval.")
        log_purchase(domain, price_usd, args.years, ok=False, note="exceeded cap")
        return 4

    if not args.confirm:
        print(f"\n  --confirm not passed. NO charge. Re-run with --confirm to actually buy.")
        log_purchase(domain, price_usd, args.years, ok=False, note="quote only (--confirm not passed)")
        return 0

    # Step 3: Purchase
    print(f"\n=== Purchasing {domain} for {args.years}yr at ${price_usd:.2f} ===")
    purchase = cf_request(
        "POST",
        f"/accounts/{account_id}/registrar/domains/{domain}",
        token,
        body={
            "auto_renew": True,
            "locked": True,
            "privacy": True,
            "registry_statuses": "ok",
        },
    )
    if not purchase.get("success"):
        errs = purchase.get("errors", [])
        msg = "; ".join(f"code={e.get('code')} {e.get('message','')[:80]}" for e in errs[:3])
        print(f"  ❌ purchase failed: {msg}", file=sys.stderr)
        log_purchase(domain, price_usd, args.years, ok=False, note=msg)
        return 5

    print(f"  ✅ purchased. Cloudflare charged saved payment method ${price_usd:.2f}.")
    log_purchase(domain, price_usd, args.years, ok=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
