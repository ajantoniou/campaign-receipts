# CampaignReceipts — Intelligence-Engine Strategy, GTM & Press Desk Design

**Date:** 2026-06-15
**Status:** CANONICAL — supersedes `search-first-rebuild-brief-2026-06-14.md`
**Authors:** Synthesis of two expert panels (consumer-SaaS/data-product founder GTM lens; data-product UX/information-design lead) commissioned via the ask-the-expert protocol, on the founder's locked vision.
**Founder lock:** the 3-tier structure, the freshness paywall, the race-tracker-as-free-SEO-centerpiece, and the weekly content flywheel are DECIDED. This brief specs HOW, not WHETHER.

---

## 0. The thesis (one breath)

CampaignReceipts is a **political-money intelligence product** built on FEC data. The product is not "an AI search tool" — it is **the receipt**: a sourced dollar figure tied to a specific vote, bill, or race. The AI (Opus 4.8) connects the dots — **who got paid · donor→influenced vote · donor→influenced bill sponsorship** — fired when new FEC receipts publish. Three customers buy three altitudes of the same data graph; a freshness paywall (free = stale, paid = current) is the value metric; a weekly automated content engine is the $0-CAC growth flywheel.

**Competitor we beat by being a data product, not an advocacy site:** trackaipac.com shows endorsements + a donate button and says "data via fec.gov" but **never shows a dollar amount, has no search, no totals, no leaderboards.** They monetize *belief* (ceiling = people who already agree). We monetize *the receipt* (ceiling = everyone who wants the number — left, right, journalist, opponent, candidate). **Don't out-advocate them. Out-receipt them, party-blind.**

---

## 1. The three customers × three altitudes (founder's framing, validated)

| Customer | Altitude | Tier | What they pay for |
|---|---|---|---|
| **Politically-inclined citizens** | Opus-written "juice," read for them | Friday Receipts | the weekly connected story + current data |
| **Content creators** (also 30% of the workforce) | pre-connected dots → make videos/threads | Friday Receipts → Press Desk | the connected narrative + export, as raw material |
| **Journalists** | trace + cite themselves; or feed their LLM | Press Desk | current data + the connection-web + CSV/citation export |

Creators are a customer **and** a distribution channel — they pay in reach. Journalists are margin, not volume.

---

## 2. Pricing — exactly THREE tiers (founder lock)

| Tier | Name | Price | What's included | The value boundary |
|---|---|---|---|---|
| 1 | **Free** | **$0** | Race tracker (donor tallies by name+amount), the Pro-Israel + inverse ledgers, leaderboards, every politician's **stale (≥30-day-old)** donor totals, all published Friday Receipts articles (SEO) | Data **aged ≥30 days**, read-only, no AI dossier |
| 2 | **Friday Receipts** | **$9/mo** ($90/yr) | The weekly Opus-written newsletter; **current-week** data on every race/politician; full article archive; "follow a race/politician" alerts | **Freshness + delivery + alerts** |
| 3 | **Press Desk** | **$45/mo** ($450/yr) | Everything + the **AI search/dossier engine** + the **connection-web** (§5) + CSV/citation export + the bill money-trail tool | **The tools: search, web, export, dossiers** |

**Decisions made (reconcile existing products):**
- **Newsletter: reprice $12 → $9, rename "Friday Receipts."** $9 is the impulse price that converts directly off a YouTube end-card; $12 was set before the free race tracker existed as a feeder. The funnel changed; the price follows.
- **$45 search → rename "Press Desk," keep $45.** It is the moat; the connection-web (§5) is its signature surface. Add CSV/citation export as the paid-tier justification.
- **Kill every other tier idea** (Creator/Newsroom/MCP-Feed from the prior panel). Three tiers only. Newsroom seat-licensing and an MCP feed are *future expansion levers*, not launch tiers — revisit only after Press Desk has product-market fit.

**The free/paid line, one rule:** *Free is the receipt for last month. Paid is the receipt for this week, plus the search that finds any receipt you want.* The race tracker + ledgers are **always free** (they are the SEO engine; paywalling them kills the flywheel). **Never paywall the hero receipt a YouTube video just showed** — it stays free on its companion page.

---

## 3. The free SEO centerpiece — Race Tracker + the Ledgers

### 3a. Race Tracker (watch every race like a UFC card / World Cup bracket)
The viral unit is NOT the bracket format — it's **one screenshot-able number per race: the head-to-head outside-money bar.**

> **KY-04 · 2026 primary**
> 🟥 Candidate A — **$2.1M spent against** · top spender: *[PAC] $1.4M*
> 🟦 Candidate B — **$3.3M spent for** · funded by *[PAC]*
> *"Someone spent $3.3M to beat one congressman. Here's who."*

Why it works: it **ranks** (evergreen "who funds [race]" queries, near-zero competition — trackaipac doesn't show $), it **screenshots** (one bar, two numbers, a named PAC), and it **auto-generates the weekly video** (most-clicked race → the Short script). Build an OG image generator `/api/card/race` (extend `/api/card/donor`) that renders exactly this bar — every share is a branded receipt.

### 3b. The Pro-Israel ledger (+ inverse) — run it as a LEDGER, never a verdict
Smart SEO, manageable risk **only if** run as sourced funding data:
1. Header is *"Received from pro-Israel PACs (FEC 2024 cycle): $X"* with the **committee ID inline** — never "pro-Israel politician." The dollar is the fact; the label is the lawsuit.
2. **Always ship the inverse ("took $0") list on the same page.** This converts a hit-list into a party-blind *database* and doubles long-tail SEO.
3. Every figure carries its FEC committee ID, clickable to fec.gov. A number you can verify is journalism, not defamation.
4. No editorializing copy on the free page — the list is the product; analysis lives in Friday Receipts (paid).
CR's nonpartisan-through-structure brand IS the legal defense: we assert a sourced number; they assert a judgment.

---

## 4. The weekly content flywheel (automated, $0 CAC)

Already partially built (the 2-phase newsletter cron). The full loop, per the founder:

1. **Thursday:** cron worker (Opus 4.8) writes full **blog articles** from the week's new FEC receipts — connected stories (who got paid · donor→vote · donor→bill).
2. **Friday:** articles publish to the site (SEO) **and** send as the Friday Receipts newsletter (per-timezone, existing cron).
3. **Weekend:** the **most-clicked/most-viewed article (or race scoreboard)** is auto-turned into a YouTube video.
4. **Rinse/repeat weekly, automated.**

One Opus run per beat → lit across **three surfaces** (Short + evergreen SEO page + a creator "juice packet"). The creator tier turns competitors into distribution. **Wire the cron's "most-clicked" signal to also pick the most-clicked race as the weekend video subject.**

---

## 5. Press Desk — "The Connection Web" (the signature paid surface)

Founder ask: the database must "look super amazing and be easy to draw connections between donor → vote → sponsored bill → campaign, like a web." The data-UX lead's spec:

**Paradigm: "pull-the-thread" expandable entity-card graph** on a dark device-canvas — NOT a force-directed hairball (positions meaningless, jitters, uncitable — explicitly rejected), NOT a full-surface Sankey (reused only inside the money-trail card).

- **Entry:** `⌘K` search (Typesense) → ONE entity card, rails collapsed but **pre-counted** ("3 PACs paid them · $214K", "voted on 6 tracked bills"). Calm default, no hairball on load.
- **The 3-click trace:** click a rail → connected entities fan out with **sourced edges**. Donor → politician (click 1) → bill the PAC's industry wanted (click 2) → the vote, edge colored by alignment (click 3). Sage = voted the money's way; coral = voted against it (fixed verdict palette = "color as meaning").
- **The revenue-justifying feature — "Cite this"** on every edge → (a) the AP-style sourced sentence with FEC ID + retrieval date, (b) the CSV row, (c) a **1200×630 receipt-card PNG** that "looks like a court exhibit" — screenshot-bait that's also legally citeable, and a watermarked ad with a real FEC ID every time it's shared.
- **AI augments, never replaces:** "Explain this connection" on any edge → the existing Opus dossier engine writes the sourced paragraph; "Find the thread" suggests next clicks (never auto-draws edges). The reporter authors the web; Opus narrates it.
- **Mostly reusable:** `lib/dossier.ts` (the data spine), `InfluenceMap` edge math, `/api/dossier`, `lib/ap-citation.ts`, `lib/pro-data.ts` (export logging), the OG card route, `components/cr/*`. Net-new = one client canvas + EntityCard + CiteDrawer + TraceRail + two thin API routes + **<10KB** dependency (`@panzoom/panzoom` + `d3-hierarchy` for the optional "Tidy"), Pro-gated so it never touches the public bundle.

---

## 6. The 10k math — honest (both experts, independently)

At $0 CAC on a cold domain (new domains don't rank 3–6 months; ~26 articles/videos in the window):
- **Funnel:** visitor → free signup ~2%; free → paid ~4% (citizen-heavy) ⇒ **~0.08% visitor→paid** (1 paid per ~1,250 uniques).
- **Honest BASE case (6 mo):** ~300k–600k cumulative uniques → 6k–12k free signups → **250–500 paid → ~$5–10k MRR.** This already clears the $500 company cap ~10–20×.
- **10,000 paid is a 12–18 month CEILING**, reachable only if 1–2 videos break out (1M+ views) and ledger pages rank page-one. *"Anyone promising 10k in 6 months at $0 CAC on a cold domain is selling a vanity number."*

**Plan for $50k MRR as the target; treat 10k paid as what you're building toward.**

---

## 7. The two things that gate everything

1. **The race database is nearly empty.** `cr_races` is seeded with ~3 races (KY-04 + 2 stubs), not 50. A scoreboard with one game is not a sport; every "who funds [race]" search hits a dead stub. **#1 de-risk move: backfill ~40–50 marquee 2026 races with real FEC outside-money + top-PAC figures BEFORE any marketing.** Depth before distribution.
2. **Citizen ≠ journalist buyer.** Don't let the journalist/Bloomberg tier define the brand or homepage — that caps you at ~1k. Lead the public site + every YouTube CTA with **Free + $9 Receipts**; Press Desk is high-margin expansion on a citizen-volume base.

---

## 8. Week-1 action list (both panels converged)

1. **Backfill 40–50 marquee 2026 races** into `cr_races` with real FEC IE + top-PAC dollars. *(Gates everything — see §7.1; this is task #20.)*
2. **Build `/api/card/race`** — the OG scoreboard image (share/thumbnail unit, §3a). Extends `/api/card/donor`.
3. **Reprice newsletter → $9, rename "Friday Receipts";** set the free/paid line at freshness (free = ≥30-day-old data).
4. **Ship the Pro-Israel ledger + inverse list** as one free page, FEC IDs inline, framed as a funding ledger (§3b).
5. **Wire the flywheel:** most-clicked race/article of the week → auto-generates the weekend Short.

## 9. Carried-over cleanup (not strategy, but noted)
- The SEALED removal left one leak: a leaderboard/article card still reads "…SEALED graded the move…" (visible on the live homepage). Scrub the remaining "SEALED graded" phrasing in article/leaderboard data + any `case_study_narrative` rendered on the homepage module.

---

## Appendix — provenance
Both expert memos (the GTM founder teardown of trackaipac + the Press Desk connection-web design spec) were produced via the ask-the-expert protocol and are the source of §3–§6. The orchestrator did not pre-decide pricing, the visualization paradigm, or the 10k assessment — the specialists did. Founder edits this brief; the build follows.
