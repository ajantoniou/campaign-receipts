# FEC Donor Data Integration

This project consumes a **portfolio-shared** FEC library, not a project-local one.

The full architecture, schema, sync pipeline, and consumer-integration patterns are documented at:

**`/shared/fec/`**

- [`README.md`](../../../shared/fec/README.md) — overview, library contract, environment variables
- [`docs/ARCHITECTURE.md`](../../../shared/fec/docs/ARCHITECTURE.md) — design rationale and data flow
- [`docs/CONSUMER-INTEGRATION.md`](../../../shared/fec/docs/CONSUMER-INTEGRATION.md) — step-by-step integration for CampaignReceipts (this project) AND BillsTracker (future)
- [`docs/FEC-INTEGRATION-PLAN.md`](../../../shared/fec/docs/FEC-INTEGRATION-PLAN.md) — the original implementation plan
- [`docs/BILLS-TRACKER-NOTES.md`](../../../shared/fec/docs/BILLS-TRACKER-NOTES.md) — forward notes for the future bills tracker that will also consume this library

## Why shared

The same FEC pipeline serves both CampaignReceipts (politician-centric donor data) and the future BillsTracker (per-bill sponsor donor data). Building it twice would mean two implementations of name disambiguation, two classifications of "corporate vs. grassroots," and two industry rollups — guaranteed drift over time. One library, two consumers, identical methodology.

## When implementation begins

The library is currently spec-only (stub `src/` files). Phase 1 implementation:
1. Build `fec-client.ts` against the FEC OpenAPI
2. Build `classify.ts` rules
3. Build `sync.ts` orchestrator
4. CampaignReceipts wires it up first (~1-2 days work)
5. UI: activate the dormant "Donor" filter + add "Who Funded This Campaign" section to politician pages

BillsTracker is Phase 2+, after CampaignReceipts proves the data pipeline.
