# 4-Page 3rd-Grade Audit — campaignreceipts.com

Author: Web UX Director
Date: 2026-05-26
Scope: `/` (homepage), `/pricing`, `/donor-to-vote`, `/donor-to-bill`
Standard: every public line readable by a curious 9-year-old. Sentence law
(≤15 words body, ≤8 words headlines, ≤4 words buttons). No Latinate
abstractions without inline gloss. Two CTAs max per page.

This doc is the spec. Section B of the engagement (homepage rewrite) is
already applied in `app/page.tsx`. Pricing + Donor→Vote + Donor→Bill
fixes are spec-only — orchestrator + designer execute.

---

## Page: `/` (homepage) — `app/page.tsx`

### First-5-seconds report

A 3rd-grader scrolling in sees:
- Tiny red dot + "Receipts. Not vibes." — fine, intriguing.
- Big headline: "The political-media company that ties **donors** to
  **votes, bills, promises, and races**." — **fails**. "political-media
  company," "ties," "donors-to-X" comma list = adult-paper headline.
  9-year-old doesn't know what a "media company" is or what "ties" means
  here. Five things ANDed together = none of them sticks.
- Body sentence is 38 words with a semicolon, "federal politician," "FEC
  donor," "congressional vote," "sponsored bill" — every noun phrase is
  jargon.
- Buttons: "Browse the directory →" (OK — verb-led, specific) and "See
  what the Bundle unlocks" (**fails** — "Bundle" undefined, "unlocks"
  abstract).

What they DON'T understand: what the site does, who it's for, why
they'd come back.

### Reading-level violations

| Line | ❌ Current | ✅ Rewrite |
|---|---|---|
| L273-277 | "The political-media company that ties donors to votes, bills, promises, and races." | "We show who paid which politician — and how they voted." |
| L278-286 | "We track every federal politician's money flow — from FEC donor on one end to congressional vote, sponsored bill, broken campaign promise, and won-or-lost race on the other. Sourced from FEC.gov and Congress.gov. Primary-source citation on every verdict." | "We follow the money for every member of Congress. Who gave it, and what the politician did after. Every claim links to FEC.gov or Congress.gov." |
| L292 | "Browse the directory →" | Keep — verb-led, clear. |
| L298 | "See what the Bundle unlocks" | "See what $45/mo gets you" |
| L300-302 | "Free to browse · $45/mo for CSV / API / commercial license" | "Free to read · $45/mo for download + reuse" |
| L338 | "Who voted with their donors this week?" | Keep — question form, verb-led. |
| L339 | "Live alignment scores across 585 politicians. Top-3 free. Bundle: full filterable table + CSV." | "We score how often each of 585 politicians votes with their donors. Top 3 free. Pay $45/mo for the full list." |
| L344 | "Broken-promise · receipt" | "Promise broken — the receipt" |
| L345 | "The 145 promises Trump made before $250M of Adelson money." | Keep — short, concrete, names the player. |
| L353 | "Which bills track to which industries?" | "Which industries paid for which bills?" |
| L354 | "Money-trail per sponsor + co-sponsor, refreshed daily. Top-3 free. Bundle: full money-trail with CSV." | "We trace donor money behind every active bill. Top 3 free. Pay $45/mo for the full trail." |
| L364 | "● Receipts, not rhetoric" | Keep — short, hooks. |
| L366-376 | "This is one of 585 receipts. The full ledger starts in SEALED 2016 →" | "This is 1 receipt. The full book has 145. Read SEALED 2016 →" |
| L434 | "Five receipts · five products" | "Five things we do" |
| L438-439 | "Donor influence on votes, bills, and elections. Broken promises. Foreign-tied funding." | "Who paid the vote. Who paid the bill. Who paid the race. Who broke their promise. Who took foreign money." |
| L440-444 | "One card per product surface — each a real politician (or PAC), a real receipt, a real primary-source citation. Click any card to open the full dossier." | "One card per thing we track. Each is a real politician and a real receipt. Click any card to read the full file." |
| L450 | "Donor → Vote · receipt" | "Who paid the vote" |
| L456 | "Voted with defense-industry donors on every tracked vote." | "Voted with defense-company donors on all 7 votes we tracked." |
| L461 | "Donor → Bill · receipt" | "Who paid the bill" |
| L467 | "Sponsored the Digital Asset Market Clarity Act of 2025. Top non-individual donor: Finance." | "Wrote the 2025 crypto bill. His #1 industry donor: Wall Street ($109K)." |
| L471 | "Donor → Election · receipt" | "Who paid the race" |
| L478 | "Most expensive U.S. House primary in history. Trump-aligned PACs poured $16.4M against incumbent Massie." | "The most expensive House primary ever. Trump-backed groups spent $16.4M trying to beat Massie." |
| L483 | "Broken-promise · receipt" | "Promise broken" |
| L489 | "81 promises graded against primary-source receipts. 22 broken, 25 partial, 28 kept (34.6%)." | "We checked 81 promises. He kept 28, broke 22, half-kept 25. Score: 34.6%." |
| L495 | "Foreign-tied · receipt" | "Foreign ties" |
| L500 | "Self-disclosed Canadian dual citizenship on Fox News Sunday, reported by The Hill." | "She said on Fox News she's also a Canadian citizen. The Hill reported it." |
| L517 | "Top 5 · live leaderboards" | "Top 5 lists" |
| L520 | "Four lists. Updated as we grade." | Keep — short, clear. |
| L526 | "kept rate · graded ≥ 8" | "% kept · at least 8 promises checked" |
| L590 | "Front page · the SEALED book" | "From the book" |
| L598-603 | "One donor. One promise. One verdict. SEALED — The 2016 Promises walks the full audit on all 145 of Trump's 2016 campaign promises with primary-source receipts on every claim." | "One donor. One promise. One verdict. The book SEALED checks all 145 of Trump's 2016 promises. Every one has a receipt." |
| L604-622 | "145 promises graded in SEALED. Read more → or get the book — $15 →" | "145 promises checked in SEALED. Read more → or buy the book — $15 →" |
| L639 | "Worst broken promise · week N, YYYY" | Keep — concrete. |
| L642 | "This week's verdict" | Keep. |
| L646 | "See the archive →" | Keep. |
| L662 | "Read the receipt on {name} →" | Keep — verb-led + specific. |
| L698 | "Featured audit · Donald J. Trump" | "Trump · the file" |
| L703-708 | "Two views of the same record. The full SEALED Press 145-promise book audit, and the curated 81-promise on-site corpus with chapter case studies + primary-source receipts on each chapter-defining verdict." | "Two views of one record. The full 145-promise book. Or our 81-promise web file with case studies and receipts." |
| L712 / 726 | "2016 audit · curated" / "1st term · canonical" | "2016 term · our scored file" / "1st term · short version" |
| L749 | "Open dossiers" | "Open files" |
| L754-757 | "Topic-scoped dossiers built on the same primary-source discipline: one government source per row, contested labels surfaced honestly." | "Special files on one topic at a time. One government source per row. We flag any claim people argue about." |
| L763 | "Which U.S. politicians hold a second citizenship — what they said, what reputable journalism reported, who funded their campaign." | "Which U.S. politicians are also citizens of another country. What they said. Who paid their campaign." |
| L769 | "Illegal foreign-national contributions, FARA-registered lobbyist money, foreign-state-owned-enterprise donors, and foreign-policy-aligned PACs." | "Money from outside the U.S. that touched U.S. campaigns. Illegal gifts, foreign lobbyists, state-owned firms, foreign-tied PACs." |
| L775 | "Citation guide for journalists. What's safe to cite today, what's not citation-ready yet, commercial-use license." | "For reporters: what you can cite today, what's not ready yet, and the rules for reuse." |
| L793 | "Receipts, not rhetoric." | Keep — short, brand. |
| L795-796 | "{N} final scorecards · {M} live-tracked terms in progress. We grade after the term ends, not before." | "{N} final scores. {M} terms still in progress. We score after the term ends, not before." |
| L807-810 | "Sorted by: graded-promises × kept-rate · live trackers shown by pending-promise count" | "Sorted by promises checked × % kept. Still-active politicians sorted by promises waiting." |
| L824 | "The week's worst broken promise, in your inbox Friday." | Keep — short, clear. |
| L826-828 | "One short email a week. One politician, one verdict, one primary-source receipt. Free. Unsubscribe in one click." | "One short email each Friday. One politician. One broken promise. One receipt. Free. One-click unsubscribe." |
| L846 | "Get Friday's receipt →" | Keep — verb-led + specific. |
| L849-850 | "First send: Friday 9am ET · Curated by editorial · No tracking pixels" | "First email: Friday 9am ET. Picked by our editors. No tracking pixels." |
| L860 | "The book that started it all" | Keep. |
| L866-870 | "All 145 of Donald Trump's 2016 campaign promises, fact-checked with paper-trail receipts on every claim. The methodology applied to the full SEALED corpus — the same methodology CampaignReceipts applies to every politician at scale." | "All 145 of Trump's 2016 promises. Every one fact-checked with a paper receipt. Same method we now use for every politician." |
| L879 | "Read more about SEALED" | "See what's in the book" |
| L888 | "Get the book — $15 PDF" | Keep — verb-led, specific, priced. |
| L895 | "Read the methodology →" | "See how we score →" |

### Navigability check

Primary purpose: "show what site does → let user find their politician
OR pay." Path today:
- Cold visitor: Hero (1) → Browse directory OR See what bundle (2). OK.
- Find-your-rep: scrolls past 6 sections before hitting `<FindYourReps>`
  at L674. **Fails** — should be one click from hero. Spec: pin
  `FindYourReps` immediately under hero, ABOVE the 5-card showcase. (Out
  of scope for me to move — engineer task.)
- Worst broken promise of week: buried at L632, after 4 other sections.
  Fine — that's a return-visit module, not a first-visit one.

Path collapse needed: hero → "Search your politician" (search box, not
just link) → profile. Today user has to click "Browse the directory" →
land on directory → THEN search. That's 3 clicks. Should be 2.

### CTA audit

- "Browse the directory →" — OK.
- "See what the Bundle unlocks" — **fail** ("unlocks" + undefined
  "Bundle"). Fix: "See what $45/mo gets you".
- "Read the receipt on {name} →" — OK.
- "See the archive →" — OK.
- "Open the dossier →" (×N) — **soft fail** for 3rd-grader; "dossier"
  is FBI-show jargon. Fix: "Open the file →".
- "Open →" (small links on cards) — OK in context, but pair with
  semantic alt-label.
- "Read more →" inside SEALED CTA — **fail** ("read more about what?").
  Fix: "See what's in the book →".
- "Get Friday's receipt →" — OK.
- "Get the book — $15 PDF" — OK (priced + verb-led).
- "Read the methodology →" — **soft fail** ("methodology" 5-syllable
  Latinate). Fix: "See how we score →".

### Mobile-first check

- All buttons are `px-5 py-2.5` — tappable, fine.
- Hero body paragraph at L278 = 38 words in one sentence, runs ~5 lines
  at 360px. **Fails** sentence law. Rewrite splits into 3 sentences.
- 5-card showcase wraps to 1-up at mobile. OK.
- Leaderboard cards: 4 columns desktop → 1-up mobile. OK.
- No hover-only interactions detected.
- `eyebrow` mono text at 9-10px is borderline unreadable at 360px. Flag
  to designer (visual, not copy).

### Top 3 changes ranked by impact

1. **Hero headline + body rewrite (L273-286).** Owner: me (DONE in
   page.tsx). Highest impact because it's the 5-second test. Replaces
   "political-media company that ties donors to votes, bills, promises,
   and races" with a 3rd-grade verb-led promise.
2. **CTA labels site-wide: kill "Bundle", "dossier", "methodology",
   "Read more".** Owner: me for homepage (DONE); orchestrator for other
   pages. These are the buttons people are scared to click.
3. **Move `<FindYourReps>` directly under hero.** Owner: engineer
   (structural, out of my scope). Today it's 6 sections deep; it's the
   #1 "what's in it for me" action and should be visible without
   scrolling on most screens.

---

## Page: `/pricing` — `app/pricing/page.tsx`

### First-5-seconds report

3rd-grader sees:
- "Pre-launch · waitlist · founder rate locks at signup" — **fails**.
  Three jargon phrases in one line. "Founder rate"? "Locks at signup"?
- Big headline: "Free for everyone. $45 for the engines." — **good**.
  Short, contrast, priced. "Engines" is borderline but the next line
  defines it.
- Body sentence: 56 words, two em-dashes, four product names. **Fails**
  badly.
- Two cards: "Free / $0 forever" + "Bundle / Commercial license
  included". The "Commercial license included" tag means nothing to a
  9-year-old.

What they DON'T understand: what "engines" do, what "commercial
license" is, what they're waitlisting for.

### Reading-level violations

| Line | ❌ Current | ✅ Rewrite |
|---|---|---|
| L75-76 | "Pre-launch · waitlist · founder rate locks at signup" | "Coming soon · join the list to lock $45/mo" |
| L78 | "Free for everyone. $45 for the engines." | "Free to read. $45/mo to download and reuse." |
| L80-88 | "Politician scorecards, foreign-tied funding, active-race spending, and the Friday Receipts newsletter are free forever. The $45/mo Bundle adds the four paid tools — Donor → Vote, Donor → Bill, Tips → Verdicts, and Pro exports — plus the commercial-use license. We're not billing yet; sign up below to lock the founder rate when billing opens." | "Reading the site is free forever. That covers all 585 politicians, foreign money, races, and the Friday email. The $45/mo plan adds 4 tools: who-paid-the-vote, who-paid-the-bill, tip-to-report AI, and CSV download with reuse rights. We haven't turned billing on yet. Sign up to lock the $45 price before we do." |
| L33-41 (FREE list) | "All politician profiles + scorecards (585+ on file)" / "Active Campaign Races · live super PAC IE tracking" / "Foreign-tied funding dossier" / "Top-3 correlations per politician" / "Leaderboards, OG share-images, comparison pages" / "Methodology + sources + corrections log" | "All 585 politician scorecards" / "Live tracker for big money in current races" / "File on foreign money in U.S. campaigns" / "Top 3 patterns we found on each politician" / "Top-5 lists, share images, side-by-side pages" / "How we score · sources · fixes we made" |
| L43-53 (PRO list) | "Full Donor → Vote engine (every politician × every tracked vote)" | "Full who-paid-the-vote tool (every politician, every vote)" |
| same | "Full Donor → Bill engine (every active bill × top funding industries)" | "Full who-paid-the-bill tool (every active bill, top donor industries)" |
| same | "Tips → Verdicts AI engine — up to 20 generated reports/month" | "Send us a tip, get an AI-written report. 20 per month." |
| same | "Daily FEC refresh (vs weekly on free)" | "New donor data daily (free version updates weekly)" |
| same | "CSV / JSON / TSV export on every dataset" | "Download any table as CSV, JSON, or TSV" |
| same | "Watchlists + email alerts on verdict changes, new votes, new bills" | "Pick politicians or bills to watch. Email when something changes." |
| same | "API access (10,000 calls/mo)" | "API access — up to 10,000 calls a month" |
| same | "Commercial-use license — cite, embed, republish, build products" | "Reuse rights — quote us, embed our charts, build on our data" |
| same | "30-day comp for working journalists (request via /for-journalists)" | "Free for 30 days if you're a working reporter — ask on /for-journalists" |
| L107-108 | "The directory. Public, primary-sourced, free to read." | "The whole site. Free to read. Every claim has a source." |
| L126 | Tag: "Commercial license included" | "Reuse rights included" |
| L134-139 | "All 4 paid tools, one login. For journalists, content creators, researchers, and policy analysts who turn this data into work that ships. Per the panel: same price as a Substack premium subscription." | "All 4 paid tools. One login. For reporters, creators, and researchers who use this data at work. Same price as a paid Substack." |
| L168 | "Save $141 — $399 / year" | Keep — priced + concrete. |
| L177 | "Join the bundle waitlist →" | "Join the list — lock $45/mo →" |
| L184 | "Or submit a tip free (sample) →" | "Or send a free tip first →" |
| L188-191 | "Cancel any time · Commercial license included while active" / "Pre-launch · founder rate locks at signup · 30-day comp for journalists" | "Cancel any time. Reuse rights while you're paying." / "Coming soon. $45 price locks when you sign up. Free 30 days for reporters." |
| L207 | "What Pro actually looks like" | "What the $45/mo plan looks like" |
| L210 | "Three previews. Each is a real Pro view." | "Three real previews. Not mockups." |
| L213-215 | "These are not mockups. Each Receipt below renders the actual schema and copy of a Pro-tier view — what you see is what you get on day one of your subscription." | "These are real Pro screens. What you see is what you get on day 1." |
| L222 | "Preview 1 · Donor-to-vote engine" | "Preview 1 · Who paid the vote" |
| L227 | "Sen. Joe Manchin — pharma alignment, 117th–118th Congress" | Keep, but "pharma alignment" → "drug-company voting record" in the title. |
| L237-244 | "Each row links to the bill on Congress.gov, the roll-call, and the OpenSecrets donor page. Full table shows all 14 votes filterable by industry / Congress / vote direction. CSV export, alerts on new alignment rows, and the commercial license to embed this chart in your piece are included with Pro." | "Each row links to the bill on Congress.gov, the vote, and the OpenSecrets donor page. The full table shows all 14 votes. You can filter, sort, download as CSV, get email alerts, and embed this chart in your story." |
| L253 | "Preview 2 · Bill money-trail engine" | "Preview 2 · Who paid the bill" |
| L269-275 | "Pro shows the full co-sponsor table, each co-sponsor's individual top-5 industries, alerts when a tracked bill changes status, and the source links to OpenSecrets bundling + FEC industry rollups. Every active bill has one of these breakdowns." | "Pro shows every co-sponsor and their top 5 donor industries. Email alerts when a bill moves. Sources link to OpenSecrets and FEC. Every active bill has one of these." |
| L284 | "Preview 3 · Real-time alerts (email + Slack)" | "Preview 3 · Alerts in email or Slack" |
| L289 | "Alert · Sen. Manchin voted on H.R. 5376" | Keep. |
| L293 | "Yea — against top donor industry (pharma)" | "Voted yes — against his top donor industry (drug companies)" |
| L295 | "your inbox + #cr-alerts Slack channel · within 4h of roll-call" | "Your inbox + Slack channel · within 4 hours of the vote" |
| L300-304 | "Subscribe to alerts on any subset of the 585 politicians or any active bill. Email + Slack webhook. Cite the alert with the same stable RCPT-ID you'd cite the verdict page itself — the alert is the receipt for your story." | "Get alerts on any politician or any bill. By email or Slack. Each alert has a stable ID you can cite in your story." |
| L317-319 | "A story-generator, not a lookup tool. Donor-to-vote alignment is the single most valuable paywall feature." | Keep — it's a sourced pull-quote, leave the speaker's voice. |
| L346 | "Redeem it for 30 days of Pro access." | "Use it for 30 free days of Pro." |

### Navigability check

Primary purpose: pick a plan + waitlist OR redeem code. Path:
- Land → see headline → scroll to Free/Bundle cards → click Bundle CTA →
  scroll to waitlist form. 2 actions if CTA scrolls to anchor. **OK**.
- "Or submit a tip free" cross-link is good — gives a $0 path to value.

Three Receipt previews are a strong proof block but **push the waitlist
form below the fold by ~3 screens on mobile.** Spec: move previews to a
collapsible "See sample previews" disclosure OR shorten to 1 preview
above the form. (Designer + engineer call.)

### CTA audit

- "Join the bundle waitlist →" — **fail** ("bundle" = jargon). Fix:
  "Join the list — lock $45/mo →".
- "Or submit a tip free (sample) →" — **soft fail** ("sample" parenthetical
  confusing). Fix: "Or send a free tip first →".
- "Subscribe — $45 / month" — OK.
- "Save $141 — $399 / year" — OK.
- "You're on Pro — open dashboard →" — OK.
- "Redeem it" headline — fine; ensure the form's button is verb-led
  ("Redeem code →" not "Submit").

### Mobile-first check

- Two-up plan cards stack vertically — OK.
- Receipts at 760px max — OK at desktop; mobile they overflow on small
  screens because of long industry names in `rows`. Designer flag.
- Sentence law violations: hero body (56 words), FEATURES_PRO bullets
  (avg 14 words, OK), preview verdictCopy blocks (50+ words each).

### Top 3 changes ranked by impact

1. **Hero body rewrite (L80-88).** Owner: orchestrator. Highest impact
   because a 56-word run-on sentence at the top kills comprehension.
2. **Rewrite FEATURES_FREE + FEATURES_PRO arrays.** Owner: orchestrator.
   These are the actual "what do I get" lines users scan. Half use
   internal product names (Donor→Vote, Donor→Bill, Tips→Verdicts) that
   no first-time visitor knows.
3. **Move Receipt previews below the waitlist form OR collapse to 1.**
   Owner: designer + engineer. Today the waitlist form is ~4 scrolls
   down on mobile. Highest-converting page element should be at top of
   funnel, not bottom.

---

## Page: `/donor-to-vote` — `app/donor-to-vote/page.tsx`

### First-5-seconds report

3rd-grader sees:
- Eyebrow "Engine · waitlist" — **fails**. "Engine" = car part.
- Headline "Donor → Vote. Every alignment, scored." — **fails**.
  "Donor → Vote" is internal jargon; "alignment" is undefined.
- Body: "How often does each politician vote with their top donor
  industry? Across every politician, every industry, every roll-call." —
  the question is GOOD. The list-of-three is dense.

What they DON'T understand: that this is a paid tool, what
"alignment," "roll-call," and "industry" mean.

### Reading-level violations

| Line | ❌ Current | ✅ Rewrite |
|---|---|---|
| L21 | "Engine · waitlist" | "Paid tool · join the list" |
| L23-24 | "Donor → Vote. Every alignment, scored." | "Who paid the vote. Every politician, every industry." |
| L26-30 | "How often does each politician vote with their top donor industry? Across every politician, every industry, every roll-call. Sortable, filterable, alerts when a politician votes against their donors." | "How often does each politician vote with the industries that paid them? We score every politician, every industry, every vote. You can sort, filter, and get an alert when a politician votes against their donors — that's the real story." |
| L31-35 | "Free hook (already on every politician page): the single most-aligned + most-broken donor industry, as a 'Manchin: 78.6% with pharma' stat. Full engine: every cell of the matrix." | "Free on every politician page: their single most-aligned and least-aligned donor industry (e.g. 'Manchin votes with drug companies 78.6% of the time'). The paid tool shows every politician × every industry." |
| L42 | "Sample · what subscribers see" | "Sample · what paying users see" |
| L46 | "One politician × one industry, fully scored." | "One politician × one industry. Fully scored." |
| L52 | "Joe Manchin × Pharmaceutical Manufacturing — 14 roll-call sample" | "Joe Manchin × drug companies — 14 votes scored" |
| L54 | Tag "Pro engine" | Tag "Paid tool" |
| L58 | "Industry · Pharmaceutical manufacturing" | "Industry · Drug companies" |
| L59 | "Top recipient rank (D) · #1 — $847,200 over last 6 cycles" | "Most-paid Democrat by this industry · #1 — $847,200 over 12 years" |
| L60 | "Sample size · 14 roll-call votes flagged as industry-aligned" | "Votes scored · 14 votes where this industry took a side" |
| L61 | "Aligned with donor position · 11 of 14 (78.6%)" | "Voted with the industry · 11 of 14 (78.6%)" |
| L62 | "Notable break · IRA drug-pricing provisions — voted yes despite donor opposition" | "When he broke with them · He voted YES on the 2022 drug-pricing law — the industry was against it." |
| L66-70 | "Each row links to the bill on Congress.gov + the roll-call record + the donor page on OpenSecrets. Full table shows every vote with industry/Congress/vote-direction filters + CSV export." | "Every row links to the bill, the vote record, and the donor page. The full table lets you filter by industry, by Congress, and by how the politician voted. CSV download included." |
| L81 | "What subscribers get" | "What you get for $45/mo" |
| L83-85 | "The matrix every reporter wishes they had." | "The lookup every reporter wishes they had." |
| L87 | "Every politician × every industry. ~585 × ~20 industries = ~12,000 alignment cells, scored against ~64,000 roll-call votes." | "585 politicians × 20 industries. About 12,000 scored cells, built from 64,000 votes." |
| L88 | "Filter + sort. Most-aligned · most-broken · biggest cohort · by Congress · by chamber." | "Filter and sort. Most-aligned. Least-aligned. Biggest groups. By Congress or House/Senate." |
| L89 | "Alerts on vote-against-donor. Email when a tracked politician votes against their top donor industry — that's the moneymaking story." | "Vote-against-donor alerts. Email when a politician votes against the industry that paid them most. That's where the story is." |
| L90 | "Weekly Friday digest. Top 5 newly-flagged alignments + biggest swings of the week." | "Friday email. Top 5 new patterns and biggest swings of the week." |
| L91 | "CSV + API + commercial license. Embed alignment charts in paid newsletters; cite in reporting." | "CSV + API + reuse rights. Embed our charts in your paid newsletter. Cite us in stories." |

### Navigability check

Primary purpose: get visitor onto the waitlist for this engine. Path:
land → scroll past sample Receipt → scroll past 6-bullet list → waitlist
form. 3 scrolls. **OK on desktop, marginal on mobile.**

Missing: a "back to pricing" or "see all tools" link so a curious
visitor doesn't dead-end here.

### CTA audit

Only one CTA on the page (the CompRequestForm at bottom). No mid-page
CTA. **Fix:** add a "Join the list →" button anchor-linking to the form
at the END of the sample Receipt — converts the visitor who already
believes after seeing the receipt.

### Mobile-first check

- Sample Receipt rows have long industry names — same overflow risk as
  pricing.
- 6-bullet list at L86-92 — each bullet is one sentence under 20 words.
  OK but bullet 1 reads like a math problem.

### Top 3 changes ranked by impact

1. **Rename "Donor → Vote" to "Who paid the vote" in H1 + tag +
   eyebrows.** Owner: orchestrator. Highest impact because "Donor →
   Vote" is internal taxonomy that means nothing on first read.
2. **Add mid-page CTA after sample Receipt.** Owner: engineer (insert
   `<a href="#waitlist-form">`-style button). Converts the receipt-
   convinced visitor before they get the bullet wall.
3. **Replace jargon throughout the Receipt rows** (alignment,
   roll-call, donor position, industry-aligned). Owner: orchestrator.
   This is the proof artifact; if it reads like a 10-K, it doesn't
   prove value to a 9-year-old.

---

## Page: `/donor-to-bill` — `app/donor-to-bill/page.tsx`

### First-5-seconds report

3rd-grader sees:
- "Engine · waitlist" — same fail as `/donor-to-vote`.
- Headline "Donor → Bill. Follow the money behind the legislation." —
  the second sentence is the useful one. Lead with it.
- Body: list-of-five filters in one sentence. Adult-paper density.

What they DON'T understand: same as Donor→Vote — internal product name,
"sponsor + co-sponsor," "aggregated across," "industries."

### Reading-level violations

| Line | ❌ Current | ✅ Rewrite |
|---|---|---|
| L21 | "Engine · waitlist" | "Paid tool · join the list" |
| L23-24 | "Donor → Bill. Follow the money behind the legislation." | "Who paid the bill. Follow the money behind every law." |
| L26-30 | "For every active bill: which donor industries are behind the sponsor + co-sponsor set? Aggregated across the sponsors' top-5 industries. Sortable by total dollars, by industry, by status, by chamber." | "For every bill in Congress right now: which industries paid the politicians who wrote and signed it? We add up the top 5 donor industries across the whole group. Sort by total dollars, by industry, by status, or by House/Senate." |
| L31-34 | "Free hook (already on individual politician + bill pages): the #1 industry behind each sponsor's coalition. Full engine: full breakdown + alerts." | "Free on each politician and bill page: the #1 industry behind the people who wrote it. The paid tool shows the full breakdown and email alerts." |
| L42 | "Sample · what subscribers see" | "Sample · what paying users see" |
| L46 | "One bill × every industry behind it." | "One bill. Every industry behind it." |
| L52 | "H.R. 5376 — Inflation Reduction Act · money trail behind 83 co-sponsors" | Keep — concrete + named. |
| L54 | Tag "Pro engine" | Tag "Paid tool" |
| L55 | "Co-sponsors · 83 (House)" | "Co-signers · 83 House members" |
| L56-59 | "#1 industry behind sponsor set · Electric utilities — $4.2M over last 6 cycles" / "#2 industry · Environmental orgs — $3.1M" / "#3 industry · Health professionals — $2.7M" / "#4 industry · Building trades unions — $2.3M" | "#1 industry · Power companies — $4.2M over 12 years" / "#2 · Environmental groups — $3.1M" / "#3 · Doctors and nurses — $2.7M" / "#4 · Construction unions — $2.3M" |
| L60 | "Vote breakdown · 220–207 (House) · 51–50 (Senate, VP tiebreaker)" | "How the vote went · 220–207 House · 51–50 Senate (VP broke the tie)" |
| L65-70 | "Pro shows the full co-sponsor table, each co-sponsor's individual top-5 industries, alerts when a tracked bill changes status, OpenSecrets bundling + FEC industry-rollup source links. Every active bill has one of these breakdowns automatically." | "The paid tool shows every co-signer and their top 5 donor industries. Email alerts when a bill moves forward. Sources link to OpenSecrets and FEC. Every active bill has one of these." |
| L81 | "What subscribers get" | "What you get for $45/mo" |
| L83-85 | "The 'who's funding this bill' lookup for every active bill." | Keep — already plain-English. |
| L87 | "Every active bill, indexed by industry behind it. Sort by total dollars; filter by industry, status, chamber, year." | "Every active bill, sorted by the industries paying for it. Filter by industry, status, House/Senate, or year." |
| L88 | "Co-sponsor money breakdown. Click any co-sponsor → their top-5 industries instantly." | "Co-signer money. Click any co-signer to see their top 5 donor industries." |
| L89 | "Bill-status alerts. When a tracked bill moves (introduced → committee → floor → vote → law), 4h notification." | "Bill-move alerts. When a bill you're watching moves to the next step, we email you within 4 hours." |
| L90 | "Friday digest. Top 5 active bills by industry concentration this week." | "Friday email. Top 5 bills with the heaviest industry money this week." |
| L91 | "CSV + commercial license. Republish charts in paid newsletters; cite in stories." | "CSV + reuse rights. Republish our charts. Cite us in stories." |
| L92 | "Watchlist by industry. 'Alert me when any bill with pharma-money > $3M moves' → email." | "Watch an industry. Example: 'Email me when any bill with $3M+ in drug-company money moves.'" |

### Navigability check

Same as Donor→Vote: single CTA at bottom, no mid-page CTA, no
cross-link to the sibling Donor→Vote page.

**Fix:** add a "Also see who paid the vote →" link at the page bottom
(or in a footer band) so the two engine pages cross-pollinate.

### CTA audit

Same critique as Donor→Vote — only one CTA, at the bottom. Add a
mid-page anchor button after the sample Receipt.

### Mobile-first check

- Long body sentence at L26-30 (40 words, four "by-X" clauses) — fails
  sentence law. Rewrite above splits it.
- 6-bullet list, same shape as Donor→Vote.

### Top 3 changes ranked by impact

1. **Rename "Donor → Bill" to "Who paid the bill" in H1 + tags + body
   throughout.** Owner: orchestrator. Same root issue as Donor→Vote.
2. **Plain-English the industry labels** ("Pharmaceutical
   manufacturing" → "Drug companies"; "Electric utilities" → "Power
   companies"; "Health professionals" → "Doctors and nurses"). Owner:
   orchestrator. These show up in the proof artifact and the rest of
   the site. May warrant a small `lib/industry-labels.ts` mapping.
3. **Add mid-page CTA + cross-link to `/donor-to-vote`.** Owner:
   engineer. Two paid tools that share an audience should link to each
   other.

---
