# Donor-Intelligence Repositioning Plan

**Author:** product strategy + data architecture pass
**Date:** 2026-06-03
**Status:** awaiting founder greenlight
**Scope:** reposition campaignreceipts.com away from "promises graded (X% kept)" and toward **donor intelligence** as the core value. Strategy + data-architecture only — no feature code in this doc.

> Every table/column/file cited below was verified against the live Supabase project `agentcompanies` (`jivahkfdkduxasnzpzgx`) and the repo on `2026-06-03`. Numbers are real query results, not estimates. Where data does NOT exist to back an idea, it is flagged in **bold** — do not ship those without a backfill.

---

## PART 1 — What data do we actually have?

The schema is split across two namespaces:
- `directory.*` — the original promise-tracking schema (migration `001_directory_schema.sql`). Largely legacy; production reads `public.cr_*`.
- `public.cr_*` — the live tables. **The donor/FEC tables are NOT in `supabase/migrations/`** — they were created out-of-band (via the FEC sync scripts / MCP), so the migrations folder under-represents the real schema. Source of truth is the live DB + the `scripts/*.mjs` that write them.

### 1a. Donor / FEC tables that already exist (live row counts)

| Table | Rows | Politicians covered | Cycles | What it holds |
|---|---|---|---|---|
| `cr_politicians` | 581 | 581 | — | identity, `district`, `state`, `branch`, `fec_candidate_id`, `bioguide`, `donor_profile` (grassroots/corporate/self-funded/unknown), plus scorecard_* columns |
| `cr_campaign_finance` | 310 | **304** | 2022, 2024 | `total_raised`, `total_spent`, `cash_on_hand`, `individual_pct`, `pac_pct`, `self_funded_pct`, `in_state_pct`, `large_donor_pct` — **all 310 rows 100% populated** |
| `cr_industry_breakdown` | 494 | **269** | 2022, 2024 | per-politician top industries: `industry_label`, `industry_code`, `total_contributions`, `rank` |
| `cr_top_donors` | 5,153 | **270** | **2024 only** | named donors: `donor_name`, `donor_employer`, `donor_occupation`, `total_contributed`, `is_pac`, `is_individual`, `industry_label`, `rank` |
| `cr_pac_contributions` | 7,885 | **42** | **2024 only** | THE CROSS-POLITICIAN SPINE. `committee_id` (FEC) → `politician_id`, `total_amount`, `contribution_count`. A PAC's committee_id recurs on every candidate it funds — this is the join for "this PAC also funds X". |
| `cr_committees` | 2,277 | 2,277 committees | — | PAC metadata: `name`, `committee_type`, `is_leadership_pac`, `industry_label`, `connected_org_name`, `funders_summary` |
| `cr_donor_vote_alignment` | **44** | **9** | — | the marquee donor→vote connection: `alignment_score` (+1/-1), `vote`, `industry_position`, `total_from_industry`. **Barely computed — 9 politicians.** |
| `cr_bill_money_trail` | 1,621 | 266 bills | — | coalition money: `total_from_industry`, `lead_sponsor_total`, `coalition_total`, `n_coalition`, `coalition_kind` (yes_voters/cosponsors/sponsor) |
| `cr_bill_industry_positions` | **48** | 32 bills | — | which industries support/oppose a bill (the input to alignment). **Thin — 32 bills.** |
| `cr_roll_calls` | **136,512** | 206 | — | rich vote record: `congress`, `chamber`, `vote`, `bill_id`, `is_procedural` |
| `cr_bills` | 335 | 335 | — | bill metadata |
| `cr_foreign_donor_records` | **10** | 0 matched | 1996–2024 | hand-curated foreign-tied funding (editorial, not bulk) |
| `cr_dossier_cache` | — | — | — | cached Opus dossiers keyed on `(entity_type, entity_id, inputs_hash)` |

### 1b. How far back does the donor data go?

**X = effectively 1 cycle (2024), with 2022 partially present.**

- `cr_campaign_finance` and `cr_industry_breakdown` carry **2022 + 2024**.
- `cr_top_donors` and `cr_pac_contributions` carry **2024 only**.
- The FEC sync scripts default to a single cycle. `scripts/fec-sync.mjs` and `scripts/fec-pac-contributions.mjs` both accept a `--cycle` flag (default `2024`), so **deeper history is a re-run, not new code** — the bottleneck is FEC API rate budget and the politician↔FEC-candidate-id mapping, not schema.
- FEC bulk/API data realistically supports back to ~1980 (itemized) / ~1990s (clean), so the founder's "past X years" is achievable for 2018/2020/2022 with backfill runs. **Each added cycle ≈ 3 FEC calls × 304 politicians.** On `DEMO_KEY` that's ~10 pols/hr; with a real `FEC_API_KEY` it's ~330/hr (a few hours per cycle). **The blocker is a real FEC API key, not money** — FEC's API is free.

**Reality check the founder must hear:** "deeper historical connections" is currently 1 cycle deep for named donors and PACs. Marketing "10 years of donor history" today would be false. The honest pitch is "2024 cycle, expanding to 2018–2024" once backfill runs.

### 1c. What "deeper connections" are already computed vs would be new

Already computed (in `lib/dossier.ts`, the `/investigate` engine):
- **donor → industry → vote alignment** — `cr_donor_vote_alignment` (but only 9 politicians).
- **cross-politician PAC networks ("this PAC also funds X")** — `buildCrossLinks()` in `dossier.ts` (lines ~576–600) walks `cr_pac_contributions.committee_id` to find every other tracked politician a committee funds. **Already real**, but only for the 42 politicians with PAC data.
- **bill → coalition money trail** — `cr_bill_money_trail` ("lead sponsor took $5k; the 204 who passed it took $63M"). Computed by `scripts/compute-bill-money-trail.mjs`.
- **multi-cycle / donor-loyalty / concentration themes** — `dossier.ts` `Theme` types (`multi_cycle`, `shared_legislation`, `donor_loyalty`, `concentration`, `industry_cluster`, `party_skew`). Computed deterministically in SQL, narrated by Opus.

NOT yet computed / would be new:
- **donor → multiple politicians at scale** — exists for 42 pols; needs the PAC backfill to cover all 304.
- **donor → bill OUTCOME** (did the bill the donor's industry wanted actually pass?) — `cr_bill_money_trail` has the money but not the enacted/failed outcome joined in.
- **cross-cycle donor persistence** (same donor, multiple cycles) — needs >1 cycle in `cr_top_donors`/`cr_pac_contributions` (today: 2024 only).
- **individual mega-donor → race networks** — only hand-curated in `lib/big-donor-stories.ts` (Adelson, Yass, etc.), not data-driven.

### 1d. Known data-quality landmines (must design around)

1. **`in_state_pct` is 0.00 for EVERY row.** Verified: a "% of money from out-of-state" lead metric is **NOT backed by data today**. The column exists but the sync never populated it. Do not use as a lead stat until backfilled.
2. **"Individual / Retired" FEC bucketing artifact.** ~70% of politicians show this as their top "industry." Already centralized in `lib/fec-industry.ts` (`isFecArtifact()`, `filterRealIndustries()`). The `InfluenceMap` component was *reverted* on the politician page (page.tsx lines 557–570) specifically because this artifact made every dossier look sloppy. **Any donor-industry lead metric MUST run through `filterRealIndustries()`.**
3. **After filtering, some big names have NO real industry** (Biden, Sherrod Brown returned NULL top-real-industry — their money is overwhelmingly small-dollar individual). The lead metric must degrade gracefully to a non-industry stat.
4. **Coverage gap:** only Senate (69/113) + House (197–199/258) have FEC data. Governors, mayors, "Other" (state legislators), and most Presidents have ZERO donor data. A donor-lead card can't be the universal default — needs a fallback for the ~277 politicians with no FEC row.

---

## PART 2 — The repositioning

### 2a. Lead metric to REPLACE "X% kept · N graded"

**Recommendation: a two-line "Money headline" that leads with `total_raised` + a corporate-vs-grassroots signal, with the top real industry as the second line. Promise % moves to a secondary stat.**

Ranked candidates (all from `cr_campaign_finance`, 100% populated for the 304 covered pols):

| Lead metric | Column(s) | Verdict |
|---|---|---|
| **PAC / corporate-funded score** | `pac_pct` + `large_donor_pct` (derive a 0–100 "corporate-funded score") | **PRIMARY.** Real, populated, on-brand ("who funds them"). Already the basis of the existing `/leaderboard?tab=most-corporate-funded`. |
| **Top industry: $X** | `cr_industry_breakdown` top row via `filterRealIndustries()` | **SECONDARY line.** Strong when present; must fall back when NULL (see landmine #3). |
| **Total raised** | `total_raised` | **Context number**, not the headline alone (a big number isn't a finding). |
| **Grassroots score** | `individual_pct` (small-dollar share) | Good inverse framing for the grassroots-funded cohort. |
| **Self-funded** | `self_funded_pct` | Niche; use only when meaningfully > 0. |
| **% out-of-state** | `in_state_pct` | **DO NOT USE — column is all zeros.** Requires backfill first. |
| **Donor-vote alignment score** | `cr_donor_vote_alignment.alignment_score` | **DO NOT USE as a universal lead — only 9 politicians.** It's the *aspirational* headline; promote it as the lead only after the alignment backfill (Phase 3). |

**Concrete lead-card spec (the swap):**
- **Line 1 (headline):** a derived `corporate_funded_score` = function of `pac_pct` + `large_donor_pct`, rendered as a labeled band ("Corporate-funded · 72/100" / "Grassroots-funded · 81% small-dollar"). Reuse the existing `donor_profile` enum (`corporate`/`grassroots`/`self-funded`) already on `cr_politicians` and already rendered as `DonorProfileTag` (page.tsx line 1049) for the color/label.
- **Line 2 (the so-what):** `Top funder: {top_real_industry} · ${total}` from `cr_industry_breakdown` filtered. If NULL → `"{individual_pct}% small-dollar"`.
- **Fallback (no FEC row):** keep the promise/tracking stat for the ~277 politicians with no donor data, so cards never render empty.

This is a **render-layer swap using existing, populated columns** — no new computation for Phase 1. The card components already exist: `FindYourReps.tsx`, the directory cards, and the politician masthead all currently show `scorecard_percentage_kept`; they swap to the money headline.

### 2b. What happens to the promise scorecard

**Demote, do not remove.** Reasons:
1. **The SEALED gate must not break.** In `app/politician/[slug]/page.tsx` the gate keys purely on slug: `isSealedTrump = slug === 'donald-trump-2016' || slug === 'donald-trump'` (line 217). The Trump promise scorecard + the `SealedLockedPromises` paywall wall (lines 939+) is the paid book funnel. **Keep the full promise scorecard rendering for the two Trump slugs unchanged.** The repositioning is a default-view change for everyone else, with a slug-level exception for Trump (mirrors the existing pattern).
2. For all other politicians: keep the promise data, but move it below the donor intel. The scorecard `Receipt` (page.tsx lines 403–459) stops being the masthead share-asset; the donor "Money headline" Receipt takes that slot. Promise scorecard becomes a secondary section / tab.
3. Brand consistency: "Campaign Receipts" still works — a *receipt* now means a money receipt first, a promise receipt second. The `Receipt`/`Stamp`/`Tag` component vocabulary (from `app/components/cr` + the agent-companies-design skill) carries over directly.

**Do NOT** kill the promise framing entirely — that is a founder decision (flagged in Part 4) and it would orphan the SEALED funnel's non-Trump cross-links.

### 2c. Donor-intelligence deepening features — ranked by impact vs effort

| # | Feature | Impact | Effort | Data status |
|---|---|---|---|---|
| 1 | **Surface the connection-matrix dossier (`/investigate`) on the FREE politician page** — the `cross_links` ("this PAC also funds X") + themes are already computed in `dossier.ts`; today they're paywalled. Show the *headline* (free) + a few cross-links on-page. | HIGH | LOW | Engine exists; only 42 pols have PAC data → expand via Phase-3 backfill |
| 2 | **PAC backfill: run `fec-pac-contributions.mjs` for all 304 pols (currently 42)** — unlocks cross-politician networks site-wide. | HIGH | LOW (script exists, needs FEC key + runtime) | New data, existing script |
| 3 | **Donor-vote alignment backfill: expand `cr_bill_industry_positions` (32→200+ bills) then re-run `compute-alignment.mjs`** — turns the 9-politician alignment table into a real lead metric. | HIGH | MED (industry positions are partly editorial/AI-tagged) | `compute-alignment.mjs` ready; needs more `cr_bill_industry_positions` |
| 4 | **Bill → outcome money trail** — join enacted/failed status into `cr_bill_money_trail` so "the coalition that took $63M and it passed" is complete. | MED | MED | money exists; needs bill outcome field |
| 5 | **Multi-cycle donor history** — backfill 2018/2020/2022 into `cr_top_donors` + `cr_pac_contributions`, enabling the `multi_cycle`/`donor_loyalty` themes already coded in `dossier.ts`. | MED | MED (rate budget) | schema + theme code ready; data is 1 cycle |
| 6 | **Data-driven mega-donor pages** (individuals, not just PACs) — generalize `lib/big-donor-stories.ts` from hand-curated to `cr_top_donors`-driven. | MED | HIGH | needs individual-donor aggregation across politicians |
| 7 | **Fix `in_state_pct` backfill** — unlock the "% out-of-state money" angle. | LOW-MED | LOW (one sync fix) | column broken/empty |

The cheapest high-impact move is **#1 + #2 together**: the dossier engine already computes the deep connections; it just needs (a) the PAC data for more than 42 politicians and (b) a free on-page surface for the headline + cross-links.

---

## PART 3 — ZIP-code programmatic SEO

### 3a. The current reality (what the homepage widget actually does)

`app/components/FindYourReps.tsx` + `app/api/reps/route.ts`:
- ZIP → **state only**, via a `ZIP3_TO_STATE` map (first 3 digits → state). House reps are **explicitly deferred** in both files with the comment "House reps require ZIP→district census data."
- `/api/reps?state=XX` returns Senate + Governor + House for the *whole state* (not district-resolved), capped at 6.

So today a ZIP page can honestly show: **2 senators + governor + (state's House delegation)**, but cannot pinpoint the single House member for that ZIP without a ZIP→district crosswalk.

### 3b. Does the data support district-level resolution?

**Partially — and enough to ship.**
- `cr_politicians.district` is populated for **245 House members**, **237 with numeric districts** (e.g. `MO-01`). So once we know a ZIP's district, we CAN resolve the exact House rep.
- What's missing is the **ZIP → congressional-district crosswalk**. This is a free, well-known dataset (Census ZCTA→CD relationship file, or the HUD USPS ZIP–CD crosswalk). A ZIP can map to >1 district (split ZIPs), which the page must handle by listing all matches.

**Recommendation:** ship `/zip/[zip]` in two honest tiers:
- **Tier 1 (launch, no crosswalk):** state-level — 2 senators + governor + "your state's House delegation (N members)." This is what `/api/reps` already returns. Distinct per state, not per ZIP → **thin-content risk is real here** (see 3e).
- **Tier 2 (after Census crosswalk load):** district-level — the exact House rep + 2 senators + governor. This makes each ZIP page genuinely distinct and is the version worth indexing at scale.

### 3c. Route design (on-demand rendered, not static files)

```
app/zip/[zip]/page.tsx
  export const dynamic = 'force-dynamic'   // or revalidate = 86400 for ISR cache
```

- On request: validate 5-digit ZIP → resolve state (reuse `ZIP3_TO_STATE`, but full 5-digit precision) and, in Tier 2, district via the crosswalk table.
- Query `cr_politicians` for the matched reps, then their `cr_campaign_finance` + filtered `cr_industry_breakdown` rows.
- **On-demand render + ISR** (`revalidate = 86400`) gives Google a real URL per ZIP without pre-building ~41,000 static files. This matches the founder's "on-demand-rendered indexable, not pre-built static" requirement and mirrors the existing `force-dynamic` pattern on the politician page.
- Crosswalk lives in a new table `cr_zip_districts (zip text, state text, district text, primary key (zip, district))` loaded once from the Census file. (This is the only new table ZIP SEO needs.)

### 3d. What each ZIP page LEADS with (donor intel, per the reposition)

Lead, in order:
1. **"Who funds your reps"** — for each resolved rep, the Part-2 Money headline (corporate-funded score + top real industry + total raised). This is the distinct, valuable, donor-first content.
2. **The cross-link hook** — "Your senator's #1 PAC, {name}, also funds {N} other members of Congress →" (from `cr_pac_contributions` cross-links). High shareability, high distinctness.
3. Promise/tracking stat as a secondary line per rep.
4. CTA: newsletter ("watch the money for your district") + `/investigate` upsell.

### 3e. Thin-content risk — the make-or-break

Programmatic ZIP pages are a known Google thin-content trap. Mitigations, in priority:
- **Ship Tier 2 (district-level) for the indexed set.** Tier-1 state-level pages are near-duplicates (every CA ZIP shows the same 2 senators) → either `noindex` Tier-1 ZIPs and only index one canonical state page, OR gate sitemap inclusion on district resolution.
- **Distinct data per page is mandatory.** Each ZIP page must render *real numbers* (this rep's actual `pac_pct`, actual top donor, actual cross-links), not a template wrapper. The donor headline + cross-links provide this naturally — a NY-12 page and an NY-10 page show different House members with different funders.
- **Canonical + sitemap discipline.** Add ZIP pages to `app/sitemap.ts` (already dynamic, revalidate 3600) ONLY for ZIPs that resolve to a district with FEC-backed reps. Skip ZIPs whose only reps have no donor data — those would be thin.
- **Don't index 41,000 pages day one.** Start with ZIPs in states/districts where the reps have full `cr_campaign_finance` + `cr_top_donors` coverage. Expand as backfill grows coverage.
- **Internal linking:** each ZIP page links to the full `/politician/[slug]` dossiers and the `/leaderboard?tab=most-corporate-funded`, giving crawl depth and avoiding orphan pages.

---

## PART 4 — Phased build plan

### Phase 1 — Visible metric swap (existing data, no backfill) — ships first
**Goal:** the site *reads* as donor intelligence using only the 100%-populated `cr_campaign_finance` columns.
1. Define a `corporate_funded_score` helper (pure function of `pac_pct` + `large_donor_pct`) — new `lib/donor-score.ts`, mirroring `lib/fec-industry.ts` conventions.
2. Swap the lead stat on: `FindYourReps.tsx`, directory cards, and the `app/politician/[slug]/page.tsx` masthead → Money headline. Keep the promise scorecard as a demoted secondary section.
3. **Preserve the SEALED gate verbatim** for `donald-trump` / `donald-trump-2016` (slug branch already isolates this).
4. Run every industry surface through `filterRealIndustries()`; implement the NULL-industry fallback.
5. Surface the existing `/investigate` dossier *headline* + cross-links FREE on the politician page (engine already exists; just unpaywall the headline for the 42 pols that have PAC data).
- **No new data required. No FEC spend.** Pure render-layer + one helper.

### Phase 2 — ZIP programmatic SEO — ships second
1. Load the Census ZCTA→CD crosswalk into a new `cr_zip_districts` table (one-time).
2. Build `app/zip/[zip]/page.tsx` (on-demand + ISR), donor-intel-led per Part 3d.
3. Reuse/extend `/api/reps` for district-aware resolution.
4. Add district-resolved ZIPs to `app/sitemap.ts`; `noindex` thin Tier-1 ZIPs.

### Phase 3 — Deeper history + connections + FEC backfill — ships third
1. **PAC backfill** — run `scripts/fec-pac-contributions.mjs` for all 304 pols (42 → 304). Unlocks cross-politician networks site-wide. *Needs a real FEC_API_KEY.*
2. **Alignment backfill** — expand `cr_bill_industry_positions` (32 → 200+ bills), re-run `compute-alignment.mjs`. Turns the 9-pol alignment table into a real lead metric; then promote donor-vote alignment to a headline stat.
3. **Multi-cycle backfill** — run `fec-sync.mjs --cycle 2022/2020/2018` for `cr_top_donors` + PAC. Enables the `multi_cycle`/`donor_loyalty` dossier themes (code already exists).
4. **Bill outcome** — add enacted/failed to `cr_bill_money_trail` joins.
5. **Fix `in_state_pct`** in the sync, then add "% out-of-state money" as a lead-metric option.

### Founder decisions required (flag before build)
- [ ] **Kill vs demote the promise framing.** Recommendation: demote, keep for SEALED funnel. Founder confirms we don't fully remove "X% kept."
- [ ] **FEC API key.** Phase 3 backfills need a real key (free from FEC). On `DEMO_KEY` the backfill is unworkably slow. No dollar cost, but someone must register the key.
- [ ] **"Deeper history" honesty.** Today data is ~1 cycle (2024) for donors/PACs. Marketing must not claim multi-year history until Phase 3 backfill lands. Confirm messaging.
- [ ] **ZIP index scale.** Confirm we ship district-level (Tier 2) before indexing at scale, and `noindex` thin state-level pages — vs. accepting Tier-1 state-level as the v1.
- [ ] **Donor-vote alignment as the lead metric** is the most editorially powerful framing ("they voted with their donors 9 of 10 times") but is the least-covered data (9 pols). Confirm it stays Phase 3, not Phase 1.

---

## Appendix — key files

- Politician page + SEALED gate: `app/politician/[slug]/page.tsx` (gate line 217; donor surfaces lines 539–576; reverted InfluenceMap note lines 557–570)
- ZIP/reps widget: `app/components/FindYourReps.tsx`, `app/api/reps/route.ts`
- Connection-matrix dossier engine: `lib/dossier.ts` (cross-links ~576–600; themes ~190–240)
- FEC artifact filter: `lib/fec-industry.ts`
- FEC sync (cycle-parametrized): `scripts/fec-sync.mjs`, `scripts/fec-pac-contributions.mjs`
- Connection compute: `scripts/compute-alignment.mjs`, `scripts/compute-bill-money-trail.mjs`
- Curated mega-donor map: `lib/big-donor-stories.ts`, `app/big-donor-map/`
- Pro tier / entitlement: `lib/pro-data.ts`, `lib/entitlement.ts`
- Sitemap (dynamic): `app/sitemap.ts`
- Leaderboard donor tab (already exists): `/leaderboard?tab=most-corporate-funded`
