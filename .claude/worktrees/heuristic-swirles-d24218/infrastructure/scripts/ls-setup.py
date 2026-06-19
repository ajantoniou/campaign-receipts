#!/usr/bin/env python3
"""
Lemon Squeezy API setup script — creates products + variants for all portfolio companies.

Run AFTER store approval lands (store must be approved before products can be created).

Usage:
    python3 ls-setup.py --check          # verify API key + store status
    python3 ls-setup.py --company concise   # create products for one company
    python3 ls-setup.py --all            # create products for all companies
    python3 ls-setup.py --list           # list all existing products + variants

Writes variant IDs back to .env automatically.
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

REPO = Path("/Applications/DrAntoniou Projects/AgentCompanies")
ENV_FILE = REPO / ".env"

# ── Load .env ─────────────────────────────────────────────────────────────────
def load_env():
    env = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip().strip('"')
    return env

def save_env_key(key, value):
    """Update or insert a key in .env file."""
    text = ENV_FILE.read_text()
    pattern = rf'^{re.escape(key)}=.*$'
    new_line = f'{key}={value}'
    if re.search(pattern, text, re.MULTILINE):
        text = re.sub(pattern, new_line, text, flags=re.MULTILINE)
    else:
        text = text.rstrip() + f'\n{new_line}\n'
    ENV_FILE.write_text(text)
    print(f"  .env updated: {key}={value}")

# ── LS API client ─────────────────────────────────────────────────────────────
class LSClient:
    BASE = "https://api.lemonsqueezy.com/v1"

    def __init__(self, api_key):
        self.api_key = api_key

    def _req(self, method, path, body=None):
        url = f"{self.BASE}{path}"
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.api_key}")
        req.add_header("Accept", "application/vnd.api+json")
        if body:
            req.add_header("Content-Type", "application/vnd.api+json")
        try:
            with urllib.request.urlopen(req, timeout=15) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  HTTP {e.code}: {body[:300]}")
            return None

    def get(self, path):
        return self._req("GET", path)

    def post(self, path, body):
        return self._req("POST", path, body)

    def patch(self, path, body):
        return self._req("PATCH", path, body)

# ── Product definitions ───────────────────────────────────────────────────────
# Each company defines the products + variants it needs.
# After creation, variant IDs are written to .env.
PRODUCTS = {
    "concise": [
        {
            "name": "SEALED: The 2016 Promises — Before the Deals",
            "description": "A historical archive of Trump's 2015-2016 campaign promises. PDF, ePub, and Audiobook formats included.",
            "variants": [
                {
                    "name": "Standard Edition",
                    "price_cents": 2200,   # $22.00
                    "env_key": "LEMONSQUEEZY_SEALED_VARIANT_ID_STANDARD",
                },
                {
                    "name": "Bundle + Tracking Sheet",
                    "price_cents": 2700,   # $27.00
                    "env_key": "LEMONSQUEEZY_SEALED_VARIANT_ID_BUNDLE",
                },
            ],
            "product_env_key": "LEMONSQUEEZY_SEALED_PRODUCT_ID",
        },
    ],
    "carstack": [
        {
            "name": "CarStack — Vehicle Intelligence",
            "description": "AI-powered sell-or-keep analysis + NHTSA recall monitoring for your vehicle.",
            "variants": [
                {
                    "name": "Monthly",
                    "price_cents": 900,    # $9.00/mo
                    "is_subscription": True,
                    "interval": "month",
                    "env_key": "LEMONSQUEEZY_CARSTACK_VARIANT_ID_MONTHLY",
                },
                {
                    "name": "Annual",
                    "price_cents": 7900,   # $79/yr (~$6.58/mo)
                    "is_subscription": True,
                    "interval": "year",
                    "env_key": "LEMONSQUEEZY_CARSTACK_VARIANT_ID_ANNUAL",
                },
            ],
            "product_env_key": "LEMONSQUEEZY_CARSTACK_PRODUCT_ID",
        },
    ],
    "exitready": [
        {
            "name": "ExitReady — Business Valuation",
            "description": "Automated business valuation report + monthly digest. Know what your business is worth today.",
            "variants": [
                {
                    "name": "Monthly",
                    "price_cents": 4900,   # $49/mo
                    "is_subscription": True,
                    "interval": "month",
                    "env_key": "LEMONSQUEEZY_EXITREADY_VARIANT_ID_MONTHLY",
                },
                {
                    "name": "Annual",
                    "price_cents": 39900,  # $399/yr
                    "is_subscription": True,
                    "interval": "year",
                    "env_key": "LEMONSQUEEZY_EXITREADY_VARIANT_ID_ANNUAL",
                },
            ],
            "product_env_key": "LEMONSQUEEZY_EXITREADY_PRODUCT_ID",
        },
    ],
    "legalpulse": [
        {
            "name": "LegalPulse API — Case Law Search",
            "description": "Semantic case law search API for legal tech builders. Federal circuits + state supreme courts, 1990-present.",
            "variants": [
                {
                    "name": "Builder Tier",
                    "price_cents": 49900,  # $499/mo
                    "is_subscription": True,
                    "interval": "month",
                    "env_key": "LEMONSQUEEZY_LEGALPULSE_VARIANT_ID_BUILDER",
                },
            ],
            "product_env_key": "LEMONSQUEEZY_LEGALPULSE_PRODUCT_ID",
        },
    ],
    "complianceos": [
        {
            "name": "ComplianceOS — SOC2 Automation",
            "description": "Automated SOC2 evidence collection and failing-controls digest.",
            "variants": [
                {
                    "name": "Starter",
                    "price_cents": 29900,  # $299/mo
                    "is_subscription": True,
                    "interval": "month",
                    "env_key": "LEMONSQUEEZY_COMPLIANCEOS_VARIANT_ID_STARTER",
                },
            ],
            "product_env_key": "LEMONSQUEEZY_COMPLIANCEOS_PRODUCT_ID",
        },
    ],
    "learnpath": [
        {
            "name": "LearnPath — Personalized Learning",
            "description": "Weekly AI-curated learning plan for your child. Parent account, zero child PII stored.",
            "variants": [
                {
                    "name": "Family Monthly",
                    "price_cents": 1900,   # $19/mo
                    "is_subscription": True,
                    "interval": "month",
                    "env_key": "LEMONSQUEEZY_LEARNPATH_VARIANT_ID_MONTHLY",
                },
                {
                    "name": "Family Annual",
                    "price_cents": 15900,  # $159/yr
                    "is_subscription": True,
                    "interval": "year",
                    "env_key": "LEMONSQUEEZY_LEARNPATH_VARIANT_ID_ANNUAL",
                },
            ],
            "product_env_key": "LEMONSQUEEZY_LEARNPATH_PRODUCT_ID",
        },
    ],
    "wealthlayer": [
        {
            "name": "WealthLayer — Net Worth Intelligence",
            "description": "Monthly net worth narrative email. Ghostfolio-powered, Plaid-connected, zero investment advice.",
            "variants": [
                {
                    "name": "Monthly",
                    "price_cents": 4900,   # $49/mo
                    "is_subscription": True,
                    "interval": "month",
                    "env_key": "LEMONSQUEEZY_WEALTHLAYER_VARIANT_ID_MONTHLY",
                },
                {
                    "name": "Annual",
                    "price_cents": 44900,  # $449/yr
                    "is_subscription": True,
                    "interval": "year",
                    "env_key": "LEMONSQUEEZY_WEALTHLAYER_VARIANT_ID_ANNUAL",
                },
            ],
            "product_env_key": "LEMONSQUEEZY_WEALTHLAYER_PRODUCT_ID",
        },
    ],
}

# ── Actions ───────────────────────────────────────────────────────────────────
def check_store(client, store_id):
    print(f"\n── Store check (ID: {store_id}) ──")
    result = client.get(f"/stores/{store_id}")
    if not result:
        print("  ✗ Could not reach store. API key may be invalid or store not yet approved.")
        return False
    attrs = result.get("data", {}).get("attributes", {})
    name = attrs.get("name", "?")
    status = attrs.get("country", "?")
    currency = attrs.get("currency", "?")
    total_sales = attrs.get("total_sales", 0)
    print(f"  ✅ Store: {name}")
    print(f"  Currency: {currency} | Country: {status} | Lifetime sales: {total_sales}")
    return True


def list_products(client, store_id):
    print(f"\n── Existing products ──")
    result = client.get(f"/products?filter[store_id]={store_id}&include=variants")
    if not result:
        print("  (none or API error)")
        return
    products = result.get("data", [])
    if not products:
        print("  (no products yet — store may not be approved)")
        return
    for p in products:
        attrs = p.get("attributes", {})
        print(f"  Product: {attrs.get('name')}  ID={p['id']}  status={attrs.get('status')}")
    included = result.get("included", [])
    for v in included:
        if v.get("type") == "variants":
            va = v.get("attributes", {})
            print(f"    Variant: {va.get('name')}  ID={v['id']}  price=${va.get('price',0)/100:.2f}  status={va.get('status')}")


def create_product_for_company(client, store_id, company, skip_existing=True):
    env = load_env()
    products = PRODUCTS.get(company, [])
    if not products:
        print(f"  No product definition for '{company}'")
        return

    for product_def in products:
        product_env_key = product_def["product_env_key"]
        existing_product_id = env.get(product_env_key, "").strip()

        if skip_existing and existing_product_id:
            print(f"\n  Skipping {product_def['name']} — already exists (ID: {existing_product_id})")
            continue

        print(f"\n── Creating: {product_def['name']} ──")

        # Create product
        product_body = {
            "data": {
                "type": "products",
                "attributes": {
                    "name": product_def["name"],
                    "description": product_def["description"],
                    "status": "draft",  # draft until file is uploaded; publish manually or via API
                },
                "relationships": {
                    "store": {
                        "data": {"type": "stores", "id": str(store_id)}
                    }
                }
            }
        }
        result = client.post("/products", product_body)
        if not result:
            print(f"  ✗ Failed to create product {product_def['name']}")
            continue

        product_id = result["data"]["id"]
        print(f"  ✅ Product created: ID={product_id}")
        save_env_key(product_env_key, product_id)

        # Create variants
        for variant_def in product_def["variants"]:
            print(f"  Creating variant: {variant_def['name']} @ ${variant_def['price_cents']/100:.2f}")

            variant_attrs = {
                "name": variant_def["name"],
                "price": variant_def["price_cents"],
                "is_subscription": variant_def.get("is_subscription", False),
            }
            if variant_def.get("is_subscription"):
                variant_attrs["interval"] = variant_def.get("interval", "month")
                variant_attrs["interval_count"] = 1

            variant_body = {
                "data": {
                    "type": "variants",
                    "attributes": variant_attrs,
                    "relationships": {
                        "product": {
                            "data": {"type": "products", "id": str(product_id)}
                        }
                    }
                }
            }
            vresult = client.post("/variants", variant_body)
            if not vresult:
                print(f"  ✗ Failed to create variant {variant_def['name']}")
                continue

            variant_id = vresult["data"]["id"]
            print(f"  ✅ Variant created: {variant_def['name']} ID={variant_id}")
            save_env_key(variant_def["env_key"], variant_id)

        print(f"  Done. Product {product_def['name']} ready. Upload digital file in LS dashboard to publish.")


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    env = load_env()
    api_key = env.get("LEMONSQUEEZY_API_KEY", "")
    store_id = env.get("LEMONSQUEEZY_STORE_ID", "363520")

    if not api_key:
        print("ERR: LEMONSQUEEZY_API_KEY not set in .env")
        sys.exit(1)

    client = LSClient(api_key)

    if "--check" in sys.argv:
        ok = check_store(client, store_id)
        if ok:
            list_products(client, store_id)
        return

    if "--list" in sys.argv:
        list_products(client, store_id)
        return

    if "--all" in sys.argv:
        print("Creating products for all companies...")
        for company in PRODUCTS:
            create_product_for_company(client, store_id, company)
        return

    if "--company" in sys.argv:
        idx = sys.argv.index("--company")
        if idx + 1 >= len(sys.argv):
            print("ERR: --company requires a name (e.g. --company concise)")
            sys.exit(1)
        company = sys.argv[idx + 1]
        create_product_for_company(client, store_id, company)
        return

    print(__doc__)


if __name__ == "__main__":
    main()
