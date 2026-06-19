# Concise Turnaround — Vision Document

**Status:** Active (launching weekend of 2026-05-02/03)
**Budget cap:** $250
**Founder time/wk:** <1 hr (no execution; founder approves brand
direction, controversial cover decisions, monthly P&L; founder ALREADY
wrote the books)

## What this company is

Turn around founder's existing **$200/mo Amazon book business** by:
1. Repackaging existing IP outside Amazon as direct-sale PDFs
2. Optimizing distribution beyond Amazon's constraints
3. Pivoting strategy based on what actually sells

**Existing assets (founder's Google Drive structure):**
- Parent folder: `Demiurgic` (LLC owning Concise pseudonym brand)
  - `Concise Reads` — main book inventory (20+ titles)
  - `Grabit Nation` — Trump election promises book (working title;
    can be renamed for direct-sale launch)
  - `Classic Titles` — Ben Franklin's 13 Virtues + companion titles
- 20+ books published under pseudonym for 10 years on Amazon at
  $200/mo
- MCAT prep books (founder is board-certified physician — credibility
  moat)
- All revenue routes through **Demiurgic Labs LLC** for tax purposes

**KDP credentials handling (CRITICAL):**
- Founder does NOT share KDP login with agents (Amazon ToS + security
  reasons)
- Saturday: founder uploads relevant manuscript files to Supabase
  Storage from above Drive folders
- Agents have read-only access to local files
- Amazon listings stay unchanged; agents do NOT touch KDP
- Email + password for Demiurgic Gmail goes in `.env` (founder's
  approach: "save in env so agents can manage email correspondence
  if needed")

## Why this company is in the active portfolio

### Existing revenue + existing IP = lowest-risk active company

- **$200/mo for 10 years** is signal that the audience exists for
  *something* in this catalog
- **20+ books already written** — no content production burden
- **Founder's MD credential** is leverageable on MCAT books and any
  health-adjacent content
- **Fast to first dollar (week 2-3)** — Stripe + landing page + PDF
  delivery ships in week 1; first PDF sales follow

### Founder said it: "no one buys books anymore"

True for new entrants. But existing IP + existing audience signal +
direct-sale margin (70-80% vs Amazon's 30-70%) creates a different
math:
- $200/mo on Amazon at ~50% royalty = ~$400/mo gross sales
- Same gross moved to direct = ~$320/mo to founder (after Stripe ~3%)
- Same gross + bundle pricing + non-Amazon-restricted promotional
  freedom = potentially 2-5x growth

This isn't a "build new market" play. It's a "extract more value from
existing market" play.

## Phase 1 (week 1-4): Repackage existing IP outside Amazon

### Inventory step
- Pull 20+ titles from CONCISE Drive folder
- Categorize by genre, audience, current Amazon performance
- Identify top 3 candidates for direct-sale launch:
  - **MCAT books** (high-value buyer, MD credential moat)
  - **Trump election promises book** (controversial = potential
    direct-sale viral angle)
  - **Best-performing general advice titles**

### MCAT books — primary direct-sale push

**Why MCAT first:**
- AAMC has 80K+ MCAT test-takers/year
- Pre-med students spend $500-3000 on MCAT prep
- MD-credentialed author = trust signal Amazon cover doesn't surface
- Bundle pricing impossible on Amazon (each book separate)
- Direct sale enables: bundle of 3 MCAT books at $49-99 vs $19/each
  on Amazon

**Direct-sale format:**
- Premium PDF bundles
- "Authored by board-certified physician"
- Free first-chapter PDF as lead magnet
- $49-99 bundle (vs $57-95 if buying individually on Amazon)
- 5-10x revenue uplift potential vs Amazon-only

### Trump book — controversial direct-sale test

**The opportunity:**
- Trump book has political content that Amazon constrains (algorithm
  suppression of polarizing content)
- Direct sale removes Amazon's content controls
- **Founder mentioned a Palestine flag cover idea** as a marketing
  angle

**Brand/Design's job:**
- Propose 3-5 cover variants:
  - Standard (book content as-is, neutral cover)
  - Palestine flag cover (founder's idea)
  - Other politically-charged variants
- Founder approves the cover direction (founder owns this decision —
  political content is personal)
- $9-19 PDF price point

**Real risks the founder must own:**
- Controversial covers attract attention (good + bad)
- Some payment processors decline politically charged products
  (Stripe usually OK, but verify)
- Brand impact on other Concise products if controversial cover
  goes viral negatively

**Honest reframe:** A Palestine flag cover isn't a marketing trick.
It's a political statement. Founder must own that publicly. If founder
isn't willing to publicly defend the cover under their pseudonym (or
real name), don't ship it. **Brand/Design surfaces the trade-off
explicitly; founder decides.**

### Other titles — repackage as bundles or individual PDFs

- General advice books — repackage as themed bundles ("3-book Concise
  Wisdom Pack")
- Continue Amazon for existing titles in parallel (don't kill the
  $200/mo)

## Phase 2 (week 4-12): SEO + content funnel

### Per-book landing pages
- Each direct-sale book gets a landing page
- First chapter free PDF → email signup → buy
- Stripe Payment Link checkout
- Email follow-up sequence (3-5 emails)

### Distribution channels (organic)
- TikTok / Instagram Reels: clips from books drive traffic
- Reddit organic in book-specific subs:
  - r/MCAT (highly engaged pre-med students; promotion rules vary —
    follow the sub's rules)
  - r/politics or r/news (for Trump book — probably won't allow
    promotion; soft approach only)
  - General self-improvement subs for advice books
- Founder's existing Twitter / pseudonym social presence (if any)
- Affiliate partnerships with content creators

### Email list as moat
- Capture email on every book landing page
- Nurture sequence: welcome → relevant excerpt → cross-sell other
  Concise titles
- Goal: 500-1500 email subscribers by day 90

## Phase 3 (month 3+): Pivot evaluation

Based on Phase 1-2 data:

- **IF book direct-sales grow consistently:** continue book
  repackaging, write new ones (founder is author, agents handle
  production/marketing)

- **IF book market truly dead:** pivot to AI coach (but only if data
  says yes; not v1)

- **IF general advice books resonate:** write new titles in "Concise"
  voice. Founder mentioned concepts:
  - "How not to be an asshole"
  - "Making Dating Great Again"
  - Other contrarian advice books

  These are content products founder writes; agents handle production
  + marketing.

- **IF a single book disproportionately dominates revenue:** invest in
  series expansion (sequel, course, related products)

**Pivot evaluation cadence:** Monthly. McKinsey advisor + CEO present
data; founder decides direction.

## Voice/tone

The brand is "Concise" — punchy, direct, no fluff. Core voice fingerprint:
- Short sentences when impact matters
- No academic verbosity
- Specific examples over abstract principles
- Authoritative where credential applies (MCAT)
- Sometimes contrarian (Trump book, "How not to be an asshole" pivot)
- Never preachy

## Sales channels (all agent-run)

### Channel A: Direct PDF sales (primary, ships week 1)
- Stripe Payment Links
- Simple landing pages per book
- Bundle pricing (Amazon-impossible)

### Channel B: Continued Amazon sales (preserve $200/mo)
- DON'T kill existing Amazon listings
- Track separately in P&L
- Optimize Amazon SEO if quick wins exist

### Channel C: TikTok / Instagram organic (week 2+)
- Clip-style content from books
- "Did you know..." / "5 things..." formats
- Drive to landing page

### Channel D: Reddit organic (week 2+)
- r/MCAT (high-intent, requires careful promotion adherence)
- General-interest subs for advice titles
- Helpful comments first; soft-link only after trust

### Channel E: Email list nurture (built throughout)
- Capture on every page
- Cross-sell other Concise titles
- 30%+ open rate target

### Channel F: Affiliate (Phase 2+)
- Partnership with pre-med tutors / content creators (MCAT)
- Partnership with political content creators (Trump book — careful
  with brand match)
- 30% commission per sale

## 90-day target

| Revenue line | Day 90 target |
|---|---|
| Existing Amazon ($200/mo continues) | $200 MRR |
| Direct PDF sales (mix of MCAT + Trump + bundles) | $200-800 new MRR |
| Email subscribers | 500-1,500 |
| Total Concise revenue | **$400-1,000/mo MRR** |

That's 2-5x existing revenue, low-effort, with high upside if pivots
hit.

## Risks

1. **Books market is dying** (founder noted: "no one buys books
   anymore"). Direct sales may not significantly outperform Amazon.
2. **Trump book controversial covers** — Brand/Design proposes;
   founder approves knowing the trade-off. Could attract press
   (good or bad).
3. **Existing Amazon revenue could erode** if direct-sales cannibalize
   without growing total demand. Mitigation: track Amazon MRR
   separately; keep both channels active.
4. **Pseudonym vs real name** — founder uses pseudonym on Amazon.
   Direct sales may force a choice: maintain pseudonym (lower trust)
   OR reveal real name + MD credential (higher trust on MCAT books,
   but ties controversial content to professional identity). Founder
   owns this decision.
5. **Stripe payment processing for controversial content** — Stripe
   usually OK with political books, but verify. Backup: Gumroad
   (simpler payment processor).

## Kill criteria

- $125 cumulative spend (50% of $250 cap) AND 0 direct-sale revenue
  by day 30 = orange (review acquisition)
- $187 cumulative spend (75%) AND <$50 direct-sale revenue by day 60
  = red (founder review)
- 90 days post-launch with <$200 new direct-sale MRR (i.e., not
  doubling existing) = research-only mode (preserve in case future
  pivot ideas resonate)

## Org chart (light team — no engineering team needed)

Concise needs minimal infrastructure. Single CTO seat handles all
engineering.

| Role | Model | Owner |
|---|---|---|
| CEO | Opus 4.7 | Strategy, pivot decisions |
| CTO (light, single seat) | DeepSeek V4-Pro / Haiku | Landing page, Stripe, PDF delivery, email integration |
| Head of Growth | DeepSeek V4-Pro / Haiku | Reddit, TikTok, SEO, Twitter |
| Brand/Design | DeepSeek V4-Pro / Haiku | Cover redesigns, voice, bundle visual identity |
| Chief Accountant | DeepSeek V4-Pro / Haiku | $250 cap, P&L (Amazon vs direct tracking) |
| McKinsey + YC Advisors (shared) | Opus 4.7 | Weekly review |

**No Sales & Partnership** (B2C, content-driven). **No Theology
Editor** (not religious). **No engineering team beyond light CTO.**
**No compliance specialists** beyond founder reviewing controversial
covers.

Smallest team in active portfolio.

## Specific founder decisions in Week 1

1. **Brand direction for Concise:** keep current pseudonym branding,
   or reveal MD credential, or hybrid (pseudonym for some, real name
   for MCAT)?
2. **Trump book cover:** standard, Palestine flag, or other variant?
   (Brand proposes 3-5; founder owns the political statement.)
3. **Top 3 books for direct-sale launch:** founder ranks based on
   personal sense of audience demand + book quality.
4. **Pivot signals:** what data would make founder greenlight AI coach
   pivot vs new general-advice books vs neither?

## Documents in this folder

- `vision.md` (this file)
- `kickoff-brief.md` — Paperclip first all-hands prompt
- `permissions-and-configurations.md` — full API/tool inventory
- `issues-backlog.md` — pre-loaded work queue
- `week-1-plan.md` — day-by-day Saturday → Friday
- `personas/` — role-specific agent prompts (5 personas)
- `pnl/` — Chief Accountant ledger (separate Amazon vs direct columns)
- `content/` — book metadata, cover assets, landing page copy
- `brand/` — brand book, cover variants
- `deploys/` — engineering deploy log
