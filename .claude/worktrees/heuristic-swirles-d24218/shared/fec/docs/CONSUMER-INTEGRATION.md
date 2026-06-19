# Consumer Integration Guide

How a project consumes `@portfolio/fec`. Two concrete examples below: **CampaignReceipts** and **BillsTracker** (future).

---

## Quick Start

In your project's `package.json`:

```json
{
  "dependencies": {
    "@portfolio/fec": "file:../../shared/fec"
  }
}
```

Then `npm install` and import:

```typescript
import {
  createFECClient,
  syncPoliticianFinance,
  classifyDonorProfile,
  generateDDL,
} from '@portfolio/fec'
```

---

## Example 1: CampaignReceipts

### Step 1: Run the schema migration

```typescript
// scripts/migrate-fec-schema.mjs
import { generateDDL } from '@portfolio/fec/schema'
import { supabaseService } from '../lib/supabase.js'

const sql = generateDDL({
  tablePrefix: 'cr_',
  fkPoliticianTable: 'cr_politicians',
})

await supabaseService.rpc('exec_sql', { sql })
```

This creates:
- `cr_campaign_finance` (totals per politician per cycle)
- `cr_top_donors` (top 10 donors per cycle)
- `cr_industry_breakdown` (industry rollups per cycle)
- Adds `cr_politicians.donor_profile` column

### Step 2: Run the sync

```typescript
// scripts/sync-fec.mjs
import { createFECClient, syncPoliticianFinance } from '@portfolio/fec'
import { supabaseService } from '../lib/supabase.js'

const client = createFECClient({
  apiKey: process.env.FEC_API_KEY,
  cacheDir: './.fec-cache',
})

// Fetch all federal politicians from the DB
const { data: politicians } = await supabaseService
  .from('cr_politicians')
  .select('id, name, state, branch')
  .in('branch', ['Senate', 'House', 'President'])

for (const p of politicians) {
  const result = await syncPoliticianFinance(client, {
    name: p.name,
    state: p.state,
    office: branchToOffice(p.branch),
    cycles: ['2024', '2018', 'lifetime'],
  })

  if (!result.fec_candidate_id) {
    console.warn(`No FEC match for ${p.name}`)
    continue
  }

  // Upsert finance
  await supabaseService.from('cr_campaign_finance')
    .upsert(result.campaign_finance.map(cf => ({ ...cf, politician_id: p.id })))

  // Upsert donors
  await supabaseService.from('cr_top_donors')
    .upsert(result.top_donors.map(d => ({ ...d, politician_id: p.id })))

  // Upsert industry
  await supabaseService.from('cr_industry_breakdown')
    .upsert(result.industry_breakdown.map(i => ({ ...i, politician_id: p.id })))

  // Update donor_profile classification
  await supabaseService.from('cr_politicians')
    .update({ donor_profile: result.donor_profile })
    .eq('id', p.id)
}
```

### Step 3: Wire the UI

Two UI changes activate the dormant feature:

```tsx
// PoliticianFilters.tsx — homepage filter
<Select
  label="Donor"
  value={donor}
  onChange={setDonor}
  options={[
    ['all', 'All'],
    ['grassroots', 'Grassroots'],
    ['mixed', 'Mixed'],
    ['corporate', 'Corporate'],
    ['self-funded', 'Self-funded'],
  ]}
  // remove the `disabled` prop
/>
```

```tsx
// Politician detail page — new section between scorecard and Featured Four
<WhoFundedThisCampaign politicianId={politician.id} />
```

The `WhoFundedThisCampaign` server component fetches from `cr_campaign_finance`, `cr_top_donors`, `cr_industry_breakdown` for the politician and renders the bar+top-donors+industry layout per the original FEC plan.

### Step 4: Cron the sync

Add to Render:

```yaml
# render.yaml (or via dashboard)
services:
  - type: cron
    name: cr-fec-sync
    schedule: "0 4 * * 1"  # Mondays 4am UTC
    buildCommand: "cd companies/campaign-receipts && npm install"
    startCommand: "cd companies/campaign-receipts && node scripts/sync-fec.mjs"
```

Weekly is fine for senators (FEC filings are quarterly). Daily during active election periods.

---

## Example 2: BillsTracker (future)

The use case is different: **per-bill, on demand**, not per-politician on a schedule.

### Step 1: Schema migration

```typescript
import { generateDDL } from '@portfolio/fec/schema'

const sql = generateDDL({
  tablePrefix: 'bt_',
  fkPoliticianTable: 'bt_legislators',  // bills tracker has its own legislator table
})
```

Plus a BillsTracker-specific table:
```sql
create table public.bt_bill_sponsor_finance (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bt_bills(id) on delete cascade,
  legislator_id uuid not null references public.bt_legislators(id),
  role text check (role in ('sponsor', 'co-sponsor')),
  -- Snapshot of the finance profile at the time of analysis
  donor_profile text,
  top_industries jsonb,  -- top 3 industries with totals
  finance_snapshot_at timestamptz default now()
);
```

### Step 2: Per-bill sponsor lookup

When a user views a bill page:

```typescript
import { createFECClient, getBillSponsorFinance } from '@portfolio/fec'

const client = createFECClient({ apiKey: process.env.FEC_API_KEY })

// Get bill + sponsors from Congress.gov
const bill = await getBillFromCongress(billId)

// Fetch sponsor finance profiles (each cached for 30 days)
const finance = await getBillSponsorFinance(client, {
  billId: bill.id,
  sponsors: bill.sponsors,  // [{ legislator_id, name, state, office }, ...]
})

// Render the bill page with donor attribution
return <BillPage bill={bill} sponsorFinance={finance} />
```

### Step 3: Cron for background refresh

Popular bills get refreshed in the background:

```bash
# Daily cron
node scripts/refresh-popular-bills.mjs
```

This pulls the top 100 most-viewed bills and refreshes their sponsor-finance snapshots if older than 30 days.

### Step 4: Influence score (Phase 3)

```typescript
import { computeInfluenceScore } from '@portfolio/fec'

const score = computeInfluenceScore({
  bill,
  sponsor: bill.sponsors[0],
  industries: ['Oil & Gas', 'Mining'],  // industries affected by this bill
})

// score = 0-100, where higher = more aligned with sponsor's donor base
```

---

## Common Pitfalls

### 1. Name disambiguation
"Senator Smith" can match multiple FEC candidate records (one per cycle, sometimes one per office sought). Always pass `state` and `office` together. The library returns the most recent match by default; pass `cycle` if you need a historical record.

### 2. Joint Fundraising Committees (JFCs)
A politician's "real" fundraising often happens through a Joint Fundraising Committee (JFC) that splits contributions between the candidate, the party committee, and other recipients. The library handles this automatically — it walks the committee graph from the principal committee.

### 3. Leadership PACs
Politicians have separate Leadership PACs that fund other candidates, not themselves. The library distinguishes:
- **Principal campaign committee** — funds the politician's own campaign
- **Leadership PAC** — politician's vehicle for funding others

The "Top Donors" UI reflects the principal committee. The Leadership PAC data is separately accessible if needed (Phase 2+).

### 4. State-level limitations
The FEC only covers federal candidates. For governors, state senators, mayors, etc., the library returns `donor_profile: 'unknown'` until state-adapter integration is built per state.

### 5. Pre-2002 records
FEC bulk data starts ~2002. Pre-2002 politicians (older retirees) won't have rich donor records. Acceptable for our use case.

---

## Performance Notes

- A full senator sync (100 senators × 6 API calls × ~150ms per call with cache misses) takes ~90 seconds wall-clock when fully uncached
- With file cache enabled, repeat syncs are ~10x faster (warm cache hits)
- Memory footprint: <50MB per sync run
- DB write footprint: ~3000 rows per full senator sync (100 politicians × ~30 rows)

---

## Open Questions for Each Consumer

When you wire up a consumer, the project should decide:

1. **Refresh cadence:** monthly cron? Real-time? Hybrid?
2. **Stale tolerance:** how out-of-date is acceptable? (30 days recommended for non-election periods)
3. **Display granularity:** top 10 donors? Top 50? Industry rollups only? (UI density tradeoff)
4. **Public API exposure:** does the consumer expose any of this data via its own API to third parties? (If yes, OpenSecrets attribution rules apply)
