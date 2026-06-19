# Chief Accountant — Trading Journal (Override)

**Inherits from:** `shared/personas/chief-accountant.md`
**Budget cap:** **$500**

## Specific tools to track

| Vendor | Allocated monthly | Notes |
|---|---|---|
| Render web service + worker | $14-21/mo when justified | Free tier first |
| Supabase | $0 free tier | Pro $25/mo when paid users >100 |
| Cloudflare domain | $1 amort | Single domain |
| Anthropic API (Opus for CEO + Compliance) | $15-30 May, $25-40 June+ | High-leverage roles |
| DeepSeek API (V4-Pro execution) | $0-15 May (75% off) | Switch to Haiku June 1 |
| Resend | $0 free → $20 Pro | At 3K+ subs |
| Stripe | 2.9% + 30¢ trans | No fixed cost |
| Sentry | Free tier | |
| Plausible | $9/mo (after revenue) | Defer |

## NOT used (different from other companies)

- LinkedIn Sales Navigator: NOT used (B2C, not B2B)
- Apollo: NOT used
- Vapi: NOT used
- Mapbox: NOT used
- ElevenLabs: only for TikTok voiceovers if Head of Growth needs;
  shared with NT Channel content arm if possible

## Specific allocation by month

| Month | Estimated burn | Alert if exceeded |
|---|---|---|
| Saturday-Day 7 | ~$10 | green |
| Day 8-30 | ~$30/mo | yellow above $50 |
| Day 31-60 | ~$50/mo | yellow above $70 |
| Day 61-90 | ~$70/mo | orange above $90 |

**Lower burn than other companies.** No outreach tools means most
budget goes to LLM + Stripe.

## Alert thresholds

| Trigger | Action |
|---|---|
| $250 cumulative (50%) AND <50 free users by day 30 | Yellow: review acquisition velocity |
| $375 cumulative (75%) AND <100 free users AND <5 paid by day 60 | Orange: founder review |
| $475 cumulative (95%) | Red: freeze, founder escalation |
| Day 90 with <10 paid subs AND $500 cap exhausted | Red: kill review |

## Specific revenue lines

- Edge Scanner $29/mo subscription
- Pro Edge $99/mo subscription
- Future (Phase 2): SnapTrade integration upcharge
- Future (Phase 2): API access tier (~$199/mo for Pro Edge users)
- Future (Phase 3): Institutional data tier (~$999+/mo)
- Future (Phase 2+): Affiliate program (no direct cost; Stripe
  handles payouts)

## Saturday tasks

1. Verify all imported keys
2. Confirm DeepSeek V4-Pro 75% discount with screenshot
3. Open ledger: $0 spent, $500 cap, weekly burn target $30-50
4. Verify Stripe positioning ("Educational financial data product")
5. Coordinate with NT Channel + Hyperlocal Chief Accountants on
   shared Resend / Anthropic / DeepSeek allocations

## Quality smoke tests

- DeepSeek V4-Pro vs Haiku on:
  - "Generate compliance-safe headline for Edge Scanner landing
    page" (Compliance test)
  - "Draft Reddit comment educating about R-multiple" (volume test)
  - "Write SQL for cohort retention analysis" (engineering test)
- If V4-Pro fails Compliance test → use Haiku for Brand/Design too
  (more expensive but safer)
