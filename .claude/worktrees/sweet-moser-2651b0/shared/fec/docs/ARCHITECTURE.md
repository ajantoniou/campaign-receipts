# `@portfolio/fec` Architecture

## The Picture

```
┌────────────────────────────────────────────────────────────────────┐
│                         FEC OpenAPI (data.gov)                      │
│              + OpenSecrets API (industry classification)            │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
                                  │  rate-limited fetch
                                  ▼
                ┌─────────────────────────────────────┐
                │     @portfolio/fec (this library)    │
                │  ┌────────────────────────────────┐ │
                │  │  fec-client.ts                 │ │
                │  │  - lookupCandidate             │ │
                │  │  - getCandidateTotals          │ │
                │  │  - getTopDonors                │ │
                │  │  - rate limit + retry + cache  │ │
                │  └────────────────────────────────┘ │
                │  ┌────────────────────────────────┐ │
                │  │  classify.ts (pure functions)  │ │
                │  │  - donor profile rules         │ │
                │  │  - industry rollup logic       │ │
                │  └────────────────────────────────┘ │
                │  ┌────────────────────────────────┐ │
                │  │  sync.ts (orchestrator)        │ │
                │  │  - per-politician pipeline     │ │
                │  └────────────────────────────────┘ │
                │  ┌────────────────────────────────┐ │
                │  │  bill-sponsor.ts (consumer fn) │ │
                │  │  - per-bill sponsor lookup     │ │
                │  └────────────────────────────────┘ │
                └────────────┬───────────┬─────────────┘
                             │           │
                  consumed by│           │consumed by
                             ▼           ▼
        ┌─────────────────────────┐  ┌─────────────────────────────┐
        │  CampaignReceipts       │  │  BillsTracker (future)       │
        │                         │  │                              │
        │  cr_campaign_finance    │  │  bt_campaign_finance         │
        │  cr_top_donors          │  │  bt_top_donors               │
        │  cr_industry_breakdown  │  │  bt_industry_breakdown       │
        │                         │  │  bt_bill_sponsor_finance ←   │
        │  Donor filter on home   │  │  per-bill sponsor donor info │
        │  "Who Funded" section   │  │                              │
        │  on politician pages    │  │                              │
        └─────────────────────────┘  └─────────────────────────────┘
```

## Why This Shape

### Pure-function classifier, isolated from I/O
`classify.ts` has zero network calls. Pure inputs → pure outputs. This means:
- It's trivially testable (no mocks needed)
- Bill-classification logic can be reused on data fetched from any source (not just FEC)
- The rules can be exposed publicly without leaking API client implementation details

### Schema generator, not hard-coded SQL
`schema.ts` exports a function that produces DDL given a table prefix. This is what makes the library truly portable — each consumer gets to namespace its tables (`cr_*`, `bt_*`) without the library knowing or caring.

### Single client instance, shared rate budget
The FEC free tier is 1000 req/hr. If both CampaignReceipts and BillsTracker run sync jobs from the same Render service, they share a single `FECClient` instance via a `getDefaultClient()` factory. If they run on different services, each gets its own bucket (still well within the cumulative budget for the foreseeable scale).

### Caching strategy
Donor records change quarterly (FEC filing deadlines). Cache aggressively:
- **In-process LRU cache:** for `lookupCandidate` and `getCandidateCommittees` (slowly-changing reference data)
- **File-based cache:** for `getCandidateTotals` and `getTopDonors` per cycle (keyed on cycle + candidate ID, valid for 30 days)
- **No cache:** for date-range queries spanning the current cycle

Cache backend is pluggable: default is file-based; a Redis adapter is planned for the multi-host case.

## Data Flow: CampaignReceipts Use Case

1. **Trigger:** monthly cron in `campaign-receipts` (or manual via `npm run sync:fec`)
2. **Iterator:** loop over `cr_politicians WHERE branch IN ('Senate', 'House', 'President')`
3. **Per politician:**
   - `lookupCandidate(name, state, office)` → cached
   - `getCandidateTotals(id, cycle)` → cached per cycle
   - `getTopDonors(id, cycle, 10)` → cached per cycle
   - `getContributionsBySize(id, cycle)` → cached per cycle
   - `classifyDonorProfile(totals)` → pure
   - `rollUpByIndustry(donors)` → pure
4. **Upsert:** project's seed script (similar to `seed-profiles.mjs`) writes results to `cr_campaign_finance`, `cr_top_donors`, `cr_industry_breakdown`, and updates `cr_politicians.donor_profile`
5. **UI cascade:** dynamic politician pages auto-pick up the new data on next render; homepage filter auto-counts politicians by `donor_profile`

## Data Flow: BillsTracker Use Case

The fundamental difference: BillsTracker is bill-centric, not politician-centric.

1. **Trigger:** real-time, when a user views a bill page (with caching), OR daily cron for popular bills
2. **Per bill view:**
   - Get the bill's sponsor + co-sponsors from Congress.gov (separate library)
   - `getBillSponsorFinance(billId, [sponsor1, sponsor2, ...])` — for each sponsor, look up their cached finance profile
   - If finance profile is stale (>30 days), trigger background refresh
3. **UI render:** the bill page shows "Sponsor: Sen. X" with a sub-line "Funded primarily by: [top 3 industries from their last cycle]"
4. **Influence score (Phase 3):** if the bill has a clear industry alignment, compute and surface the sponsor's donor-industry correlation

## Schema Contract

The library exports a single canonical schema. Both consumers run the same migration with their own prefix:

```typescript
import { generateDDL } from '@portfolio/fec/schema'

const sql = generateDDL({
  tablePrefix: 'cr_',
  fkPoliticianTable: 'cr_politicians',
})
```

Produces:
```sql
create table public.cr_campaign_finance (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid not null references public.cr_politicians(id) on delete cascade,
  ...
);
-- etc.
```

For BillsTracker (which may not have a politicians table — instead linking by FEC candidate ID directly):
```typescript
const sql = generateDDL({
  tablePrefix: 'bt_',
  // No fkPoliticianTable — bills tracker keys directly on fec_candidate_id
})
```

## Migration Strategy

When the library's schema changes:
1. Bump library version
2. Library exports a `migrationsBetween(fromVersion, toVersion)` function that returns SQL for each consumer to run
3. Consumers run the migrations against their prefixed tables
4. The classifier may also change rules; in that case, the library publishes a "reclassify" function consumers run once to update derived `donor_profile` values without re-fetching FEC data

## Testing

Library ships with:
- Unit tests for `classify.ts` (pure functions, easy)
- Integration tests for `fec-client.ts` against the FEC sandbox API (when available) or recorded fixtures
- E2E test for `sync.ts` against a known politician (e.g., a long-retired senator with stable records) to verify the full pipeline

## Open Architectural Questions

These are decisions to revisit when implementation begins:

1. **Industry classification source.** OpenSecrets is the gold standard but their TOS is restrictive. Alternative: build our own employer→industry mapping using a public industry-classification database (NAICS). More work but cleaner licensing.

2. **State-level adapter pattern.** State-level campaign-finance APIs are wildly inconsistent. The library should define an `Adapter` interface; per-state implementations slot in. Not Phase 1 work, but the interface should be in place from day one.

3. **Real-time vs. batch sync.** CampaignReceipts is fine with monthly batch. BillsTracker may need real-time for popular bills. The library supports both via the same client; the consumer decides.

4. **Multi-tenant for the future SaaS.** If the $399/mo PromisesKept Pro tier needs per-customer API rate limits or quotas, the library will need a tenant abstraction. Out of scope for Phase 1.
