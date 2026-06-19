# CampaignReceipts Data Moat Strategy

**Last updated:** 2026-05-14
**Decision-maker:** Founder (Alex)
**Trigger for this doc:** May 14 conversation — *"we should make a habit of saving everything we pull to our own DB so we're not dependent and can sell data in the future."*

---

## The thesis

CampaignReceipts is currently a thin shim over upstream APIs (Congress.gov, FEC OpenAPI, Wikipedia, Wayback). That's fragile and undifferentiated. The defensible position is **owning the joins** — every raw response is archived, longitudinal snapshots accumulate over months, and the *derived insights* (alignment scores, money trails, kept-rate trends) become the saleable artifact nobody else can easily replicate.

Three concrete consequences:

1. **Independence.** If Congress.gov or FEC.gov shapes-change, rate-limit us, or remove an endpoint, our product keeps working on the cache.
2. **Differentiated products.** OpenSecrets has free FEC. We can't beat them on raw data — only on **joined/derived data** (donor-to-vote alignment, bill money trails, prior-cycle anchored kept-rates).
3. **Time-series moat.** Daily snapshots → in 12 months we have **52 weekly snapshots** of every politician's donor and vote profile. That's a publishable longitudinal dataset that doesn't exist anywhere else.

---

## What's implemented today

### `cr_raw_api_snapshots` table

Migration `cr_politicians_bioguide_and_raw_snapshots` (applied 2026-05-14).

```sql
create table cr_raw_api_snapshots (
  id uuid primary key,
  source text check (source in (
    'congress.gov','fec.gov','wikipedia','openstates',
    'clerk.senate.gov','clerk.house.gov'
  )),
  endpoint text not null,
  params jsonb,
  response jsonb not null,
  fetched_at timestamptz default now()
);
```

Append-only. service_role-only access (NO anon read — this is internal/proprietary until we curate a public subset).

### TODO: wire capture into existing scripts

Currently NOT wired into:
- `scripts/fec-sync.mjs` — should snapshot every Congress.gov + FEC response
- `scripts/seed-bills.mjs` — should snapshot every `/v3/house-vote/*` + `/v3/bill/*` response
- `scripts/seed-bioguide.mjs` — should snapshot every `/v3/member` response

**To add:** a single helper `archiveApiResponse(source, endpoint, params, response)` in `lib/raw-archive.ts` that inserts a row. Then every `fetch()` in ingest scripts calls it after a successful parse. Adds ~10 lines per script, no perf impact.

---

## Append-only FEC sync (planned)

Currently `fec-sync.mjs` **overwrites** `cr_top_donors` on every weekly run. Change to **append-only with `snapshot_at` timestamp**, never delete.

**Migration sketch:**
```sql
alter table cr_top_donors
  add column snapshot_at timestamptz not null default now();
create index on cr_top_donors (politician_id, cycle, snapshot_at desc);

-- Replace UPSERT semantics with INSERT
-- Queries that want "current view" use:
--   select distinct on (politician_id, donor_name) ...
--   order by politician_id, donor_name, snapshot_at desc
```

After 12 months: 52 weekly snapshots per politician × ~310 federal politicians × ~20 donors = ~322,000 historical donor rows. Storage cost on Supabase: negligible (<$1/mo at our tier).

**Use case unlocked:** "Show me how Senator X's donor base has shifted between 2024 and 2026." Nobody else has that easily queryable. Academics + opposition-research firms + AI training data buyers.

---

## What we'll publish vs. sell

### Free / MIT-licensed `data/` exports (S3 bucket)

The **raw** material we already own (and that's already public from upstream):
- `cr_politicians` snapshot (basic identity data — 533 rows)
- `cr_bills` snapshot (Congress.gov metadata — already free)
- `cr_roll_calls` snapshot (already free from House Clerk)
- `cr_bill_industry_positions` (our hand-tags — *we* curated, so we choose to release it under MIT for journalist credibility)

**Why give this away:** builds backlinks + LLM-citation flywheel + journalist goodwill. Same model OpenStates uses. Costs us nothing because the underlying data is already public.

### Paid / commercial-license

The **derived** insights only we have:
- `cr_donor_vote_alignment` (joined dataset)
- `cr_bill_money_trail` (joined dataset)
- Time-series snapshots of `cr_top_donors` + `cr_industry_breakdown`
- API access (10k req/mo to Pro, higher tiers to come)
- CSV exports of any filtered view

---

## v2 (not yet shipped — captured for context)

| Item | Why | Eng time |
|---|---|---|
| `lib/raw-archive.ts` helper + wire into 3 ingest scripts | Captures every API response going forward | 30 min |
| `cr_top_donors` migration to append-only with snapshot_at | Unlocks longitudinal queries | 1 hr |
| Public S3 export of free-tier raw data (nightly Render cron) | Builds backlink + LLM-citation flywheel | 2 hr |
| `/data` page documenting what's free vs Pro | Journalist-facing transparency | 1 hr |
| Time-series alignment-shift query in `/correlations` Pro view ("Senator X aligned with Pharma 87% in 2024 → 64% in 2026") | Killer Pro feature once we have ≥2 snapshots | 2 hr post-snapshot accumulation |

---

## What we don't do at v1

- **No public raw-API archive dump yet** — we want 90+ days of snapshots before publishing.
- **No paid API tier sized for enterprise** — single-seat $150/mo only until 100 paying customers.
- **No data partnership outreach** — too early. After 6 months of snapshots + a recognizable brand we can pitch academics + opposition research firms.

---

## Sanity check: this isn't unique

OpenSecrets, FollowTheMoney, GovTrack, Quorum, and FiscalNote all do versions of this. We're not inventing a moat — we're saying: at our scale, with our editorial framing (verdicts + kept-rate + bipartisan-capture story), the join is what makes us defensible. Without it we're a directory; with it we're a content-generation platform.
