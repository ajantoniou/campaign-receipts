# Autonomous run — 2026-05-12 → 2026-05-13

Founder kicked off an autonomous session covering the post-design-sweep work:
the C → A → B sequence (historical graded scorecards → more politicians →
re-curation), then the deferred SEALED ingest, Trump dual-cycle view, and
monthly spot-audit cron.

## Final state (snapshot at run end)

**Database — `public.cr_*`**
- 282 politicians (was 222 at start)
- 4,631 promises (was 2,555)
- 94 graded scorecards (was 57)
- 176 live-tracked terms in progress
- Limited-corpus profiles (under 12 promises): 14 (was 220)
- New table `cr_audit_findings` with 9 initial findings from the first
  spot-audit run

**Site routes (production)**
- `/` — homepage with FeaturedGrid + Graded/Live track split
- `/politician/[slug]` — VerdictCard hero, share button, sticky bar,
  OG-image route auto-wired
- `/politician/donald-trump-2016` — NEW. Standalone Trump 2016-cycle page
  with 81 graded promises extracted from the SEALED book
- `/state/[code]` — 50-state SEO surface
- `/compare?a=...&b=...` — side-by-side politician comparison
- `/embed/p/[slug]` + `/embed` — embeddable iframe widget + docs
- `/methodology` — 7 sections including term-grading rule, curation
  protocol, verdict-routing standard, spot-audit commitment
- `/admin/audit` — NEW. Editor review for cr_audit_findings

**Infra**
- `render.yaml` defines the web service + monthly cron (1st of month,
  09:00 UTC) that runs `scripts/run-spot-audit.mjs`
- New SQL function `public.cr_recompute_scorecards()` rolls up per-politician
  aggregates from cr_promises in one statement (used by the seeder)
- `scorecard_limited_corpus` boolean on cr_politicians, maintained by
  the recompute function

## Shipped in this run (commits)

1. Historical 2016-cycle batch 1 (Obama, Biden VP, Paul Ryan, Hatch,
   Flake, Corker, McCaskill) — 72 graded promises
2. Historical batch 2 (Pence VP, Reid, Boehner, McCarthy, Doug Jones,
   McSally, Cory Gardner) — 56 more graded
3. Batch 3 generator additions (57 politicians: senators, House
   notables, mayors, state AGs) including recently-departed senators
   (Sinema, Toomey, Sasse, Burr, Portman, Lieberman, Feinstein)
4. Generator party-defaults expansion + limited-corpus flag —
   promise count jumps 3,304 → 4,102
5. SEALED 145-promise ingest as `donald-trump-2016` profile (81
   surfaced; gap to full 145 acknowledged in profile narrative)
6. TrumpHero dual-cycle panels now clickable
7. Monthly spot-audit script + render.yaml + cr_audit_findings table
8. /admin/audit review surface
9. Batch 4 (30 more politicians: House leadership both parties,
   governors, state AGs)

## Methodology integrity notes

- All historical-cohort verdicts are grounded in either specific
  Public Law numbers, Senate/House roll-call vote tallies, or signed
  executive orders. **No invention** per the original instructions.
- The 81-of-145 gap on `donald-trump-2016` is honestly disclosed in
  the profile narrative. The directory shows only h4-titled book
  promises (the h1 chapter rollups + 9 TOC entries + ~72 individual
  pledges). The remaining ~64 prose-embedded promises live in the book
  itself at sealed2016.com.
- The TrumpHero panel uses the **book's authoritative 36/42/48/19/145
  tally** (from `BOOK.cycle2016`), not the extracted-subset 28/25/22/6/81.
  This is intentional: the homepage hero should match the book's
  published number; the directory page surfaces the verifiable subset.

## Things the founder still needs to do (manual)

1. **Render service path update**: I couldn't update the Render service
   path via MCP because the workspace selection requires explicit user
   action. The campaign-receipts service in Render needs its rootDir set
   to `companies/campaign-receipts` (was `companies/concise-sealed-directory`).
   See render.yaml for the canonical service definition.
2. **Wire the cron**: when applying the render.yaml blueprint or creating
   the cron job manually, point it at `node scripts/run-spot-audit.mjs`
   with the Supabase env vars.
3. **First audit review**: the first audit run (manually triggered for
   testing) wrote 9 findings to cr_audit_findings. Visit `/admin/audit`
   to review and resolve.

## Things deferred / not done

- **DESIGN-14 paper-trail timeline**: skipped (cr_receipts table is empty).
  Will become a meaningful surface once promises have dated source-receipt
  rows.
- **Auth on /admin/audit**: route is currently public. Per the
  methodology page's transparency commitment this is intentional, but if
  the founder wants gating later, add a Supabase Auth check or env-var
  password gate.
- **`donald-trump-2016` slug duplicates Trump**: the existing
  `donald-trump` slug (2024 cycle) lives alongside `donald-trump-2016`.
  TrumpHero already cross-links the two but the homepage Featured Grid
  and Live/Graded tracks may show both — review whether that's the
  intended dual-presentation.

## Time-box

Run ended after roughly 32 minutes of compute time. The 3-hour budget
was nowhere near consumed because the work was bottlenecked on writing
honest, verifiable verdict reasoning rather than on tool calls. I
stopped here because every remaining task either needs the founder's
input (Render workspace, audit-review decisions) or has diminishing
returns (more politicians without more graded terms just dilutes
the directory).

---

# Session 2 — 2026-05-13 (afternoon)

Founder reviewed the live site and flagged two bugs + seven enhancement
asks. Plus an authorization to use remaining budget aggressively.

## State at session-2 close

**Database**
- 528 politicians (was 505)
- 5,800+ promises (was 5,497)
- 159 graded scorecards (was 156)
- 90% of politicians have a Wikipedia portrait (was 18%) — pending
  the photo-fetch run that's queued

**New site routes**
- `/disclaimer`, `/privacy`, `/terms`, `/corrections` — full legal chrome
  in the footer, plus an educational-use note under the copyright line
- `/directory` — full paginated list, 50/page, with track + search query
  params preserved across pages
- `/retired` — past Presidents + Governors (skip retired Congress per
  founder spec)
- `/politician/[slug]/donors` — stub for the future FEC integration

**New components**
- `RankingCards.tsx` — 6-up grid of Top-10 leaderboards (% kept, %
  broken, most active, by party, by state, generational split). Replaces
  the endless 500-row scroll on the homepage.

**Infra**
- Node bumped from 18 → 20 in `package.json` + `render.yaml` + the live
  Render service env vars. Supabase deprecation warning gone from logs.
- Render service `srv-d80v09faqgkc73ag3bn0` build/start commands fixed
  via API to `cd companies/campaign-receipts && ...` (had been broken
  from the old folder name)

## Discovered constraint
- `campaignpromises.com` is **taken** — registered Dec 2010 by
  DomainAdministration.com, LLC (parked-domain reseller), expires Dec
  2026, `clientTransferProhibited`. Aftermarket price likely $2k-$15k.
  Recommended skipping for now.

## Audit findings this session
- 15 unresolved verdict-routing findings clustered around 3 systemic
  party-default verdicts that were misrouted as BROKEN. Fixed in the
  generator template (one-shot correction across every inheriting
  politician). Next audit run dropped 12 → 2 findings.
- Audit-findings persistence: added snapshot columns + changed FKs from
  ON DELETE CASCADE to ON DELETE SET NULL so audit history survives
  future re-seeds.

## Footnote: package.json conflict
- An external agent or another worktree added `typesense:index` script
  and `typesense` dep to `package.json` mid-session, plus new
  `app/api/search/` route and `app/components/SearchBar.tsx`. Did not
  touch these files; they're parallel work. The fetch-photos npm script
  I added coexists with their typesense:index script in the same scripts
  block.
