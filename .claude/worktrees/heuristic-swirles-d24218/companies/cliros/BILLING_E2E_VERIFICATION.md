# Billing E2E verification — 2026-05-21

## Automated (passed)

`npx tsx scripts/verify_billing_e2e.ts` confirms:

- Lemon Squeezy API key, store, webhook secret present locally
- Package variant IDs documented (prod: 1668302 / 1685339 / 1685341)
- Code paths: `buy-package` → `webhook` (with **ls_order_id idempotency**) → `search/queue` package decrement

## Code changes this session

- Webhook: skip duplicate `order_created` when `report_packages.ls_order_id` already exists
- Queue: `is_free_trial` only when `billingMode === "free"`

## Manual production gate (founder)

No `report_packages` rows exist yet in DB — first real card purchase still required:

1. https://cliros.ai/dashboard/billing → Buy 1-pack ($250)
2. Re-run `verify_billing_e2e.ts` → expect new package row + `reports_remaining=1`
3. Run one search → balance `0`
