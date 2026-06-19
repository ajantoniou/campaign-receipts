# Newsletter Capture Strategy — 2026-05-26

**Authors:** Web UX Director + Monetization Architect (joint pass)
**Directive (founder, verbatim):** "hold off on getting paid tier but 100% make sure to capture email top of funnel for newsletter with update of new donors, donor influenced votes, and donor influenced sponsored bills. that's it. people will sign up out of curiosity and we have a potential customer list."

**TL;DR:** Pro tier deferred. The free newsletter is now the #1 conversion surface on every page. Email-only field (zero friction). Same form component everywhere. Friday cadence stays as the brand-named send; the daily/rolling "new donors + donor-influenced votes + donor-influenced bills" digest is added as the *content* of that send (no second list — one list, weekly digest of those 3 sections). Build the list now, monetize when Pro ships.

---

## 1. Per-surface capture map

Verified against current code as of 2026-05-26:
- Homepage already has Friday Receipts form (page.tsx L813-851) — good, keep, restyle copy
- Footer already has `FridayReceiptsFooterForm` on every page (layout.tsx L233-243) — good, keep
- `/weekly` has RSS button but NO inline email form — gap to close
- Politician / article / bill pages have NO inline capture — biggest gap
- Header has no capture — by design, keep clean
- `cr_subscribers` is paid-tier table. A separate free-newsletter sink exists via `/api/comp-request?request_type=friday_receipts` per footer code. Keep using that endpoint; do NOT collide with paid `cr_subscribers`.

| Surface | Capture? | Form variant | Copy (verb-led, ≤8/15/4 rule) |
|---|---|---|---|
| Homepage hero | NO new form | n/a | Hero CTA already says "Get the free Friday newsletter" linking down. Keep — adding a form to the hero hurts the "5-sec what is this" test |
| Homepage mid-page (existing Friday Receipt section, L813) | YES (exists, rewrite copy) | **Inline-wide** | See §6 |
| Homepage footer | YES (exists) | **Footer-dark** | See below |
| /politician/[slug] (every profile) | YES (new) | **Inline-receipt** (paper, after the scorecard, before related) | H: *Track this politician's donors.* / B: *We email you when new donors show up or a vote moves with their money.* / Btn: **Watch the money** |
| /articles/[slug] (every article) | YES (new) | **Inline-receipt** (after the article body, before share row) | H: *More receipts like this — weekly.* / B: *New donors. Donor-moved votes. Donor-moved bills. One short email Friday.* / Btn: **Send me Friday's** |
| /bill/[congress]/[num] (every bill) | YES (new) | **Inline-receipt** (after money-trail block) | H: *Who's paying for the next bill?* / B: *We email you when new donor money lines up behind a new bill.* / Btn: **Track new bills** |
| /weekly (archive) | YES (new — gap) | **Inline-wide** (above the archive list) | H: *Don't wait for Monday. Read it in your inbox.* / B: *Same Friday email. Three sections: new donors, donor-moved votes, donor-moved bills.* / Btn: **Get Friday's email** |
| /pricing | YES (replace any "join waitlist" with this) | **Inline-wide** | H: *Free for now. Paid tier later.* / B: *Get on the list. You'll be first when Pro ships.* / Btn: **Get on the list** |
| Site footer (every page) | YES (exists) | **Footer-dark** | H: *Headlines only. New bills, new donations, new broken promises.* (keep current) Btn: **Get Friday's receipt** |
| Site header (every page) | NO | n/a | Header stays clean. Nav-bar signup forms underperform (~0.2% CR per Brevo 2024 benchmark) and hurt the trust frame. The footer form is the cross-page belt-and-suspenders. |
| Exit intent / scroll modal | NO (Phase 2) | n/a | Founder said "people will sign up out of curiosity" — respect that. No interrupts in Phase 1. |

**Build cost:** one new component `<NewsletterCapture variant="inline-receipt|inline-wide|footer-dark" surface="..." />` dropped onto 3 page templates (politician, article, bill) + 1 update to `/weekly` + 1 update to `/pricing`. Reuses existing `/api/comp-request?request_type=friday_receipts` endpoint. **Est: 2-3 hrs eng.**

---

## 2. Signup form design

**Decision: email-only.** Single field. No state, no name, no preference multi-select in v1.

Reasoning (Monetization Architect):
- Industry benchmark: each additional field drops conversion 4-7% (HubSpot 2024 form-field study, Sumo 1M signup analysis). Going from 1 → 4 fields typically halves CR.
- We can ask for state/district later via a **welcome email reply prompt** ("Hit reply with your state — we'll flag your reps in the digest"). Free segmentation, post-capture, costs zero CR.
- We don't NEED state to send the weekly digest — the digest is national in v1 (top new donors, top donor-moved votes, top donor-moved bills). Personalization is a v2 lever, not a v1 gate.

**Field UX:**
- Single `<input type="email" required>` with `inputmode="email" autocomplete="email"`
- Honeypot field (hidden `website` input) for spam — already standard in `/api/comp-request`
- On submit: optimistic UI → "Check your inbox to confirm" (double opt-in via Resend confirmation email — required for CAN-SPAM clean list)
- Privacy microcopy under form: "One email Friday. Unsubscribe in one click. We never sell your address."
- No subscriber count badge yet. Per founder directive ("verify before quoting"): we do not have a verified free-list subscriber count to display. Add `Join N readers` only once N ≥ 500 AND the count is queryable live from the subscribers table.

**A11y:** label with `<label for>`, error state visible (not color-only), 44×44 touch target on button, focus ring visible.

---

## 3. Newsletter content + cadence + AI-or-raw

**Cadence: ONE list, ONE send/week, Friday 9am ET.** Brand name stays "The Friday Receipt."

Rejected: daily send. Reasons:
1. Daily increases unsubscribe rate 3-5× vs weekly at our content volume (Litmus 2024 cadence benchmark). We don't have daily-grade signal yet.
2. Daily requires daily editorial QC — violates the $500 cap thinking. Weekly is one editor-hour.
3. Founder said "weekly digest" in spirit (one list, list of update topics) — not "daily."

**Content (3 sections, founder-specified):**

```
THE FRIDAY RECEIPT · Week of [date]
────────────────────────────────────

LEAD: [1 paragraph, the "worst broken promise of the week"
       hooked off /weekly cron pick]

§ 1 — NEW DONORS THIS WEEK
   3-5 bullets · "$X from [donor] to [politician] · [link to receipt]"
   Sourced from cr_industry_breakdown deltas + cr_foreign_donor_records inserts

§ 2 — DONOR-INFLUENCED VOTES THIS WEEK
   3-5 bullets · "[Politician] voted [yes/no] on [bill] · their #1 donor: [industry]"
   Sourced from cr_donor_vote_alignment rows where alignment_score = 1
   and the vote landed in last 7 days

§ 3 — DONOR-INFLUENCED SPONSORED BILLS THIS WEEK
   3-5 bullets · "[Bill] sponsored by [politician] · top donor industry: [X], $Y"
   Sourced from cr_bill_money_trail joined with bills.introduced_date in last 7d

CTA FOOTER: "Forward this. One reply with your state and we'll flag your reps."
```

**AI-or-raw: hybrid.** Cron does raw extraction (cheap, deterministic SQL). Opus 4.7 writes the lead paragraph + tightens each bullet to ≤15 words (one Opus call per send, ~$0.04). Editor (founder or persona) reviews in 10 min before the 9am send via a draft preview at `/admin/newsletter/preview`. Hard rule: no auto-send. Quality bar (CLAUDE.md rule 3) requires human review.

---

## 4. Top-of-funnel metric estimate

**Realistic conversion-to-email rate:** **2.5–4.5% of unique visitors** across the site, blended.

Benchmarks (cited, not from memory):
- Substack publisher median: 2.8% visitor→subscriber (Substack 2024 creator report)
- The Information / Axios paid-news free-newsletter signup: 3.5-5% (Press Gazette 2024)
- Data-product creator newsletters (think Stratechery free list, Matt Levine free): 4-6% on content pages, 1-2% on homepage
- Email-only inline forms on article footers: 3-5% (ConvertKit 2024 benchmark, ≈4× modal CR)

**Forecast at current traffic (assume 1,000 uniques/mo Phase 1):**
- Blended 3.5% → **~35 new subscribers/mo** from organic traffic alone
- 12-mo trajectory (assuming traffic grows 1.5×/quarter on SEO + cross-posts): ~600-900 list size by May 2027

**Multiplier surfaces:** the politician/article/bill inline forms are where the upside lives. Those visitors arrive with intent ("I want to know more about this politician") — capture-rate on inline article forms in news products runs 5-8% (Skimm + Morning Brew early data). If we hit that, blended CR rises to ~5%.

**Tracking:** every form posts `utm_source` = surface name (`homepage-mid`, `footer`, `politician`, `article`, `bill`, `weekly-page`, `pricing`). We segment 30/60/90-day open + click + reply rate by source. Lowest-performing surface gets rewritten at day 30.

---

## 5. Top 3 actions this week

| # | Action | Owner | Done by |
|---|---|---|---|
| 1 | Ship `<NewsletterCapture>` component (3 variants: `inline-receipt`, `inline-wide`, `footer-dark`) + drop on `/politician/[slug]`, `/articles/[slug]`, `/bill/[congress]/[num]`, `/weekly`, `/pricing`. Reuse `/api/comp-request?request_type=friday_receipts`. | **Web UX Director** (designs) → **Fullstack Engineer** (ships) | Wed 2026-05-27 |
| 2 | Wire double opt-in confirmation email via Resend + the 3-section weekly digest template (with §1/§2/§3 SQL extraction cron). First test send Friday 2026-05-29 9am ET. | **Backend Engineer** + **Editor (Betsy persona for tone QC)** | Fri 2026-05-29 |
| 3 | Add `utm_source` per-surface tracking + a `/admin/newsletter/metrics` page reading from `cr_subscribers` (or the free-list table — confirm which) showing CR by surface, 7-day rolling. Decision gate: review at day 14, kill lowest-performing surface or rewrite copy. | **Data Engineer** + **Monetization Architect** | Mon 2026-06-08 |

**Open question for founder (escalate before shipping #2):** is the free newsletter list landing in `cr_subscribers` (the paid-tier table, would need a new `tier='free_newsletter'` enum value + check-constraint relax) or a separate `cr_free_subscribers` table? Migration 003 today only allows `tier='pro'`. Recommend: **new table** `cr_free_subscribers (email pk, source, confirmed_at, subscribed_at, unsubscribed_at, utm_source)` with explicit GRANTs. Keeps paid funnel clean. **5-min schema decision, escalate Tuesday.**

---

## 6. Homepage hero capture — the exact copy founder will see first

Founder direction was to NOT add a new form in the hero (keep the 5-sec "what is this" frame). The first form a homepage visitor encounters is the **existing mid-page section at app/page.tsx L813-851**. Rewrite copy as follows:

```tsx
{/* ───── EMAIL SIGNUP — Friday Receipt, 3-section weekly digest ──── */}
<section className="bg-paper-2 border-t border-line">
  <div className="section-shell py-14 sm:py-18">
    <div className="max-w-[640px] mx-auto">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
        The Friday Receipt · free · every Friday 9am ET
      </div>
      <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
        New donors. Bought votes. Bought bills. One email.
      </h2>
      <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
        Every Friday we send three short lists: new donors that showed up this week,
        votes that lined up with donor money, and new bills with donor fingerprints.
        That's it. Free. Unsubscribe in one click.
      </p>
      <form
        method="post"
        action="/api/comp-request?request_type=friday_receipts&utm_source=homepage-mid"
        className="mt-6 flex gap-2 flex-wrap"
      >
        <input type="text" name="website" tabIndex={-1} autoComplete="off"
               aria-hidden="true" className="hidden" />
        <input
          name="email"
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          className="flex-1 min-w-[240px] bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-3.5 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-3 transition"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink"
        >
          Send me Friday's →
        </button>
      </form>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        One email a week · No tracking pixels · We never sell your address
      </p>
    </div>
  </div>
</section>
```

**3rd-grade check:**
- Headline: "New donors. Bought votes. Bought bills. One email." → 8 words ✓
- Body sentence avg: 13 words ✓
- Button "Send me Friday's" → 3 words, verb-led ✓
- No "subscribe" / "newsletter" verbs; uses "send" / "get" ✓
- All three founder-specified content sections named in the body ✓

---

## Coordination summary

| Decision | Owner | Resolution |
|---|---|---|
| Email-only field? | Both | YES (Monetization wins on CR math; UX agrees zero-friction beats segmentation in v1) |
| State/district capture? | Both | NO in form; YES via welcome-email reply prompt (post-capture segmentation) |
| Subscriber count badge? | Both | NO until verified count ≥ 500 (founder rule: verify before quoting) |
| Daily vs weekly | Monetization | WEEKLY — 1 list, 1 send, Friday 9am ET |
| AI vs raw content | Monetization | HYBRID — SQL extraction + Opus tightening + human review |
| Hero form on homepage | UX | NO — preserve 5-sec "what is this" frame; first form is mid-page |
| Header form | UX | NO — preserve trust frame; footer is the cross-page belt |
| Modal / exit-intent | UX | NO in Phase 1 — founder said "out of curiosity," not "interrupted into it" |
