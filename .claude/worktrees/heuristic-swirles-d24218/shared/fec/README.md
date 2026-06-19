# `@portfolio/fec` — Shared FEC Donor Data Library

A portfolio-wide library for fetching, normalizing, and persisting U.S. Federal Election Commission donor and campaign-finance data. Built to be consumed by multiple projects:

| Project | What it uses FEC data for |
|---|---|
| **CampaignReceipts** | Per-politician "Who Funded This Campaign" section + homepage "Donor" filter (corporate / grassroots / self-funded) |
| **BillsTracker** (future) | "Who funded the sponsor of this bill" attribution on every active federal + state bill — connecting legislation to the donor network behind it |
| Future portfolio projects | Any product that needs to connect politicians → donors → dollar amounts |

The principle: **one canonical FEC pipeline, many products.** When new FEC data sources, rate limits, or schema changes happen, you fix them in one place.

---

## What This Library Provides

### Runtime client (`src/fec-client.ts`)
A typed Node/TypeScript client for the FEC OpenAPI:
- `lookupCandidate(name, state, office)` → returns FEC candidate ID(s)
- `getCandidateTotals(candidateId, cycle)` → top-line raise/spend/cash-on-hand
- `getTopDonors(candidateId, cycle, limit)` → ranked individual contributors
- `getPACContributions(candidateId, cycle)` → PAC committee contributions
- `getContributionsBySize(candidateId, cycle)` → small-donor vs. large-donor split
- `getCandidateCommittees(candidateId)` → principal committees + their IDs
- Automatic rate-limit handling (token bucket, default 1000 req/hr)
- Pagination + retry with exponential backoff
- Optional response caching (file-based or KV-backed)

### Sync orchestrator (`src/sync.ts`)
Higher-level functions that:
- Iterate over a list of politicians (with name + state + office)
- Fetch + normalize their FEC data for one or more cycles
- Compute derived metrics: `donor_profile` classification (grassroots / mixed / corporate / self-funded), industry rollups
- Return a normalized result object ready to upsert into any database

### Classifier (`src/classify.ts`)
Pure functions (no I/O) for derivation rules:
- `classifyDonorProfile(totals)` → `'grassroots' | 'mixed' | 'corporate' | 'self-funded' | 'unknown'`
- `rollUpByIndustry(donors)` → industry totals using OpenSecrets-derived industry codes
- `computeInfluenceScore(donor, recipientVotes)` → vote-vs-donor correlation metric (used by BillsTracker)

### Normalized schema (`src/schema.ts`)
TypeScript types + SQL DDL snippets for the canonical FEC tables. Both consuming projects use the same column shapes; only table-name prefixes differ (`cr_*` for CampaignReceipts, `bt_*` for BillsTracker).

### Bill-sponsor connector (`src/bill-sponsor.ts`)
A BillsTracker-specific helper:
- `getBillSponsorFinance(billId, sponsors)` → for a given bill, returns the campaign-finance profile of each sponsor + co-sponsor
- Designed to power the "who funded the sponsor" UI element on bill pages
- Shares the rate-limit budget with the CampaignReceipts sync (single client instance)

---

## Repository Layout

```
shared/fec/
├── README.md                  # this file
├── package.json               # @portfolio/fec, version-tracked
├── tsconfig.json
├── src/
│   ├── fec-client.ts          # low-level FEC API client
│   ├── sync.ts                # high-level sync orchestrator
│   ├── classify.ts            # pure derivation functions
│   ├── schema.ts              # types + DDL snippets
│   ├── bill-sponsor.ts        # BillsTracker-specific helper
│   ├── opensecrets.ts         # optional industry-classification client
│   └── index.ts               # public exports
└── docs/
    ├── FEC-INTEGRATION-PLAN.md  # original spec (moved here from campaign-receipts)
    ├── ARCHITECTURE.md          # design rationale
    └── CONSUMER-INTEGRATION.md  # how to consume from a project
```

---

## How Consuming Projects Use It

### Option A: Local file path (recommended for monorepo)
In a project's `package.json`:

```json
{
  "dependencies": {
    "@portfolio/fec": "file:../../shared/fec"
  }
}
```

Then in code:

```typescript
import { createFECClient, syncPoliticianFinance, classifyDonorProfile } from '@portfolio/fec'

const client = createFECClient({ apiKey: process.env.FEC_API_KEY! })

const result = await syncPoliticianFinance(client, {
  name: 'Bernie Sanders',
  state: 'VT',
  office: 'senator',
  cycles: ['2024', '2018', 'lifetime'],
})

// result is a normalized object you can upsert into your project's tables
await db.from('cr_campaign_finance').upsert(result.campaign_finance)
await db.from('cr_top_donors').upsert(result.top_donors)
await db.from('cr_industry_breakdown').upsert(result.industry_breakdown)
```

### Option B: Standalone script
For one-off syncs, run the sync script directly:

```bash
cd shared/fec
node src/sync-cli.mjs --politicians ../../companies/campaign-receipts/politicians.json \
  --output /tmp/fec-result.json
```

The CLI dumps a result file the project then ingests with a project-specific upsert script.

---

## Environment Variables

Add to the monorepo `.env`:

```bash
# Required: free signup at https://api.data.gov/signup/
FEC_API_KEY=...

# Optional: free signup at https://www.opensecrets.org/api/admin/login.php
# Used for industry classification of donors
OPENSECRETS_API_KEY=...

# Optional: cache directory (default: ./.fec-cache)
FEC_CACHE_DIR=...

# Optional: rate limit (default: 1000 req/hr, FEC's free tier)
FEC_RATE_LIMIT_PER_HOUR=1000
```

---

## Rate-Limit Strategy

The free FEC API tier allows 1000 requests/hour. The library uses a token-bucket rate limiter shared across all calls. When multiple projects sync concurrently, they share the budget — the rate limiter is process-local, so:

- **Single-host setup (today):** all projects share the limit naturally
- **Multi-host setup (later):** if/when you split projects across separate Render services, add a Redis-backed token bucket (`@portfolio/fec` supports plugging in a custom rate-limiter)

The 1000/hr budget supports:
- ~150 senators full sync per hour (6 calls per politician)
- ~10,000 politicians per week at sustained throughput
- Easily fits the CampaignReceipts use case + BillsTracker's per-bill sponsor lookups

OpenSecrets free tier is 200/day — used only for industry classification, with results cached aggressively.

---

## Schema Contract Between Projects

Both CampaignReceipts (`cr_*` tables) and BillsTracker (`bt_*` tables) follow the same column shapes for these tables. The library's `schema.ts` exports both the TypeScript types and a DDL snippet generator:

```typescript
import { generateDDL } from '@portfolio/fec'

// In CampaignReceipts:
const sql = generateDDL({ tablePrefix: 'cr_' })
// In BillsTracker:
const sql = generateDDL({ tablePrefix: 'bt_' })
```

Both produce identical schemas (the same `campaign_finance`, `top_donors`, `industry_breakdown` tables) — only the prefix differs.

---

## Compliance + Attribution

**FEC data:** Public domain. Attribute as: "Source: FEC (Federal Election Commission)."

**OpenSecrets data:** TOS restricts redistribution of their proprietary industry classification. We use it at sync time but expose only the derived rollup totals (which are FEC-source amounts grouped by category). We do not expose raw OpenSecrets fields to end users or APIs. Each politician profile credits: "Industry categorization derived from OpenSecrets (Center for Responsive Politics)."

**Bills tracker specifics:** Bill text and metadata from Congress.gov (public domain) + state bill APIs vary. The FEC layer only attaches the donor-finance profile of the sponsor; the bills tracker handles bill-text licensing separately.

---

## Versioning

This library is version-pinned. Breaking changes (schema additions, classifier rule changes) bump the major version. Consumers should pin to a specific version in their `package.json` for stability:

```json
"@portfolio/fec": "file:../../shared/fec#v1.0.0"
```

(Git-tagged versions until/unless we publish to a private registry.)

---

## Implementation Phases

### Phase 1: CampaignReceipts integration
- Build `fec-client.ts`, `sync.ts`, `classify.ts`, `schema.ts`
- Wire to CampaignReceipts senator profiles (~100 politicians)
- Activate the dormant "Donor" filter on the homepage
- Add "Who Funded This Campaign" section to politician pages
- **Effort: 1-2 days**

### Phase 2: BillsTracker bootstrap
- Build `bill-sponsor.ts` helper
- Bill-tracker project consumes the library
- Each bill page shows sponsor donor profile
- **Effort: depends on bill-tracker timeline**

### Phase 3: Cross-project enrichment
- `computeInfluenceScore()` — for a given bill, score how aligned the sponsor's vote is with their top donor industries
- Surface the same correlation metric on CampaignReceipts as "donor-vote alignment"
- **Effort: 1 day once both projects are live**

### Phase 4: State-level expansion
- State-level campaign-finance APIs (varies by state — some have FEC-equivalent APIs, others require web scraping)
- Same library, additional adapters per state
- **Effort: ongoing, per state**

---

## Why Not Just Build This Twice?

The most expensive part of FEC integration isn't the API client — it's the **name disambiguation, industry classification, and donor-profile rules.** These are the same regardless of consumer:

- Disambiguating "Senator Smith" across multiple FEC candidate records
- Mapping donor employer → industry code (OpenSecrets methodology)
- Classifying a politician as "corporate-funded" vs "grassroots" with consistent thresholds
- Handling FEC data quirks (multiple committees per candidate, joint fundraising committees, leadership PACs)

If BillsTracker has its own implementation, the two projects will drift on classification rules and produce different "donor profiles" for the same politician. That's a credibility risk we don't need.

---

## Status

**Not yet implemented.** This README is the architectural commitment. Phase 1 implementation is the next FEC-related work item.
