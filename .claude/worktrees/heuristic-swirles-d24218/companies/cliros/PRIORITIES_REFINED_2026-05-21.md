# Refined priorities — panel-guided (2026-05-21)

Sources: [HANDOFF_2026-05-21.md](HANDOFF_2026-05-21.md), [PANEL_QUERY_2026-05-21.md](PANEL_QUERY_2026-05-21.md), [BACKLOG_PANEL_2026-05-21.md](BACKLOG_PANEL_2026-05-21.md)

**Unanimous backlog panel verdict:** `fix` @ 15% go-live confidence

## P0 — Revenue + trust (before outbound sales)

| # | Task | Owner action |
|---|------|----------------|
| 1 | **Billing E2E** — LS checkout → webhook → `reports_remaining` → queue → decrement | `scripts/verify_billing_e2e.ts` + webhook idempotency |
| 2 | **RLS** on `cliros.report_documents` | Supabase migration |

## P1 — Report accuracy (demo defensible)

| # | Task | Notes |
|---|------|-------|
| 3 | **GSCCCA** grantor/grantee row merge | `parseDeedResults` — shipped this session |
| 4 | **Re-run EIKHOFF** + panel | Target orchestrator `ship` / confidence >80% |

## P2 — Conversion UX

| # | Task |
|---|------|
| 5 | Homepage alex@ / support@ CTAs |
| 6 | Welcome video — `record-walkthrough.mjs` + `WALKTHROUGH_REPORT_ID` |
| 7 | Harrington firm Settings → `/api/firm` |
| 8 | Landing sample PDF (deferred if EIKHOFF not ship) |

## Policy — No charge on unverifiable addresses (2026-05-23)

**Rule:** when the pipeline ends a report in `pipeline_stage='blocked'` for an
unverifiable cause (parcel not found, panel kill, max-attempts retry exhaustion,
billing-failure rollback), `refundReport()` automatically marks the report
`billed=false` and reverses the credit on whichever rail consumed it:

- **Package:** +1 to `report_packages.reports_remaining` (oldest non-expired,
  FIFO mirror of the debit) and +1 to `users.reports_remaining`.
- **Metered:** posts an offsetting `action=decrement` LemonSqueezy usage record
  via `decrementReportUsageBySubItem`. Best-effort — if the offset fails the
  report still shows as un-billed; support comps invoiced overages manually.
- **Free trial / BETA_MODE:** no credit movement; the audit row records
  `credit_kind='free_trial'` for UI purposes.

Idempotent via `report_refunds.UNIQUE(report_id)` — a re-run that fails again
is a no-op. Pipeline sites that call the helper: `stageSearching`
(PARCEL_NOT_FOUND), `panel_review` (PANEL_KILL), `failStage` after
MAX_ATTEMPTS, and `queue/route.ts` on billing-failed metered rollback.

Refunded reports surface a green "Address could not be fully verified — no
charge applied" banner on the report detail page and a "Refunded" counter on
Billing.

## Parked

Stripe, multi-state, Spanish, white-label, MarketCheck, citation directories.
