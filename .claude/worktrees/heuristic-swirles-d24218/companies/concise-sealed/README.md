# SEALED Press

**SEALED Press** is a publishing imprint under the **Concise** company. It publishes historical archives and suppressed records — beginning with *SEALED: The 2016 Promises — Before the Deals*, a historical archive of Trump's 2015–2016 campaign promises organized as a 145-promise ledger with margin rails, verbatim excerpts, and comparison bodies.

**Revenue goal:** First $100 in direct-PDF revenue by 2026-06-15 (Paperclip goal `ddcba1d3`).

> ⚠️ **THIS folder is what sealed2016.com deploys.** Render service
> `sealed-press` (srv-d7rub9pkh4rs73f2dbd0) builds from
> `companies/concise-sealed` on `main`. The sibling `companies/Sealed/` is a
> duplicate working folder that is NOT deployed — site changes committed only
> there never reach production (that's how the retired $15 price survived on
> the live site until 2026-06-11). Keep `app/`, `lib/`, `components/`
> identical in both, or better: consolidate.

---

## Manuscript pipeline (canonical)

Single source of truth: **`scripts/build-retail-pdf.mjs`** (prose embedded
inline) → **`artifacts/SEALED-v1-retail.pdf`**. Regenerate with
`npm run generate:retail-pdf`. See `.claude/CLAUDE.md` for the full canonical-vs-archived
file map. Files under `artifacts/archive/` and `scripts/archive/` are deprecated.

---

## Quick Start

```bash
npm install
npm run dev    # Development server (reads ../../.env via dotenv-cli)
npm run build  # Production build
npm run start  # Production server
```

All env vars are loaded from the **monorepo root `.env`** (`/Applications/DrAntoniou Projects/AgentCompanies/.env`) via `dotenv -e ../../.env`. That file is gitignored and contains all API keys/tokens for the portfolio.

---

## Tech Stack

| Layer | Tool |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS 3 + custom `@layer components` button system |
| Fonts | Source Sans 3 (body) + Lora (display) via `next/font` |
| Database | Supabase (shared project, isolated schema) |
| Payments | Lemon Squeezy (pending store approval) |
| Email | Mailchimp (waitlist + welcome sequence) |
| Hosting | Render free tier (`rootDirectory = companies/concise-sealed`) |
| PDF tooling | `pdf-lib` (dev dependency for sample/proof generation) |

---

## Service URL

- **Production:** https://sealed-press.onrender.com
- **Phase 2 domain (after 5 sales):** sealedpress.com (pending founder approval)

---

## Environment Variables

All keys live in the monorepo root `.env` (never committed to git).

**Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `MAILCHIMP_API_KEY`
- `MAILCHIMP_AUDIENCE_ID`
- `MAILCHIMP_DC_REGION`

**Optional / feature-gated:**
- `NEXT_PUBLIC_SEALED_CHECKOUT_STANDARD_URL` — LS variant checkout URL (standard edition). **Store goes live automatically when both checkout URLs are set to real values.**
- `NEXT_PUBLIC_SEALED_CHECKOUT_BUNDLE_URL` — LS variant checkout URL (bundle edition)
- `NEXT_PUBLIC_SEALED_SOLD_OUT` — set `true` to flip to sold-out / restock waitlist mode
- `NEXT_PUBLIC_HERO_VARIANT` — switches hero imagery (sealed-envelope vs rally WebPs)
- `NEXT_PUBLIC_CONTACT_EMAIL` — public contact mailto (optional until inbox is configured)

---

## Product: The Book

**Title:** *SEALED: The 2016 Promises — Before the Deals*

A 12-chapter, 4-part historical archive covering 145 campaign promises from 2015–2016:

| Part | Chapters | Theme |
|------|----------|-------|
| I | 1–5 | The campaign record (trail mechanics, lobbyists, trade, jobs, healthcare) |
| II | 6–8 | Alliances & force posture (NATO, Middle East, China) |
| III | 9–10 | Order, borders, rule of law |
| IV | 11–12 | Scorecard, appendices, methodology |

**Format:** Each entry has a margin rail (time/place/audience), a verbatim block (sourced), and a body (comparison to later public record — reader-led judgment, no editorializing).

**Audience rule:** 6th-grade reading level, average sentence ≤ 16 words, visual diagrams paired with every complex comparison. Written for the average American on a phone.

**Full chapter outline:** [`artifacts/SEALED-CHAPTER-OUTLINE-V1.md`](artifacts/SEALED-CHAPTER-OUTLINE-V1.md)
**Working manuscript:** [`artifacts/sealed-v1-content.md`](artifacts/sealed-v1-content.md)

---

## Manuscript Production Pipeline

Tracked under Paperclip epic **CON-171** with milestones:

| Step | Milestone | Ticket | Status |
|------|-----------|--------|--------|
| M1 | Outline + TOC lock | CON-172 | Done |
| M2 | Chapter 1 research packet | CON-173 | Done |
| M3 | Draft Chapter 1 (6th-grade voice + diagrams) | CON-174 | In progress |
| M4 | Chapter 1 illustration plates | CON-175 | Done |
| M5 | Chapter 1 proof PDF | CON-176 | Todo (blocked on M3) |

**Critical path:** CON-174 → CON-176 → CON-25 (LS checkout wiring).

**Key docs:**
- [`eng/SEALED-V1-DELIVERY-MILESTONES.md`](eng/SEALED-V1-DELIVERY-MILESTONES.md) — full milestone map
- [`eng/MANUSCRIPT-EDITORIAL-WORKFLOW.md`](eng/MANUSCRIPT-EDITORIAL-WORKFLOW.md) — editorial cadence
- [`research/ch1-trail-mechanics-research-packet.md`](research/ch1-trail-mechanics-research-packet.md) — Chapter 1 source research

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run generate:sample-pdf` | Generate 5-page sample preview PDF |
| `npm run publish:editorial-sample` | Copy final typeset proof into `public/sample/` |
| `npm run generate:ch1-proof` | Assemble Chapter 1 proof PDF from manuscript + plates |
| `npm run press-kit-pdf` | Generate press kit one-pager PDF |
| `npm run generate:one-pager-share` | Shareable one-pager PDF |
| `npm run verify:ls-webhook` | Verify Lemon Squeezy webhook fixture (unit) |
| `npm run verify:ls-webhook:integration` | Verify LS webhook against live env |

---

## Directory Structure

```
concise-sealed/
├── app/                    # Next.js App Router pages + components
│   ├── components/         # Landing blocks, store CTA, section components
│   ├── contact/            # /contact stub
│   ├── sample/             # /sample page
│   └── thank-you/          # LS return / thank-you page
├── artifacts/              # Manuscript content + chapter outline
├── briefs/                 # CEO/CoS briefs specific to Sealed
├── docs/                   # UX audits, contrast checks, disclosures
├── eng/                    # Engineering docs (milestones, fonts, Mailchimp, LS)
├── lib/                    # Landing content, store status, hero assets, subscriber log
├── marketing/              # Launch copy, welcome sequence, outreach, press kit
├── personas/               # PERSONA_RUNBOOK.md (maps to parent Concise personas)
├── public/                 # Static assets (hero images, product images, ornaments, sample PDF)
├── research/               # Chapter research packets
├── scripts/                # PDF generation, webhook verification, vitals
├── supabase/               # Migrations (email_subscribers schema)
└── validation/             # Historical validation briefs
```

---

## Product Assets (Lemon Squeezy)

Product gallery images for LS checkout (CON-52 — Book Illustrator — COMPLETE):

- `public/product-images/cover-mockup-v1.jpg` — Physical book render (hero)
- `public/product-images/sample-page-spread-v1.jpg` — Interior content preview
- `public/product-images/table-of-contents-v1.jpg` — Scope/credibility signal
- `public/product-images/social-proof-v1.jpg` — Trust badges + stat graphic

Archive aesthetic, faceless design, platform-safe. Generated 2026-05-04 via Grok ($0.28).

---

## Launch Blockers (as of 2026-05-09)

1. **Lemon Squeezy store approval** — verification reply sent 2026-05-07 (founder LinkedIn shared narrowly for LS internal verification only). Awaiting clearance.
2. **Chapter 1 manuscript freeze (CON-174)** — Literary Agent drafting; blocks proof PDF (CON-176).
3. **LS checkout wiring (CON-25)** — CTO work, queued after proof PDF + store approval.
4. **Email form → Mailchimp (CON-27)** — confirm vs current Resend path before building.

---

## Agent Roster (Paperclip)

Personas live under parent [`companies/concise/personas/`](../concise/personas/). See [`personas/PERSONA_RUNBOOK.md`](personas/PERSONA_RUNBOOK.md) for mapping.

| Role | Owns |
|------|------|
| Literary Agent | Manuscript, proof-quote checklist, press kit quotes, sample accuracy |
| Brand & Design | Visual tokens, landing design, press kit design |
| Head of Growth | Welcome sequence, launch-day copy, outreach angles |
| CTO | Next.js app, APIs, PDF/epub tooling, deploy health |
| Book Illustrator | Chapter plates, product gallery images |
| Sales Agent (optional) | Pre-launch outreach pipeline |

---

## Hard Rules (from BIBLE.md)

1. **FACELESS** — No founder face/voice/real name in any public asset.
2. **PSEUDONYM** — Founder identity is always pseudonym in Concise marketing. No author photos. About-page describes brand mission.
3. **Pseudonym waiver (narrow, 2026-05-07):** Founder's personal LinkedIn shared ONLY for LS internal verification. Not reusable for marketing, product listing, or other merchant onboarding.
4. **$500 hard cap** cumulative spend to prove profitability.
5. **Revenue-first** — every feature must justify with paying customer unlocked.
6. **Quality bar** — nothing ships public without at least one other role agent reviewing.

---

## Ownership

Owned by **Concise CEO**. Rolls up under Concise company P&L.

Parent company: [`companies/concise/`](../concise/)
Portfolio hub: [`shared/portfolio-hub/`](../../shared/portfolio-hub/)
All API keys/tokens: monorepo root `.env` (gitignored, never pushed)
