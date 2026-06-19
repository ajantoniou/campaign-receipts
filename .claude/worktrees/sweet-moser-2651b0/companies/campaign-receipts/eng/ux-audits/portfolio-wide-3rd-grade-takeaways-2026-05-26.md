# Portfolio-Wide 3rd-Grade Takeaways

Author: Web UX Director (Campaign Receipts)
Date: 2026-05-26
Audience: NTO, SEALED, EstimateProof, HealthBrew site owners + CEOs.
Source: 4-page audit of campaignreceipts.com (see sibling doc).

Five patterns I found over and over again on CR that apply across
the portfolio. Same fixes, different surfaces.

---

## 1. Kill internal product names on public pages

CR shipped "Donor → Vote engine," "Donor → Bill engine," "Tips →
Verdicts," "Bundle," "Pro." None of these mean anything to a cold
visitor. Internal names = internal docs. Public pages get
plain-English: "Who paid the vote." "Who paid the bill." "Send us a
tip — we'll write a report." "$45/mo plan."

**Where this hits the portfolio:**
- **EstimateProof:** "estimate-to-claim pipeline," "AOL workbench,"
  "buyer report" — every one of these is internal taxonomy.
  Public copy: "Get your estimate paid faster." "Send the buyer a
  report."
- **SEALED:** "the 145-promise corpus," "graded vs pending" — same
  problem. Public copy: "All 145 promises Trump made in 2016." "Done
  vs still waiting."
- **HealthBrew:** "inspiration video pipeline," "Ep.N" — fine
  internally, but if any of that leaks to the description page or
  channel-about, kill it.
- **NTO:** if NTO ships a website, audit the homepage before launch
  for "production pipeline," "tier-N," "canonical" — all founder/dev
  language.

**Rule:** if it's a JIRA ticket label, a Notion page title, or a
Supabase table name, it cannot appear on a public page.

---

## 2. Buttons must be verb + thing, never "Learn more" or "Get started"

CR shipped "Read more →" (read more about what?), "See what the
Bundle unlocks" ("unlocks" + undefined noun), "Open the dossier"
(FBI-show jargon). All replaced with verb + specific noun.

**Where this hits the portfolio:**
- **EstimateProof:** check every CTA for "Get Started" — replace with
  "Upload your estimate" or "See a sample buyer report."
- **SEALED:** "Read more about SEALED" is on CR's homepage today.
  Replace with "See what's in the book." If SEALED's own marketing
  pages use "Learn more," same fix.
- **HealthBrew + NTO:** YouTube channel CTAs should never be "Watch
  more" — be "See the new episode" or "Watch Ep.N."

**Rule:** every button is `[verb] [the specific thing the click
delivers]`. Max 4 words. No exceptions.

---

## 3. Hero body paragraphs are 30-50 words too long

CR's homepage hero body was 38 words in ONE sentence with a
semicolon. Pricing hero body was 56 words in one paragraph with two
em-dashes and four product names. Every site I see in the portfolio
does this.

**Rule (mirror the script-writer's sentence law):**
- Headlines: ≤8 words.
- Body sentences: ≤15 words, max 3 sentences per paragraph.
- Buttons: ≤4 words.
- Tooltips: ≤12 words.

**Where this hits the portfolio:**
- **EstimateProof:** the "support diagnosis, not replace" repositioning
  must land in a ≤15-word headline. Today's marketing pages run long.
- **SEALED:** book-description copy. Same fix.
- **NTO + HealthBrew websites (if any):** every hero on every page.

---

## 4. Define jargon inline on FIRST USE — or don't use it

CR uses "FEC," "PAC," "IE," "co-sponsor," "roll-call," "scorecard,"
"alignment" without first-use gloss on a free page. Every one is a
5-second exit risk. The fix is small: first use gets
`(plain-English gloss)`. Subsequent uses can run unglossed.

**Pattern that works:** "ad money the candidate never touches (we
used to call this 'independent expenditures')" — gives the curious
reader the technical term to look up later, while keeping the read
moving.

**Where this hits the portfolio:**
- **EstimateProof:** "supplement," "shop pack," "DRP" (direct
  repair program) — auto-body insurance jargon. Every one needs an
  inline gloss the first time it appears.
- **SEALED:** "verdict," "graded," "primary source" — gloss on first
  use of each.
- **HealthBrew + NTO:** content pipelines themselves use plain
  English in scripts; ensure the website mirrors it.

---

## 5. One primary CTA per page. At most one secondary.

CR's homepage today has ~12 CTAs above the fold (hero buttons +
trending receipts strip + 5-card showcase + 4-card leaderboards +
worst-of-week + …). That's not "more conversion paths," that's
"none of them is the path." Same for pricing — 3 CTAs in the Bundle
card + waitlist + comp + redeem code = paralysis.

**Rule:**
- Every page has ONE primary CTA + AT MOST one secondary.
- Surface cards (leaderboards, receipts) are NOT CTAs — they're
  navigation. Don't style them like buttons.
- Mid-page CTAs ("after the sample Receipt → join the list") are
  fine because they're context-sensitive. Two side-by-side CTAs in
  the hero are not.

**Where this hits the portfolio:**
- **EstimateProof:** the buyer-report sample page is good — one
  primary (download sample) + one secondary (talk to us). Keep it
  that way. The homepage may have crept past 2.
- **SEALED:** book pages should be: "Get the book — $15" primary,
  "Read sample chapter" secondary. Nothing else.
- **HealthBrew + NTO:** every video description and channel page
  needs the same discipline.

---

## How to operationalize this across the portfolio

1. Each company's CEO agent runs the 3rd-grade-website checklist
   over their homepage + pricing + top 2 product pages monthly.
2. Any new public page goes through Web UX Director review before
   ship — same gate Brand/Design Lead already runs.
3. If a hire pushes back with "but the audience is sophisticated,"
   reread the founder's lock: Bloomberg charges $24K/year. We don't.
   Sophistication is a paid-product feature.

---
