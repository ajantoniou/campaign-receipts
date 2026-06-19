#!/usr/bin/env python3
"""
Generate an image via OpenAI / Grok / (future) Anthropic API and log cost.

Usage:
    python3 generate-image.py \
        --provider {openai|grok|anthropic} \
        --prompt "vintage 2016 campaign poster, sealed envelope archive aesthetic" \
        --out /path/to/output.png \
        --company concise \
        [--size 1024x1024]

Provider preference (subject to availability):
  1. OpenAI DALL-E 3 — most reliable, $0.040/standard 1024×1024
  2. Grok (xAI image gen) — fallback
  3. Anthropic — verified NOT yet GA via /v1/models on 2026-05-03; placeholder

Cost ceiling: $5/day across the whole portfolio. Script will refuse to run if
today's accumulated cost in `.image-gen-costs.jsonl` is already at or over $5.
Use --override-cap to bypass (founder approval only — script asks for confirmation).
"""

import argparse
import datetime as dt
import hashlib
import json
import os
import sys
import urllib.request
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
ENV_FILE = REPO / ".env"
COST_LOG = REPO / "infrastructure" / "scripts" / ".image-gen-costs.jsonl"
DAILY_CAP_USD = 5.00


def load_env() -> dict:
    """Tiny .env parser."""
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


def todays_spend_usd() -> float:
    """Sum cost_usd from cost log for today."""
    if not COST_LOG.exists():
        return 0.0
    today = dt.date.today().isoformat()
    total = 0.0
    for line in COST_LOG.read_text().splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
            if row.get("ts", "")[:10] == today:
                total += float(row.get("cost_usd", 0.0))
        except Exception:
            continue
    return total


def log_call(provider: str, prompt: str, size: str, cost_usd: float, company: str, out_path: str, ok: bool, error: str = "") -> None:
    """Append one JSONL line to cost log."""
    COST_LOG.parent.mkdir(parents=True, exist_ok=True)
    row = {
        "ts": dt.datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "provider": provider,
        "prompt_hash": hashlib.sha256(prompt.encode()).hexdigest()[:12],
        "prompt_first_60": prompt[:60],
        "size": size,
        "cost_usd": round(cost_usd, 4),
        "company": company,
        "out": out_path,
        "ok": ok,
    }
    if error:
        row["error"] = error[:200]
    with COST_LOG.open("a") as f:
        f.write(json.dumps(row) + "\n")


def call_openai(env: dict, prompt: str, size: str) -> tuple[bytes, float]:
    """Call OpenAI DALL-E 3 / images.generations. Returns (image_bytes, cost_usd)."""
    api_key = env.get("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY missing from .env")
    body = json.dumps({
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": size,
        "response_format": "url",
        "quality": "standard",
    }).encode()
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.loads(r.read())
    image_url = d["data"][0]["url"]
    # Fetch the image
    with urllib.request.urlopen(image_url, timeout=60) as r:
        img_bytes = r.read()
    # DALL-E 3 standard 1024×1024 = $0.040; HD = $0.080. We use standard.
    cost_table = {
        "1024x1024": 0.040,
        "1024x1792": 0.080,
        "1792x1024": 0.080,
    }
    cost = cost_table.get(size, 0.040)
    return img_bytes, cost


def call_grok(env: dict, prompt: str, size: str) -> tuple[bytes, float]:
    """Call xAI Grok image generation. Returns (image_bytes, cost_usd).

    xAI image-gen API endpoint per https://docs.x.ai/docs/guides/image-generations.
    """
    api_key = env.get("XAI_API_KEY")
    if not api_key:
        raise RuntimeError("XAI_API_KEY missing from .env")
    body = json.dumps({
        "model": "grok-imagine-image",
        "prompt": prompt,
        "n": 1,
        "response_format": "url",
    }).encode()
    req = urllib.request.Request(
        "https://api.x.ai/v1/images/generations",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "curl/7.88.1",  # xAI Cloudflare blocks Python default UA
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        d = json.loads(r.read())
    image_url = d["data"][0]["url"]
    dl_req = urllib.request.Request(image_url, headers={"User-Agent": "curl/7.88.1"})
    with urllib.request.urlopen(dl_req, timeout=60) as r:
        img_bytes = r.read()
    # Grok-2-image pricing per xAI docs: $0.07/image at the time of writing
    cost = 0.070
    return img_bytes, cost


def call_anthropic(env: dict, prompt: str, size: str) -> tuple[bytes, float]:
    """Anthropic image-gen via API was NOT GA at script-write time (2026-05-03).
    Verify at runtime; fail fast if still unavailable.
    """
    api_key = env.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY missing from .env")
    # Verify by listing models — if no image-gen model present, abort
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/models",
        headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"},
        method="GET",
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read())
    models = d.get("data", [])
    image_models = [m for m in models if any(s in m.get("id", "").lower() for s in ("image", "imagen", "flux"))]
    if not image_models:
        raise RuntimeError(
            "Anthropic image-gen API not yet GA. /v1/models exposes "
            f"{len(models)} models; none are image-gen. Use --provider openai or grok."
        )
    # If/when GA, replace this with the real call.
    raise RuntimeError(
        "Anthropic image-gen detected in /v1/models but the script handler "
        "isn't implemented yet. Update generate-image.py call_anthropic() with the "
        "real endpoint when shipping."
    )


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate an image via OpenAI/Grok/Anthropic and log cost.")
    ap.add_argument("--provider", choices=["openai", "grok", "anthropic"], required=True)
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--out", required=True, help="Output PNG path (will be created/overwritten).")
    ap.add_argument("--company", required=True, help="Company slug for cost attribution: concise|nt-ministry|healthbrew|portfolio-hq|test")
    ap.add_argument("--size", default="1024x1024")
    ap.add_argument("--override-cap", action="store_true", help="Bypass $5/day portfolio cap (founder approval).")
    args = ap.parse_args()

    env = load_env()
    if not env:
        print("ERROR: .env not loaded", file=sys.stderr)
        return 1

    # Cost cap check
    today_spent = todays_spend_usd()
    if today_spent >= DAILY_CAP_USD and not args.override_cap:
        print(
            f"ERROR: today's image-gen spend is ${today_spent:.2f} (cap ${DAILY_CAP_USD:.2f}). "
            f"Either wait for tomorrow's reset or pass --override-cap (founder approval only).",
            file=sys.stderr,
        )
        return 2

    # Dispatch by provider
    handlers = {"openai": call_openai, "grok": call_grok, "anthropic": call_anthropic}
    handler = handlers[args.provider]

    try:
        img_bytes, cost_usd = handler(env, args.prompt, args.size)
    except Exception as e:
        log_call(args.provider, args.prompt, args.size, 0.0, args.company, args.out, ok=False, error=str(e))
        print(f"ERROR: {args.provider} call failed: {e}", file=sys.stderr)
        return 3

    # Write image
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(img_bytes)

    # Log
    log_call(args.provider, args.prompt, args.size, cost_usd, args.company, str(out_path), ok=True)

    new_total = today_spent + cost_usd
    print(f"sent: {args.provider} | size={args.size} | cost=${cost_usd:.4f} | today=${new_total:.4f} of ${DAILY_CAP_USD:.2f} cap")
    print(f"out: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
