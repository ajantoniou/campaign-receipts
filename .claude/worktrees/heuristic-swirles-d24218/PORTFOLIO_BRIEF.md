# AgentCompanies — Portfolio Master Brief

**Last updated:** 2026-05-21 (Paperclip + CoS multi-agent layer deprecated; document trimmed to evergreen strategy.)
**Founder:** Alex Antoniou (alex@antoniou.net)
**Founder credential:** Board-certified physician, 23-state licensed.

This document is the source of truth for portfolio strategy: which
companies exist, what tier, what budget, what kill criteria. Hard
rules live in [`BIBLE.md`](BIBLE.md).

---

## 1. Founder Constraints (HARD RULES)

| Constraint | Rule |
|---|---|
| **Time commitment** | ≤12 hrs/week. Founder reviews + approves big decisions. Founder does ZERO execution work. |
| **Liability profile** | **CLEAN BUSINESSES, MINIMAL ZERO LIABILITY.** No malpractice exposure. No HIPAA Business Associate responsibilities. No SEC investment-advisor classification. No state medical board exposure. |
| **Spend ceiling** | $50-200 per Tier 1 company; $100-200 per Tier 2 company; $50-100/mo per Tier 3 company. Total portfolio target ~$650/mo steady state. |
| **Revenue-first** | Every decision optimizes for time-to-first-dollar. Companies with cashflow proven first; community plays second. |
| **No telehealth ever** | Not now, not at scale, not under any pivot. |
| **No PHI handling** | None of the active/research companies touch Protected Health Information. HealthBrew Longevity is educational + avatar-based. |
| **Plutopath isolation** | Different folder, different Supabase, different Stripe. The trading platform connects to Plutopath read-only via founder-controlled lagged endpoint. |
| **Founder failure pattern** | The 9-startup history pattern is "spinning up too many ideas + customer acquisition weakness." Tier discipline prevents this from recurring. |

---

## 2. Portfolio Structure (Revenue-fast / Slow-burn / Hibernating)

| Bucket | Company | Cap | First $ | Founder time/wk | Liability |
|---|---|---|---|---|---|
| **Revenue-fast** | **Concise** (multi-book PDF launch + SEALED imprint) | $200 | Week 1-2 | <30 min | Zero |
| **Revenue-fast** | **CarStack / EstimateProof** (B2B vehicle-history reports for mechanics/dealers) | $100/mo | Week 2-4 | <30 min | Zero |
| **Slow-burn** | **NT Ministry** (Content arm + Directory arm + NT Films research, all one company) | $300 | Week 4-8 (content), Month 3-4 (directory) | <45 min | Low |
| **Slow-burn** | **HealthBrew Longevity Dashboard** | $50/mo | TBD (free until traction) | <15 min | Low (educational, avatar-based) |
| **Hibernating** | **Hyperlocal Matrix** (anonymous chat) | $0/mo paused | Deferred | 0 | Low-Medium |
| **Hibernating** | **Plutus Street** (trading platform: journal + signals + live video) | $0/mo paused | Deferred | 0 | Low |

**Hibernating definition:** budget capped at $0/mo, no active work, no founder attention. Revisit weekly to decide re-activate vs. continue hibernation. Persona/vision/backlog files frozen-in-place for fast restart.

### Companies CUT entirely (preserved in git history only)

| Company | Cut date | Reason |
|---|---|---|
| Physician Nexus Letters | 2026-05-02 | Malpractice insurance + license exposure too murky |
| Prior Auth SaaS | 2026-05-02 | HIPAA Business Associate complexity; not $1M+ ceiling |
| Trading Live (spectator-only standalone) | 2026-05-01 | Replaced by Plutus Street with live video as feature |
| Health Info Product | 2026-05-01 | No existing IP; agent-suggested idea |
| Estate Planning | (earlier) | Cannot outspend LegalZoom |

---

## 3. The Pluto Family Architecture

The founder owns multiple Pluto-family domains:
- `plutopath.com` (trading system, founder's private infrastructure)
- `plutoship.com` (available for use)
- `plutopursuit.com` (available for use)

**Architectural decision:** Pluto/Plutus (Greek god of wealth) is a brand family for founder's financial products. The trading platform launches under this family.

| Property | Domain | Use |
|---|---|---|
| Plutopath | plutopath.com | Founder's private trading system (NOT in this portfolio) |
| **Plutus Street** (working name) | plutoship.com | Trading platform (hibernating) |
| Future financial products | plutopursuit.com | TBD |

**One brand family, multiple products** — same architectural pattern as NT Empire (content + directory + future films).

---

## 4. Companies — Detailed Briefs

### 4.1 Concise (Multi-Book Direct Sales)

**Company entity:** Demiurgic Labs LLC (founder's existing LLC owning Concise pseudonym brand)

**One-line:** Repackage founder's existing 20+ books outside Amazon as direct-sale PDFs + bundles, leveraging MD credential (MCAT specifically) and bolder positioning Amazon constrains.

**Existing assets:**
- Founder's CONCISE Drive folder: 20+ books, 10 years on Amazon at $200/mo
- Specific titles flagged: Trump election promises book (Grabit Nation), Ben Franklin's 13 Virtues (Classic Titles series), MCAT prep series, general advice titles
- All books written by founder under pseudonym

**Phase 1 launch (week 1-4): 3 SKUs simultaneously**
1. **Trump Election Promises Book** (working title from "Grabit Nation" book) — $9-19 PDF
2. **Ben Franklin's 13 Virtues + companion** — $9-19 PDF
3. **MCAT Bundle** (3 MCAT prep books) — $49-99 bundle

**Why all 3 in week 1:** different audiences, different channels, fast learning. If one catches, double down. If none catch in 30 days, reassess.

**Pricing locked:**
- Individual books: $9-19 each
- MCAT bundle: $49-99 (vs $57+ if buying individually on Amazon)
- Continue Amazon listings in parallel (don't cannibalize $200/mo)

**Sales channels:**
- Reddit organic: r/MCAT, r/premed, r/conservative or r/politics (Trump book — careful with promotion rules), r/selfimprovement
- TikTok/Instagram clip content from books
- Twitter (founder's existing pseudonym handle if continued, or fresh handle)
- Continued Amazon SEO (preserve passive)
- Email nurture sequence on landing pages

**90-day target:**
- Existing Amazon: $200/mo continues
- Direct PDF sales: $300-1,500/mo new MRR
- Email subscribers: 500-1,500
- **Combined: $500-1,700/mo**

**Liability profile:** ZERO. Founder's own IP. No medical claims even on MCAT books (educational/exam-prep). No telehealth. No HIPAA. The Trump book + Palestine flag cover idea is founder's political statement to own publicly.

**Pseudonym vs real-name:** Founder decision; preserved options include keep pseudonym throughout, hybrid (MD on MCAT only), or full reveal.

**KDP credentials handling:** Founder uploads manuscripts to Supabase Storage. Read access to local files. Don't touch KDP. Amazon listings stay unchanged.

**Kill criteria:**
- $100 cumulative spend AND $0 direct sales by day 30 = orange
- $200 cumulative spend AND <$100 direct sales by day 60 = red

---

### 4.2 NT Ministry (Content Arm + Directory Arm + NT Films research)

**This is ONE company with multiple arms under one parent entity.** Replaces previous "NT Channel" + separate "NT Directory" + separate "NT Films" structure.

**One-line:** Multi-arm Christian media ministry. Content arm is the flagship (faceless YouTube/TikTok content). Directory arm activates month 3-4 (Charlotte Christian Business Directory). NT Films stays research-only.

**Founder's mission:** "spread the idea that we don't have to apologize for the old testament's bad behavior if we just focus on Jesus Christ. It's very very freeing."

**Long-term vision:** Eventually expand into events, philanthropy, charity, movie production, podcasts about Christ and politics, paid mission trips for politicians to see poverty firsthand.

**Phase 1 (week 1-12):**
- Faceless YouTube long-form (5-15 min) + Shorts (60s)
- TikTok / Instagram Reels / X repurposed clips
- Stack: Bible reading + ElevenLabs voiceover + Flux/Midjourney imagery + scripture overlay

**Editorial line:**
- New Testament-only frame
- Frame: "Jesus showed us a better understanding of God"
- AVOID: anti-Semitic framings, attacks on Judaism as a religion, dismissing OT as "evil"
- Pushback from mainstream Christians and atheists is engagement, not failure

**Monetization (in order of activation):**
1. Patreon $5/mo "deep dive" tier (Day 1 setup)
2. YouTube AdSense (month 2-3, 1K subs + 4K watch hours threshold)
3. Ebook: "The New Testament-Only Christian's Field Guide" — $19 (month 2)
4. Christian sponsorships (month 3+)
5. Affiliate (Logos software, Christian books — month 4+)

**90-day target:**
- 100-500 email subscribers
- 10-30 Patreon members at $5/mo = $50-150 MRR
- 20-50 ebook sales = $380-950 cumulative
- AdSense activated
- **Combined: $400-1,500/mo MRR**

**Future: NT Directory arm activates after Content arm has 1,000+ email subscribers.**

**Liability profile:** Low. Theological pushback expected.

**Kill criteria:**
- $100 cumulative spend AND <50 email subs by day 30 = orange
- $200 cumulative spend AND no AdSense / no Patreon by day 60 = red

---

### 4.4 NT Ministry: Directory Arm (sub-arm)

**One-line:** Christian Business Directory for Charlotte metro. Free listings for businesses, $1/mo for member access, $10/mo donor tier. Each business pledges 10% of leads-from-site revenue to a named local church.

**Activation trigger:** 1,000 NT Ministry email subscribers

**Pre-activation:** $0 (under NT Ministry's $300 cap; agents already employed by Content arm extend into Directory work)

**Post-activation budget:** ~$100/mo additional within NT Ministry's total $300 cap

**Editorial separation rule:** Directory uses broadly Christian voice (NOT NT-only Marcionite). Same theology line reviews both arms but applies different voice fingerprints. Cross-contamination kills both arms.

**90-day post-activation target:**
- 200-500 free business listings
- 200-1,000 paying members at $1/mo
- $400-2,000/mo MRR

### 4.5 NT Ministry: NT Films research arm (sub-arm)

**Status:** Research-only sub-arm. $0 dedicated budget; AI video tool maturity monitored monthly.

**Activation triggers:**
- AI video produces uncanny-valley-free 1-min Christian scene at <$10 cost
- NT Ministry has 10K+ YouTube subscribers
- Founder explicit approval

---

### 4.6 Hyperlocal Matrix (Anonymous Hyperlocal Chat) — HIBERNATING

**One-line:** Hyperlocal anonymous chat (5-mile default radius). Free users see only nearby conversations. Paid premium ($5-10/mo) for cross-radius access. Businesses pay for proximity-gated channels (~0.5 mile). All posting requires verified credit card on file + 18+ certification.

**Founder's vision:** "X might acquire — OR copy hyperlocal twitter essentially. They could crush me actually but I could also sell it to facebook." Empowers the individual. Acquisition target.

**Verification model (LOCKED, NON-NEGOTIABLE):**
- 18+ certification
- Credit card on file required to post (Stripe Identity, $0 charge v1)
- "Anonymous to other users, accountable to platform"
- **Reducing posting friction without explicit founder approval is FORBIDDEN.**

**Launch sequence (when un-hibernated):** Plaza Midwood #1, Matthews #2, South End #3.

**Liability profile:** Low-Medium (anonymous platform mod risk mitigated by CC + 18+ verification).

---

### 4.7 Plutus Street (Trading Platform) — HIBERNATING

**One-line:** Trading platform for retail traders. Free trade journal + paid Plutopath-derived signals + live trader video streams. Brand under the Pluto family architecture.

**Founder's ethos for this product:** "empower the INDIVIDUAL. So i'm building things for the individual to become better not for the individual to be a part or piece of something else."

**Two-tier free + paid + creator stream model:**

**Free tier (lead magnet):**
- Manual trade entry + computed metrics (win rate, R-multiple, MAE/MFE, drawdown, expectancy)
- Equity curve charts, win-rate-by-setup, drawdown analysis
- CSV export
- $1 per pull from broker (Phase 2 SnapTrade) OR free with weekly CSV upload (Phase 1 — saves users $45/mo vs competitors)

**Paid Edge Scanner — $29/mo:**
- Daily Plutopath signal feed (LAGGED 5-15 MIN, AGGREGATE only)
- Pattern alerts: "BROKEN_SUPPORT_ACCEL pattern firing in tech sector"
- Sector / regime indicators
- Educational research-grade insights
- **NEVER specific ticker calls. NEVER personalized advice.**

**Paid Pro Edge — $99/mo:**
- Everything in Edge Scanner
- Backtest tools
- Cohort analysis (user's own trades)
- Leak finder
- Priority support

**Live Trader Video Streams (Phase 2):**
- Creators stream live trading via OBS → RTMP
- Audience pays subscription per creator (creator sets price)
- Platform takes 10% (vs YouTube's ~49% mobile take)

**Critical legal positioning (LOCKED):**
This is a **DATA PRODUCT**, not investment advice. Avoids SEC investment-advisor classification.

**Plutopath edge protection (CRITICAL):**
- Lag enforced at Plutopath export side, NOT Plutus Street client
- Aggregate not specific (sector/pattern-class only)
- Read-only HTTPS GET to founder-controlled endpoint
- Trading platform CANNOT modify Plutopath
- Founder reviews signal output weekly (~10 min)

---

### 4.8 HealthBrew Longevity Dashboard

**Company:** HealthBrew (founder's existing dormant brand at healthbrew.clinic)

**One-line:** Educational longevity dashboard for individuals. Avatar-based (no PII required). Aggregates self-reported labs + DNA SNPs + wearable data into biological age + key biomarker tracking. Free tier first, monetize when traction proven.

**Founder's framing:** "Same theme of empowering the individual. Super crowded. I think this could be another one of $50/month to maintain but offered free to build customer/community base. Then we price gate if we have enough attention/traction."

**Privacy model (CRITICAL):**
- Avatar-based: user creates avatar with preferred name + email + phone (for 2FA)
- "First name and last name not required" (advertised explicitly)
- No PII required, no PHI processed by definition
- All data is self-reported by user (no integrations with medical records, no provider portal access)
- Compliance positioning: educational content + self-tracking tool, NOT a medical service

**Phase 1 features (week 1-12):**
- User uploads lab PDF (self-extracted from any lab portal)
- Parse values into structured fields
- User uploads 23andMe / Ancestry DNA file (raw genome export)
- Extract longevity-relevant SNPs
- User connects Apple Health / Whoop / Oura / Fitbit (read-only OAuth)
- Computed: biological age estimate, key biomarker trends, longevity score
- Educational content explaining what each metric means

**Liability framing:**
- "This is educational; consult your physician for medical decisions"
- No diagnostic claims
- No personalized health advice
- No medication recommendations
- No clinical decision support
- FTC-safe health claim language

**Monetization (deferred):**
- Free until 1,000+ active users
- Then: $9-29/mo subscription tier with advanced features
- Phase 3: white-label premium mineral water / multivitamin (founder mentioned interest)

**Sales channels:**
- Reddit organic: r/longevity, r/biohackers, r/Supplements, r/QuantifiedSelf
- TikTok longevity content
- SEO long-tail (biological age calculator, longevity dashboard, etc.)
- YouTube educational content

**90-day target:**
- 100-500 free users
- $0 revenue (intentional — community building first)
- Email subscribers 500+

**Liability profile:** Low. Educational. Avatar-based eliminates PII exposure.

**Kill criteria:**
- $30 cumulative spend AND <30 users by day 60 = yellow
- $100 cumulative spend AND <100 users by day 90 = orange (review)
- This is community-build mode; revenue NOT the v1 KPI

---

### 4.9 CarStack / EstimateProof

**One-line:** B2B vehicle-history reports for mechanics/dealers. LubeLogger (MIT) OSS base + proprietary agent/billing/UX layer. Cox Automotive acquisition target framing.

**Status:** Active. Lives in `companies/estimateproof/`. NHTSA cron + market-value pipeline already shipping.

**Liability profile:** Zero (B2B data product, no consumer auto-purchase advice).

**Cost mode through 2026-05-09:** Sonnet/Haiku via Claude Code session.

---

## 5. Cost Discipline

### Per-company budget envelope

| Company | Monthly burn target | Cap |
|---|---|---|
| Concise | $25-50 | $200 |
| NT Channel Content | $80-120 | $200 |
| NT Directory (when activated) | $50-80 | $100/mo |
| Hyperlocal Matrix | **HIBERNATING $0** | **$0/mo paused** |
| Plutus Street | **HIBERNATING $0** | **$0/mo paused** |
| HealthBrew | $30-50 | $50/mo |
| CarStack / EstimateProof | $40-60 | $100/mo |
| NT Films (research) | $15-25 | $25/mo |
| **Portfolio total** | **~$260-415/mo** | **~$650/mo ceiling** |

### Kill criteria triggers

- Tier 1: $100 cumulative + $0 revenue + 30 days = orange; 60 days = red
- Tier 2: $200 cumulative + 60 days no revenue + no signed pre-orders = red
- Tier 3: $50 cumulative + 90 days <100 users = yellow (community build mode is acceptable longer)
- Any tier: any legal exposure flagged = immediate founder escalation

---

## 6. Failure Mode Watchlist

1. **Founder over-scoping** — adding new companies during launch period.
2. **Feature creep** — "let's also build X." Cut. Ship.
3. **Going in circles** — same decision re-litigated 3+ times in a week.
4. **Slop production** — generic AI-flavored output.
5. **API budget burn on internal debate** — long agent threads without decisions.
6. **Missing the actual user** — agents talk to each other instead of building for / talking to real customers.
7. **Soft bypassing safety gates** — Hyperlocal CC requirement, Plutus Street "data vs advice" line, HealthBrew educational framing. ALL FORBIDDEN to relax without founder approval.
8. **Hand-waving numbers** — fake metrics. Every number must have source citation.
9. **Plutopath edge erosion** — Plutus Street over-discloses signals. Lag enforced at Plutopath side, not client side.
10. **Concise Amazon cannibalization** — direct sales eroding existing $200/mo.
11. **NT theology cross-contamination** — Content arm (NT-only) voice mixing with Directory arm (broadly Christian) voice. Mixing kills both.
12. **HealthBrew health claim drift** — educational language slipping into diagnostic/medical advice.
13. **Customer acquisition fantasy** — believing agents will solve customer acquisition. Founder owns acquisition strategy; agents execute.

---

## 7. Open Questions / Pending Founder Inputs

Items needing founder decision (also tracked in [`FOUNDER_ACTIONS.md`](FOUNDER_ACTIONS.md)):

1. Domain names — propose options, founder approves + registers
2. Brand names — propose 3-5 candidates per company, founder picks
3. Gmail account naming — pattern proposed, founder confirms
4. Stripe Connect onboarding — prepare materials, founder completes KYC
5. Render API access verification — Render MCP installed; founder approves first deploy

**Concise-specific:**
- Pseudonym vs real-name strategy
- Trump book cover direction
- Top 3 books for direct-sale launch confirmation
- CONCISE Drive folder access

**Plutus Street-specific (when un-hibernated):**
- Plutopath signal export endpoint
- Twitter strategy (existing pseudonym vs new handle)
- Trading platform final name

**HealthBrew-specific:**
- Brand continuity (`healthbrew.clinic` vs new domain)
- 23andMe / wearable API priority

---

## 8. References

- Plutopath (founder's other project, ISOLATED): `/Applications/DrAntoniou Projects/Plutopath/`
- Render API: https://render.com
- Supabase: https://supabase.com (NEW project, NOT Plutopath's)
- Anthropic API docs: https://docs.claude.com
- Founder's global rules: `/Users/drantoniou/.claude/CLAUDE.md`
- Hard rules + money caps: [`BIBLE.md`](BIBLE.md)

---

## 9. The bargain

> "I'll give you ≤12 hours/week of strategic input + decisions.
> You handle everything else. We launch a handful of small bets,
> test fast, kill fast, sustain low spend. If something hits in
> 6 months, we double down. If nothing hits in 12 months, we close
> it down sanely.
>
> My goal is $30K/mo profit in 6 months but I accept the realistic
> path is 12-24 months. The companies that hit my number fast (Prior
> Auth, Physician Letters) carry liability I won't accept. So I'm
> taking the slower clean path with companies I actually care about."
