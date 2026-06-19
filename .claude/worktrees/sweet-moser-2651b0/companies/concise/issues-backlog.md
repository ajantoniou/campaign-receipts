# Concise — Issues / Backlog

**Status legend:** TODO / IN PROGRESS / BLOCKED / DONE
**Priority legend:** P0-P3

---

## P0 (Saturday/Sunday)

### CN-001 / CON-2: Initial infrastructure provisioning
- **Owner:** Founder (unblock) → CTO (resume)
- **Status:** BLOCKED on Founder (rescope + Render confirmation)
- **Unblock owner:** Founder
- **Unblock actions:**
  1. Confirm Render service for Concise exists (post service ID + public URL OR grant MCP access)
  2. Confirm rescope direction (drop Stripe items [move to CON-25] OR keep as child issues)
- **Phase 2 (CTO) completed 2026-05-03:** ✅ Schema migration `migrations/001-create-concise-schema.sql` (7 tables) | ✅ Next.js stub app (Coming Soon + email API) | Commits 8ae4fd2, 3548300, 74aa6a3
- **Why BLOCKED (CEO 17:03 ET 2026-05-03):** SEALED pivot supersedes CON-2.4/2.5 Stripe items (now CON-25 Lemon Squeezy + CON-27 Mailchimp). Render deployment unverified.
- **Blocker doc:** `deploys/CON-2-BLOCKED-RESCOPE-REQUIRED.md`
- **Post-unblock work:** Verify Render service live, close CON-2 with verification commit
- **Manager note (CEO):** CTO move to next unblocked task (CN-005 or CN-020). Do not comment further on CON-2 until founder responds.

### CN-002: Brand name proposals
- **Owner:** Brand/Design
- **Output:** 3-5 candidates. Note: existing pseudonym branding may
  carry over OR new direct-sale brand may be cleaner. Founder owns
  this decision.
- **Status:** TODO

### CN-003: Domain registration
- **Owner:** CTO (after Brand proposes + founder approves)
- **Status:** TODO

### CN-004: CONCISE Drive folder access
- **Owner:** Founder → CTO
- **Output:** Books accessible (manual download to Supabase Storage
  recommended)
- **Status:** ✅ DONE (2026-05-04) — Symlinks active at `books-source/concise-reads/` and `books-source/grabit-nation/`

### CN-005: Inventory existing books
- **Owner:** CEO + Brand/Design
- **Output:** `content/inventory.md` with all 20+ books, current
  Amazon performance, audience tags, top 3 candidates for direct-
  sale launch
- **Status:** ✅ DONE (2026-05-04) — 18 books inventoried, Top 5 launch candidates ranked in `content/inventory.md`
- **Deliverable:** See `content/inventory.md` for complete catalog

### CN-006: Render web service stub
- **Owner:** CTO
- **Status:** TODO
- **Engineering note:** `package.json` keeps TypeScript + Tailwind + PostCSS + `@types/*` as **dependencies** so Render/production `npm install` still runs `next build` (same root cause as skipped devDeps on cloud hosts).

### CN-007: Supabase schema
- **Owner:** CTO
- **Output:** `concise` schema with `books`, `customers`, `orders`,
  `email_subscribers` tables
- **Status:** CTO DONE (repo) — migrations committed (`migrations/001-create-concise-schema.sql`, `002-*`). **Deploy:** BLOCKED until founder provisions Supabase + CTO applies SQL (same gate as portfolio-wide schema policy).

### CN-008: Top 3 books for launch identified
- **Owner:** CEO + Founder approval
- **Output:** Founder ranks based on:
  1. Likely audience demand
  2. Book quality / readiness for direct sale
  3. Cover redesign feasibility
- **Status:** ✅ DONE (2026-05-04) — Top 5 candidates ranked in `content/inventory.md` Section 2:
  1. **P0:** MCAT Prep Bundle (lead magnet ready, high demand)
  2. **P0:** Consulting Frameworks (evergreen, high-value audience)
  3. **P1:** Trump Book (REBRAND REQUIRED — awaiting Brand/Design title proposals)
  4. **P1:** Nuclear Medicine Bundle
  5. **P1-P2:** How To Incorporate
- **Next action:** CTO can start landing pages for #1-2; Brand/Design to propose Trump book titles

### CN-009: Trump book cover variant proposals
- **Owner:** Brand/Design
- **Output:** 5 new title proposals (founder REJECTED "Grabit Nation" 2026-05-03) + sales hooks + landing page mockup + image generation prompts for campaign imagery
- **New framing (founder direction 2026-05-03):** "Secret promises BEFORE foreign-lobby capture" / "America First — Original Edition" / historical record framing
- **Decision authority:** CEO picks title under pivot authority; escalate to CoS only if touches hard rule
- **Status:** TODO (awaiting Brand/Design title proposals)
- **See:** `content/inventory.md` Section 4 for full rebrand requirements

### CN-010: Pseudonym vs real-name decision
- **Owner:** Founder
- **Output:** Decision documented in `brand/identity-strategy.md`.
  Possible:
  - Keep pseudonym throughout (lower trust, simpler)
  - Reveal MD credential on MCAT only (hybrid)
  - Reveal real name everywhere (highest trust, ties controversial
    content to real identity)
- **Status:** TODO

---

## P1 (Week 1)

### CN-020: Landing page v1 (CTO)
- **Output:** Hero + book preview + Stripe Payment Link + email
  capture

### CN-021: Per-book landing pages for Top 3
- **Output:** 3 pages, one per launch book
- Each: cover + back-cover copy + first chapter PDF download +
  buy button

### CN-022: Stripe Payment Links for Top 3 books
- **Owner:** CTO
- **Acceptance:** Test purchase delivers PDF via email

### CN-023: PDF delivery automation (Resend)
- **Owner:** CTO
- **Acceptance:** Stripe webhook → Resend email with secure download
  link

### CN-024: First chapter free PDF lead magnets
- **Owner:** Brand/Design + CTO
- **Output:** First chapter extracted from each Top 3 book, designed
  as standalone PDF with email capture CTA

### CN-025: Welcome email sequence drafted
- **Owner:** Brand/Design + Head of Growth
- **Output:** 5-email sequence: download → value → cross-sell →
  bundle offer → testimonial

### CN-026: TikTok account created (or use founder's existing)
- **Owner:** Brand/Design
- **Output:** Account live, brand applied, first 3 video concepts
  drafted

### CN-027: First Reddit comments
- **Owner:** Head of Growth
- **Target subs:** r/MCAT (high-intent), r/politics or r/conservative
  (Trump book — careful), general advice subs
- **Output:** 5+ helpful comments without links

### CN-028: First TikTok / Reels video
- **Owner:** Head of Growth + Brand/Design
- **Output:** 60-sec video featuring a Concise book topic

---

## P2 (Week 2)

### CN-030: MCAT bundle pricing test
- **Owner:** CTO + CEO
- **Output:** Bundle Stripe product ($49-99) live; track conversion
  vs individual book sales

### CN-031: Email nurture sequence active
- **Owner:** Backend (CTO) + Brand/Design

### CN-032: 5+ books direct-sale live
- **Owner:** Brand/Design + CTO
- **Output:** Cover redesigns + landing pages for books 4-5

### CN-033: First sale
- **Owner:** Whole team
- **Acceptance:** First $X in direct revenue

### CN-034: Customer support inbox
- **Owner:** CTO + Brand/Design

### CN-035: Refund policy decision
- **Owner:** Founder
- **Output:** Document policy in ToS

---

## P2-P3 (Week 3-4)

### CN-040: 10+ direct sales
### CN-041: 100+ email subscribers
### CN-042: SEO content drafts (long-tail keywords per book)
### CN-043: Affiliate program brainstorm (Phase 2 prep)
### CN-044: First customer testimonial collected (with permission)
### CN-045: Amazon vs direct revenue comparison report (Chief Accountant)

---

## Phase 2 backlog (month 2-3)

- 10+ books direct-sale live (full inventory migration)
- Series bundle pricing for any multi-book collections
- Affiliate program launch (10-20% commission)
- TikTok 1K followers
- Reddit profile karma 100+ in target subs
- Email list 500+
- First customer testimonial + case study
- Google Ads test (only if revenue justifies)
- Newsletter expansion (if email list engaged)

## Phase 3 backlog (month 3+, pivot evaluation)

Based on data from Phase 1-2:

### Pivot path A: Continue books, write new ones
- Founder writes new titles in Concise voice
- Agents handle production + marketing
- Book #21, #22, etc. with bundle pricing from start

### Pivot path B: AI coach
- Convert most-popular advice book(s) into AI coach format
- Subscription model
- Significantly different tech stack — full team would expand

### Pivot path C: Video / course expansion
- Convert MCAT book content into video courses
- $99-499 course pricing (vs $19-29 books)
- Higher revenue per customer, more production work

### Pivot path D: New advice books
Founder mentioned concepts:
- "How not to be an asshole"
- "Making Dating Great Again"
- Other contrarian advice books

These would be new books founder writes; agents handle launch.

**Pivot decision cadence:** Monthly McKinsey + CEO + founder review.

---

## DO NOT DO

- Pull books from Amazon (preserve $200/mo)
- Make health claims on MCAT book marketing (it's exam prep, not
  medical advice)
- Reveal founder's real name without explicit approval
- Ship Trump book cover without founder approval on direction
- Spam Reddit (target subs ban quickly)
- Run paid ads without revenue proof of funnel

---

## CEO grooming weekly

Sunday evening:
1. Move completed items to DONE
2. Re-prioritize based on conversion data
3. Add issues from McKinsey/YC reviews
4. Track Amazon vs direct revenue split monthly
