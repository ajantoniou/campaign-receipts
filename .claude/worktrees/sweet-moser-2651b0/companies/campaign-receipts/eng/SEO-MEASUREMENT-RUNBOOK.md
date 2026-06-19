# Campaign Receipts — SEO Measurement Runbook (2026-06)

Companion to `eng/SEO-STRATEGY-2026-06.md`. This is the turn-key setup to measure
whether the SEO work (PR #53) actually grows organic traffic. PR #53 is merged +
deployed live (sitemap 1,238 URLs in prod).

## STATUS (2026-06-03)
- ✅ PR #53 merged + deployed; sitemap live with all new URL types.
- ✅ Sitemap submitted in Google Search Console (processing — a few hours).
- ⚠️ GSC automation **BLOCKED by a confirmed Google bug**: adding a service
  account under Search Console → Users and permissions fails with "email not
  found" — a widespread, Google-acknowledged bug breaking new service accounts
  (not a setup error on our end). Verified: service account `gsc-reader@
  campaignreceipts.iam.gserviceaccount.com` created + email correct, but the
  GSC UI rejects it even on Owner. The reporting cron `cr-gsc-weekly-report`
  was therefore **deleted** (no point running it without a credential it can't
  obtain). `gsc-report.mjs` stays in the repo — it'll work the moment Google
  fixes the bug and the SA can be added.
- ✅ **Replacement: manual rank checks.** Instead of GSC automation, the agent
  runs target queries through web search on request and records where
  campaignreceipts.com ranks — see `eng/SEO-RANK-CHECKS.md` (baseline captured
  2026-06-03). No credential, no cron. Plus: GSC's own browser UI still works
  for the human owner (sitemap already submitted; watch the Pages report).
- ⏸️ SerpBear (off-page-1 daily rank tracking) NOT deployed: it needs a
  persistent disk (the Render API tool can't attach one → would lose history)
  and a separate scraping-API signup. Spin it up via the Render dashboard later
  if wanted; GSC covers "is the SEO working."

Three tools, in priority order: **Google Search Console** (free, the real KPI source),
**SerpBear** (daily rank tracking, paid Render service), **Plausible/CF Analytics**
(funnel tie-out). Do GSC first — it costs nothing and is the leading indicator.

---

## ⭐ The one remaining setup: GSC service-account credential

GSC needs a **service-account JSON key** (NOT an API key — API keys cannot read
Search Console data; the API serves data to *verified property owners* only).
Use a narrow, read-only service account — do NOT create a broad "all APIs"
platform key.

**Project:** `campaignreceipts` (org `antonioualfred-org`). Links below assume
`authuser=4`; if you land in the wrong project, switch accounts via the avatar.

1. **Create the service account** —
   https://console.cloud.google.com/iam-admin/serviceaccounts?project=campaignreceipts&authuser=4
   → Create service account → name `gsc-reader` → Create and continue → Done.
   (No project roles needed — GSC access is granted in Search Console, step 3.)
2. **Add a JSON key** — click `gsc-reader@campaignreceipts.iam.gserviceaccount.com`
   → Keys → Add key → Create new key → **JSON** → downloads a file.
3. **Authorize it in Search Console** (only the founder can do this) —
   https://search.google.com/search-console → pick the `campaignreceipts.com`
   property (verify it first if not yet verified) → Settings → Users and
   permissions → Add user → paste the `gsc-reader@…iam.gserviceaccount.com`
   email → permission **Owner** (or Full) → Add.
4. **Set the credential** — `CR_GSC_SERVICE_ACCOUNT_JSON` = the JSON file's
   contents (inline) OR an absolute path to it. Set it on the Render service
   `cr-gsc-weekly-report` (Environment tab) and/or root `.env` for local runs.
   Only the **Search Console API** must be enabled (already done) — nothing else.

Then: `node scripts/gsc-report.mjs check` → `submit-sitemap` → `indexation` /
`queries`. The weekly Render cron runs indexation+queries automatically once
the var is set.

---

## Pre-deploy baseline (captured 2026-06-03, before PR #53 ships)

Measured live from `https://campaignreceipts.com/sitemap.xml` so the lift is provable:

| Sitemap URL type | LIVE now (pre-PR) | After PR #53 deploys |
|---|---|---|
| total `<url>` entries | **828** | ~1,180+ |
| `/politician/` | 581 | 581 (+ new `Person` schema) |
| `/race/` | **0** | ~6 |
| `/articles/` | **0** | ~14 |
| `/bill/` | **0** | ~335 |
| `/receipt/` | **0** | (all weeks) |
| `/state/` | **0** | 51 |
| `/leaderboard?tab=` | 5 | 5 |

robots.txt already advertises the sitemap (verified live). The headline: **races,
bills, articles, receipts, and state pages are entirely absent from the live
sitemap today** — ~356 built pages Google currently can't discover. That delta is
the week-1–2 indexation KPI in §1.

---

## 0. Sequence (what to do, when)

| When | Action | Tool | Needs founder? |
|------|--------|------|----------------|
| Day 0 (merge+deploy) | Confirm sitemap serves the new URLs in prod; submit sitemap in GSC | GSC | no (GSC is free) |
| Day 0 | Request indexing on 5–10 sample new URLs (a race, a bill, an article, a state) | GSC | no |
| Week 1–2 | Watch GSC Pages report: new URLs move Discovered → Indexed | GSC | no |
| Week 1–2 | Watch GSC Enhancements: `Person`/`Article`/`Dataset`/`Legislation` valid-items climb, 0 errors | GSC | no |
| Week 2 | Stand up SerpBear, seed the keyword set below | SerpBear | **yes — ~$7/mo Render service** |
| Monthly | Query-template scorecard (below) + funnel tie-out | GSC + Plausible/CF | no |

---

## 1. Google Search Console (do this first — free)

**Property:** `https://campaignreceipts.com` (Domain property if DNS access; else URL-prefix).

**Setup steps**
1. Verify the property (DNS TXT via Cloudflare, or the existing CF-analytics is unrelated — GSC needs its own verification).
2. **Sitemaps → submit** `https://campaignreceipts.com/sitemap.xml`. (PR #53 added races/bills/articles/receipts/states — ~356 newly-listed URLs. Confirm the count jumps.)
3. **URL Inspection → Request indexing** on one of each new template so crawling starts immediately rather than waiting for discovery:
   - a race: `/race/<slug>`  · a bill: `/bill/119/hr1`  · an article: `/articles/<slug>`  · a state: `/state/tx`  · a politician (re-crawl for new `Person` schema): `/politician/<slug>`

**Automated path (scripts/gsc-report.mjs — zero npm deps):** once a
service-account credential exists, the manual GSC steps above are scripted.
- One-time founder setup: create a service account in the CampaignReceipts GCP
  project (GSC API already enabled), add its email as an Owner in Search Console
  (verify the domain first if needed), and set `CR_GSC_SERVICE_ACCOUNT_JSON` in
  the root `.env` (a path OR inline JSON). Optional `CR_GSC_PROPERTY` (defaults
  to the `https://campaignreceipts.com/` URL-prefix property; use
  `sc-domain:campaignreceipts.com` for a Domain property).
- Then: `node scripts/gsc-report.mjs check` (verify access) →
  `submit-sitemap` (PUT the sitemap) → `indexation` (sitemap submitted/indexed
  totals) → `queries` (the §2 query-template scorecard, last 28d).
- The script auth path is verified working (signs a service-account JWT, calls
  the real Google token endpoint); it only needs a real authorized key. With no
  credential set it exits 0 with a setup notice, so it's cron-safe to wire early.

**Leading indicator (week 1–2):** GSC **Pages** report — the new templates should move from *Discovered/Crawled — not indexed* to *Indexed*. This is the single metric everything else depends on. A spike stuck in *Crawled — not indexed* is the thin-content warning (see strategy doc trap #1).

**Rich results (week 1–2):** GSC **Enhancements** / Rich Results Test on a sample URL — confirm `Person` (politician), `Article` (article), `Dataset` (politician), `Legislation` (bill), `Organization`/`WebSite` (home) parse with **zero errors**. Validate any one URL live at https://search.google.com/test/rich-results.

---

## 2. The query-template scorecard (the real KPI)

Segment GSC **Performance → Search results** by **Page** (URL filter) per template. Track impressions + clicks + avg position on the query classes CR is built to own:

| Template (URL filter contains) | Target query classes |
|---|---|
| `/politician/` | `[name] donors`, `who funds [name]`, `[name] campaign finance`, `[name] promises kept` |
| `/bill/` | `[bill] donors`, `who funded [bill]`, `[bill] sponsors money` |
| `/race/` | `[race] campaign finance`, `who's funding [race]`, `[state] [office] race money` |
| `/articles/` | weekly-receipt + race-funding story queries; watch Top-Stories/freshness impressions |
| `/state/` | `[state] campaign finance`, `[state] politicians donors` |
| `/leaderboard`, `/directory` (hubs) | head terms: `congressional races campaign finance`, `politician donor tracker` |

**Cadence:** weekly for month 1 (indexation + rich results), then monthly on this scorecard.

---

## 3. SerpBear — daily rank tracking (paid; founder approval)

Per the `serpbear` skill deploy checklist. **~$7/mo Render starter — needs founder sign-off (new spend).**

1. Render → new **Docker** service, image `niciche/serpbear`, starter plan.
2. Root `.env`: `SERPBEAR_URL`, `SERPBEAR_API_KEY`, `SERPBEAR_SECRET` (`openssl rand -hex 32`).
3. First login → add domain `campaignreceipts.com` → seed the keyword set below.

**Seed keywords — CR entity-intent set (the strategy thesis made concrete).**
Use real entities that have pages live. Mix head terms + a rotating sample of
high-traffic politicians/bills so we see the long tail move, not just brand terms.

Head / brand:
- `campaign receipts`, `politician promise tracker`, `who kept their promises`,
  `congressional campaign finance tracker`, `who funds congress`

Politician entity (rotate ~10 high-traffic names that have rich pages):
- `<name> donors`, `who funds <name>`, `<name> campaign finance`, `<name> promises`
  — e.g. for the most-trafficked politicians in GSC after week 2.

Bill entity (the un-owned wedge):
- `<bill short title> donors`, `who funded <bill>` — seed 5 bills with money-trail pages.

Race entity:
- `<state> <office> race funding`, `who's funding <race>` — seed the active races.

> Keep the list honest: only track queries whose answering page is actually live
> and non-thin. Tracking a query CR can't answer just logs a flat zero.

---

## 4. Funnel tie-out (does organic convert?)

CR currently runs **Cloudflare Web Analytics** (in `app/layout.tsx`), not Plausible.
CF Analytics shows referrers/pages but is thin on per-template funnel segmentation.

Two options (founder call):
- **Cheapest:** use GSC for traffic + CF for on-site, and infer conversion from
  newsletter/checkout starts. No new infra.
- **Better segmentation:** deploy the portfolio `plausible` skill (self-hosted on
  Render, ~$14–21/mo) and tag landing-page template → `/pricing` / checkout-start,
  to prove organic entity pages (politician/bill) feed signups — not just impressions.

Either way, the question to answer monthly: **do organic landing sessions on
`/politician/*` and `/bill/*` produce newsletter ($12) + Donor Intelligence ($45)
starts**, at what rate, vs other channels.

---

## 5. Decision gates

- **If indexation stalls** (URLs stuck "Crawled — not indexed"): thin-content risk —
  revisit strategy doc trap #1; render less on sparse pages, don't pad.
- **If impressions climb but clicks don't:** title/description CTR problem — iterate
  the per-template titles (don't keyword-stuff; see trap #4).
- **If clicks climb but conversions don't:** the landing page isn't routing to
  `/pricing` — strengthen the in-page CTA, not the SEO.

---

*Owner: founder triggers the paid pieces (SerpBear, optional Plausible). GSC + the
scorecard are free and should run from day 0 of deploy.*
