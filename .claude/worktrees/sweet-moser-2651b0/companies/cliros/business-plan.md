# 1Search — Business Plan

*Last updated: May 23, 2026*
*Company name: 1Search (logo: the number 1)*
*Working tagline: "Every search. One platform. Instant."*

---

## Vision

**1Search starts as a title search tool. It becomes the trust verification layer for every transaction on earth.**

Every transaction between humans requires answering "can I trust this?" — Is this property clean? Is this entity real? Can this person pay? Are these assets legitimate? Today those questions are answered by fragmented, slow, expensive legacy companies (title insurers, credit bureaus, due diligence firms) using 1990s technology. 1Search builds the AI-native answer engine — starting with property, expanding to all asset and entity verification.

**The $100B+ thesis:** S&P Global is worth $150B answering "is this bond safe?" Experian is worth $35B answering "can this person pay?" 1Search answers "is this property / entity / person / asset what they claim to be?" — the AI-native version of the entire trust verification industry.

**Founder timeline: 5-7 years to a $1B+ outcome, not 15.** Build the property search platform (Years 1-3), launch the API (Year 2-3), expand to bundled legal searches (Year 3-4), get acquired or raise growth round at $1-5B (Year 4-5). The global trust layer is the vision that attracts talent, investors, and acquirers — but the founders' exit window is Year 4-6, not Year 15.

**Important clarification:** 1Search is a B2B tool for professionals (attorneys, title agents, investors) — NOT a consumer product for homebuyers. The customer is the person who currently pays $250-350 to an abstractor and waits 3-5 days. We replace the vendor, not the professional.

---

## 1. Company Overview

**Name:** 1Search AI (recommended — see Appendix A for alternatives)

**Tagline:** "Every search. One platform. Instant."

**What it does:** AI-powered platform that aggregates public records — county recorders, courts, Secretary of State, tax authorities, municipal offices — and answers trust questions about properties, entities, and people. Starting with title search reports and Attorney Opinion Letters, expanding to the full stack of legal and due diligence searches, then selling via API to every app that touches real estate, lending, or legal.

**Business model — evolves in 3 phases:**

| Phase | Product | Revenue model | Target buyer |
|---|---|---|---|
| Phase 1 (Year 1-2) | Title search reports + draft AOLs | $100/report + subscription tiers | Attorneys, investors, agents |
| Phase 2 (Year 2-3) | Bundled closing searches + API | $200-400/bundle + API pricing | Attorneys, title agents, proptech apps |
| Phase 3 (Year 3-5) | Full search API infrastructure | $0.50-50/API call + enterprise contracts | Banks, insurers, proptech, legaltech, government |

**Pricing tiers (Phase 1):**

| Tier | Price | Included | Overage | Target |
|---|---|---|---|---|
| Pay-as-you-go | $200/report | Client Closing Brief + AOL + Vault source pack | — | Light users, try-before-you-commit |
| Pro | $499/mo | 10 reports + Vault Pro | $175/ea | Solo attorneys, 5-12 closings/mo |
| Firm | $999/mo | 25 reports + Vault Firm | $150/ea | Small firms, 15-30 closings/mo |
| Vault Pro (storage-only) | $99–149/mo | Unlimited matter storage + 5 report credits | $200/ea | Firms that already ran searches; retention |
| Free trial / beta | $0 | Unlimited during beta preview | — | Feedback cohort (2026) |

**Founders:**
- **Technical cofounder** — builds the AI platform, data pipeline, product, SEO infrastructure, API
- **Attorney cofounder (50/50 partner)** — demand validation, attorney network sales, CLE presentations, regulatory navigation, output quality review. Partnership rationale: accountability partner for sustained execution, domain credibility with buyers, and access to attorney networks. 4-year vesting, 1-year cliff for both founders.

---

## 2. The Problem

### Problem 1: Title search is broken
Every real estate closing in the US requires a title search. Today this works one of two ways:

1. **Abstractor model:** A human drives to the county courthouse or searches county websites manually, traces the chain of title back 30-60 years, and writes up a report. Cost: $250-350. Time: 2-5 business days.

2. **Title company model:** Big Four title insurers (Fidelity, First American) maintain proprietary "title plants" — private databases of county records. They search faster but bundle the search with a $1,500-3,000 title insurance policy with <5% claims rate.

### Problem 2: Every closing requires 5-8 separate searches from 5-8 separate vendors

| Search | Who does it today | Cost | Time |
|---|---|---|---|
| Title search | Abstractors | $250-350 | 2-5 days |
| Judgment/lien search | Search companies | $75-125/name | 1-3 days |
| UCC search | CT Corporation, CSC | $50-100/state | 1-2 days |
| Tax lien search | Search companies | $50-100 | 1-3 days |
| Bankruptcy search | PACER services | $50-75 | 1 day |
| Municipal lien search | Municipal search firms | $100-250 | 3-7 days |
| HOA estoppel | Estoppel companies | $100-299 | 3-10 days |
| Corporate entity search | CT Corporation | $50-150 | 1-2 days |
| Flood certification | Flood cert companies | $15-25 | Instant |
| Zoning/permit report | Zoning report firms | $200-500 | 3-5 days |
| Environmental (Phase I) | Environmental firms | $1,800-5,000 | 2-4 weeks |

**Total spend per closing on searches: $500-1,500+. Nobody bundles them.**

### Problem 3: No standardized data infrastructure exists
No county in the US has a standardized API. Every county has different websites, forms, and search logic. The 22 attorney-mandate states include: AL, CT, DE, DC, FL, GA, KS, KY, ME, MD, MA, MS, NH, NJ, NY, NC, ND, PA, RI, SC, VT, VA.

---

## 3. The Solution

### Phase 1: Title Search Reports + AOLs

1Search AI deploys AI browser agents against county recorder websites to extract property records, then uses LLMs to analyze the chain of title, flag defects, and generate:

1. **Title Search Report** — comprehensive property history, lien summary, chain of title analysis, flagged defects
2. **Draft Attorney Opinion Letter** — Fannie Mae-compliant AOL template pre-filled with search findings, ready for attorney review and signature

The AOL is a document generated by AI — the attorney reviews and signs it, the same way a CPA signs a TurboTax-generated tax return. 1Search does not practice law.

### Cliros deliverable architecture (2026 beta → launch)

**Strategic insight:** Attorneys don't buy software — they buy *things they can hand to a client or file in a matter* without embarrassment. Cliros wins when all three outputs are something a $400/hr closing attorney is proud to attach to an email. The engine is commodity; the *presentation layer* and the *source trail* are the moat.

**Launch bundle — $200/report (bulk tiers at beta exit):**

| Deliverable | Audience | What it is | Build stack |
|---|---|---|---|
| **Client Closing Brief** | Buyer / seller (client-facing) | Luxurious, plain-English property story: timeline, key transfers, lien summary in human language, Street View / map hero, firm branding. Designed so the attorney looks like they spent hours on client care — not a legal dump. | **Claude Design** (layout system, typography, firm white-label) + **Remotion** (render timeline beats, count-ups, source-card reveals → export as PDF pages or short embed). Extends current `homeowner-template.ts` into a premium tier. |
| **Attorney Opinion Letter (AOL)** | Lender / file (attorney-facing) | Fannie Mae B7-2-06 draft with **inline citations to source material** — every chain row, exception, and lien references book/page, instrument ID, or vault document ID. Thorough enough to defend; not a black box. | Persona pipeline (`aol-drafter` + QC). Citations resolve to Cliros Vault objects (see below). |
| **Source Material Vault** | Matter file / discovery | Raw GSCCCA pulls, lien index extracts, federal search JSON, permit rows — stored per report in Supabase Storage (`report_documents`), addressable from dashboard + AOL footnotes. Attorney downloads once; Cliros holds the file. | Already live (`document-storage.ts`, `/api/reports/[id]/sources`). |

**Why Remotion + Claude Design for the client brief (not just HTML→PDF):**

- Static PDFs feel like software output. A **designed closing brief** — timeline arrows that animate in the render, a count-up on years of clean title, a source card flash for the current deed — feels like a *firm deliverable*.
- Remotion compositions already exist in monorepo `/remotion/` (`Timeline`, `SourceCard`, `CountUp`, `VerdictStamp`). Cliros gets a dedicated composition (e.g. `ClirosClosingBrief`) that renders per-property props from `search_reports` JSON → stitched into a multi-page PDF via Playwright or Remotion's PDF pipeline.
- Claude Design defines the **design system** (paper stock palette, serif/sans pairing, receipt-style stat tiles — same family as Campaign Receipts / EstimateProof audit aesthetic) so every firm's white-label variant looks bespoke, not templated.

**AOL ↔ Vault citation model (product requirement):**

```
Chain row in AOL:  "...vested in John Smith per Deed recorded at Book 1234, Page 56 (Vault: DOC-abc123)"
Exception schedule: "Subject to Security Deed... (Vault: DOC-def456; GSCCCA instrument SD-7890)"
```

- Each `report_documents` row gets a stable **vault ID** + human label (deed, SD, cancellation, judgment, etc.).
- AOL drafter persona must emit citations; `step_qc.aol-quality` dimension: `source_cited` (every material statement traceable).
- Dashboard: one screen — Client Brief | AOL | Vault — so the attorney never hunts across tabs.

### Cliros Vault + Matter CRM (membership tier)

**Thesis:** Many solo and small-firm attorneys have no real matter CRM and no disciplined digital file for title work — they use email, Dropbox, and memory. If Cliros already holds every search, AOL, client brief, and raw pull for a property, **storage becomes the retention hook** after report revenue.

| Phase | Vault + CRM | Price | Included |
|---|---|---|---|
| **Beta (now)** | Unlimited matter storage, report history, client share links, feedback loop | **Free** with beta access | All reports free; vault included to drive habit |
| **Launch** | **Vault Pro** | **$99–149/mo** (TBD at beta exit) | Unlimited closed-matter storage, property/party index, closing-date reminders, branded client-brief delivery, share links; **5 report credits/mo** then $200/ea overage |
| **Firm** | **Vault Firm** | **$299–499/mo** | Multi-attorney roster, firm templates, audit log, 15–25 report credits, priority support |

**CRM scope (v1 — intentionally light):** Not Clio. Matter list keyed by property address + closing date + parties; report rerun updates same matter (no duplicate rows — already implemented). Enough that an attorney can answer "what did we pull on 1394 Peachtree?" without opening email.

**Revenue logic:** Report fees ($200) pay for compute + acquisition; **Vault subscription** pays for retention and expands LTV when closing volume is seasonal. A firm doing 8 closings/mo pays ~$1,600 in reports but stays for $149/mo vault because their *client files* live here.

**Beta policy (locked):** Vault + storage free during preview. Communicate in onboarding: *"Storage is free while we're in beta; founding firms get preferred Vault pricing when we launch."*

### Phase 2: Bundled Closing Searches + Add-on Products

One platform replaces 5-8 vendors:

```
Attorney enters property address + owner name
→ ALL searches run simultaneously (5-10 minutes):
  - Title search (county recorder)
  - Judgment/lien search (PACER + state courts)
  - UCC search (Secretary of State)
  - Tax lien search (IRS + state + county)
  - Bankruptcy search (PACER)
  - Municipal lien search (city/town)
  - Corporate entity search (Secretary of State)
  - Flood certification (FEMA)
→ One unified report, one invoice, $200-400
→ Replaces $750+ from 5-8 vendors, delivered in minutes instead of days
```

**Phase 2 add-on products (high-margin, low-build-cost):**

| Add-on | Price | What it does | Gap it fills | TAM |
|---|---|---|---|---|
| **PermitPulled** | $19 | AI scrapes municipal permit records, flags unpermitted renovations (electrical, plumbing, structural) by prior owners. Buyer inherits liability for unpermitted work — title insurance does NOT cover this | No professional in the transaction checks this | ~4M transactions/yr × $19 = $76M |
| **HOAReader** | $39 | Upload 100-500 pages of HOA CC&Rs, bylaws, financials, reserve studies. AI extracts red flags: special assessments coming, underfunded reserves, lawsuit exposure, rental restrictions, pet restrictions | Buyer gets docs 3 days before closing, can't read them. Agents refuse (liability). HOA attorneys charge $500-800 | 30% of US housing = ~1.5M HOA transactions/yr × $39 = $58M |
| **White-label Realtor Reports** | $49/mo | Realtors get branded "[Agent Name] Property Intelligence Report" with their logo on every listing presentation. Includes lien check + permit history + HOA summary | Realtors want differentiation — this makes them look like they did deep research | ~1.5M active agents, target 1% = 15K × $49/mo = $8.8M ARR |

**Why these add-ons matter:** Each fills a gap that NO professional in the transaction currently addresses. The title company doesn't check permits. The buyer's agent won't read HOA docs. The attorney focuses on title, not building permits. These are genuine blind spots.

### Phase 3: Search API Infrastructure

Every application that touches real estate, lending, or legal calls 1Search's API:

```
API call: POST /v1/search
{
  "address": "123 Main St, Atlanta, GA 30301",
  "owner": "John Smith",
  "searches": ["title", "judgment", "ucc", "tax", "bankruptcy", "municipal"]
}

→ Returns structured JSON with all findings
→ Billed per call: $0.50 - $50 depending on search depth
```

**Who calls the API:**

| Customer | Why | Volume | Price/call |
|---|---|---|---|
| Qualia, Clio, CosmoLex | Embed searches in their workflow | Millions/yr | $5-20 |
| Zillow, Redfin, Realtor.com | Property history on listings | Tens of millions/yr | $0.50-2 |
| Blend, Better, LoanDepot | Instant title check at loan origination | Millions/yr | $10-30 |
| Banks (JPMorgan, Wells) | Underwriting, collateral verification | Millions/yr | $20-50 |
| Insurance companies | Risk assessment | Millions/yr | $5-15 |
| Hedge funds, REITs | Portfolio due diligence | Hundreds of thousands/yr | $10-50 |

---

## 4. Market Size

### Phase 1 market: Title search

| Metric | Number |
|---|---|
| US home sales (2024) | ~4 million transactions |
| Title insurance industry revenue | $17.1B/year |
| Mandatory attorney closing states | 22 states |
| Estimated RE attorneys in those states | ~50,000+ |
| Abstractor market | ~$1-2B/year |

### Expanded customer base (not just attorneys)

| Customer segment | Est. size | Use case | Willingness to pay |
|---|---|---|---|
| RE attorneys (attorney states) | ~50,000 | Closings, AOLs | $100/report |
| Title agents / abstractors | ~10,000 | Replace manual search | $100/report |
| RE investors | Millions (BiggerPockets) | Due diligence before buying | $50-100 |
| RE agents / brokers | ~1.5M active | Pre-listing lien check | $25-50 |
| Wholesalers / flippers | ~100,000 | Quick title check before contract | $25-50 |
| Mortgage brokers | ~50,000 | Pre-qualify property | $50-100 |

### Phase 2 market: Bundled closing searches
- 4M residential transactions/yr x $300/bundle = **$1.2B**
- 500K commercial transactions/yr x $2,000/bundle = **$1.0B**
- **Total closing search TAM: $2.2B/year**

### Phase 3 market: API + all legal searches
- CT Corporation / Wolters Kluwer due diligence market: **$5B+**
- CT Corporation alone serves 75% of Fortune 1000, 70% of NLJ Top 250 firms
- Broader trust verification market (credit, identity, asset, entity): **$300B+/year**

### Product tiers for expanded customer base

| Product | Price | Buyer |
|---|---|---|
| Quick lien check (liens + judgments only) | $25-50 | Investors, agents, wholesalers |
| **Full closing package** (Client Brief + AOL + Vault sources) | **$200/report** | Attorneys, title agents |
| Full title search report (attorney-only, no client brief) | $150 | Internal / investor use |
| **Vault Pro** (storage + light CRM + credits) | **$99–149/mo** | Attorneys retaining matter files on Cliros |

---

## 5. Competitive Landscape

### Direct Competitors

| Company | What they do | Pricing | Weakness |
|---|---|---|---|
| **National Attorney Title** (Tony Roveda, 2025) | AOL provider with insurance wrap | Service-based, not self-serve SaaS | Human-driven process, not a tech platform |
| **ProTitle USA** | Insured AOL product for lenders | Per-transaction, opaque | Service company, not scalable self-serve |
| **Title AI** (Natnael Zeleke) | AI browser agents for county search | Pre-revenue (hackathon project) | Not production-grade, no attorney workflow |
| **Titl** | AI + blockchain title verification | $2.5M seed, early | Blockchain adds complexity, unclear adoption |
| **Dono** | AI property records on Qualia marketplace | Marketplace integration | Tied to Qualia ecosystem, not independent |

### Indirect Competitors (Enterprise, different segment)

| Company | What they do | Pricing | Why they're not a threat |
|---|---|---|---|
| **Qualia** ($2.2B valuation, $113M rev) | Closing workflow + Qualia Clear AI | Enterprise SaaS | Workflow platform — doesn't do the search, integrates Dono. Not selling to individual attorneys |
| **Doma** (partially acquired by Opendoor) | AI instant title decisioning | Enterprise | $124M net loss 2023, restructured. Cautionary tale |
| **DataTrace** (First American subsidiary) | AI title plants, 69 TX counties | Enterprise only | Won't sell to individual attorneys |
| **CT Corporation** (Wolters Kluwer) | UCC, lien, entity searches | Per-search, enterprise | Legacy technology, expensive, slow. Serves Fortune 1000 — ignores small firms |

### Key Insight
No competitor offers a **self-serve, pay-per-use platform that bundles ALL closing searches** for individual attorneys, title agents, and investors. Qualia is a workflow platform (doesn't do searches natively). CT Corporation is enterprise-only and legacy. The "one platform, every search, instant" lane is empty.

---

## 6. Go-to-Market Strategy

### Phase 1: Launch (Months 1-6) — Target: 200 paying users

**Launch in 3 attorney-mandate states with good digital county records:**
- **Georgia** — attorney state, major metros digitized (Fulton, DeKalb, Gwinnett), high transaction volume
- **Massachusetts** — statewide digital registry (MA Land Records), attorney required
- **South Carolina** — attorney state, growing market, less competition

**Acquisition channels (self-serve first, no cold calling):**

| Channel | What | Cost | Expected result |
|---|---|---|---|
| **Google Ads** | Bid on "[county] title search" keywords. $2-5/click, low competition | $500-1K/mo | 10-25 paying users/mo from day 1 |
| **County SEO pages** | Landing page for every supported county. Target "[County] title search", "[County] property records", "[County] lien search" | $0 (one-time build) | 50-100 users/mo by month 4-5 |
| **BiggerPockets** | Genuine, helpful posts in RE investor forums | $0 | 10-20/mo |
| **Directory listings** | List on legal tech directories at launch (see Section 6a) | $0-500 | Backlinks + credibility + organic discovery |
| **Referral program** | $25 credit per referred user who completes first paid report | Variable | Network effects |

**Pricing from day 1:** All tiers live — pay-as-you-go $100, quick lien check $25-50, Pro $499/mo, Firm $999/mo. Free first 3 reports.

### Section 6a: Directory Listings (Launch Week)

| Directory | Why it matters | Cost |
|---|---|---|
| **ABA Legal Technology Buyer's Guide** | buyersguide.americanbar.org — highest credibility with attorneys | Paid listing (inquiry required) |
| **Capterra / G2 / GetApp** (legal category) | Attorneys and agents search here for tools, review-driven | Free to list |
| **LawNext Directory** | Legal tech specific — PacerPro, Docket Alarm listed here | Free |
| **State bar association vendor directories** | GA, MA, SC bar associations — free in most states | Free |
| **Clio App Directory** | 150K+ legal professionals browse this | Free to list |
| **ALTAconnect** (ALTA marketplace) | Title industry specific | Inquiry required |
| **LawSites** (Bob Ambrogi) | Most-read legal tech blog — pitch for review/coverage | Free (PR outreach) |

"Listed in ABA Legal Technology Buyer's Guide" = credibility badge on landing page.

### Phase 2: Expand + Bundle + API (Months 6-18) — Target: 1,000 users + first API customers

**Product expansion:**
- Launch bundled closing search package ($200-400)
- Add judgment, UCC, tax, bankruptcy, municipal searches
- Launch API (beta) for proptech/legaltech integrations

**Distribution expansion:**
- Expand to 10-12 attorney states
- CLE webinars: attorney cofounder presents "How AI is changing title search" — bar associations promote for free (they need CLE content)
- Email power users: "You've run 15 reports this month — want a Firm account?"
- Add title agency / abstractor white-label tier
- LinkedIn content about AOLs, Fannie Mae changes
- Hire 1 sales rep for mid-size firms (10-50 attorneys)
- First API partnerships: approach Clio, CosmoLex, smaller proptech apps

### Phase 3: API-First + Scale (Months 18-36) — Target: 2,500 direct users + major API customers

- Full 22 attorney-state coverage
- API GA launch with full documentation, SDKs, sandbox
- Enterprise API tier with SLAs for banks, insurers, large proptech
- Lender partnerships — lenders recommend 1Search
- Expand search types: asset search, background/entity verification, environmental data
- Begin commercial RE due diligence searches ($2,000+ per bundle)

---

## 7. Unit Economics

### Phase 1 (direct reports)

| Metric | Value |
|---|---|
| Revenue per report (blended) | ~$85 (mix of $100, $50, $25 products) |
| COGS per report | $3-8 (data API ~$2-5 + LLM inference ~$0.50-2 + infra ~$0.50) |
| Gross margin | ~91-95% |
| CAC (blended) | ~$200-400 per user (Google Ads + SEO + referrals + CLE) |
| LTV per user | $85 x 8 reports/mo x 24 mo avg retention = $16,320 |
| LTV:CAC ratio | 40-80x |
| Payback period | < 1 month |

### Phase 3 (API)

| Metric | Value |
|---|---|
| Revenue per API call (blended) | ~$5 |
| COGS per API call | ~$0.50-1.00 |
| Gross margin | ~80-90% |
| CAC per API customer | $5,000-50,000 (enterprise sales) |
| LTV per API customer | $50K-5M/year (volume-dependent) |

---

## 8. Revenue Projections

### Phase 1: Direct users (reports + subscriptions)

| Milestone | Users | Reports/mo | MRR | ARR |
|---|---|---|---|---|
| Month 6 | 200 | 1,600 | $136K | $1.6M |
| Month 12 | 600 | 5,400 | $459K | $5.5M |
| Month 18 | 1,200 | 10,800 | $918K | $11M |

### Phase 2-3: Direct + Bundled + API (combined)

| Milestone | Direct MRR | API MRR | Total MRR | Total ARR |
|---|---|---|---|---|
| Month 18 | $918K | $100K | $1.02M | $12.2M |
| Month 24 | $1.2M | $500K | $1.7M | $20.4M |
| Month 36 | $1.5M | $2.5M | $4.0M | $48M |
| Month 48 | $2.0M | $10M | $12M | $144M |
| Month 60 | $2.5M | $40M | $42.5M | $510M |

### Long-term API scale (Year 5+)

| Volume | Avg price | Annual revenue |
|---|---|---|
| 50M API calls/yr | $2 | $100M |
| 500M API calls/yr | $3 | $1.5B |
| 2B API calls/yr | $5 | $10B |

---

## 9. Technical MVP — What AI Builds vs. What Founders Unblock

### What the AI/product does (the code)

| Component | Description | Timeline |
|---|---|---|
| **County data pipeline** | Connect to property data aggregator APIs (Pubrec/PropMix: 151M+ properties, 3,100+ counties, 100+ data points per property, pay-as-you-go). Pull deeds, mortgages, liens, tax records, ownership history | Weeks 1-2 |
| **AI browser agents** (for counties not in aggregators) | Deploy browser automation against county recorder websites — handle different UIs, forms, pagination, session state per county. Start with 50-100 high-volume counties in GA/MA/SC | Weeks 2-4 |
| **Chain of title analysis engine** | LLM analyzes extracted records: traces ownership chain back 30-60 years, flags breaks, unreleased mortgages, judgment liens, easements, tax liens, UCC filings | Weeks 3-4 |
| **Report generation** | Generate clean PDF: property summary, chain of title timeline, lien/encumbrance list, flagged defects with severity ratings | Week 4 |
| **AOL draft generation** | Generate Fannie Mae-compliant AOL template pre-filled with search findings. Structured letter with property description, chain summary, lien list, opinion statement, signature line | Week 4-5 |
| **Web app** | Property address input, search progress, report viewer, PDF download, Stripe payment, account dashboard, usage tracking | Weeks 3-5 |
| **SEO county pages** | Auto-generate landing page per supported county. "[County] title search" targeting. Property address input on each page | Week 5-6 |
| **Subscription billing** | Stripe: all tiers, overage billing, free trial (3 reports) | Week 5 |
| **Quick lien check product** | Lightweight search: liens + judgments only, $25-50. Faster, simpler, targets investors/agents | Week 6 |

**Suggested tech stack:**
- **Frontend:** Next.js (SEO-friendly for county pages)
- **Backend:** Node.js / Python (Python preferred for data pipeline + browser automation)
- **Data APIs:** Pubrec/PropMix (primary), TitleFlex (backup), direct county scrapers (gap-fill)
- **Additional data:** PACER/CourtListener (judgments, bankruptcy), Secretary of State sites (UCC), FEMA (flood)
- **Browser automation:** Playwright + LLM-guided agent (for county sites not in aggregators)
- **LLM:** Claude API for document analysis + report generation
- **PDF generation:** Puppeteer or WeasyPrint
- **Payments:** Stripe
- **Hosting:** Vercel (frontend) + Railway or Render (backend)
- **Database:** Postgres (Supabase)
- **API layer (Phase 2):** REST API with OpenAPI spec, rate limiting, API key management, usage metering

### What founders must unblock (human tasks)

These are tasks that cannot be automated and must be completed by the founders to enable the AI/product to work:

| Task | Who | Why AI can't do it | Timeline |
|---|---|---|---|
| **Validate demand with 10 attorneys** | Attorney cofounder | Real conversations, trust, body language, objections | Week 1 |
| **Confirm county digitization quality** | Technical cofounder | Sign up for Pubrec/PropMix trials, test actual data coverage and quality for GA/MA/SC counties. Determine which counties need browser agents vs API | Week 1-2 |
| **Get AOL template reviewed** | Attorney cofounder | A practicing RE attorney must confirm the AI-generated AOL template meets Fannie Mae B7-2-06 requirements and state-specific standards | Week 2-3 |
| **Malpractice insurance research** | Attorney cofounder | Understand what malpractice coverage attorneys need to issue AOLs, ensure product disclaimers are compliant | Week 2-3 |
| **State bar ethics check** | Attorney cofounder | Confirm that using AI-generated title search reports doesn't violate unauthorized practice of law rules in GA/MA/SC | Week 2-3 |
| **Register business entity** | Both | LLC or C-Corp (C-Corp if planning to raise). EIN, bank account, Stripe account | Week 1-2 |
| **Submit directory listings** | Technical cofounder | ABA Buyer's Guide, Capterra, G2, LawNext, state bars, Clio directory | Week 5-6 (at launch) |
| **Set up Google Ads** | Technical cofounder | Create campaigns for "[county] title search" keywords in launch states | Week 5-6 (at launch) |
| **CLE webinar proposal** | Attorney cofounder | Submit to GA, MA, SC bar associations for Phase 2 | Month 3-4 |
| **First 10 customer conversations** | Attorney cofounder | Onboard first paying users, gather feedback, understand workflow gaps | Month 2-3 |
| **Legal disclaimers / Terms of Service** | Attorney cofounder | Draft ToS, disclaimers (AI-generated report, attorney reviews and assumes liability), privacy policy | Week 4-5 |
| **API partnership outreach** | Both | Approach Clio, CosmoLex, smaller proptech apps for beta API integration | Month 6-8 |

### MVP milestone gates

| Gate | Criteria | Target |
|---|---|---|
| **Gate 1: Data works** | Pull complete property records for 10 test addresses across 3 counties in GA. Chain of title traceable | Week 2 |
| **Gate 2: Report is useful** | Show AI-generated report to 3 RE attorneys. They confirm it's accurate and would save them time | Week 4 |
| **Gate 3: Payment flows** | End-to-end: address in → report out → Stripe charges $100 → PDF delivered | Week 5 |
| **Gate 4: First paying customer** | A user who is NOT a friend pays for a real report on a real transaction | Week 6-8 |
| **Gate 5: Bundled search works** | Title + judgment + UCC + tax in one report, one invoice | Month 8-10 |
| **Gate 6: API beta** | One external app successfully calls 1Search API and gets structured results | Month 12-14 |

---

## 10. The Scaling Path — From Tool to Infrastructure

### How this becomes a $1B-100B+ company

```
Layer 1 (Year 1-2):  SEARCH      Title search reports + AOLs           $5-15M ARR
Layer 2 (Year 2-3):  BUNDLE      All closing searches, one platform    $15-50M ARR  
Layer 3 (Year 3-4):  API         Every RE/legal app calls our API      $50-150M ARR
Layer 4 (Year 4-5):  EXPAND      All legal searches (M&A, litigation)  $150-500M ARR
Layer 5 (Year 5-7):  TRUST       Universal verification infrastructure $500M-10B ARR
```

**Each layer is built on the one below it.** You can't sell the API without proving the data works via direct reports. You can't sell to banks without proving accuracy via millions of searches.

**Founder exit windows:**

| Milestone | Likely valuation | Possible outcome |
|---|---|---|
| Year 2: $10-15M ARR, product-market fit | $80-150M | Acqui-hire or early acquisition by Qualia/Clio |
| Year 3: $30-50M ARR, API traction | $300-500M | Growth round or acquisition by First American/Fidelity |
| Year 4-5: $100-150M ARR, enterprise API | $1-2B | IPO-track or strategic acquisition |
| Year 5-7: $500M+ ARR, trust platform | $5-10B+ | IPO or mega-acquisition |

**The Twilio/Plaid/Stripe pattern — comparable API infrastructure companies:**

| Company | What they API-ified | Revenue | Valuation |
|---|---|---|---|
| Twilio | Phone/SMS | $4B | $15B |
| Plaid | Bank data | $1-2B | $13B |
| Stripe | Payments | $18B | $95B |
| CoreLogic | Property data (pre-AI) | $1.6B | Acquired $6B |
| Verisk | Insurance data | $3B | $40B |
| S&P Global | Credit/entity ratings | $13B | $150B |
| **1Search** | **Property + legal + entity verification** | **?** | **?** |

### The broader trust verification market we're entering

| Trust question | Who answers it today | Market size | Their tech |
|---|---|---|---|
| Is this property clean? | Title insurers | $17B/yr | 1990s title plants |
| Can this person pay? | Credit bureaus (Experian, Equifax) | $40B/yr | COBOL mainframes |
| Is this entity real? | CT Corporation, D&B | $10B/yr | Manual + database |
| Are these assets legitimate? | Due diligence firms | $50B/yr | Humans + spreadsheets |
| What's the insurance risk? | Verisk, actuaries | $100B/yr | Statistical models |
| Is this bond/equity safe? | S&P, Moody's | $20B/yr | Analyst opinions |
| **Total trust verification market** | | **$300B+/yr** | **All legacy** |

1Search starts in the $17B title column and expands right across the table. Every column is AI-disruptable. Every incumbent is running on technology from the previous century.

### What makes this defensible at scale

| Moat | Why it compounds |
|---|---|
| **Data** | Every search adds to proprietary database. After 10M searches, nobody can replicate your accuracy |
| **Accuracy track record** | Banks and insurers require proven accuracy across millions of searches — takes years to build |
| **Integration stickiness** | Once Qualia, Zillow, and JPMorgan integrate your API, switching cost is months of engineering |
| **Regulatory approvals** | SOC2, bank-grade security certifications, state-by-state compliance — takes years to replicate |

---

## 11. Exit Strategy

**Primary exit: acquisition at Year 4-6.** Founders are 41 — target personal liquidity by age 45-47.

**Likely acquirers by stage:**

| Stage | Valuation | Acquirer | Why they'd buy |
|---|---|---|---|
| $10-15M ARR | $80-150M | Qualia, Clio | Adds search/data layer they don't have |
| $30-50M ARR | $300-500M | First American, Fidelity | Defensive — control the AOL/search disruption |
| $100M+ ARR | $1-2B | Blend, ICE/Black Knight | Mortgage tech consolidation play |
| $500M+ ARR | $5B+ | S&P Global, Verisk, CoreLogic | Strategic entry into AI-native trust verification |

**Alternative: IPO track.** If API revenue exceeds $200M ARR with 85%+ gross margins, the company is IPO-eligible. Founders can sell shares on secondary markets at Year 4-5 without a full exit.

**Conservative founder math:**
- $50M ARR x 8x = $400M. 50/50 split, minus dilution if VC raised = **$80-150M each**

**Aggressive founder math:**
- $150M ARR x 10x = $1.5B. After dilution = **$150-300M each**

---

## 12. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Title insurance lobby (ALTA) restricts AOL adoption | Medium | Title search report + bundled searches are valuable independent of AOL. AOL is additive, not core |
| Lenders slow to accept AOLs | Medium | Same — search products stand alone. Fannie Mae pilot extended through 2027 |
| County data access breaks or gets blocked | Low-Medium | Multiple data aggregators (Pubrec, PropMix, TitleFlex) + direct county scrapers as backup |
| Qualia builds native search (beyond Dono marketplace) | Medium | Qualia sells to title companies, not attorneys/investors. Different customer. First-mover on bundled self-serve |
| Big Four title insurer launches competing product | Low | They won't price at $100 — cost structure can't support it |
| AI generates incorrect title report | Medium | Attorney/user ALWAYS reviews. Clear disclaimers. Product liability insurance. Accuracy tracking |
| CT Corporation competes on bundled legal searches | Low | CT is enterprise-only, legacy tech, won't serve small firms at $100-400 |
| Cofounder misalignment | Medium | 4-year vesting, 1-year cliff. 2-week trial sprint before formalizing |
| Voxtur bankruptcy (major AOL provider, bankrupt 2025) | N/A | Validates service-model fragility; tech-platform model is more resilient |

---

## 13. Advisory Review — Pressure Test (May 2026)

An independent advisor challenged the thesis with three questions. Responses below:

**Q1: "Who pays when 4 professionals are already in the transaction?"**

The advisor assumed 1Search sells to homebuyers. It doesn't. 1Search sells to the professionals themselves — the attorney who currently pays $250-350 to an abstractor, the title agent who waits 3 days for a search, the investor doing due diligence before making an offer. We replace the vendor (abstractor/search company), not the professional. The professional is our customer.

**Q2: "How do you overcome the 'perceived coverage' problem — buyers think title insurance covers them?"**

We don't need to. We're not asking buyers to skip title insurance. We're helping attorneys generate AOLs faster and cheaper (the attorney's choice, not the buyer's). And for non-AOL products (title search reports, lien checks), buyers aren't choosing between us and title insurance — they're choosing between us and nothing (no pre-offer due diligence).

**Q3: "Do PermitPulled or HOAReader survive the filter better?"**

Both are excellent products — but they're add-ons to 1Search, not replacements for it. PermitPulled ($19, unpermitted work detection) and HOAReader ($39, AI-read HOA documents) fill gaps no professional in the transaction addresses. They're now in the Phase 2 product roadmap as high-margin add-ons. Combined TAM: $134M/year. But neither is big enough as a standalone company. 1Search is the platform; they're features.

**Advisor's strongest point:** The add-on products (PermitPulled, HOAReader, white-label realtor reports) are genuine gaps that survive the "who pays?" filter better than the core title search — because literally nobody else fills them. They should launch as early as Phase 1.5, not wait for Phase 2.

---

## 14. Partnership Structure

**Current plan: Solo founder, bring on CEO later.**

**Original consideration:** 50/50 with Tanner Blake (attorney, 30, San Diego). Deferred — building solo to Phase 2 first, then bringing him in as CEO at 5-10% equity when product has traction.

**Why solo first:**
- Technical founder can build 90%+ of the product without a cofounder
- Revenue + paying customers = leverage in any future partnership negotiation
- $500 budget sprint doesn't justify splitting equity
- If product works and generates $50K+/mo, bring Tanner in as CEO with salary + 5-10%

**If brought in early (fallback):**
- 80/20 max (not 50/50) with 4-year vesting, 1-year cliff
- Clear role split: technical founder = product/engineering/API, attorney = sales/compliance/partnerships

**Protection:**
- 4-year vesting, 1-year cliff, both founders
- 2-week trial sprint before formalizing (build MVP prototype together, test working dynamics)
- Clear role delineation in writing: technical cofounder owns product/engineering/API, attorney cofounder owns sales/compliance/legal architecture/partnerships
- If either founder leaves before cliff, unvested shares return to company

---

## 14. Immediate Next Steps (Week 1)

| # | Task | Who | Deliverable |
|---|---|---|---|
| 1 | Pitch the idea to attorney friend | You | His answer: in or out |
| 2 | Check domain availability: cleartitle.ai, deedrun.com, chaincheck.ai | You | Secured domain |
| 3 | Sign up for Pubrec/PropMix API trials | You | Test data quality on 10 GA properties |
| 4 | Attorney validates with 5-10 RE attorneys: "Would you pay $100 for an AI title search report delivered in 5 minutes?" | Attorney cofounder | Demand signal |
| 5 | 2-week sprint: you build data pipeline, he maps state regulations | Both | Gate 1 passed + regulatory green light for GA/MA/SC |
| 6 | If sprint goes well: formalize partnership (vesting agreement, C-Corp) | Both | Legal entity + bank account |

---

## Customer Success & Refund Policy (locked May 21, 2026)

### Refund Policy
**Report packages are non-refundable.** Industry standard (PropMix, ProTitle USA, First American, Black Knight all operate this way) and required to protect cash flow on a prepaid-credit model.

**However, we are generous with credits and re-runs** because variable cost per report is ~$2 and customer retention is far more valuable than holding a $200 credit.

Customer-facing language (lives in ToS + checkout footer + receipt email):
> Refund Policy. Report packages are pre-purchased credits and are non-refundable. Unused reports remain available for 12 months from purchase date. If a report contains a material factual error in the records we examined, we will re-run the search at no charge within 30 days of delivery. Cliros is not a substitute for the legal opinion of a licensed attorney; the Attorney Opinion Letter is the document of reliance.

### Re-run / Credit Workflow
- **Channel: support@cliros.ai only.** No in-product self-service refund button — we want the human touch, and the AI triage cron categorizes incoming requests automatically.
- Triggers: address typo, ZIP error, parcel-not-found that turns out to be a valid address, AI hallucination, data source outage, parser error, anything the panel review missed.
- Action: re-run the report at no charge, OR add a credit back to their dashboard balance.
- Track every credit in `cliros.refunds` table (id, user_id, report_id, amount_cents, reason, created_at) so we can spot patterns and improve product.

### Feature Request / Data Inclusion Channel
Attorneys can request new features, additional data sources, or report-content changes via **alex@cliros.ai** (founder direct).

This is intentional — direct founder access during early growth phase is a moat. Every email becomes:
- A product signal (which data sources actually matter to closing attorneys)
- A relationship deposit (attorney feels heard, far less likely to churn)
- Competitive intelligence (what are their abstractors doing that we're not)

Surface this prominently in the dashboard ("Have an idea? Email alex@cliros.ai — we read every message") and on the homepage ("We'll make it work for your firm").

### Long-Term Vision: Office Hours Once We Hit Scale
**Trigger:** 1,000 high-volume clients (defined as: 50-100 reports/month each).

**Action:** Weekly office hours where Alex meets directly with these clients to understand exactly what they need. Build the product to match their workflows. Goal: customers stay forever because Cliros is shaped around their specific practice.

Why this is the right play:
- At 1,000 high-volume clients × ~$10K-15K MRR each = $10-15M MRR = $120-180M ARR
- Even split across 1,000 customers, founder time per customer per week is meaningful (15-20 min average)
- Vertical SaaS moats are built one customer at a time
- This is what every $1B+ vertical SaaS company (Veeva, Procore, Toast) did in years 2-5
- Switching costs in legal-tech are enormous (data migration, training, malpractice risk of trying a new vendor) — high-volume customers don't churn

This is a 2-3 year horizon goal, not a launch-day requirement. Documented now so we don't drift.

---

## Appendix A: Company Name Options

| Name | Domain | Notes |
|---|---|---|
| **1Search AI** | cleartitle.ai | Clean, professional, describes what it does. May feel too narrow if expanding beyond title. Recommended for launch — can rebrand later |
| **DeedRun** | deedrun.com | Short, memorable, implies speed |
| **ChainCheck** | chaincheck.ai | References "chain of title" — insider term |
| **TitlePilot** | titlepilot.ai | AI + guidance metaphor |
| **LienFree** | lienfree.ai | Outcome-oriented |
| **AbstraktAI** | abstraktai.com | Play on "abstractor" |
| **Veritas Search** | veritassearch.ai | "Truth search" — scales beyond title to full trust verification vision |

---

## Appendix B: Data Sources

| Source | Coverage | Data | Pricing model |
|---|---|---|---|
| **Pubrec / PropMix** | 151M+ properties, 3,100+ counties | Deeds, mortgages, tax, ownership, assessments, foreclosures. 100-300 attributes/property | Pay-as-you-go API |
| **TitleFlex** | National | Property data API, JSON format | Pay-as-you-go |
| **County recorder websites** (direct) | Per-county | Full document images, indexes | Free — requires browser automation |
| **Secretary of State sites** (50 states) | Per-state | UCC lien filings | Free, most have online search |
| **PACER / CourtListener / RECAP** | Federal courts | Judgments, liens, bankruptcy filings | PACER $0.10/page; CourtListener free API |
| **FEMA flood maps** | National | Flood zone determinations | Free |
| **IRS / state tax authorities** | Federal + state | Federal tax liens | Varies |
| **Municipal offices** | Per-city/town | Water/sewer liens, code violations, open permits | Free but fragmented — requires automation |

---

*Sources: Fannie Mae Selling Guide B7-2-06, ALTA Q1 2025 Premium Data, NAR Existing Home Sales 2024, IBISWorld Title Insurance Industry Report 2025, HousingWire, Free Law Project, Pubrec/PropMix documentation, Qualia public data (Latka/Tracxn), CT Corporation/Wolters Kluwer*
