# Cliros — Vision Document

**Status:** Pre-build (business plan complete, app scaffold built)
**Budget cap:** $500 (8-week sprint)
**Founder time/wk:** <2 hrs (sign up for APIs, register domain, submit directory listings; all product/code built by AI agent)
**Name:** Cliros (from Greek κλήρος — deed, inheritance, lot)
**Tagline:** "Title intelligence in minutes, not days."
**Domain:** cliros.ai (registered)

## What this company is

AI-powered property and legal search platform. Enter a property address, get a complete title search report + draft Attorney Opinion Letter in minutes instead of days, at $100 instead of $300.

**Phase 1:** Title search reports + AOLs for attorneys, investors, agents ($100/report)
**Phase 2:** Bundled closing searches (title + judgment + UCC + tax + bankruptcy + municipal) — one platform replaces 5-8 vendors ($200-400/bundle)
**Phase 3:** Search API infrastructure — every RE/legal/fintech app calls Cliros's API ($0.50-50/call)

## Why this exists

- $17.1B/year title insurance industry with <5% claims rate (95%+ is profit + overhead)
- Fannie Mae approved Attorney Opinion Letters as title insurance alternatives (2022-2024)
- Homebuyers save 33-77% using AOLs vs title insurance
- No self-serve AI platform exists to help attorneys generate AOLs at scale
- No platform bundles all closing searches into one instant product
- Every closing requires 5-8 separate searches from 5-8 separate vendors

## Revenue model

| Tier | Price | Target |
|---|---|---|
| Quick lien check | $25-50 | Investors, agents, wholesalers |
| **Closing package** (Client Brief + AOL + Vault) | **$200/report** | Attorneys — primary SKU |
| Pro subscription | $499/mo (10 reports + Vault Pro) | Solo attorneys, 5-12 closings/mo |
| Firm subscription | $999/mo (25 reports + Vault Firm) | Small firms, 15-30 closings/mo |
| **Vault Pro** (storage + matter CRM) | **$99–149/mo** | Retention; free during beta |
| Bundled closing package (Phase 2) | $200-400 | Multi-search bundle |
| API calls | $0.50-50/call | Phase 3 |
| Beta | Free unlimited reports + vault | Feedback cohort (2026) |

## Product pillars (2026)

1. **Client Closing Brief** — Remotion + Claude Design; luxurious client-facing PDF the attorney is proud to send.
2. **AOL with vault citations** — every material statement points at stored source documents.
3. **Cliros Vault** — raw GSCCCA/federal/permit artifacts per matter; free in beta → paid membership with light CRM.

## Target market

- 50,000+ RE attorneys in 22 mandatory-attorney states
- 10,000+ title agents / abstractors
- 1.5M+ RE agents, investors, wholesalers, mortgage brokers
- Phase 3 API: proptech apps, banks, insurers, government

## Competitive landscape

- **No direct competitor** offers self-serve, pay-per-use AI title search + AOL generation
- National Attorney Title / ProTitle USA = service companies, not tech platforms
- Title AI = hackathon prototype, not production
- Qualia ($2.2B, $113M rev) = closing workflow, doesn't do searches natively
- CT Corporation (Wolters Kluwer) = enterprise-only, legacy tech, won't serve small firms
- Doma = cautionary tale ($124M loss, partially acquired by Opendoor)

## Tech stack

- **Frontend:** Next.js (SEO-friendly for county landing pages)
- **Backend:** Python (data pipeline + browser automation)
- **Data APIs:** Pubrec/PropMix (primary), TitleFlex (backup), direct county scrapers
- **Additional data:** PACER/CourtListener (judgments), Secretary of State sites (UCC), FEMA (flood)
- **Browser automation:** Playwright + LLM-guided agent (for county sites not in aggregators)
- **LLM:** Claude API (document analysis + report generation)
- **PDF generation:** Puppeteer or WeasyPrint
- **Payments:** Stripe (sole proprietor, SSN — no LLC until revenue justifies it)
- **Hosting:** Vercel (frontend) + Railway or Render (backend)
- **Database:** Postgres (Supabase)

## Scaling path

```
Layer 1 (Year 1-2):  SEARCH      Title search reports + AOLs           $5-15M ARR
Layer 2 (Year 2-3):  BUNDLE      All closing searches, one platform    $15-50M ARR
Layer 3 (Year 3-4):  API         Every RE/legal app calls our API      $50-150M ARR
Layer 4 (Year 4-5):  EXPAND      All legal searches (M&A, litigation)  $150-500M ARR
Layer 5 (Year 5-7):  TRUST       Universal verification infrastructure $500M-10B ARR
```

## Founder exit windows

| Milestone | Valuation | Age |
|---|---|---|
| Year 2: $10-15M ARR | $80-150M | 43 |
| Year 3: $30-50M ARR | $300-500M | 44 |
| Year 4-5: $100-150M ARR | $1-2B | 45-46 |
| Year 5-7: $500M+ ARR | $5-10B+ | 46-48 |

## Partnership (pending)

- Potential cofounder: Tanner Blake (attorney, 30, San Diego)
- Decision deferred to Phase 2 — build solo first, bring him in as CEO at 5-10% equity when product has traction
- If brought in early: 80/20 max with 4-year vesting, 1-year cliff

## Go-to-market

1. Google Ads on "[county] title search" keywords ($500-1K/mo)
2. SEO county landing pages (auto-generated for every supported county)
3. BiggerPockets (genuine posts in RE investor forums)
4. Directory listings (ABA, Capterra, G2, LawNext, state bars, Clio)
5. Referral program ($25 credit per referred user)
6. Phase 2: CLE webinars, LinkedIn content, 1 sales rep

## Immediate blockers (founder tasks)

1. ~~Register domain~~ ✅ cliros.ai registered
2. Sign up for Pubrec/PropMix API trial at pubrec.propmix.io
3. Provide a test property address in Georgia for data validation
4. Say "go"

## Key files

- [business-plan.md](business-plan.md) — full business plan with financials, competitors, GTM, unit economics
