# Campaign Receipts — Handoff (2026-06-04)

Context handoff for continuing in Codex. Everything below is **merged to `main`
and deployed to production** (Render auto-deploys CR on push to main) unless
marked otherwise. Repo: `github.com/ajantoniou/agentcompanies`, CR lives at
`companies/campaign-receipts/`.

---

## What shipped this session (all live in prod)

### SEO (PRs #53, #57, #58, #59 — merged + deployed)
- Sitemap now emits races / bills / articles / receipts / **51 states** + index
  pages — prod sitemap went **828 → 1,238 URLs**.
- Structured data live: `Person` (politician), `Article`, `Legislation` (bill),
  `Organization`+`WebSite`+`SearchAction` (home), plus `Dataset` (pre-existing).
- Canonicals on dynamic + query-param pages; keyword titles on hub pages.
- "Who funds [name]?" section + related-articles/related-politicians internal
  linking on politician pages.
- Strategy: `eng/SEO-STRATEGY-2026-06.md`. Measurement: `eng/SEO-MEASUREMENT-RUNBOOK.md`.

### SEO measurement
- **GSC automation is BLOCKED by a confirmed Google bug** ("email not found" when
  adding a service account — Google-acknowledged, not our setup). `scripts/gsc-report.mjs`
  (zero-dep, auth path verified) is in-repo, dormant, ready when Google fixes it.
- **Working alternative:** a weekly remote routine `weekly-seo-rank-check`
  (claude.ai/code/routines/trig_01V6fL5SK7Wsnx4si3YwqzdR) runs web-search rank
  checks across all 5 portfolio sites every Mon 9am ET, pushes a branch +
  appends to `shared/monitoring/SEO-RANK-CHECKS-PORTFOLIO.md`. First baseline
  captured: everything "not ranking" yet (pages indexed only hours earlier).

### Dashboard (PR #53 + follow-ups — merged)
- Full 20-point overhaul: comp-user fixes, paper-receipt design, plain-English
  copy, monetization (first-run hero, low-credits states, cross-sell), security
  hardening (`fromUser` tenant guard, atomic magic-link consume).

### Nav + ZIP fix (PR #60 — merged + deployed)
- **Login/Dashboard button**: `app/components/AuthNavButton.tsx` (client) +
  `app/api/me` ({loggedIn} only). Layout stays static (no cookies() in layout)
  → SEO/caching preserved. Wired into desktop nav + MobileNav.
- **ZIP "your reps" bug fixed**: `/api/reps` kept only `Sitting%` officeholders
  + dedups by branch+state+lastname; deleted duplicate `josh-stein-gov` DB row
  + removed from `scripts/generate-bulk-profiles.mjs`; "Federal reps" →
  "Your reps". NC now returns the correct 6.

### Donor-intelligence Phase 1 CORE (PR #61 — merged + deployed)
- **`lib/donor-score.ts`** (new): `corporateFundedScore(cf)` (0–100 from
  `pac_pct`+`large_donor_pct`) and `donorHeadline(cf, donorProfile)` → the
  "Money headline" (label + value + `$raised`). Returns `null` when no usable
  finance row so callers fall back to the promise stat (never empty).
- **`/api/reps`** embeds `cr_campaign_finance` and attaches `donorHeadline`.
- **`FindYourReps`** (homepage widget) now LEADS with the donor headline.
- Verified live: NC reps show "Corporate-funded: 60/100 · $1.9M raised" with
  correct promise fallback.

---

## NEXT STEPS for Codex (donor-intelligence Phases 1-finish → 3)

Source of truth: **`eng/DONOR-INTELLIGENCE-REPOSITIONING-PLAN.md`** (read it). The
lead-metric helper (`lib/donor-score.ts`) is already built and proven — reuse it
everywhere.

### Phase 1 — FINISH (render-layer, no new data, no FEC spend)
The helper exists; these surfaces still show "% kept" and need the same swap:
1. **Politician masthead** — `app/politician/[slug]/page.tsx`. The masthead
   Receipt's "Headline number" (~line 486) is `scorecard_percentage_kept`. Swap
   to `donorHeadline()` as the lead; demote the promise scorecard Receipt
   (~lines 403–459) to a secondary section.
   ⚠️ **DO NOT TOUCH the Trump SEALED gate**: `isSealedTrump = slug ===
   'donald-trump-2016' || slug === 'donald-trump'` (~line 217) and the
   `SealedLockedPromises` paywall (~line 939+) are the paid-book funnel. Keep
   the full promise scorecard rendering for those two slugs unchanged — branch
   on the existing slug check.
   The page does NOT yet fetch `cr_campaign_finance` — add it to `getData()`
   (embed like `/api/reps` does).
2. **Directory cards** — `app/directory/page.tsx` — same lead-stat swap.
3. **Unpaywall the dossier headline + cross-links FREE on the politician page**
   — engine is `lib/dossier.ts` (already computes "this PAC also funds X" +
   themes); today it's behind the `/investigate` paywall. Surface the headline +
   a few cross-links on-page. Only ~42 pols have PAC data today (see Phase 3 #2).
4. Route every industry surface through `filterRealIndustries()` (`lib/fec-industry.ts`)
   with the NULL-industry fallback.

### Phase 2 — ZIP programmatic SEO (`/zip/[zip]`)
- New table `cr_zip_districts (zip, state, district)` from the Census ZCTA→CD
  crosswalk (free). `cr_politicians.district` is populated for 237 House members.
- `app/zip/[zip]/page.tsx`, `export const revalidate = 86400` (on-demand ISR,
  NOT pre-built static — founder requirement). Lead with the donor "Money
  headline" per rep + the cross-link hook.
- **Thin-content discipline (make-or-break):** index ONLY district-resolved ZIPs
  whose reps have real FEC data; `noindex` state-level (Tier-1) ZIPs. Add
  resolved ZIPs to `app/sitemap.ts` (already dynamic). See plan Part 3e.

### Phase 3 — deeper history + connections (needs data work)
1. **PAC backfill** — `scripts/fec-pac-contributions.mjs` for all 304 pols
   (currently 42). **Needs a real `FEC_API_KEY`** (free from api.open.fec.gov).
2. **Donor-vote alignment** — expand `cr_bill_industry_positions` (32→200+
   bills) then re-run `scripts/compute-alignment.mjs`. Currently only 9 pols
   have alignment — that's why it's NOT the launch lead metric.
3. Multi-cycle donor history (backfill 2018/2020/2022) — data is ~1 cycle (2024)
   deep today. **Don't market "deeper history" until this runs.**

### Known data landmines (the plan's Part 1d — design around these)
- `cr_campaign_finance.in_state_pct` is **all zeros** → "% out-of-state money"
  angle is NOT backed by data; needs a sync fix first.
- Donor history is ~1 cycle (2024); 2022 partial.
- PAC cross-links: 42/304 pols until the backfill runs.

---

## Founder decisions still open
- Greenlight Phases 2 & 3 (Phase 1-finish is safe to proceed).
- Whether to fully kill the promise framing for non-Trump pols (currently:
  demote, not remove — preserves SEALED cross-links). Founder call per plan Part 4.
- GSC service-account: blocked on Google's bug; revisit when fixed.
- SerpBear (paid, off-page-1 rank tracking) — deferred; needs a persistent disk
  (Render dashboard, not the API) + a scraping-API signup. GSC/rank-routine
  cover the need for now.

## Build/verify notes
- `npm run build` is `next build` from `companies/campaign-receipts/`. Local
  full builds intermittently OOM in the **static-gen worker** (117 pages) — this
  is an environment memory limit, NOT a code defect; "Compiled successfully" +
  `tsc --noEmit` clean are the reliable signals. Render builds fine.
- Render auto-deploys CR on merge to `main` (`autoDeploy: true`).
