# CampaignReceipts — Product Ladder Decision (2026-05-26)

**Author:** Monetization Architect (`shared/personas/monetization-architect.md`)
**Companions:** `monetization-audit-2026-05-25.md`, `chat-agent-pricing-2026-05-26.md`
**Job:** rank, sequence, and KILL across the 5 candidate products the founder is juggling. No "consider." DO / DON'T with numbers.

---

## TL;DR (founder, read this and stop)

1. **BUILD NEXT (this week):** D2C Chat at $9/mo — already scoped, already priced, already has the Haiku cost model. Ship.
2. **BUILD AFTER (next week):** Daily Journalist Newsletter — FREE, no paywall. It is a funnel, not a SKU. Every overnight cron diff goes out as one email. Cost ~$0, acquisition value enormous.
3. **KEEP AS-IS:** $45 Bundle (the "Matrix"). Do NOT unbundle to 3× $10 SKUs — the math says unbundling needs ≥1.65 SKUs/customer to break even and that's a coin flip you don't need to take.
4. **KILL:** Per-State Weekly Email at $10/state. The "Hill aide will subscribe" hypothesis does not survive TAM math — Punchbowl is free, POLITICO Pro is bought by the office not the aide, and per-state product is a 50-product maintenance burden for a small ceiling.
5. **DEFER (6+ months):** Federal Weekly Email at $10/mo, ONLY as a Bundle add-on or substack-style standalone *after* the free newsletter has 5K+ subs. Don't build it cold.

---

## Section A — TAM validation: the "Hill aide" hypothesis

Founder's hypothesis: *"every helper aide in Congress would be subscribed."*

### How many Hill staff actually exist?

Best public figures (CRS reports, Congressional Management Foundation, LegiStorm):

| Bucket | Headcount |
|---|---|
| House personal office staff | ~6,500–7,500 |
| Senate personal office staff | ~3,500–4,000 |
| House + Senate committee staff | ~2,500 |
| Leadership offices (both chambers) | ~400 |
| Support staff (CRS, GAO, CBO, etc. — not "aides") | ~5,000 (out of scope) |
| **Total addressable Hill staff** | **~13,000–14,500** |

State legislative staff (NCSL "Size of State Legislative Staff" report, most recent): ~30,000 full-time-equivalent nationally, but **concentrated in 10 large-pro states** (CA ~2,200, NY ~3,000, FL, PA, TX, IL, MI, OH, NJ, MA). Most states have 50–300 staff. The "every state has aides hungry for our newsletter" picture is not real — 30 states have legislatures that meet part-time and where staff use their phones, not Punchbowl.

### What do Hill staff currently use?

- **Punchbowl News AM / PM / Tech / Policy** — FREE for the morning newsletters that drive almost all Hill mindshare. Punchbowl Premium is **~$300/mo** but the free product is what aides actually read.
- **POLITICO Pro** — **$5,000–$10,000+/yr per seat**, but **bought by the office on the Member's MRA, not the aide**. Every personal office gets a few seats; aides share.
- **Axios Pro Rules** — **$599–$1,000+/yr/seat**, similar org-bought pattern.
- **CQ.com (FiscalNote)** — **$5,000–$10,000+/yr/seat**, org-bought.
- **OpenSecrets** — **FREE.** This is the actual money-in-politics tool every aide already uses.
- **FEC.gov alerts** — **FREE.** Direct from source.
- **LegiStorm** — **~$1,200/yr**, org-bought for HR/staff salary tracking.
- **Bloomberg Government** — **$5,700+/yr/seat**, org-bought.

**Critical pattern:** money-tracking tools that Hill staff use are either (a) FREE (OpenSecrets, FEC, Punchbowl AM) or (b) $5K+/seat and **bought by the office, not the individual aide**. There is no $10/mo "I expense it" tier on the Hill — the MRA paperwork for a $10 sub is more annoying than just reading OpenSecrets.

### Realistic capture rate for a $10/mo CR Federal email

Aides on a personal Gmail / personal card paying $10/mo for an email newsletter from a sub-1K-sub YouTube channel with **no Hill brand recognition** competing against **free Punchbowl AM and free OpenSecrets**:

- Best case (year 2, post-press hits, 50K YT subs): **0.5% of 14K = 70 subs = $700/mo gross.**
- Realistic (year 1, today): **0.1% = 14 subs = $140/mo.**
- Free-newsletter-first capture rate (5K free → 5% paid upgrade) gets us to maybe 250 paid Federal-tier subs over 18 months = **$2,500/mo**.

State-level math (50 SKUs):

- 30,000 state staff, but realistically only 10 large states have professional staff who'd pay. 10 states × 2,000 staff avg × 0.1% capture × $10 = **$2,000/mo total across the entire 10-state SKU set**, after 50 newsletters' worth of weekly editorial work.
- Editorial cost: writing 1 state newsletter = ~2 hours of LLM time + 30 min human QC. 50 states weekly = 50 × 2.5 hr = **125 hours/week of human-equivalent work**. Even fully AI'd, the QC + correction loop is unsustainable for the revenue.

### VERDICT on Section A

**The Hill-aide hypothesis is FALSE at $10/mo.** The aide market is either (a) served free by Punchbowl + OpenSecrets or (b) gated by org-bought $5K+/yr seats. There is no $10/mo aide market.

There IS a **$249/Desk-License market** — the Deputy Comms Director or Research Director **expensing it on the MRA** — and we already have that SKU. That's the Hill play. Not a $10 personal sub.

**State-by-state is even worse.** Total addressable ~$2K/mo for 50 SKUs of weekly editorial work. KILL.

---

## Section B — Rank the 5 products (12-month MRR)

Assumptions: ~30K MAU by month 12 (5× today's traffic, achievable with Section 5 blog-companion + 2–3 viral videos), conversion bands from the 2026-05-25 audit + 2026-05-26 chat doc.

| # | Product | 12-mo MRR | Build cost | Maint/mo | Cannibal risk | **Verdict** |
|---|---|---|---|---|---|---|
| 1 | **D2C Chat $9/mo** | **$4–6K** (30K MAU × 1.8% × $9 × 0.93) | 1.5–2 eng-wks (already scoped) | low (~$0.40/user inference) | low — entry rung below Bundle, +15% upsell to Bundle | **KEEP — BUILD FIRST** |
| 2 | **$45 Bundle (Matrix)** | **$15–20K** (30K MAU × 1.5% × $45 × 0.93) | already built; needs WAITLIST_OFF + free-preview cell | low | none — the anchor SKU | **KEEP — already in flight** |
| 3 | **Daily Journalist Newsletter (FREE)** | **$0 direct, $3–5K attributed** (drives 15–20% lift on Chat + Bundle signups via funnel) | 3–5 eng-days (cron diff → Resend template) | very low (Resend free up to 100/day, $20/mo at 50K) | negative (it FEEDS the other SKUs) | **KEEP — BUILD SECOND, FREE** |
| 4 | **Federal Weekly Email $10/mo** | **$500–2,500** (best case 0.5% of 14K Hill staff + spillover) | 1 eng-wk + ongoing weekly editorial | medium (weekly Opus 4.7 commentary + human QC, $80–150/wk editorial) | high — anyone who'd pay $10 federal would pay $9 for Chat which is more useful | **DEFER 6 months** — only after free newsletter hits 5K subs; then ship as $10 add-on |
| 5 | **Per-State Weekly Email $10/state/mo** | **$1–2K total across all 50 SKUs** (best case) | 2 eng-wks + 50× ongoing editorial pipelines | **HIGH** (50 weekly newsletters, each needs state-finance data integration that doesn't fully exist in our DB) | medium | **KILL** |

**Key callout on #5:** the state product requires state campaign-finance data, which **is not in our DB** (we only have FEC = federal). Building state data ingestion across 50 states with 50 different filing systems (NY Board of Elections, CA Cal-Access, TX TEC, etc.) is a 6-month engineering project on its own. Per Section A the ceiling is ~$2K/mo. Negative ROI. KILL.

---

## Section C — Sequence (what 2 to build, in what order)

The constraint is **founder + Claude bandwidth**, not money. Pick the 2 things with highest **(revenue impact × strategic compounding) ÷ (build cost)**.

### THIS WEEK: Ship D2C Chat at $9/mo

**Why this and not the newsletter first:**
1. It's already fully spec'd (`chat-agent-pricing-2026-05-26.md`). No new strategy work.
2. It has the most-direct revenue mechanism — the moment it ships, MRR can move.
3. It generates **query telemetry** ("what donor questions matter") which feeds the newsletter's editorial calendar. Build chat → harvest queries → newsletter writes itself.
4. It's the **entry rung** of the ladder. Without it the funnel is "free → $45 Bundle" which is a cliff. With it, "free → $9 Chat → $45 Bundle" is a staircase.

**Critical gates (do not ship without):**
- Prompt caching headers (Risk 1 in chat doc) — block PR without test
- `cr_chat_usage` metering table, hard cap at 100 q/mo
- FEC read-through cache (Risk 3)
- Langfuse traces from day 1

**Owner:** engineer subagent + designer (chat UI matches receipt aesthetic). **Deadline:** Friday.

### NEXT WEEK: Ship the FREE Daily Journalist Newsletter

**Why second, not first:**
1. Chat ships gross revenue today; newsletter ships pipeline. Revenue before pipeline when both are cheap.
2. Newsletter at scale becomes more valuable once Chat exists (every newsletter sub is a Chat lead).
3. Build is small (3–5 days) — cron already emits diffs (new donors, new bills, new votes from `cr-fec-weekly`, `cr-bills-weekly`, `cr-alignment-nightly`). We just need Resend template + signup form + 1 editorial pass.

**Spec:**
- One email per day, sent 7am ET
- Sections: "New filings overnight" (top 10 by amount or notability), "New bills introduced" (auto-tagged for money-relevance), "Vote alignments that moved" (donor → vote score deltas >threshold)
- 1-paragraph human-written (or Opus 4.7 auto-written + human QC) top-of-email "what mattered yesterday"
- Every item links to `/r/[id]` or `/politician/[slug]` or `/bill/...` — every email is a traffic driver
- CTA footer: "Want to ask follow-up questions? → Chat ($9)" + "Want to build a watchlist? → Bundle ($45)"

**Owner:** engineer + Head of Growth + video-producer (for the daily 1-paragraph). **Deadline:** end of next week.

### What we are EXPLICITLY NOT doing in the next 2 weeks

- ❌ State Weekly Email (any state) — killed
- ❌ Federal Weekly Email — deferred to month 6+
- ❌ Unbundling the Matrix into 3× $10 SKUs (Section D) — math doesn't support
- ❌ More YouTube videos at the expense of shipping the above (videos are the growth engine but Chat ships in parallel)

---

## Section D — The matrix problem (bundle vs. unbundle math)

Founder said: *"The matrix i'm not sure is so sexy, it's just a dashboard."*

He's right that it's "just a dashboard" — but **the dashboard IS the product** for the journalist/researcher ICP. They don't want chat for this work; they want sort, filter, export. The Bundle's UX problem is solvable (designer pass); the pricing isn't broken.

### The unbundling math

Proposed unbundling: **Donor Engine $10 + Vote Engine $10 + Bill Daily Refresh $10 = $30 in 3 SKUs** vs. current **$45 Bundle**.

For unbundling to beat bundling on revenue:

- Bundle revenue per customer: **$45**
- Unbundled revenue per customer: **$10 × N** where N = avg SKUs purchased per customer
- Break-even: **N = 4.5 SKUs/customer** — *but we only have 3 SKUs proposed*, so it's mathematically impossible for unbundling to beat the bundle on ARPU **even if every customer buys all 3**.

If every customer bought all 3 = $30 ARPU = **33% revenue loss vs. Bundle.**
Realistic mix (per Tunguz/OpenView SaaS unbundling data, customers typically buy 1.3–1.8 SKUs when given an a-la-carte menu of 3 related items):
- **1.5 SKUs/customer avg × $10 = $15 ARPU** = **67% revenue loss vs. Bundle.**

For unbundling to be revenue-neutral, you'd need conversion rate to **3×** (4.5% MAU → paid instead of 1.5%). There is zero evidence that a $10 entry price triples conversion on a journalist/researcher tool — these buyers are price-insensitive in the $10–$50 band; they care about the workflow.

### Where unbundling DOES make sense

It does NOT make sense as a permanent re-architecture. It DOES make sense as **one feature inside the Bundle being a "preview SKU"** — i.e., free preview of the Bill Daily Refresh email (which is just the journalist newsletter, see Section C) → upgrades to Bundle for the full matrix.

### VERDICT on Section D

**KEEP the $45 Bundle as one SKU.** Do NOT unbundle to 3× $10 SKUs.

**DO** make the Bundle "sexier":
- Ship the free-preview-cell change from prior audit §7 Action 3 (Manchin × Pharma live, rest gated)
- Add a "What I get for $45" comparison table on `/pricing` that visually contrasts vs. $9 Chat and vs. $249 Desk
- Add an annual plan emphasis ($399/yr saves $141) — annual is where the LTV doubles

**Owner:** designer + agent-companies-design.

---

## Section E — Free newsletter as funnel (the math)

If the Daily Journalist Newsletter is FREE, what's it worth?

### Funnel math at steady state (month 6 post-launch)

Assumptions (industry-standard for free political newsletters with daily cadence):

- **Newsletter signup rate from site visitors:** 2.5% of MAU (industry mid for free newsletter with strong utility)
- **Newsletter → Chat ($9) upsell rate:** 5% within 90 days
- **Newsletter → Bundle ($45) upsell rate:** 1.5% within 180 days
- **Newsletter → Desk ($249) attributed leads:** 0.05% (cold-outbound conversion)

### At 30K MAU (month 12):

- Newsletter subscribers: **30K × 2.5% = 750 free subs in month 1**, compounding to **~5,000 free subs by month 12** (assuming 40% MoM growth tapering to 8%)
- Chat conversions from newsletter: **5,000 × 5% = 250 Chat subs × $9 = $2,250/mo**
- Bundle conversions from newsletter: **5,000 × 1.5% = 75 Bundle subs × $45 = $3,375/mo**
- Desk leads from newsletter: **5,000 × 0.05% = 2.5/mo × $499 avg × ~30% close = $375/mo attributed**

**Newsletter-attributed MRR at 5K subs: ~$6,000/mo.**

### Cost to run newsletter

- Resend: **free** (100/day) → **$20/mo** at ~50K sends/mo (5K subs × 30 days) → **$80/mo** at 20K subs
- Cron compute: already paid for (the diff-generating crons already run)
- Editorial: 15 min/day human QC over LLM-generated top-of-email = **~7 hr/wk** of founder or persona time. At $0 marginal (Claude does the draft, founder rubber-stamps).
- Total marginal cost: **<$100/mo** at 20K subs

### ROI

**$6,000 attributed MRR / $100 cost = 60× ROI.** This is the highest-leverage product in the entire list.

### Why FREE, not paid

If we paywalled the newsletter at $10/mo:
- Sub count drops from 5,000 free → ~500 paid (10× drop is standard for newsletter free→paid friction)
- Direct revenue: 500 × $10 × 0.93 = **$4,650/mo**
- BUT funnel value collapses: 500 × 5% Chat upgrade × $9 = $225/mo + 500 × 1.5% Bundle × $45 = $338/mo = **$563/mo funnel value**
- Total paid newsletter: **$5,213/mo vs. $6,000/mo for free newsletter as pure funnel**

**Free wins by ~$800/mo AND builds a 10× larger email list** that compounds for years. The list is also the only thing CR owns that survives a YouTube algo change.

### VERDICT on Section E

**FREE. NO PAYWALL on the newsletter.** Ever. It is the top of funnel for Chat + Bundle + Desk.

If you ever want a paid newsletter SKU, build it as **"CR Friday Insider"** — a separate, deeper, Opus-4.7-commentary, week-in-review at $15–25/mo that lives alongside the daily free. Different product, different ICP (the prosumer who wants synthesis, not the journalist who wants raw diffs). NOT the same product behind a paywall.

---

## Appendix — Decisive table for the founder

| Question | Answer |
|---|---|
| Ship Chat at $9 this week? | **YES.** Top priority. |
| Ship Free Daily Newsletter next week? | **YES.** Funnel value 60× cost. |
| Unbundle Matrix to 3× $10 SKUs? | **NO.** Math impossible — 3 SKUs × $10 < $45 even at 100% attach. |
| Build Federal Weekly Email at $10? | **NOT NOW.** Defer until free newsletter >5K subs (month 6+). |
| Build Per-State Weekly Email at $10/state? | **KILL.** TAM ~$2K/mo for 50 newsletters of editorial; state data not in DB. |
| Is the Hill-aide hypothesis real? | **NO at $10/mo.** Real at $249/Desk License (which we already have). |
| Make Matrix sexier? | **YES** — free-preview cell + annual-plan emphasis + comparison table. |
| Order of operations | (1) Chat this week, (2) Free newsletter next week, (3) Bundle free-preview cell week 3, (4) revisit Federal email at month 6. |

---

## Sister persona handoffs

- **Chief Accountant:** Add Chat MRR + Newsletter-attributed MRR lines to P&L template. Newsletter cost line ~$0–100/mo.
- **McKinsey Advisor:** Kill threshold for Chat tier already set (day 90, <200 subs). Add new kill threshold for newsletter: if <500 subs by day 60, re-evaluate top-of-email editorial format (not the channel).
- **YC Advisor:** Red-team the 5% newsletter→Chat upsell rate. If real is 2%, attributed MRR drops to ~$3K but newsletter still wins as a list-building exercise.
- **Head of Growth:** OWN the newsletter signup placement (every blog post, every politician page, every chat answer footer). This is the load-bearing acquisition surface for the next 6 months.
- **Designer + agent-companies-design:** Newsletter template must match paper-receipt aesthetic. Plain-text-fallback friendly. Footer CTAs visually distinct from body.
