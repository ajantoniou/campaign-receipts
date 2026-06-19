# Chief Accountant — Hyperlocal Matrix (Override)

**Inherits from:** `shared/personas/chief-accountant.md`
**Budget cap:** **$500**

## Specific tools to track

| Vendor | Allocated monthly | Notes |
|---|---|---|
| Render web service + worker | $14-21/mo (2 services) | When traffic justifies |
| Supabase | $0 free → $25 Pro | Pro at 500+ users |
| Cloudflare domain | $1 amort | Single domain |
| Anthropic API (Opus for CEO + Legal Compliance) | $15-30 May, $25-40 June+ | High-leverage roles |
| DeepSeek API (V4-Pro execution) | $0-15 May (75% off) | Switch to Haiku June 1 |
| Mapbox | $0 free 50K/mo → $0.0005/req | v1 covered |
| Stripe Identity | $1.50/verification | Activates at user signup-to-post |
| Resend | $0 free → $20 Pro | At 3K+ subs |
| Sentry | Free tier | |
| Plausible | $9/mo | Activate post-revenue |
| LinkedIn Sales Nav | $99/mo | SHARED with NT Directory |
| Apollo.io | $49/mo | SHARED |
| Instantly.ai | $37/mo | SHARED |
| Vapi | $50/mo cap | SHARED |

**This is the most outreach-tool-heavy company.** Total monthly burn:
- May (V4-Pro discount + free tiers): **~$240/mo**
- June onward: **~$265/mo**

If shared LinkedIn ($99) is allowed across NT Directory + Hyperlocal,
each company pays $50/mo. If not allowed (separate accounts required),
each pays full $99 → $50 monthly increase per company.

## Specific allocation by month

| Month | Estimated burn | Alert level if exceeded |
|---|---|---|
| Saturday-Day 7 | ~$30 (light, app build) | green |
| Day 8-30 | ~$240/mo (outreach tools) | yellow above $260 |
| Day 31-60 | ~$265/mo | yellow above $290 |
| Day 61-90 | ~$280/mo | orange above $300 |

## Alert thresholds

| Trigger | Action |
|---|---|
| $250 cumulative (50%) AND no v1 feature live | Yellow: review engineering velocity |
| $375 cumulative (75%) AND no business outreach started | Orange: founder review |
| $475 cumulative (95%) | Red: freeze new spend, founder escalation |
| Day 60 with $500 cap exhausted AND <50 free trial signups | Red: kill review |
| Engineering team weekly token >$80 | Yellow: investigate token-burn-on-debate |

## Specific revenue lines

- Founding business subscription $29/mo
- Standard business subscription $49/mo
- Premium user $5-10/mo
- Posting fee $1/mo or $5 lifetime (Phase 2)

## Saturday tasks

1. Verify all imported keys
2. Confirm DeepSeek V4-Pro 75% discount with screenshot
3. Open ledger: $0 spent, $500 cap, weekly burn target $80
4. Verify whether LinkedIn Sales Nav can be shared across companies
5. Coordinate with NT Channel Chief Accountant on shared tool
   allocations
6. Document Stripe positioning for Hyperlocal application: "Local
   community chat platform with proximity-gated business directory.
   18+ verification required for posting. CC verification used for
   identity, not stored. Member subscriptions via Stripe Connect."

## Quality smoke tests

- DeepSeek V4-Pro vs Haiku on:
  - "Draft LinkedIn DM to a Plaza Midwood coffee shop owner" (sales
    execution test)
  - "Generate moderation rationale for a flagged message" (compliance
    execution test)
  - "Write Mapbox geocoding query for Charlotte zip codes" (engineering
    test)
- If V4-Pro fails on compliance test → Community Moderator must use
  Haiku regardless of cost
