# SEALED Press — uptime + health probes (tracker step 45)

## Render-native

Configure the web service **Health Check Path** to **`/api/health`** (already supported by concise-sealed). Render marks instances unhealthy when that route fails.

## Synthetic checks

Optionally attach an external uptime monitor:

- **`GET`** `https://<your-host>/api/health` — expect **`200`** and JSON `status` of **`ok`** or **`degraded`** (Supabase optional for “degraded” vs hard failure depending on deployment policy).
- **`GET`** `https://<your-host>/` — expect **`200`** for storefront liveness.

Do **not** embed secrets in public monitors; **`/api/health`** exposes only booleans + `buildId`, not credential values.

## Weekly vitals rollup

- The vitals beacon also writes JSON lines to `runtime/vitals/vitals.jsonl`. The optional rollup script reads that file and generates a CSV per ISO week.
- Run it from the SEALED root (or prefix with `node companies/concise-sealed/scripts/vitals-rollup.mjs` from the repo root). Defaults to the current week; pass `--start=YYYY-MM-DD` or `--week=2026-W18` to target another window.
- Output lands in `runtime/vitals/rollups/vitals-rollup-<YYYY-MM-DD>.csv`; the runtime directory is gitignored so only the latest summary file stays local.
