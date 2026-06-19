# Campaign Receipts — SEO Strategy (2026-06)

Author: SEO strategist (technical + content). Audience: founder.
Scope: organic search growth → top-of-funnel → newsletter ($12/mo) + Donor Intelligence ($45/mo) conversions.
Ground truth: verified against this codebase on 2026-06-03 (file paths cited inline).

---

## 1. Thesis

CR's defensible organic moat is **entity-intent queries on people and money**: searches like
*"who funds [politician]"*, *"[politician] donors"*, *"[politician] biggest donors 2024"*,
*"[politician] promises kept"*, *"who funded [bill name]"*, and *"[race] campaign finance"*.
These are high-intent, evergreen, and **programmatically generable** from CR's existing FEC +
Congress.gov data across ~585 politicians, races, and bills — yet the site already ranks on
almost none of them because the pages that answer them (races, bills, articles) are **not even in
the sitemap** and carry **no entity structured data**. The fastest organic wins are not new
content — they're (a) getting the ~hundreds of already-built race/bill/article pages crawled, and
(b) putting `Person` / `Article` / `Legislation` JSON-LD on pages that already render the data, so
Google can connect CR to the knowledge-graph entities people are searching for. Content plays
(programmatic "[politician] donors" landing sections, internal-linking the orphan pages) come
second and compound the technical fixes.

---

## 2. Prioritized action list (impact-vs-effort ranked, highest ROI first)

### TIER 1 — Crawlability gaps (the site is hiding pages from Google)

**1. Add races, bills, articles, and receipts to the sitemap.**
- File: `app/sitemap.ts` (currently emits ~700 URLs but **excludes** `/race/[slug]`, `/articles/[slug]`, `/bill/[congress]/[number]`, `/receipt/[week]`, and the index pages `/bills`, `/articles`, `/race`).
- Pull slugs the same way politicians are pulled (Supabase `cr_articles`, race table, bill table) and push them into the existing `out` array. These pages already exist, render fully, and have `generateMetadata` — they are simply not being submitted.
- Impact: **High** · Effort: **S**
- Why: every published race/bill/article is a missed indexable surface; this is the single biggest "we built it and Google can't find it" gap.

**2. Add the index pages to the sitemap + give them `generateMetadata`.**
- Files: `app/bills/page.tsx`, `app/race/page.tsx`, `app/articles/page.tsx`, `app/directory/page.tsx`, `app/promises/page.tsx` (all currently static `export const metadata`; `/race`, `/bills`, `/articles` aren't in the sitemap at all).
- Add their canonical URLs to `STATIC[]` in `app/sitemap.ts` and ensure each has a keyword-targeted title/description ("2024 House & Senate races — who's funding them", etc.).
- Impact: **High** · Effort: **S**
- Why: index/hub pages are where link equity pools and where head-term rankings ("congressional races campaign finance") live; they also feed crawlers into the detail pages.

### TIER 2 — Structured data on pages that already render the data

**3. Add `Person` JSON-LD to politician pages.**
- File: `app/politician/[slug]/page.tsx` (today only emits `schema.org/Dataset`, lines ~243-271). The data is already fetched (`name, party, branch, state`, term dates, scorecard fields).
- Add a second `<script type="application/ld+json">` with `@type: Person` (`name`, `jobTitle` from branch, `memberOf` the party, `address`/`worksFor` the state, `url`, `sameAs` if a Wikipedia/Ballotpedia URL is available). Keep the Dataset block.
- Impact: **High** · Effort: **S/M**
- Why: `Person` schema is how Google maps a page to the politician's knowledge-graph entity — the prerequisite for ranking on "[name] donors" and earning entity-rich SERP treatment.

**4. Add `Article` (NewsArticle) JSON-LD + OG image + prev/next to article pages.**
- File: `app/articles/[slug]/page.tsx` (`generateMetadata` lines ~92-105 sets only title/description/OG type=article — no image, no `datePublished`/`dateModified`/`author`).
- Add `Article` JSON-LD (`headline`, `datePublished`, `dateModified`, `author` Organization, `image`, `publisher`), set `twitter.card`, and add a dynamic `app/articles/[slug]/opengraph-image.tsx` (the leaderboard/politician OG routes are the template).
- Impact: **High** · Effort: **M**
- Why: `Article` schema + a real `datePublished` is table stakes for Google News / Top Stories eligibility and for freshness ranking on weekly-receipt and race-funding stories — CR's most timely, link-worthy content.

**5. Add `Legislation` JSON-LD to bill pages + OG image.**
- File: `app/bill/[congress]/[number]/page.tsx` (`generateMetadata` exists at line ~121; no JSON-LD, no OG image).
- Add `@type: Legislation` (`legislationIdentifier`, `legislationType`, `legislationDate`, `sponsor` as Person, `legislationPassedBy`). Add a bill OG image route.
- Impact: **Med** · Effort: **M**
- Why: bill pages are CR's wedge into "[bill] donors / who funded [bill]" — a query class no major site owns well; structured data + crawlability is what unlocks it.

**6. Add `Organization` JSON-LD globally.**
- File: `app/layout.tsx` (today has global OG but **no** `Organization`/`WebSite` JSON-LD — grep returned nothing).
- Add one `Organization` block (name, url, logo, sameAs socials) + a `WebSite` block with `SearchAction` (sitelinks search box). Once.
- Impact: **Med** · Effort: **S**
- Why: establishes the publisher entity once for the whole site and can earn a sitelinks search box; cheap, sitewide.

### TIER 3 — Canonicals & duplicate-content hygiene

**7. Set canonicals on query-param pages.**
- Files: `app/leaderboard/page.tsx` (tabs via `?tab=`), `app/compare/page.tsx` (`?a=&b=`). Only `/receipt/[week]` currently sets `alternates.canonical`.
- For leaderboard, self-canonical each `?tab=` URL (they're distinct content and already in the sitemap — keep them indexable but explicit). For `/compare`, canonical to the **a/b-ordered** form so `a=x&b=y` and `a=y&b=x` don't split into duplicates.
- Impact: **Med** · Effort: **S**
- Why: prevents param permutations from diluting/duplicating; locks the canonical CR wants ranked.

**8. Add canonicals to all dynamic detail pages.**
- Files: `app/politician/[slug]/page.tsx`, `app/articles/[slug]/page.tsx`, `app/race/[slug]/page.tsx`, `app/bill/[congress]/[number]/page.tsx`.
- One line each in the returned metadata: `alternates: { canonical: '<full url>' }`.
- Impact: **Low/Med** · Effort: **S**
- Why: cheap insurance against any tracking-param or trailing-slash duplication; consolidates signals on the clean URL.

### TIER 4 — Internal linking & IA (spreads equity to the orphans)

**9. Cross-link politician pages ↔ articles that mention them, and ↔ related politicians.**
- File: `app/politician/[slug]/page.tsx` (today links only to itself + `/donors`; never to `/articles/*` or peer politicians — verified).
- Article pages already store `politician_ids` and `related_race_id` (`app/articles/[slug]/page.tsx`), so the reverse lookup is trivial: on a politician page, query `cr_articles` where `politician_ids` contains this politician and render a "In the receipts" link list. Add a "Same state / same committee" related-politician rail.
- Impact: **High** · Effort: **M**
- Why: politician pages are CR's highest-authority template; routing their equity into orphaned articles/races is the highest-leverage internal-linking move and lifts the whole long tail.

**10. Build/strengthen the hub pages as link-equity distributors.**
- Files: `app/race/page.tsx`, `app/bills/page.tsx`, `app/articles/page.tsx`, plus `app/state/[code]/page.tsx`.
- Ensure `/race` lists every race linking to `/race/[slug]`, `/bills` lists/aggregates bills, and state pages link to every politician in that state AND to that state's races. State pages are currently under-linked.
- Impact: **Med/High** · Effort: **M**
- Why: hubs give crawlers a path to every detail page and let head-term hub pages pass equity down — the structural fix that makes Tier-1 sitemap additions actually rank.

### TIER 5 — Programmatic landing content (do AFTER 1-10)

**11. Add a dedicated "Who funds [politician]" section/anchor to each politician page.**
- File: `app/politician/[slug]/page.tsx` (+ the existing `/politician/[slug]/donors` route).
- A short, data-backed H2 ("Who funds [name]") summarizing top donors/industries in plain language, with the `/donors` deep page linked. Templated, but each instance carries unique FEC numbers — not thin.
- Impact: **High** · Effort: **M**
- Why: directly targets the highest-volume CR-ownable query ("who funds [name]" / "[name] donors") on the page already best-positioned to rank.

**12. Optional FAQ JSON-LD on politician/race pages.**
- Files: politician/race page templates.
- 2-3 genuinely-answered Qs ("Who is [name]'s biggest donor?", "How much has [name] raised?") with on-page answers, marked up as `FAQPage`.
- Impact: **Low/Med** · Effort: **S**
- Why: can earn PAA/rich-result real estate — but only if the answers are actually on the page (see traps).

### Skip / deprioritize
- New marketing pages or blog content for its own sake — the data pages are the asset; don't divert effort.
- Hreflang / i18n — single-locale site, no value.
- Aggressive `BreadcrumbList` everywhere before the entity schema (3-9) ships — breadcrumbs are nice-to-have, not the bottleneck.

---

## 3. The "do these 5 first" shortlist

1. **Sitemap: add races, bills, articles, receipts + the index pages** — `app/sitemap.ts` (+ titles on the index pages). Effort **S**. Stops hiding hundreds of built pages from Google. *This is the single highest-ROI change.*
2. **`Person` JSON-LD on politician pages** — `app/politician/[slug]/page.tsx`. Effort **S/M**. Unlocks "[name] donors" entity ranking.
3. **`Article` JSON-LD + OG image + datePublished on article pages** — `app/articles/[slug]/page.tsx` + new `opengraph-image.tsx`. Effort **M**. News/freshness eligibility for the timely content.
4. **Cross-link politician pages → articles mentioning them (+ related politicians)** — `app/politician/[slug]/page.tsx` via `cr_articles.politician_ids`. Effort **M**. De-orphans articles using the highest-authority template.
5. **Canonicals on `/compare` (order-normalized) and `/leaderboard?tab=`** — `app/compare/page.tsx`, `app/leaderboard/page.tsx`. Effort **S**. Kills param-duplication before more pages get indexed.

Rough total: ~1.5-2 engineering days. Items 1, 2, 5 are same-day.

---

## 4. What NOT to do / traps

- **Don't ship thin programmatic pages.** Every "[politician] donors" / "[bill] donors" surface must carry real, distinct FEC/Congress numbers and a sentence of plain-language interpretation. A template wrapping near-empty data is a doorway-page penalty risk. If a politician has sparse data, render less — don't pad.
- **Don't index every `/compare` permutation.** `a=x&b=y` and `a=y&b=x` are the same comparison — canonicalize to one ordering (item 7) or you split equity and look duplicative.
- **Don't FAQ-markup answers that aren't visibly on the page.** Google treats marked-up-but-absent answers as spam. Only add `FAQPage` where the answer text actually renders.
- **Don't over-optimize titles into keyword stuffing.** Current politician titles ("[name] (term) — X% kept · N graded | CampaignReceipts") are good and human — keep that voice; don't degrade to "[name] donors funders contributions money 2024".
- **Don't gate the SEO-valuable data behind the $45 paywall.** The crawlable summary must satisfy intent; the paid product is the *deep* cut. If Googlebot only sees a paywall, the page can't rank for the query that would convert.
- **Don't let the sitemap balloon uncached.** It already does live Supabase reads with `revalidate=3600` — adding races/bills/articles is fine, but keep it on the cached path; don't drop the revalidate.

---

## 5. Measurement

Track in **Google Search Console** (and the `serpbear` skill for daily rank on the target query set):

- **Indexation first (week 1-2):** GSC Pages report — confirm race/bill/article/receipt URLs move from "Discovered/Excluded" to "Indexed" after the sitemap fix. This is the leading indicator everything else depends on.
- **Rich-result coverage:** GSC Enhancements — watch for `Article`, `Dataset`, and any `FAQ` valid-items counts climbing as schema ships; zero errors.
- **Query templates (the real KPI), segmented by page template via GSC URL filters:**
  - `/politician/*` → impressions/clicks on "[name] donors", "who funds [name]", "[name] campaign finance", "[name] promises".
  - `/bill/*` → "[bill] donors", "who funded [bill]".
  - `/articles/*` & `/race/*` → race-finance and weekly-receipt queries; watch freshness/Top-Stories impressions.
- **Internal-linking effect:** crawl-stats + the articles/races template climbing in average position after item 9 ships (de-orphaning should raise the long tail).
- **Funnel tie-out:** with `plausible`, segment newsletter/checkout starts by landing-page template — prove organic entity pages (politician/bill) actually feed `/pricing` and signups, not just impressions.
- **Cadence:** GSC review weekly for the first month (indexation + rich results), then monthly on the query-template scorecard. Flag any "Crawled — not indexed" spike as a thin-content warning (ties to trap #1).
