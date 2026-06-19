# Hyperlocal Matrix — Vision Document

**Status:** Active (launching weekend of 2026-05-02/03)
**Budget cap:** $100/mo (revised down from $500 — paid outreach tools
removed; founder-driven Twitter + Reddit organic only; community-
build mode)
**Founder time/wk:** 0 hrs (zero execution work, agents handle ALL
outreach via LinkedIn DM + AI voice + email + free 3-month trial)

## What this company is

Hyperlocal anonymous chat (5-mile default radius) where:
- Free users see only nearby conversations within their radius
- Paid premium users can see/jump into ANY conversation cross-city
  with distance-from-you indicators
- Businesses pay for proximity-gated channels that surface to users
  near their physical location (~0.5 mile default)
- All posting requires verified credit card on file + 18+ certification
- "Anonymous to other users, accountable to platform"

## Why this company is portfolio priority #3

- Slowest to first dollar of the 3 active companies (week 6-10)
- Requires app build before outreach can start
- Cold-start risk per neighborhood

## Why still active (not deferred)

- Founder has had this idea for 10 years (signal of conviction)
- LARGEST TAM of the portfolio (acquisition target for Nextdoor /
  Meta / Google Maps / Apple Maps)
- Three-sided revenue model with strong unit economics
- The "10-year idea" deserves a proper test run

## The verification model (NON-NEGOTIABLE LOCKED-IN DESIGN CONSTRAINT)

**All posting requires:**
- 18+ certification (checkbox + Stripe Identity flow)
- Verified credit card on file (Stripe Identity, $0 charge in v1)
- Phase 2: $1/mo posting fee or $5 lifetime

**Magic phrase:** "Anonymous to other users, accountable to platform"

**Why this rule cannot be relaxed:**
1. Eliminates ~95% of bots/spam from day 1
2. Provides legal cover for 18+ claims (better than nothing)
3. Filters for users with real intent to participate
4. Generates a third revenue line at scale

**Reducing posting friction without explicit founder approval is FORBIDDEN.**

## Three-sided revenue model

| Revenue line | Pricing | Notes |
|---|---|---|
| Business channels | $29-49/mo (founding rate $29, standard $49) | Geographic-gated visibility |
| Premium users | $5-10/mo cross-radius access | "Jump anywhere" tier |
| Posting fees | $1/mo or $5 lifetime (Phase 2) | Activates after launch |

## Launch sequence (LOCKED — neighborhood priority)

| Priority | Neighborhood | Why |
|---|---|---|
| #1 | **Plaza Midwood** (Charlotte) | Indie business density, creative-class millennials, walkable Central Ave/Commonwealth corridor, app-friendly demographics |
| #2 | **Matthews** (Charlotte metro) | Founder's home, suburban model validation, easier operational followup if needed |
| #3 | **South End** (Charlotte) | Highest density, biggest ceiling, hardest to crack — saved for after playbook proven |

Phase 2 expansion (if Charlotte proves out): NoDa, Dilworth, Myers Park,
Ballantyne, then other metros.

## Outreach mechanic (REVISED 2026-05-02 — founder-driven organic only)

**Major change from earlier plan:** Paid outreach tools (LinkedIn
Sales Navigator $99/mo, Apollo.io $49/mo, Instantly.ai $37/mo, Vapi
voice $50/mo) ALL CUT to fit reduced $100/mo budget cap.

Hyperlocal Matrix is now a **community-build, slow-ramp Tier 3
project** that relies on:

### Channel A: Reddit organic (PRIMARY)
- r/Charlotte (180K+ subs), r/PlazaMidwood, r/CLT
- Helpful comments first; build trust; soft-link in profile bio
- Founder approves drafts of posts that mention Hyperlocal Matrix
- Volume: 5-10 helpful comments/day across target subs
- NO promotional posts in subs that ban promotion

### Channel B: Twitter/X (founder-supported)
- Founder's existing handle posts about the platform
- Brand/Design drafts; founder approves before sending
- Building public anticipation for Plaza Midwood launch

### Channel C: Charlotte-targeted Meta ads (small budget, after MVP)
- Geographic targeting: Plaza Midwood + 2-mile radius
- Age 21-50, interests in dining/nightlife/local events
- Budget: $30-50/mo cap
- Activates only after MVP product is live

### Removed channels (cut from scope)

- ❌ LinkedIn Sales Navigator + DMs ($99/mo) — too expensive
- ❌ Cold email at scale (Apollo + Instantly = $86/mo) — too expensive
- ❌ AI voice calls (Vapi = $50/mo) — reputation risk in small market
- These can be re-added later if revenue justifies

**Trade-off:** much slower customer acquisition. Accepting this
because the budget cap is the constraint and Hyperlocal is a
long-burn community play.

## Free trial mechanic

> "Founding business program — first 50 [neighborhood] businesses claim
> a permanent channel + 3 months free. After 3 months: $29/mo locked
> rate (regular $49). Cancel anytime. No card required to start."

## Expected funnel (90 days)

- 800 touches/week (200 LinkedIn + 100 AI voice + 500 emails)
- ~5% blended free signup rate = 40 signups/week
- ~30-50% become active = 12-20 active/week
- ~20-40% convert at month 3 to paid = 4-8 paying/month-3
- **Realistic Month 4 MRR: $116-232 from outreach alone**
- Month 6 MRR: $500-1,500 (multiple cohorts compounding)

## Engineering scope

**v1 (3-4 weeks):**
- Web app (mobile-responsive, NOT native v1)
- Geofencing (Mapbox API)
- Anonymous identity system (random username + token)
- Stripe Identity for 18+ verification
- Stripe Connect for business payments
- Channel infrastructure (rooms scoped to lat/long radius)
- Moderation pipeline (LLM pre-screen + flag queue + 24h SLA)
- Web push notifications

**v2 (months 2-3):**
- Native mobile apps (iOS + Android)
- Live event-driven moderation
- Premium "jump anywhere" UI

## 90-day target

- 5-15 paying businesses ($145-435/mo MRR)
- ~200-500 active users (free + paying combined)
- App live in Plaza Midwood
- Playbook documented for Matthews #2

## Org chart

| Role | Model | Owner of |
|---|---|---|
| CEO | Opus 4.7 | Strategy, weekly plan |
| **Engineering team (FULL)** | DeepSeek V4-Pro / Haiku | See engineering-team.md |
| Head of Growth | DeepSeek V4-Pro / Haiku | Paid Charlotte ads, organic growth |
| Sales & Partnership | DeepSeek V4-Pro / Haiku | LinkedIn + AI voice + email outreach |
| Brand/Design | DeepSeek V4-Pro / Haiku | App UX brand, outreach voice |
| Chief Accountant | DeepSeek V4-Pro / Haiku | $100/mo cap, P&L |
| **Community Moderator** (company-specific) | DeepSeek V4-Pro / Haiku | LLM pre-screen, flag queue, mod policies |
| **Legal Compliance Watcher** (company-specific) | Opus 4.7 | Anonymous-platform legal exposure |
| McKinsey Advisor | Opus 4.7 | Weekly review |
| YC Founder Advisor | Opus 4.7 | Weekly review |

## Risks and mitigations

### Risk 1: Cold start per neighborhood
**Mitigation:** Sales agent does outreach to 3 neighborhoods
simultaneously to ensure list size. Free trial mechanic lowers
adoption friction.

### Risk 2: Moderation legal exposure
**Mitigation:** Community Moderator agent + Legal Compliance Watcher
agent. Conservative ToS, 24h takedown SLA, LLM pre-screen on every post.

### Risk 3: Stripe high-risk merchant flags
**Mitigation:** Position as "social/local app," not "anonymous flirting."
Choose Stripe category carefully. Be ready to provide explanation
during onboarding.

### Risk 4: Reputation hit from AI voice cold calls
**Mitigation:** Voice as warm follow-up only, never first touch. 50/week
cap. Mandatory AI disclosure within 30 seconds.

### Risk 5: Anonymous platform → harassment/illegal content
**Mitigation:** CC required + 18+ verification = pseudonymous, not pure
anonymous. Posting fee Phase 2 adds friction. Mod policy enforced.

## Kill criteria

- $100 cumulative cap exhausted with $0 paying customers AND <50 free trial
  signups by day 60 = paused for founder review
- Any legal complaint or compliance issue = immediate founder
  escalation
- Stripe account suspension = immediate founder escalation
- Single moderation incident with legal exposure (CSAM, doxxing
  with measurable harm) = immediate shutdown of affected channels
  + founder escalation

## Success criteria (90-day)

- $145+ MRR from paying businesses
- 5+ paying businesses across 1-3 Charlotte neighborhoods
- 200+ active users (free + paying)
- Moderation pipeline processing 100% of posts with <24h SLA
- Charlotte playbook documented for Matthews #2 expansion

---

## Documents in this folder

- `vision.md` (this file)
- `kickoff-brief.md` — Paperclip first all-hands prompt
- `permissions-and-configurations.md` — full API/tool inventory
- `issues-backlog.md` — pre-loaded work queue
- `personas/` — role-specific agent prompts
- `pnl/` — Chief Accountant ledger
- `standups/` — daily agent posts
- `plans/` — weekly sprints
- `sales/` — outreach CRM, templates, funnel reports
- `brand/` — brand book, voice guide
- `deploys/` — engineering deploy log
