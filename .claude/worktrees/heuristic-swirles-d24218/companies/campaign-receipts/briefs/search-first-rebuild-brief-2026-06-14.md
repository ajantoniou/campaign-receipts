# Product Brief — Search-First Rebuild + Free Weekly Newsletter

**Date:** 2026-06-14
**Author:** Claude (Opus 4.8) for founder review
**Status:** DRAFT — needs founder approval before any build
**Trigger:** Founder, on seeing the `/investigate` search: *"What if this was the product? And we rebuild the website around this? Plus free newsletter to get once a week updates (automated/running on cron)."*

---

## 0. TL;DR

Two moves:

1. **Make "Who paid for this?" search the homepage.** Today the search lives at
   `/investigate` behind a $45/mo paywall and is buried. Promote it to the hero of
   the site — one box, the whole product. Give it a **free tier** (a few searches/mo,
   no card) so the YouTube-driven visitor can *try the thing the channel promises*
   in one click, then convert to paid for volume.

2. **Add a genuinely FREE weekly newsletter.** The site already has a polished
   2-phase newsletter engine — but it's wired to the **paid** ($12/mo) list. Add a
   free weekly digest as the top-of-funnel email capture, reusing ~90% of the
   existing cron machinery.

Both are revenue-first: search-first lifts trial→paid on the $45 product; the free
newsletter is the email list that feeds both paid products.

> **⚠️ Live bug found + fixed during this review:** the search was returning *"The
> research engine is busy"* in production because `ANTHROPIC_API_KEY` was **not set**
> on the `campaignreceipts` Render service (confirmed in prod logs:
> `search session: first turn failed Error: ANTHROPIC_API_KEY not set`). Key has been
> set; redeploy in flight. **The product idea below assumes the search works** — which,
> as of this fix, it does.

---

## 1. What exists today (verified, not assumed)

| Piece | Status | Location |
|---|---|---|
| Entity search (autocomplete) | ✅ works | `/api/entity-search` → Typesense (226 politicians, ~4.5k promises) |
| AI dossier ("ask the receipts") | ✅ works *(was env-broken in prod, now fixed)* | `/api/search/session` → `lib/search-chat.ts` (Haiku 4.5 + web_search server tool) |
| Credit metering | ✅ works | `lib/search-credits.ts` — 100 searches/mo, hard cap |
| Paywall gate | ✅ works | `hasSoftware` entitlement; teaser shown to free users |
| Investigate page | ✅ exists, buried | `/investigate` |
| **Paid** weekly newsletter engine | ✅ built, 2-phase | `scripts/weekly-content-build.mjs` (Thu, Sonnet synthesis) + `scripts/weekly-newsletter-send.mjs` (hourly, per-TZ Friday-05:00 send) |
| Free email capture form | ✅ exists | `friday_receipts` mode in `CompRequestForm` → `/api/comp-request` |
| Render crons | ✅ live | `cr-weekly-content-build`, `cr-weekly-newsletter-send`, `cr-daily-worker` |

**Implication:** this is mostly a **repositioning + free-tier** job, not a from-scratch
build. The expensive parts (search engine, dossier AI, newsletter cron) already exist.

---

## 2. The thesis line (fable "$10k site" method)

> **"Type any politician. See who paid them — and what they did after."**

Every design decision tests against that line. The homepage's only job is to get the
visitor to type a name and get an answer.

---

## 3. Search-first homepage — proposed structure

Keep the paper/audit family system + the three design passes already shipped (ticker,
dark-canvas chart, scroll-reveals). Change the **hero** and the **order**:

1. **LIVE ticker** (keep — it's the "this is live" proof).
2. **HERO = the search box.** Headline = the thesis line. The `/investigate` search
   UI (the working entity-search + dossier) moves *here*, front and center. One box,
   filter chips, "99 of 100 free searches" meter for signed-in / "3 free searches —
   no card" for anonymous.
3. **A worked example, pre-run.** Below the box, one already-generated dossier
   (e.g. a famous name) so a visitor sees the payoff *before* typing — answers "what
   do I get?" in 2 seconds.
4. **Free newsletter capture** (the new free weekly — see §4).
5. Everything else (leaderboards, dark-canvas chart, races, dossiers, SEALED) moves
   **below** the fold as supporting evidence, in the order they are now.

### Free-tier search (the conversion mechanic)
- **Anonymous:** N free searches (proposal: **3**), tracked by cookie/IP, no signup.
  Hitting the cap → "Sign up free for more" → email capture (also subscribes to the
  newsletter if they opt in).
- **Free account:** a small monthly allotment (proposal: **5–10**), enough to get
  hooked, not enough for a researcher.
- **Paid ($45/mo):** the existing 100/mo. Unchanged.
- *Open question for founder:* exact free numbers + whether anonymous search is
  allowed at all (COGS: each search = 1 Haiku turn + up to N web searches; needs a
  cost ceiling — see §6 Risks).

---

## 4. Free weekly newsletter — proposed architecture

**Reuse the existing 2-phase engine.** The only real change is a **second audience
list** (free) alongside the paid one.

- **Phase 1 (build), already exists:** `weekly-content-build.mjs` synthesizes the
  week into stories + a newsletter issue (`cr_newsletter_issues`). A **free** issue
  can be a lighter cut of the same build (e.g. the top story + 3 one-line receipts;
  paid gets the full money-trail breakdown). Likely just a `tier` flag on the issue.
- **Phase 2 (send), already exists:** `weekly-newsletter-send.mjs` already does
  per-timezone Friday-05:00 sends with a per-(issue,user) ledger. Extend recipient
  selection to include **free subscribers** (from the `friday_receipts` captures /
  a `cr_subscribers` free list), sending them the free-tier issue.
- **Capture:** the `friday_receipts` form already writes leads. Wire those leads into
  the send list (today they may just sit in `cr_comp_requests`). Confirm the storage
  table + double-opt-in/unsubscribe compliance.
- **Sender:** Resend (already used: `RESEND_API_KEY`). Unsubscribe link required in
  every send (CAN-SPAM) — the paid path already has this; mirror it.

**Net new work is small:** a free issue variant + extend recipient selection + wire
the free capture list + a confirm/unsubscribe path. No new cron, no new infra.

---

## 5. Phasing (revenue-first, each phase shippable)

- **Phase 0 — UNBLOCK (done today):** set `ANTHROPIC_API_KEY` on Render so search
  works at all. ✅
- **Phase 1 — Free-tier search + search-first homepage.** Highest leverage: turns the
  channel's promise into a one-click trial. Ship behind a preview route first
  (`/preview/search-home`), founder reviews, then promote to `/`.
- **Phase 2 — Free weekly newsletter.** Reuse the engine; add the free list + free
  issue variant + capture wiring. Ship the capture on the new homepage.
- **Phase 3 — Conversion polish.** Cap→signup→paid funnel, the pre-run example
  dossier, share artifacts of dossiers (each answer is a screenshot-able receipt).

---

## 6. Risks / open questions for founder

1. **Search COGS at free scale.** Each free search = 1 Haiku turn + up to N web
   searches (billable). Anonymous free search could be abused. Need: a hard per-IP
   daily ceiling + maybe disable `web_search` on the free tier (DB-only dossiers),
   reserving web-augmented answers for paid. **Decision needed.**
2. **Free numbers.** 3 anonymous / 5–10 free-account — founder's call; affects both
   conversion and COGS.
3. **"Is this still SEALED-funnel?"** Today every page soft-sells the SEALED book.
   A search-first home changes the primary CTA. Confirm search-trial is the new #1.
4. **CAN-SPAM / opt-in** for the free list — confirm double-opt-in + unsubscribe are
   in place before we scale sends.
5. **Reading level.** The web-ux-director's 3rd-grade contract still binds: hero copy,
   the meter, the cap message, the newsletter — all ≤15-word sentences, verb-led CTAs.
6. **$500 cap.** Per portfolio rules, this needs a revenue justification (it has one:
   trial→paid on $45) and Chief-Accountant sign-off on the search COGS ceiling.

---

## 7. Recommendation

Do **Phase 1 first** as a preview route — the search-first homepage with a free tier —
because it's the single change most likely to convert the existing YouTube traffic the
channel already drives. It reuses the (now-working) search engine and needs no new
infra. The free newsletter (Phase 2) is a fast follow that mostly reuses the existing
cron engine. Get founder sign-off on the **free-search numbers + COGS ceiling** (§6.1,
§6.2) before building, since those govern both conversion and spend.
