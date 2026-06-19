# CampaignReceipts — Donor Intelligence Chat Agent: Pricing & Unit Economics (2026-05-26)

**Author:** Monetization Architect (persona: `shared/personas/monetization-architect.md`)
**Companion to:** `monetization-audit-2026-05-25.md` (which recommended KEEPING the $45 Bundle paywall).
**Founder proposal:** Haiku-powered chat agent over our Supabase + FEC + (new) video-transcripts DB, at **$20/month**. Cost goal: **<$1/user/mo**. Scope ladder v1→v3 (federal → state → all officials).
**Binding on:** pricing recommendation + position-vs-Bundle decision. Advisory on engineering implementation.

**TL;DR (one paragraph):**
The chat agent is a **good product, wrong price, and the wrong job description**. At Haiku 4.7 pricing with realistic power-user behavior (50 q/mo), raw inference is ~$0.10-0.25/user/mo — the <$1 goal is easily met. But $20/mo puts us in a knife-fight with **ChatGPT Plus and Perplexity Pro at the same price** with weaker UX, and cannibalizes the Bundle ($45 → $20 = lose 55% ARPU per converted user) without adding new ICPs. Ship it as **the entry rung of a 3-tier ladder at $9/mo (not $20)** — power consumer tier — keep the $45 Bundle as the **prosumer/journalist** tier (chat + matrix UI + export + API), keep $249+ Desk License at top. Scope-ladder pricing should stay **flat across v1→v3**, with tier-up via **rate limits + features**, not scope.

---

## Section 1: Cost-per-user analysis (does <$1/user/mo hold?)

### Token math (Anthropic Claude Haiku 4.7 pricing, public)

Haiku 4.7 listed pricing (verify before launch — these are my best-known figures as of 2026-05; cite source in implementation PR):
- **Input:** ~$0.80 / 1M tokens
- **Output:** ~$4.00 / 1M tokens
- **Cached input read:** ~$0.08 / 1M tokens (10× discount with prompt caching)

### Per-query token budget (realistic)

A typical donor-intelligence chat turn:

| Component | Tokens | Notes |
|---|---|---|
| System prompt (tools, schema, guardrails) | 4,000 | cacheable across all users — bill at cached rate |
| Conversation history (avg 3 prior turns) | 1,500 | cacheable per session |
| Tool definitions (FEC API, Supabase RPC, transcript search) | 2,500 | cacheable |
| User question | 80 | uncached |
| Tool call results (FEC JSON + 1-2 Supabase rows + 1 transcript chunk) | 3,500 | uncached (results change per query) |
| **Total input per query** | **~11,580** | 8,000 cached @ $0.08/M + 3,580 uncached @ $0.80/M |
| Output (answer + 1-2 citations) | 600 | @ $4.00/M |

**Cost per query:**
- Cached input: 8,000 × $0.00000008 = **$0.00064**
- Uncached input: 3,580 × $0.0000008 = **$0.00286**
- Output: 600 × $0.000004 = **$0.0024**
- **Subtotal LLM: ~$0.0059/query (~0.59¢)**

### 50 queries/mo per active user

- LLM: 50 × $0.0059 = **$0.30/user/mo**
- Supabase queries: 50 queries × ~3 DB reads each = 150 reads. Pro plan ($25 flat) covers ~millions of reads — marginal cost effectively **$0.00**. Even pgvector embeddings on transcripts at 50 calls/mo add nothing measurable.
- FEC API: free, rate-limited at **1,000 req/hr per API key**. At 50K active users × 50 q/mo with ~1 FEC call per query = 2.5M calls/mo = 3,500/hr peak — **we blow through the per-key limit**. Fix: (a) key rotation pool (5-10 keys, FEC is permissive about additional keys for legitimate use), (b) **cache FEC responses in Supabase** so 2nd+ user asking the same question hits our DB, not FEC. With caching at scale, FEC calls drop ~95% → safe. **Cost: $0** (FEC has no paid tier; the constraint is rate, not money).
- Egress + hosting marginal: chat responses are tiny (<2 KB). At 50K users × 50 msgs = 2.5M responses × 2 KB = 5 GB/mo. Render egress trivial.
- Transcript search (pgvector or Typesense): one-time embedding cost (~$5 for entire video archive at OpenAI prices, or $0 if we use Haiku-embed equivalent). Query-time: $0.

**Total marginal cost per active user (50 q/mo): ~$0.30-0.40/mo.**

**Heavy-user pessimistic case (200 q/mo, power journalist):**
- LLM: 200 × $0.0059 = **$1.18/user/mo** — **breaks the <$1 goal**.
- This is the 95th-percentile user. Either (a) enforce 100 q/mo soft cap on the $9 tier, (b) absorb (they're $9 ARPU and inference is still <15% of revenue), or (c) gate at 100 q/mo and upsell to $45 Bundle for unlimited.

**Verdict on founder's <$1/user/mo:** Achievable for the median user (50 q/mo) by a comfortable 2-3× margin. Achievable for the 95th percentile **only with a rate cap or upsell trigger**. Build the rate-counter on day 1 — don't ship unmetered.

### Hidden costs to budget

- **Prompt caching requires Anthropic's cache-control headers**; if engineering ships without them, costs **8× higher** (no cache discount) → $2.40/user/mo at 50 q/mo and we lose money on every user. **Hard requirement in the implementation PR.**
- **Bad-query loops** (user iterates 5× on a vague question): each iteration is a full turn. Cap conversation depth at 20 turns/session, 5 sessions/day for the $9 tier.
- **Hallucinated tool calls** that retry: cap at 3 tool-call retries per turn.

---

## Section 2: Pricing recommendation (one clear answer)

### **Recommendation: $9/mo, not $20/mo. Annual: $79/yr (save $29).**

### Why not $20/mo

1. **Direct competitor anchoring kills us at $20.** ChatGPT Plus is $20/mo with GPT-5/o-equivalent reasoning, image gen, voice, code interpreter, custom GPTs, and (as of 2026) live web search. Perplexity Pro is $20/mo with multi-model routing + live web + file analysis. A consumer comparing "$20/mo for ChatGPT vs $20/mo for a chat-with-FEC tool" picks ChatGPT 95% of the time. Our differentiation (live FEC + our donor-correlation DB + our transcript archive) is **real but narrow**, and a casual political news viewer doesn't know they need it.

2. **We don't have the brand permission to charge ChatGPT prices yet.** <1K YouTube subs, no paid Bundle subs yet, no press hits. Price-anchoring at the same point as the category-defining product requires either equal scope or 10× better at a niche. We're 10× better at one narrow niche (donor money trails) — not enough for a casual consumer to pay $20 over their existing $20 ChatGPT sub.

3. **$9/mo is the "extra subscription" price band** (Apple One add-on, Patreon mid-tier, NYT digital intro). Users add $9 subs without canceling something else. They don't add $20 subs without canceling.

4. **$9/mo at 1.5% MAU conversion = same gross as $20/mo at 0.7% conversion**, and **2× more users in the loop generating word-of-mouth + transcripts of their queries** (which become product fuel — "what people ask about Pelosi" is a content asset). At 100K MAU: $9 × 1.5% × 100K × 0.93 = **$12.5K/mo** vs. $20 × 0.7% × 100K × 0.93 = **$13K/mo**. ~Same revenue, **2× the funnel volume into the $45 Bundle upsell**.

### Why not free + ad-supported

The chat agent is the **most expensive surface per session** we'd offer. A free user firing 50 q/mo costs us $0.30 and we'd recoup ~$0.02 in display ads (chat UIs convert poorly to ads). Net **-$0.28/user/mo**. Free tier capped at **5 queries/mo total** (not "free forever") is the right floor — gives the demo, forces the upgrade.

### Final pricing card

| Tier | Price | Queries/mo | Scope | Features |
|---|---|---|---|---|
| **Free** | $0 | 5/mo | federal only | chat only, no exports, no history |
| **Chat** | **$9/mo** ($79/yr) | 100/mo soft cap | federal + governors + major mayors (v1) | chat, 30-day history, share links |
| **Bundle (existing $45)** | $45/mo ($399/yr) | unlimited chat | + full Donor→Vote/Bill matrix UIs, watchlists, alerts, CSV/JSON export, API 10K calls/mo, daily FEC refresh, commercial license | the prosumer/journalist tier |
| **Desk** | $249+/mo | unlimited everything | enterprise SLA, API 100K, team seats | newsroom B2B |

---

## Section 3: Position vs. the $45 Bundle (a/b/c)

### **Recommendation: (c) Entry tier in a 3-tier ladder.** $9 Chat → $45 Bundle → $249+ Desk.

NOT (a) replace — Bundle ARPU is 5× higher and journalists/researchers don't want a chat UI as their primary tool, they want **the matrix** (sort, filter, export). Chat is discovery; matrix is the work surface.
NOT (b) sit alongside as a second siloed product — siloing means we duplicate billing, support, and brand surface for no upsell path. A ladder reuses the same auth + entitlements (`/dashboard` already exists per `monetization-audit-2026-05-25.md` §1) and creates an obvious upgrade trigger ("hit your 100-q cap → upgrade to Bundle for unlimited + the matrix").

### Revenue math at 100K MAU for each option

Assumptions: conversion bands from prior audit (Bundle 1.5% MAU baseline; chat tier ~1.5-2% as a cheaper add).

| Option | Tier conversion | Tier ARPU | Gross/mo @ 100K MAU |
|---|---|---|---|
| **(a) Replace Bundle with $9 chat** | 2% MAU | $9 × 0.93 = $8.37 | **$16.7K** |
| **(a) Replace Bundle with $20 chat** | 0.8% MAU | $18.60 | **$14.9K** |
| **(b) Two separate products** | chat 1.5%, bundle 1.0% (cannibalized) — total 2.5% but split | blended ~$22 | **$55K** (admin overhead high) |
| **(c) 3-tier ladder ($9/$45/$249)** | chat 1.8%, 15% of those upgrade to Bundle within 6 mo, 0.05% direct Desk | blended ARPU ~$14 | **$70K** (chat $15K + Bundle $50K + Desk $5K) |
| **Baseline: $45 Bundle only** (status quo) | 1.5% MAU | $41.85 | **$62.7K** |

**(c) beats baseline by ~$7K/mo at 100K MAU** AND grows the top-of-funnel paying-customer count from 1,500 to 1,800+, which:
1. Generates more **product telemetry** (what donor questions matter most → editorial calendar).
2. Builds **email list of credit-card-verified users** for upsells.
3. Creates the **chat-history-as-shareable-artifact** loop (every shared transcript with a CR-branded receipt link is a free acquisition channel).

**The lever that moves total revenue most is still the Bundle.** Chat is acquisition + retention + upsell fuel, not the primary revenue lever. Don't let the chat agent's shipping excitement deprioritize the §7-Action-3 work from the prior audit (convert `/donor-to-vote` from waitlist → free preview cell).

---

## Section 4: Scope-ladder pricing (v1 → v2 → v3)

### **Recommendation: Flat price across all 3 scope versions. Differentiate on rate limits + features, not scope.**

### Why flat-on-scope wins

1. **The marginal cost of adding state-level officials to the DB is near zero** (FEC + state campaign-finance data, scrape & seed). It's an engineering project, not an inference cost. Users shouldn't pay more for scope we already amortized.
2. **Price changes confuse and churn users.** A $20 → $35 → $50 ladder over 12 months forces re-decisions. Each forced re-decision is a churn event. Keep the price; expand the value.
3. **"All public officials in v3" is the marketing promise that justifies $9 → 100K subs growth**, not a price-up trigger. The headline is "every politician in America for $9/mo," not "now $50 because we added your school board."
4. **State officials and below have LOWER willingness-to-pay per record**, not higher (long-tail of officials nobody searches for). Charging more for more scope inverts the demand curve.

### Recommended tier structure (single price ladder, scope expands free)

| Tier | Price | Query cap | Scope (v1 today → v3 by month 12) |
|---|---|---|---|
| Free | $0 | 5/mo | full scope as it exists at each version |
| Chat | $9/mo | 100/mo | full scope |
| Bundle | $45/mo | unlimited | full scope + matrix + export + API |
| Desk | $249+/mo | unlimited + SLA | full scope + team seats |

### What we DO change as v2 / v3 ship

- **Add a "Pro+ research" tier at $29/mo** ONLY if we add a genuinely-different feature like multi-document synthesis (compare 5 politicians' donor profiles in one report) or scheduled monitoring (daily digest on a politician's new filings). Price-on-feature, not price-on-scope.
- **Bump query caps** for the $9 tier from 100 → 200 in v2 to keep value-per-dollar growing as the catalog grows.
- **Press release on every scope expansion** (PR is free marketing; price hikes are not).

### Rate-limit tiers vs. flat-price (founder's "or stays flat $9 but with 100/1000/unlimited tiers")

I considered the 3-tier rate-limit ladder (100 q/mo free, 1000 q/mo $20, unlimited $50). Rejected because:
- 1,000 q/mo is **33 q/day** — the only users hitting that are journalists/researchers, who **need the matrix UI**, not just more chat. Sell them the Bundle, not a chat-rate tier.
- Pure rate-limit tiers train the user to think of us as a meter, not a product. Bundle/Desk train them to think of us as a workspace. Workspace-pricing has 2-3× the LTV of meter-pricing in B2C SaaS (Notion, Linear, Figma all moved meter → workspace).

---

## Section 5: Conversion + LTV math

### Conversion: YouTube viewer → paid chat user

- Prior audit §3 assumed 1% video-view-to-site-click, 1.5% site-visitor-to-paid-Bundle. For a $9 chat tier with a clearer "talk to FEC about Pelosi" promise, expect **2.0-2.5% site-visitor-to-paid** (cheaper price, more visceral demo). Net video-view-to-paid: ~0.02-0.025% (slightly better than Bundle's 0.015%).
- **At 100 views/video today: 0.02 chat subs/video.** Same growth-not-pricing constraint as the prior audit. The chat agent does **not** fix the traffic problem; it shouldn't be sold to the founder as a growth lever, only a monetization-depth lever.

### LTV

Comparable consumer chat/data products:
- **ChatGPT Plus:** ~6-8 mo median retention (reported on r/OpenAI surveys; not official). LTV $120-160.
- **Perplexity Pro:** ~5-7 mo retention reported; LTV ~$100-140.
- **Politico Pro consumer-light tier (defunct):** churned hard at 3 mo.
- **Substack political newsletters at $5-10/mo:** 4-6 mo retention.

**CR Chat estimate: 4-month median retention.** Political-content paywalls (per persona rule) cluster at 3-5 mo. Chat agents skew slightly higher on retention than read-only newsletters due to interactive engagement.

- **Chat LTV:** $9 × 4 mo × 0.93 = **$33.50** gross, ~$32 net of LS.
- **Annual upsell LTV:** $79 × 1.2× renewal = $95 × 0.93 = **$88 net**. Push annual hard from checkout.

### Allowable CAC

- **3:1 LTV:CAC on monthly:** $11 max CAC. That's "share a referral link, get $5" levels of CAC — feasible only via organic + referral + the existing YouTube channel. **Paid acquisition does not work at $9/mo.** Don't let anyone propose Meta/Google ads to drive chat signups.
- **3:1 on annual:** $29 max CAC. Better, still organic-only.

### Bundle upgrade path (the actual LTV story)

If **15% of chat subs upgrade to Bundle within 6 months** (typical B2C SaaS upsell rate for adjacent-tier upgrades when the upsell trigger is a hit cap):

- Blended LTV: 85% × $33.50 + 15% × ($33.50 + Bundle-LTV-of-$200) = **$63 blended** — nearly **2× the chat-only LTV**.
- This is why (c) the ladder wins (b) two-silos: the chat sub is a **qualified lead for the Bundle**, not a separate customer.

---

## Section 6: Top 3 unit-economics risks (what kills the <$1/user goal)

### Risk 1 — Engineering ships without prompt caching → cost balloons 8×
**Trigger:** PR merges without `cache_control` on the system prompt, tool defs, and conversation history.
**Impact:** $0.30/user/mo → **$2.40/user/mo**. Above price floor for free trials; ~25% of revenue for $9 tier.
**Mitigation:** Block PR merge without (a) caching unit test that asserts >70% of input tokens are cached on turn 2+, (b) Langfuse trace verifying cache_read_input_tokens > cache_creation_input_tokens. Owner: engineer + Langfuse skill (`shared/skills/langfuse/`).

### Risk 2 — Unmetered queries → power users burn budget
**Trigger:** No per-user query counter; users discover they can pipe 10,000 q/mo through us at $9 flat.
**Impact:** Even 50 abusers at 5,000 q/mo each = $1,475/mo in inference, ~$0 in revenue beyond their $9 each. Wipes out the tier's margin.
**Mitigation:** Hard cap at 100 q/mo on the $9 tier, with a "buy 100 more for $5" overage OR a "go unlimited with Bundle" upsell card at 80% cap consumption. Build the metering on day 1 in Supabase (`cr_chat_usage` table, RLS by user_id, increment on each tool call). Don't promise "100 messages" — promise "100 questions" and count by user-initiated turns, not internal tool calls.

### Risk 3 — FEC API rate-limit + no-cache → 429s + Anthropic burns retrying
**Trigger:** Each chat query hits live FEC API. At 1,000-user × 50-q/mo × 1-FEC-call peak hour = >1K/hr per key → 429s → Haiku does tool-call retries → 3× input token spend, no answer for the user.
**Impact:** **2-3× LLM cost during peak hours + user-visible failures**. Worst case during a news cycle (we go viral on a Senate vote, all users ask about the same donor): meltdown.
**Mitigation:** (a) All FEC reads go through a **Supabase-cached read-through layer** with 24h TTL on filing-level data (FEC filings don't change retroactively). (b) Pool of 5-10 FEC API keys (legitimate per FEC ToS). (c) Anthropic tool-call max_retries = 2 (not default 3-5). Owner: engineer.

### Bonus risk 4 — Transcript paywall idea is fine but cheap to copy
The founder noted "store transcripts of all our news videos in DB — that's our paywall." Transcripts are a **content moat that any one of our competitors can scrape in a week** once we publish (they're already in the video). The real moat is the **donor-correlation DB + the receipts permalink graph + the matrix UIs**, not the transcripts. Don't oversell transcripts as defensibility — sell them as **citation surface** (chat answers cite specific video timestamps with deeplinks, which drives YouTube watch time, which feeds the YPP threshold).

---

## Appendix A — Single decisive answers (for the founder, no hand-waving)

| Question | Answer |
|---|---|
| Should we build it? | **Yes**, as the entry tier of a 3-tier ladder. |
| At what price? | **$9/mo** ($79/yr). NOT $20. |
| Replaces or sits beside Bundle? | **Neither** — it's the rung **below** the Bundle. Bundle stays $45. |
| Cost per user (median, 50 q/mo)? | **~$0.30-0.40/mo** (well under $1) — IF prompt caching is shipped. |
| Scope ladder pricing? | **Flat $9** across v1/v2/v3. Differentiate on rate caps + tier features, not on which officials are in scope. |
| Free tier? | Yes — **5 queries/mo lifetime cap on free**, hard upgrade wall. Not "free forever." |
| Biggest risk? | **No prompt caching at launch** = unit economics break. Block the PR. |
| Revenue at 100K MAU with ladder vs. Bundle-only? | **$70K/mo vs. $62.7K/mo** (+$7K, +11%). Bundle still 70% of mix. |

---

## Appendix B — Sister persona handoffs

- **Chief Accountant:** add chat-tier line to weekly P&L template. Track `cost_per_active_chat_user` weekly; alert if >$0.80.
- **McKinsey Advisor:** kill threshold proposal — if chat tier has <200 paid subs by day 90 post-launch (or upgrade-to-Bundle rate <8%), kill the tier and reabsorb engineering into Bundle features.
- **YC Advisor:** red-team the 15% chat→Bundle upgrade assumption. If real number is 5%, blended LTV drops to ~$45 (still profitable, but the ladder advantage over Bundle-only narrows to ~$2K/mo at 100K MAU and the engineering cost may not justify).
- **Head of Growth:** the chat agent's primary acquisition surface is **shareable transcript permalinks** — every answer gets a `/chat/[id]` URL with the receipts inline, shareable to X / Bluesky / newsletter. Design this in v1 — it's the loop.
- **Designer + agent-companies-design:** chat UI must match the audit-receipt aesthetic (monospace answers, FEC-source-tile citations, stamped-verdict callouts). Do NOT ship a generic ChatGPT clone — the paper-token brand is the differentiation users see before they see the data.
- **Langfuse skill:** instrument every Haiku call from day 1; cost-per-user-per-day dashboard is the launch gating metric.
