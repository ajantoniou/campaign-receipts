# Trading Journal + Paid Signals — Permissions & Configurations

Complete inventory of every API key, third-party service, and
integration this company needs.

---

## Required: Saturday morning

### LLM APIs (already in .env)

| Service | Env var | Status |
|---|---|---|
| Anthropic Claude | `ANTHROPIC_API_KEY` | ✅ shared |
| DeepSeek | `DEEPSEEK_API_KEY` | ✅ shared |
| Render Platform | `RENDER_API_KEY` | ✅ shared, MCP installed |

### Hosting & DB

| Service | Action | Cost |
|---|---|---|
| Render | 1 web service `trading-journal` + 1 background worker | Free → $14/mo each when justified |
| Supabase | Add `trading_journal` schema to shared project | Free → $25 Pro at scale |
| Cloudflare | Register 1 domain | $10/yr |

### Gmail

| Account | Purpose |
|---|---|
| `trading.journal.edge@gmail.com` (or alternate from Brand) | Stripe, support, Resend sender |

Add to `.env`:
- `TRADING_JOURNAL_GMAIL_ADDRESS`
- `TRADING_JOURNAL_GMAIL_APP_PASSWORD`
- `TRADING_JOURNAL_DOMAIN`

---

## Service-specific APIs

### Payments

| Service | Env vars | Cost |
|---|---|---|
| Stripe | `TRADING_JOURNAL_STRIPE_SECRET_KEY`, `TRADING_JOURNAL_STRIPE_PUBLISHABLE_KEY`, `TRADING_JOURNAL_STRIPE_WEBHOOK_SECRET` | 2.9% + 30¢ |
| Stripe Subscriptions | (master keys) | included |

Two products:
- "Edge Scanner Monthly" — $29/mo recurring
- "Pro Edge Monthly" — $99/mo recurring

### Plutopath data integration (CRITICAL)

| Service | Env vars | Cost |
|---|---|---|
| Plutopath signal export | `PLUTOPATH_SIGNAL_EXPORT_URL` (founder provides) | $0 (existing system) |
| Plutopath read-only DB credential | `PLUTOPATH_READONLY_KEY` (founder generates) | $0 |

**CRITICAL ARCHITECTURE RULE:** Trading Journal company MUST connect
to Plutopath as **read-only**. Cannot write back. Cannot modify.
Cannot delete. The Plutopath system is the founder's live trading
infrastructure and is sacred.

The signal feed flows: Plutopath generates → exports anonymized,
lagged signals → Trading Journal reads → displays to paid users.

**No PHI, no real money flow, no production trading data
modification.** Read-only signal feed only.

### Email

| Service | Env vars | Cost |
|---|---|---|
| Resend | `TRADING_JOURNAL_RESEND_API_KEY` | Free 3K/mo → $20 Pro |

### Charting

| Service | Env vars | Cost |
|---|---|---|
| Recharts (npm) | (no API) | Free |
| TradingView widget | (free embed) | Free |

### Monitoring

| Service | Env vars | Cost |
|---|---|---|
| Sentry | `TRADING_JOURNAL_SENTRY_DSN` | Free tier |
| UptimeRobot | (login) | Free tier |
| Plausible | `TRADING_JOURNAL_PLAUSIBLE_DOMAIN` | $9/mo (after revenue) |

### Future (Phase 2-3)

| Service | Env vars | Cost | When |
|---|---|---|---|
| SnapTrade (broker import) | `TRADING_JOURNAL_SNAPTRADE_CLIENT_ID`, `TRADING_JOURNAL_SNAPTRADE_CONSUMER_KEY` | $300-1000/mo | Activate when 30+ paid users |

---

## Outreach (light — minimal Sales & Partnership role)

| Tool | Cost | Shared? |
|---|---|---|
| Reddit (manual) | $0 | Per-company account |
| TikTok / Twitter | $0 (organic) | Founder's existing handles |

**No LinkedIn Sales Nav for this company.** B2C, content-driven.

---

## OAuth flows founder must complete Saturday

1. Create Gmail (~10 min)
2. Cloudflare register domain (~10 min)
3. Render: create web service + background worker (~10 min)
4. Stripe: create products (Edge Scanner + Pro Edge)
   (~30 min — KYC may already be done from other companies)
5. Resend signup + domain verify (~15 min)
6. Plutopath signal export endpoint setup (founder's infra side, ~30 min)

**Total: ~100 min Saturday** (lower than NT or Hyperlocal because
no distribution platform OAuth, no content production tools, no
business verification API).

---

## Compliance configurations (BEFORE first paid signup)

Compliance Reviewer writes; founder approves before launch.

- [ ] Privacy Policy live
- [ ] Terms of Service live (must explicitly disclaim investment advice)
- [ ] FTC truth-in-advertising compliance review of all marketing copy
- [ ] "Past performance does not guarantee future results" disclaimer
      on every paid product page
- [ ] No personalized advice claims
- [ ] No profit-promising language
- [ ] Refund policy (recommend: 14-day money back guarantee for first
      month)
- [ ] Stripe positioning: "Educational financial data product"
      (NOT "financial services" — different Stripe risk classification)

---

## Permissions / Access Roles

| Role | Read | Write |
|---|---|---|
| CEO | All | Plans, decisions |
| CTO + Engineers | Code, schema, deploys | Code, schema, deploys |
| Compliance Reviewer | All public-facing drafts | Reviews only |
| Brand/Design | All drafts | Brand book, creative |
| Head of Growth | Analytics, drafts | Growth experiments |
| Sales & Partnership | (Phase 2 only) | Affiliate templates |
| Chief Accountant | Billing dashboards | Ledger only |
| McKinsey/YC | All | Reviews only |

**No agent has WRITE access to Plutopath.** Read-only signal feed
exposed via founder's controlled endpoint. Engineering must implement
this constraint at the integration layer.

---

## Disaster recovery

If Plutopath signal feed breaks:
- Display "Signals temporarily paused" message in Edge Scanner
- Pause new sign-ups (don't take money for product that doesn't
  function)
- Founder + CTO investigate within 24h
- Free journal continues working (no Plutopath dependency)

If Stripe high-risk flag triggered:
- Position to Stripe: "Educational financial data product. Free
  journal + paid scanner. No personalized advice. No transactions
  flow through us. Customers manually trade through their own
  brokers."
- Be ready to provide ToS + Privacy Policy + product demo

If a paid user files SEC complaint:
- Compliance Reviewer engages immediately
- Founder + securities attorney review specific complaint
- Likely path: confirm data product framing held throughout user's
  experience; refund if any ambiguity
