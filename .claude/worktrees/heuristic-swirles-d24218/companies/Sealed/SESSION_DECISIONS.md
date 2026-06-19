# SEALED Press — Session Decisions

Created 2026-05-06. Log CEO/CTO/design decisions for **concise-sealed** only.  
Format: `## YYYY-MM-DD HH:MM ET — <heading>` then 2–5 bullets.

## 2026-05-08 — CON-199: recover missing next step for CON-174

- **Trigger:** Recovery wrapper `CON-199` fired because the `CON-174` run succeeded but the harness saw no recorded `clear_next_step`, so the issue kept re-opening even though the manuscript lane had green prose.
- **Action:** Updated `SEALED-V1-DELIVERY-MILESTONES.md` to point recovery at the Chapter 1 plates (`public/SEALED-IMAGE-INDEX.md`) and at the CTO proof pipeline (`scripts/build_sealed_v1_pdf.py` → `artifacts/SEALED-v1-before-the-deals.pdf`), so the post-draft continuation now sits in a durable doc rather than a transient comment.
- **Next:** CTO (CON-176) executes the proof PDF once `artifacts/sealed-v1-content.md` is frozen, posts the generated PDF path on the issue, and closes CON-199; the harness can then stop reopening the lane because it now sees a concrete next action.

## 2026-05-07 16:46 ET — Lemon Squeezy verification reply sent (Issac Abraham)

- **Sent:** Two-line reply via the active LS application thread — sample PDF link + storefront URL + founder personal LinkedIn (`linkedin.com/in/alexantoniou`) for verification. Source-of-truth draft at `eng/LEMON-SQUEEZY-REPLY-ISSAC.md`.
- **Pseudonym rule (founder waiver, narrow scope):** The Literary Agent persona's "Pseudonym always" hard rule (`companies/concise/personas/literary-agent.md` §HARD RULE) is **NOT** broadly relaxed. The personal LinkedIn was shared **only** for LS internal verification at the founder's explicit direction in this thread. Future agents must NOT reuse the LinkedIn or the founder's real name on (a) the public product listing, (b) marketing copy, (c) press kits, (d) any other merchant onboarding without re-checking with the founder.
- **Tone direction (founder, this thread):** Keep replies on this LS thread minimal. No book-pitch, no political framing, no compliance lectures. Two-answer format only unless Issac asks for more.
- **Next:** Wait on LS approval. Storefront stays in `notify` mode (preview + waitlist live, checkout disabled) until LS clears.

## 2026-05-07 — Paperclip: suppress assignee wake on board disposition comments

- **Root cause:** Board/admin `POST /issues/:id/comments` always woke the assignee (`selfComment` skip applies only to **agent** JWT). Cursor CEO heartbeats using `PAPERCLIP_ADMIN_TOKEN` re-waked CON-171 on every disposition comment → infinite loop.
- **Fix (Paperclip repo):** Optional **`suppressAssigneeWake: true`** on board-authored **`POST /issues/:id/comments`** and **`PATCH /issues/:id`** (with `comment`) skips the assignee wakeup. Restart local Paperclip server after pulling.
- **Operational:** Prefer **agent JWT** for agent-authored comments when possible; use **`suppressAssigneeWake`** for CoS/admin housekeeping notes on agent-assigned issues.

## 2026-05-07 — CON-171 manuscript + illustration milestone track

- **`eng/SEALED-V1-DELIVERY-MILESTONES.md`** — single map for manuscript + illustration + CTO proof PDF (Ch.1 pilot), linked to canonical artifacts and briefs.
- **Paperclip:** Children **CON-174** (M3 draft Ch.1), **CON-175** (M4 plates), **CON-176** (M5 proof PDF) created under epic **CON-171**; **CON-174** blocked by **CON-173**, **CON-176** blocked by **CON-174** + **CON-175**. Existing **CON-172** / **CON-173** carry M1 / M2.
- **Identifier hygiene:** Board comment batch once listed **CON-177 / CON-178 / CON-179** for M3–M5; those tickets are **`cancelled`** dupes — execution lanes are **CON-174–176** only (`SEALED-V1-DELIVERY-MILESTONES.md` + **`MANUSCRIPT-EDITORIAL-WORKFLOW.md`** updated to match).

## 2026-05-07 — CON-171: buyer copy note + duplicate M3–M5 recovery

- **CoS thread (`dbcc7562`):** Buyer-forward Lemon placeholder funnel — hero / methodology / verification framing in **`lib/landing-content.ts`** (“receipts”, swamp / fair-trade hooks). Re-validate against verified Ch.1 once **CON-173** → **CON-174** lands.
- **Paperclip:** Recovery briefly re-opened **CON-177–179**; canonical milestones stay **CON-174 / CON-175 / CON-176**. CEO **cancelled** dupes again, moved illustrator continuity to **`CON-175` `in_progress`**, closed recovery **CON-182**, restored epic **`CON-171` `in_progress`**.
- **Ch.1 plates (`834a68c4`):** Three JPEGs in **`public/`** + index rows in **`public/SEALED-IMAGE-INDEX.md`**; measured dimensions (**1408×768**, **1296×864**, **1408×768**) corrected in the index (replacing 1024×1024 brief).

## 2026-05-07 — CON-171: Part I Ch.1 research packet landed → next action

- **Research drop:** The Part I Chapter 1 research packet sits at `research/ch1-trail-mechanics-research-packet.md` with margin-rail hooks, primary transcripts, Scorecard grade definitions, and verification links that satisfy the M2 acceptance criteria from the editorial workflow.
- **Next action:** Literary agent / writer treats **CON-174** as the active lane now—draft Section A/B/C with the researched rails, verify the Grade entries listed in `artifacts/sealed-v1-content.md`, and merge the sections into that canonical manuscript so the layout is proof-ready before the illustrator (CON-175) and CTO (CON-176) steps trigger; cross-check each grade row against the packet so the recovery agent sees the documented successor.
- **Why this matters:** This note plus the `SEALED-V1-DELIVERY-MILESTONES.md` continuation update create the `clear_next_step` disposition the recovery agent asked for; once the draft is in motion we can close the recovery wrapper and keep CON-171 `in_progress` with its real blockers.

## 2026-05-07 — Editorial sample swap (CON-168)

- `COPY_FROZEN_v1` is locked, so `/sample/sealed-sample-preview.pdf` now mirrors `artifacts/SEALED-v1-before-the-deals.pdf` instead of the generated placeholder.
- Added `npm run publish:editorial-sample` and a short script to copy the finalized proof into `public/sample`; the existing generator stays for early mocks but notes not to run after the freeze.

## 2026-05-07 — Sample PDF length + portfolio cross-promo goals

- **Sample:** Canonical download `public/sample/sealed-sample-preview.pdf` is now **5 pages** (manuscript excerpts: half-title, foreword, methodology, two case studies) via `scripts/generate-sealed-sample-pdf.mjs` — aligns public preview + Lemon share link with agreed “short interior proof” length.
- **VotingCitizen at checkout:** Goal logged — optional **1-month trial** for VotingCitizen newsletter/dashboard SaaS via SEALED **LS confirmation / thank-you**, clearly **not part of SEALED file delivery**. **Paperclip:** **CON-167** (Concise). Compliance: review Lemon merchant terms for **disclosed partner perks** (typically allowed when not deceptive and product delivered as described); keep redemption + privacy copy separate from SEALED SKU.
- **Editorial handoff:** **CON-168** tracks swapping programmatic bytes for final typeset sample when manuscript freezes.

## 2026-05-07 — CoS: CON-167 / CON-168 agent assignment

- **CON-167** assigned **Head of Growth** (partner offer + disclosure copy); thread notes **CTO** pairs on LS thank-you / mail wiring.
- **CON-168** assigned **Literary Agent** (editorial PDF replaces programmatic sample). Concise roster has no dedicated Copy Editor / McKinsey hire — those lanes route via CEO roundtable or future agent hire per portfolio doctrine.

## 2026-05-07 — CON-70 / TASK-011: production deploy smoke (sealed-press)

- **Checks:** `curl -I` against `https://sealed-press.onrender.com/api/health`, `/sample`, and `/sample/sealed-sample-preview.pdf` → HTTP 200 (metadata and `content-type: application/pdf` on the PDF as expected).
- **Disposition:** Work was recorded on the issue thread; CEO recovery run closed CON-70 after a Paperclip continuation failure (`adapter_failed` / cursor-retrieval) had left the ticket in `blocked` despite green prod.

## 2026-05-07 — TASK-022 / CON-81: launch-day thread → scheduling buffer

**Shipped:** [`marketing/social-scheduling-buffer-launch-v1.md`](marketing/social-scheduling-buffer-launch-v1.md) — paste-ready X thread slots, LinkedIn block, email stub; cross-linked from [`marketing/launch-day-copy-pack-v1.md`](marketing/launch-day-copy-pack-v1.md). **Acceptance remainder:** Head of Growth attaches one screenshot of the queued launch-day thread in the live scheduler (delegation matrix: screenshot).

## 2026-05-07 — CON-76 / TASK-017: Lighthouse CLS/fonts spot-check

- **Score note:** `npx lighthouse http://127.0.0.1:3000 --only-categories=performance --chrome-flags="--headless --no-sandbox"` → Performance 69, CLS 0 (no layout shifts), font-display audit score 1. First Contentful Paint ~906 ms, LCP ~1,356 ms on the local dev build.
- **Conclusion:** `next/font` is already self-hosting Source Sans 3 + Lora with `display: 'swap'` (`app/layout.tsx` and `eng/FONTS.md`), so the CLS impact from fonts is negligible. Continue to monitor when new hero art or third-party embeds are introduced.

## 2026-05-06 — CON-51 / CON-52: multi-agent gate before LS codes + listing art

**Decision:** Discount codes (CON-51) and storefront images (CON-52) **do not** ship founder-first. Sequence: Brand Design + Branding → Concise CEO → Portfolio HQ roundtable (CoS, McKinsey, YC) per `companies/portfolio-hq/process/MULTI_AGENT_REVIEW_GATE.md`; two-pass review. **LS codes blocked** until Lemon Squeezy store approval. Imagery must use **real legible copy** workflows (real English, citations, no gibberish micro-text).

## 2026-05-06 — CON-52 execution pack: copy freeze → then Book Illustrator + Brand Design

**Shipped:** `marketing/CON-52_REGENERATION_BRIEF_v1.md` + `marketing/CON-52_COPY_BLOCKS_v1.md` — **Literary Agent + CEO** own copy; **Brand Design (head)** → **CEO** → **Portfolio roundtable** → second pass; **no image export** until `COPY_FROZEN_v1` line in copy file. Replaces prior “AI gibberish page” approach.

## 2026-05-06 — Bootstrap + T+0 launch-tracker execution

**Shipped:** `issues-backlog.md` + this file; **JSON-LD** (`Book` + `Organization`) + **canonical** URL in [app/layout.tsx](app/layout.tsx); **sitemap** entries for `/sample`, `/contact`; stub routes [app/contact/page.tsx](app/contact/page.tsx), [app/sample/page.tsx](app/sample/page.tsx).  
**Ops:** Public mailto is gated on optional env **`NEXT_PUBLIC_CONTACT_EMAIL`** (avoid orphan inbox until configured).

## 2026-05-06 — Ops + Concise redirect reconciliation (tracker 2, 42–45, 47, 50)

**Shipped:** `supabase/migrations/001_email_subscribers.sql`; eng docs **`SUPABASE-SUBSCRIBERS`**, **`MAILCHIMP`**, **`UPTIME`**; redacted **`[subscribe]…`** stdout via `lib/subscriber-log.ts`; amber banner **`getWaitlistCount()`** placeholder when LS gate is closed; standalone **`/thank-you`** stub for Lemon return URLs  
**Concise:** removed legacy **`companies/concise/app/sealed`** routes so **`next.config.js`** `/sealed` + `/sealed/thank-you` redirects win (CON-41 filesystem precedence fix).  

**Stale reference audit (#50):** Historical validation briefs (`companies/concise/validation/*`, dated **2026-05-03**) still mention `app/sealed/page.tsx`; treat as archival only—runtime **`/sealed`** ships from **Concise redirects → sealed-press**.

**CarStack overlap:** **`report-engine/vin.mjs`** charset gate + structured logs without printing full VINs; **`launch-readiness-checklist.md`** at repo `companies/estimateproof/`.

## 2026-05-06 — Conversion funnel + CarStack PDF path

**SEALED:** Modular sections (`app/components/Section.tsx`, `landing-blocks.tsx`, `lib/landing-content.ts`) — benefits, methodology, TOC preview, testimonials scaffold, author block, objections, standard vs bundle comparison; hero trust line + price tease; nav anchors updated.  
**CarStack:** Report-engine **`pdf-report.mjs`** + `format: 'pdf'` on **`POST /report`**; ServiceLedger site proxy returns PDF + **Download PDF** button on `/sample-report`.

## 2026-05-06 — Operating model (portfolio — founder autonomous + reader self-serve)

**Aligns with Portfolio HQ:** agents own routine shipping; readers self-serve sample → email → purchase path without founder in the loop except documented gates (live payments, LS verification, legal sign-offs). See [../portfolio-hq/delegations/2026-05-06-founder-free-queue.md](../portfolio-hq/delegations/2026-05-06-founder-free-queue.md) (*Operating model — autonomous founder path + self-serve customer*).

## 2026-05-05 — Persona-marketing batch + proofs (steps 35–41)

**Personas:** Literary + Brand (`press-kit-one-pager-v1.md`), Head of Growth (`welcome-email-sequence-v1.md`, `launch-day-copy-pack-v1.md`), Sales (`pre-launch-outreach-list-v1.md`), CTO (`artifacts/README.md`, [`eng/EPUB-PROOF.md`](eng/EPUB-PROOF.md)). [**`personas/PERSONA_RUNBOOK.md`**](personas/PERSONA_RUNBOOK.md) maps Soul-scoped agents to folders.

## 2026-05-05 — Fonts (step 17), hero variant env (step 6), Lighthouse (step 32)

**Fonts:** `next/font` — **Source Sans 3** (body) + **Lora** (display); [`eng/FONTS.md`](eng/FONTS.md). Hero title uses `font-sealed-display`.

**Hero A/B:** [`lib/hero-assets.ts`](lib/hero-assets.ts) + [`public/hero/HERO_MANIFEST.md`](public/hero/HERO_MANIFEST.md) — `NEXT_PUBLIC_HERO_VARIANT` switches sealed-envelope vs rally WebPs.

**Lighthouse 11 (local `next start`, May 2026):** Performance **99**, Accessibility **95**, Best practices **96**, SEO **100**.

**Manuscript:** proof-quote checklist stub — [`artifacts/sealed-v1-content.md`](artifacts/sealed-v1-content.md).

## 2026-05-05 — Hero `<picture>`, ornament SVG, contrast checklist (steps 21–23)

**Shipped:** [app/page.tsx](app/page.tsx) hero uses **`<picture>`** + `image/webp` for desktop/mobile crops; [public/ornaments/sealed-divider.svg](public/ornaments/sealed-divider.svg) + [SealedOrnamentDivider](app/components/landing-blocks.tsx) after benefits; [docs/contrast-pass-step-22.md](docs/contrast-pass-step-22.md) AA audit table.

## 2026-05-05 — Button style system (tracker step 18)

**Shipped:** `@layer components` in [app/globals.css](app/globals.css) — `sealed-btn-primary` / `secondary` / `notify` / `notify-solid` / `ghost` / `bundle`; cross-ref in [tailwind.config.js](tailwind.config.js). Hero, `#buy` stack, and [store-cta.tsx](app/components/store-cta.tsx) use the tokens.

## 2026-05-05 — 3-state store CTA (tracker step 19)

**Shipped:** `lib/store-status.ts` → `getStoreCtaMode()` (`notify` | `buy` | `sold_out`); optional **`NEXT_PUBLIC_SEALED_SOLD_OUT`**. **`store-cta.tsx`** nav + hero button; **`PricingCompareSection`** + **`#buy`** + email header copy branch on `sold_out`. Sold-out still collects emails for restock.
