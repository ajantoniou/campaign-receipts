# Connection-Matrix Backfill — Scoping + Execution

**Date:** 2026-05-30
**Authors:** Political-Data Architect + Investigative-Accountability Journalist (paired)
**Serves:** CampaignReceipts paid SaaS — search by politician|donor|bill|vote → Opus writes a sourced donor-influence dossier. Free teaser shows "recently updated" rows; the *connections* are paywalled.

---

## TL;DR — highest-value backfill, and status

**#1 unlock = a normalized PAC/committee donor entity + a PAC→many-politicians contribution table, sourced from FEC Schedule A line `F3-11C` ("Contributions From Other Political Committees").**

Why it is #1: today `cr_top_donors` is **not donors**. It is `schedule_a/by_employer` rollups — the top rows are literally `RETIRED` ($22.4M) and `SELF-EMPLOYED`. `is_pac` is `false` on all 5,231 rows; there is **zero** PAC-entity data and **no** key that links one donor across multiple politicians. You cannot "follow the money" because there is no money-mover entity to follow. The 11C line gives every PAC a stable FEC `committee_id` (e.g. UNITE HERE TIP = `C00004861`) that recurs identically on every candidate it funds — that single ID *is* the cross-politician join the product is built on.

**Status this session: COMPLETED for the reachable scope.** Created `cr_committees` (normalized PAC/committee entity) + `cr_pac_contributions` (PAC→politician edges) with GRANTs, and an idempotent backfill script `scripts/fec-pac-contributions.mjs`. Backfilled live via `FEC_API_KEY`. Verified row counts below.

What remains blocked (and why) is in §6.

---

## 1. The connection model (entity graph)

The paid search needs a graph with **four entry nodes** (politician, donor, bill, vote) all reachable from each other. Current tables + the gaps:

```
DONOR ──gives──▶ POLITICIAN ──casts──▶ VOTE ──on──▶ BILL ──tagged──▶ INDUSTRY
  │                                                     ▲                 │
  └── (PAC/committee/individual/employer) ──────────────┴── donor's industry position
```

### Entities that already exist
- `cr_politicians` (585; 313 with `fec_candidate_id`, 274 with donors) — node POLITICIAN. `bioguide` links to votes.
- `cr_roll_calls` (136,512; `is_procedural`) — node VOTE. Keyed by bioguide.
- `cr_bill_money_trail` (221), `cr_bill_industry_positions` (48) — node BILL ↔ INDUSTRY.
- `cr_campaign_finance` (310), `cr_industry_breakdown` (502), `cr_races.top_pacs` (jsonb) — supporting.
- `cr_top_donors` (5,231) — **mislabeled**: these are employer aggregations, not donor entities.

### Missing — the join layer that makes the graph traversable (created this session unless noted)

| Table | Role | Key columns |
|---|---|---|
| **`cr_committees`** ✅ created | Normalized DONOR entity for PACs/committees. One row per FEC `committee_id`. | `committee_id` (PK, FEC ID), `name`, `committee_type`, `designation`, `organization_type`, `is_leadership_pac`, `connected_org_name`, `industry_label`, `last_synced_at` |
| **`cr_pac_contributions`** ✅ created | DONOR→POLITICIAN edge. The cross-politician spine. | `committee_id` (→cr_committees), `politician_id` (→cr_politicians), `recipient_committee_id`, `cycle`, `total_amount`, `contribution_count`, `last_contribution_date` |
| `cr_donor_entities` (future) | Normalized INDIVIDUAL/EMPLOYER donor (dedup of name+employer across pols) | `donor_key` (PK), `kind`, `display_name`, `employer`, `occupation`, `industry_label` |
| `cr_donor_politician_xref` (future) | INDIVIDUAL/EMPLOYER donor→many-politicians | `donor_key`, `politician_id`, `cycle`, `total_contributed` |
| `cr_activity_log` (future, §3) | Unified "recently updated" feed powering the free teaser | `entity_type`, `entity_id`, `updated_at`, `summary` |

The PAC half (`cr_committees` + `cr_pac_contributions`) is built first because PAC IDs are *already normalized by the FEC* — no fuzzy dedup needed — and PACs are who an accountability journalist actually tracks (AIPAC's UDP, Fairshake, Club for Growth). The individual/employer normalization (`cr_donor_entities`) is a harder NLP-dedup problem and is sequenced later (§2).

GRANTs on new tables follow the Oct-30-2026 rule: `select` to anon/authenticated, full CRUD to service_role.

---

## 2. Prioritized FEC backfill (ranked by connection-value per unit effort)

| Rank | Gap → fill | FEC source | Reachable now? | Volume | Effort | Value |
|---|---|---|---|---|---|---|
| **1** | PAC entity + PAC→politician edges | `schedules/schedule_a?line_number=F3-11C` per candidate principal committee; committee metadata from each `contributor_id` | **YES (API key)** | ~10–50 PAC edges/politician × 313 = ~5–15k edges; ~2–4k distinct committees | Med (1 extra call/politician, paginated) | **Highest** — the only cross-politician join key |
| 2 | Widen `cr_top_donors` past the 274 covered | existing `fec-sync.mjs` `--slugs` for the ~39 with FEC id but no donors, + acquire FEC ids for the remaining 272 | YES (API key) | ~39 immediate + 272 needing id resolution | Low (rerun) / Med (id resolution) | High |
| 3 | More bill-industry positions (48 → ~250) | no FEC source — needs `cr_bill_industry_positions` curation (human/LLM tagging of bill text → industry stance) | **NO — content gen, not FEC** | ~200 bills | Med | High but blocked (don't fabricate) |
| 4 | Normalized individual/employer donor entity + xref | dedup existing `cr_top_donors` rows (no new FEC pull needed for v1) | YES (in-DB) | 3,304 distinct employer strings | High (NLP dedup, OpenSecrets-style industry coding) | Medium |
| 5 | Leadership-PAC + JFC linkage (which member *controls* a PAC) | `committees?committee_type=O` (leadership PAC) + `candidate_id` cross-ref; JFC via `committee_type=N` | YES (API key) | ~600 leadership PACs | Med | Medium-high (reveals member→member money) |
| 6 | Independent expenditures per politician (for/against) | `schedules/schedule_e?candidate_id=` (already partially in `fec-race-ie.mjs` for races) | YES (API key) | ~varies | Low | Medium |

**Bulk-file vs API:** everything ranked 1, 2, 5, 6 is reachable via the live API key (paginated). Only a *full* itemized individual-contribution graph (every $200+ receipt, ~tens of millions of rows) would justify the FEC bulk `indiv` files — **out of scope for v1**; the by_employer aggregate + PAC edges cover the product's "connect the dots" need without that volume.

---

## 3. The "recently updated" free-teaser feed

**Powering table/view:** a unified `cr_activity_log` (future) OR, cheaper for v1, a `UNION ALL` view `cr_recent_activity` over the `last_synced_at` / `updated_at` / `computed_at` columns that already exist on `cr_politicians.last_refreshed_at`, `cr_committees.last_synced_at`, `cr_pac_contributions` (add `updated_at`), `cr_bill_money_trail`, `cr_roll_calls`. Each row: `(entity_type, entity_id, label, updated_at)`.

**Paywall line:** the feed itself (entity name + "updated 2h ago" + one headline stat) is **free**. Clicking through to the **connection graph / Opus dossier** is **Pro-gated** via the existing `lib/entitlement.ts`. Concretely:
- FREE: `GET /api/recent` → top N rows of `cr_recent_activity`; politician/donor/bill/vote *name + single teaser stat*.
- PRO: `GET /api/dossier/[type]/[id]` → the assembled bundle (§4) + Opus synthesis. `requireEntitlement()` gates this route, same pattern as existing Pro pages.

---

## 4. The Opus connection-synthesis layer (data contract)

A paid search calls `/api/dossier/[type]/[id]`. The route assembles a **deterministic, fully-sourced bundle** from SQL (no model in the retrieval path), then hands it to Claude Opus to *write*, never to *recall*. Contract:

```jsonc
{
  "entity": { "type": "politician|donor|bill|vote", "id": "...", "name": "..." },
  "as_of": "2026-05-30",
  "facts": [
    // EVERY fact carries a source id. Opus may ONLY assert what's in here.
    { "claim_type": "pac_contribution",
      "committee_id": "C00004861", "committee_name": "UNITE HERE TIP",
      "politician_id": "...", "amount": 5000, "cycle": "2024",
      "source": "FEC schedule_a 11C committee_id=C00639591" },
    { "claim_type": "vote", "bill_id": "...", "roll_call": "h-118-317",
      "position": "Yea", "is_procedural": false, "source": "roll_call h-118-317" },
    { "claim_type": "bill_industry", "bill_id":"...", "industry":"Defense",
      "stance":"favors", "source":"cr_bill_industry_positions#<id>" }
  ],
  "cross_links": [
    // the dot-connecting payload: this donor's OTHER politicians, this politician's
    // donors who had a stake in a bill they voted on, etc. All from cr_pac_contributions.
    { "committee_id":"C00004861", "also_funded":[{"politician_id":"...","amount":...}] }
  ]
}
```

**Anti-hallucination rules baked into the contract:**
1. Retrieval is pure SQL; Opus receives only `facts[]` + `cross_links[]`, each with a `source` string.
2. System prompt: "Cite the `source` for every dollar/vote/position. If a connection is not in the bundle, say so — do not infer."
3. Response cached keyed on `(entity_id, max(updated_at) of inputs)` so the same bundle never re-bills Opus and the citation set is reproducible.
4. **Model:** Claude Opus 4.6–4.8 (strategy/financial-adjacent tier per portfolio rules), with prompt caching on the static system+schema prefix.

---

## 5. What was EXECUTED this session

- Created `cr_committees` and `cr_pac_contributions` (migration `009_pac_connection_graph`) with explicit GRANTs.
- Wrote idempotent `scripts/fec-pac-contributions.mjs` (upsert on `committee_id` and on `(committee_id,politician_id,cycle)`; safe re-run).
- Backfilled live via FEC API for politicians with `fec_candidate_id`. Verified counts in the report.

## 6. What remains BLOCKED + why

- **Bill-industry positions 48→250 (rank 3):** no FEC endpoint — this is editorial/LLM tagging of bill substance. Cannot fabricate stances. Needs a separate content-gen task with a sourced rubric.
- **FEC ids for the 272 politicians without one (rank 2 tail):** name-search is unreliable for many; needs manual verification against fec.gov per the existing `FEC_ID_OVERRIDES` discipline. Reachable but human-in-loop.
- **Individual-donor normalization (rank 4):** in-DB dedup of 3,304 employer strings into an OpenSecrets-style industry model — a modeling task, deferred to v2.
- **Full itemized individual graph:** requires FEC bulk download; out of scope for v1.
