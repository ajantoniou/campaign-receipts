# FEC Donor Data Integration Plan

**Status:** Spec / not implemented
**Owner:** CampaignReceipts directory
**Goal:** Activate the dormant "Donor" filter on the homepage and add a "Who Funded This Campaign" section to every politician page.

---

## Why This Matters

The SEALED book's most memorable Chapter 1 argument — "the swamp didn't drain, the lobbies got served" — rests on documented donor → policy outcome correlations (Sheldon Adelson $218M lifetime → 3-for-3 AIPAC priorities). Right now the directory shows promise verdicts but not the money trail. Adding FEC donor data per politician:

1. **Doubles the brand promise** — "every promise, every receipt" gains a second meaning (campaign-finance receipts)
2. **Activates the "Donor" filter** currently shown disabled on the homepage
3. **Generates a viral content vector** — "look who funded this senator" is share-bait
4. **Creates the data moat for the $399/mo journalist tier** (Phase 2 monetization)

---

## Data Sources

### Primary: FEC Open API
- **URL:** `https://api.open.fec.gov/v1/`
- **Auth:** Free API key via `https://api.data.gov/signup/` (instant approval)
- **Rate limit:** 1,000 requests/hour at the standard tier; 7,200/hour after upgrade approval
- **Data quality:** Authoritative (it's the agency that receives the filings)
- **Coverage:** All federal candidates + PACs; governors and state offices are NOT in FEC (state-level filings)

### Secondary: OpenSecrets (Center for Responsive Politics)
- **URL:** `https://www.opensecrets.org/api/`
- **Auth:** Free API key (manual approval, usually <48h)
- **Rate limit:** 200 requests/day on free tier
- **Data quality:** FEC data + categorization (industry codes, ideology scores)
- **Coverage:** Same as FEC + lobbying data
- **Note:** Their TOS prohibits redistribution; we use it for derived metrics only

### Strategy
- Use FEC API for raw filings (contributions, expenditures, committees)
- Use OpenSecrets sparingly for industry-categorized roll-ups (their classification is the gold standard)
- For state-level governors/legislators, use state-board-of-elections APIs where available; otherwise leave the donor data sparse for those tiers

---

## Schema Changes

Add three tables to the existing `public` schema (matching the `cr_` prefix convention):

```sql
-- Per-cycle campaign-finance summary
create table public.cr_campaign_finance (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid not null references public.cr_politicians(id) on delete cascade,
  cycle text not null,  -- e.g. '2024', '2018', 'lifetime'
  fec_candidate_id text,
  total_raised numeric(14,2),
  total_spent numeric(14,2),
  cash_on_hand numeric(14,2),
  individual_pct numeric(5,2),  -- percentage from individual contributions
  pac_pct numeric(5,2),
  self_funded_pct numeric(5,2),
  in_state_pct numeric(5,2),
  large_donor_pct numeric(5,2),  -- $200+ contributions
  last_synced_at timestamptz default now(),
  unique (politician_id, cycle)
);

create index idx_cf_politician on public.cr_campaign_finance (politician_id);

-- Top donors per politician per cycle
create table public.cr_top_donors (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid not null references public.cr_politicians(id) on delete cascade,
  cycle text not null,
  rank int not null,  -- 1 = top donor
  donor_name text not null,
  donor_employer text,
  donor_occupation text,
  total_contributed numeric(12,2),
  is_pac boolean default false,
  is_individual boolean default false,
  industry_code text,  -- OpenSecrets industry code if known
  industry_label text  -- e.g., "Securities & Investment", "Oil & Gas"
);

create index idx_top_donors_pol on public.cr_top_donors (politician_id, cycle, rank);

-- Industry breakdown per politician per cycle
create table public.cr_industry_breakdown (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid not null references public.cr_politicians(id) on delete cascade,
  cycle text not null,
  industry_code text not null,
  industry_label text not null,
  total_contributions numeric(12,2),
  rank int  -- 1 = highest-contributing industry
);

create index idx_industry_pol on public.cr_industry_breakdown (politician_id, cycle, rank);
```

Also extend `cr_politicians` with a donor-funding-profile label for the homepage filter:

```sql
alter table public.cr_politicians
  add column if not exists donor_profile text
  check (donor_profile in ('grassroots', 'mixed', 'corporate', 'self-funded', 'unknown'));
```

`donor_profile` classification rules (computed during sync):
- **grassroots**: individual_pct ≥ 70% AND large_donor_pct ≤ 50%
- **corporate**: pac_pct ≥ 30% OR top-3 industries are corporate sectors
- **self-funded**: self_funded_pct ≥ 25%
- **mixed**: anything else
- **unknown**: no FEC data (state-level politicians or pre-FEC)

---

## Sync Pipeline

A Node script in `/scripts/sync-fec.mjs` that runs:

1. **For each federal politician in `cr_politicians`:**
   - Look up FEC candidate ID by name + state + office (cache result)
   - Fetch `/v1/candidate/{id}/totals/?cycle={cycle}` for each cycle of their tenure
   - Fetch `/v1/candidate/{id}/committees/` to find their principal campaign committee
   - From the committee, fetch `/v1/schedules/schedule_a/by_size/by_candidate/` for individual-contribution size bucketing
   - From the committee, fetch top contributors via paginated `/v1/schedules/schedule_a/by_contributor/`
   - Compute industry rollups (cross-reference OpenSecrets industry codes by donor employer if available)

2. **For each cycle, upsert:**
   - One row in `cr_campaign_finance` with totals and percentages
   - Top 10 rows in `cr_top_donors`
   - Top 10 rows in `cr_industry_breakdown`

3. **Recompute donor_profile** on `cr_politicians` based on rules above

4. **For state-level politicians (governors, future state legislators):** mark `donor_profile = 'unknown'` until state-API integrations are built

### Rate-limit budget

- 100 senators × ~6 API calls per sync (cycle, committee, contributions, donors, industry) = 600 calls
- Comfortably under the 1,000/hour FEC limit at the free tier
- One full sync of all 100 senators ≈ 15-20 minutes wall-clock

### Refresh cadence

- **Monthly** for incumbents (FEC filing deadlines are quarterly; monthly catches everything within a deadline)
- **Daily** during 30 days before an election for the candidates in that race
- **Once** for politicians no longer in federal office (their FEC data is final)

---

## UI Changes

### Homepage filter
Replace the disabled "Donor (soon)" select with active options:
- All
- Grassroots-funded
- Corporate-funded
- Self-funded
- Mixed

Wire to filter on `cr_politicians.donor_profile`.

### Politician page — new "Who Funded This Campaign" section
Place between the scorecard and the Featured Four section. Layout:

```
WHO FUNDED THIS CAMPAIGN                                  [2024 cycle ▾]

┌─────────────────────────┬────────────────────────────────────────────┐
│  $12.4M                 │  Top 10 Donors                             │
│  total raised           │  1. Sheldon Adelson · $5M · Casinos       │
│                         │  2. Charles Koch · $3M · Oil & Gas        │
│  87% individual         │  ...                                       │
│  11% PAC                ├────────────────────────────────────────────┤
│  2% self-funded         │  Top Industries                            │
│                         │  • Securities & Investment · $1.8M         │
│  Profile: corporate     │  • Oil & Gas · $1.2M                       │
│                         │  • Real Estate · $0.9M                     │
└─────────────────────────┴────────────────────────────────────────────┘

  Did Sen. X vote with these donors' interests?
  [Compare promises by category →]
```

Killer feature: a button on the donor block linking to a filter view that shows promises by category, sortable next to the donor industries. Lets readers draw their own conclusions about money → policy alignment.

---

## Effort Estimate

- Schema migration: 30 minutes
- Sync script (FEC API client + name-matching + rate-limited fetcher): 4-6 hours
- UI changes (homepage filter + politician-page donor section): 2-3 hours
- Manual matching of 100 senators to FEC candidate IDs (name disambiguation): 1-2 hours
- Total: ~1 working day

## Cost

- FEC API: free
- OpenSecrets API: free (with rate limits we won't hit)
- Storage: negligible (10s of MB)
- Cron job for monthly refresh: free on Render (existing cron infrastructure)

---

## Phasing

**Phase 1 (this session or next):**
- Schema migration
- Sync script for senators only (100 politicians)
- UI: activate filter, add basic donor section to politician pages

**Phase 2:**
- House members (~440 politicians)
- Governors (state-level data sources — variable quality)

**Phase 3:**
- State legislators (Phase 3 territory generally — state-API patchwork)
- OpenSecrets enrichment for full industry classification

**Phase 4 (future):**
- "Vote-vs-Donor" correlation visualizations (the actual killer feature for the journalist tier)
- API endpoint exposing donor-promise correlations (paid tier monetization vector)

---

## Risk / Open Questions

- **Name disambiguation:** FEC candidate IDs are best looked up by `name + state + office_sought`. Some senators have multiple FEC IDs across decades (different committees over time). The sync script needs careful matching logic.
- **Industry classification:** OpenSecrets has the canonical industry codes, but their TOS restricts redistribution. We use their classification at sync time but don't expose their proprietary data fields — only the derived rollup totals.
- **Recency:** FEC data lags real-time donations by 30-90 days (filing deadlines). Acceptable for our use case but worth surfacing on the UI.
