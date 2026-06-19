# Infrastructure Setup — Saturday Morning Step-by-Step

**Target:** Saturday 2026-05-02
**Founder time:** ~5-7 hours one-time provisioning
**Goal:** All API keys + accounts ready for agent execution by Sunday

This document is the canonical setup guide for the **6 active
companies** plus 1 research arm under NT Ministry. Frozen companies
(Physician Letters, Prior Auth) are CUT entirely.

---

## Active companies summary (6)

| Tier | Company | Folder |
|---|---|---|
| Tier 1 | Concise (multi-book PDF launch) | `companies/concise/` |
| Tier 2 | NT Ministry (Content + Directory + NT Films research) | `companies/nt-ministry/` |
| Tier 3 | Hyperlocal Matrix (anonymous chat) | `companies/hyperlocal-matrix/` |
| Tier 3 | Plutus Street (trading platform) | `companies/plutus-street/` |
| Tier 3 | HealthBrew Longevity Dashboard | `companies/healthbrew/` |

---

## PART 1: Pre-flight (15 min)

### 1.1 Open required tabs
- https://render.com/dashboard
- https://supabase.com/dashboard
- https://dash.cloudflare.com
- https://stripe.com (for KYC tasks)
- https://console.anthropic.com
- https://platform.deepseek.com
- https://x.ai (Grok API verification)
- https://accounts.google.com (for new Gmail accounts)

### 1.2 Verify .env baseline

Open `/Applications/DrAntoniou Projects/AgentCompanies/.env` and
confirm these are populated:
- `ANTHROPIC_API_KEY` ✅
- `DEEPSEEK_API_KEY` ✅
- `RENDER_API_KEY` ✅
- `XAI_API_KEY` ✅ (Grok, NEW)

### 1.3 Render MCP verify

```bash
cd "/Applications/DrAntoniou Projects/AgentCompanies"
claude mcp list
```

Should show: `render: ✓ Connected`

If not connected, see "Render MCP Reinstall" at end.

---

## PART 2: Gmail accounts (45 min)

Create 6 Gmail accounts (one per active company):

1. `concise.books@gmail.com` (or alternate from Brand)
   → `CONCISE_GMAIL_ADDRESS` + `CONCISE_GMAIL_APP_PASSWORD`
2. `nt.ministry@gmail.com` (or alternate; covers Content + Directory)
   → `NT_GMAIL_ADDRESS` + `NT_GMAIL_APP_PASSWORD`
4. `hyperlocal.matrix@gmail.com` (or alternate)
   → `HYPERLOCAL_GMAIL_ADDRESS` + `HYPERLOCAL_GMAIL_APP_PASSWORD`
5. `plutus.street.trading@gmail.com` (or alternate, founder may use
   existing pseudonym handle)
   → `PLUTUS_GMAIL_ADDRESS` + `PLUTUS_GMAIL_APP_PASSWORD`
6. `healthbrew.longevity@gmail.com` (or alternate)
   → `HEALTHBREW_GMAIL_ADDRESS` + `HEALTHBREW_GMAIL_APP_PASSWORD`

For each: strong unique password, Gmail app password generated via
Google Account → Security → 2-Step Verification → App Passwords.

**Brand/Design proposes final names Saturday afternoon. Founder can
use working names initially or wait.**

---

## PART 3: Supabase (20 min)

### 3.1 Create new project

- New project: `agent-companies` (or similar)
- Region: us-east-1 (closest to Charlotte)
- Plan: Free tier covers v1 across all 6 companies

**This is a NEW Supabase project, separate from Plutopath's.**

### 3.2 Add env vars to .env

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3.3 Create schemas

```sql
CREATE SCHEMA concise;
CREATE SCHEMA nt_ministry;            -- covers content + directory arms
CREATE SCHEMA hyperlocal_matrix;
CREATE SCHEMA plutus_street;
CREATE SCHEMA healthbrew_longevity;
```

Backend Engineer / CTO agents populate tables Saturday/Sunday.

---

## PART 4: Cloudflare domains (45 min)

### 4.1 Wait for Brand/Design proposals (Saturday afternoon)

Brand/Design proposes 3-5 names per company by 2 PM Saturday.

### 4.2 Domain decisions

| Company | Domain action |
|---|---|
| Concise | New domain (Brand proposes) |
| NT Ministry | New domain(s) for Content + Directory (separate brands) |
| Hyperlocal Matrix | New domain (Brand proposes) |
| Plutus Street | **Use plutoship.com** (founder owns) OR new |
| HealthBrew Longevity | **Use healthbrew.clinic** (founder owns) OR new |

For new domain registrations: ~$10/yr each. Total Saturday domain
spend: $0-50 depending on how many existing domains are used.

### 4.3 Add to .env

```
CONCISE_DOMAIN=
NT_CONTENT_DOMAIN=
NT_DIRECTORY_DOMAIN=                     # activates with Directory arm later
HYPERLOCAL_DOMAIN=
PLUTUS_DOMAIN=plutoship.com              # or alternate
HEALTHBREW_DOMAIN=healthbrew.clinic      # or alternate
```

DNS pointing to Render handled by CTO agents Sunday.

---

## PART 5: Render web services (35 min)

Create 7 services:

| Service name | Type | Plan |
|---|---|---|
| `concise` | Web Service | Free → $7 |
| `nt-content` | Web Service | Free → $7 |
| `nt-directory` | Web Service | Free → $7 (defer until Directory arm activates) |
| `hyperlocal-app` | Web Service | Free → $14 |
| `hyperlocal-worker` | Background Worker | Free → $7 |
| `plutus-street` | Web Service | Free → $7 |
| `plutus-street-worker` | Background Worker | Free → $7 |
| `healthbrew` | Web Service | Free → $7 |

That's 7 immediate services + 2 conditional (NT Directory, Plutus
worker). Free tier suffices for all v1.

Region: Oregon for all.

Build/Deploy left blank for now. CTO agents configure Sunday.

---

## PART 6: Stripe accounts (60-90 min — KYC)

**This is the ONE thing only founder can do.**

### 6.1 Single Stripe account, multiple products (recommended)

### 6.2 Activate via KYC

Business verification (1-3 business days for full activation; test
mode immediate).

### 6.3 Create products

**Concise:**
- "Concise Trump Election Promises Book PDF" — $9-19
- "Concise Ben Franklin's 13 Virtues PDF" — $9-19
- "Concise MCAT Bundle" — $49-99
- (Other titles as launched)

**NT Ministry (Content arm):**
- "NT Ministry Ebook" — $19 (Phase 1, month 2)
- "NT Ministry Patreon $5/mo" — handled via Patreon

**NT Ministry (Directory arm — activates later):**
- "NT Directory Member Basic" — $1/mo recurring
- "NT Directory Member Donor" — $10/mo recurring

**Hyperlocal Matrix:**
- "Hyperlocal Founding Business" — $29/mo recurring (after free trial)
- "Hyperlocal Standard Business" — $49/mo recurring
- "Hyperlocal Premium User" — $5/mo recurring

**Plutus Street:**
- "Edge Scanner Monthly" — $29/mo recurring
- "Pro Edge Monthly" — $99/mo recurring
- "Auto Broker Pull" — $1 per use (Phase 2)

**HealthBrew Longevity:**
- (No Stripe products v1 — free until traction)

### 6.4 Stripe Connect (Hyperlocal businesses + future Plutus
creators)

- Apply for Stripe Connect (Express) for Hyperlocal
- Defer Plutus Street creator payouts to Phase 2

### 6.5 Stripe Identity (Hyperlocal only)

- Enable Stripe Identity for 18+ + CC verification
- Document `HYPERLOCAL_STRIPE_IDENTITY_VERIFICATION_TEMPLATE_ID`

### 6.6 Webhook endpoints

Per service:
- `concise` → /api/webhooks/stripe (book sales)
- `nt-content` → /api/webhooks/stripe (ebook)
- `hyperlocal-app` → /api/webhooks/stripe (subscriptions, identity)
- `plutus-street` → /api/webhooks/stripe (subscriptions)

### 6.7 Document keys in .env (per company prefix)

```
CONCISE_STRIPE_*
NT_CONTENT_STRIPE_*
NT_DIRECTORY_STRIPE_*  # activates with Directory arm
HYPERLOCAL_STRIPE_*
HYPERLOCAL_STRIPE_IDENTITY_VERIFICATION_TEMPLATE_ID=...
PLUTUS_STRIPE_*
HEALTHBREW_STRIPE_*  # activates Phase 2
```

---

## PART 7: Content production tools (30 min)

**For NT Ministry content arm + Concise (covers):**

### 7.1 ElevenLabs (voiceover for NT + HealthBrew)

- Plan: Starter $5/mo
- Generate API key
- `NT_ELEVENLABS_API_KEY=...`
- (Other companies share this key OR have own — agents decide v1)

### 7.2 Image generation

**Option A: Flux (free tier)** — recommend v1 for all companies
- Sign up via Together.ai or fal.ai
- `FLUX_API_KEY=...` (shared)

**Option B: Midjourney ($30/mo)** — defer; activate per-company if
quality drift

### 7.3 Resend (email — all companies)

- Free tier 3K emails/mo PER DOMAIN
- Verify each domain (SPF, DKIM via Cloudflare):
  - concise.[domain]
  - [nt-content domain]
  - [nt-directory domain when activated]
  - [hyperlocal domain]
  - plutoship.com (or alternate)
  - healthbrew.clinic (or alternate)
- Generate API keys per domain:
  - `CONCISE_RESEND_API_KEY=...`
  - `NT_CONTENT_RESEND_API_KEY=...`
  - `HYPERLOCAL_RESEND_API_KEY=...`
  - `PLUTUS_RESEND_API_KEY=...`
  - `HEALTHBREW_RESEND_API_KEY=...`

---

## PART 8: Distribution platforms (60-90 min)

**For NT Ministry content arm primarily; secondary use by other
companies for organic content.**

### 8.1 YouTube + Google Cloud Console (NT Ministry)

- Console project: "NT Ministry Content"
- Enable YouTube Data API v3
- OAuth credentials
- `NT_YOUTUBE_*`

### 8.2 TikTok for Developers

Apps registered for:
- NT Ministry
- Concise (per founder approval)
- HealthBrew
- Plutus Street (under founder's existing pseudonym handle?)

`<COMPANY>_TIKTOK_*` keys per app.

### 8.3 Meta Graph API (Instagram + Facebook)

- App: "NT Ministry Empire" primary
- App review process for posting permissions

### 8.4 X / Twitter

- $100/mo Basic tier for posting
- **Decision: defer X to month 2 if budget tight** (founder's existing
  pseudonym handle works manually for v1)

### 8.5 Patreon

- NT Ministry Content creator page + $5/mo Deep Dive tier
- `<COMPANY>_PATREON_*` keys per page

---

## PART 9: Civic data sources (Campaign Receipts — 30 min)

All free for non-commercial / low-volume use:

- Congress.gov API → `CONGRESS_API_KEY`
- OpenStates.org API → `OPENSTATES_API_KEY`
- **OpenSecrets.org API** → `OPENSECRETS_API_KEY` (THE WEDGE — lobby
  funding data; attribution required)
- ProPublica Congress API → `PROPUBLICA_API_KEY`
- FEC.gov (no key, public REST API)

---

## PART 10: Maps (Hyperlocal Matrix — 5 min)

- Mapbox: free tier 50K req/mo
- `HYPERLOCAL_MAPBOX_API_KEY=...`

---

## PART 11: Wearable APIs (HealthBrew Longevity — 30-45 min)

OAuth apps registered:
- Google Fit Developer Console → `HEALTHBREW_GOOGLE_FIT_*`
- Whoop Developer Portal → `HEALTHBREW_WHOOP_*`
- Oura Developer Portal → `HEALTHBREW_OURA_API_KEY`
- Fitbit Developer Portal → `HEALTHBREW_FITBIT_*`

(Apple Health uses iOS XML export, no server-side OAuth)

---

## PART 12: Plutopath signal export (Plutus Street — 30 min)

**Founder builds the read-only, lagged, aggregated export endpoint
on Plutopath side.**

Endpoint requirements:
- Read-only HTTPS GET
- Authenticated via API key
- Returns aggregate sector/pattern signals (NOT specific tickers)
- All signals lagged 5-15 min
- JSON response, cron-friendly

Document in Plutus Street .env:
```
PLUTOPATH_SIGNAL_EXPORT_URL=https://...
PLUTOPATH_READONLY_KEY=...
```

**Plutus Street CTO consumes this endpoint; cannot modify Plutopath.**

---

## PART 13: Monitoring (15 min)

- **Sentry** free tier — 6 projects (one per active company)
  - `<COMPANY>_SENTRY_DSN` per company
- **UptimeRobot** free tier — monitor each Render service
- **Plausible** ($9/mo for 10 sites) — defer until first revenue

---

## PART 14: Outreach tools (REMOVED from active portfolio)

**Major change 2026-05-02:** Hyperlocal Matrix's paid outreach tools
(LinkedIn Sales Navigator $99/mo, Apollo $49/mo, Instantly $37/mo,
Vapi $50/mo) ALL CUT to fit reduced $100/mo Hyperlocal cap.

If you want to re-add these later, they're documented in the
deleted-portfolio history (see git history of `companies/hyperlocal-
matrix/`). Don't activate v1.

---

## PART 15: Final verification (15 min)

### 15.1 Test each API key

```bash
# Anthropic
curl -X POST https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-haiku-4-7","max_tokens":50,"messages":[{"role":"user","content":"hi"}]}'

# DeepSeek
curl -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"hi"}],"max_tokens":50}'

# Grok (xAI)
curl -X POST https://api.x.ai/v1/chat/completions \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"grok-2","messages":[{"role":"user","content":"hi"}],"max_tokens":50}'

# Stripe (test mode)
curl https://api.stripe.com/v1/customers \
  -u $CONCISE_STRIPE_SECRET_KEY: \
  -d 'limit=1'
```

### 15.2 DeepSeek 75% V4-Pro discount confirmation

Screenshot DeepSeek dashboard pricing. Save to
`shared/docs/deepseek-discount-screenshot-2026-05-02.png` (or
similar). Chief Accountants reference for cost baseline.

### 15.3 Grok pricing baseline

Screenshot xAI pricing page. Save to
`shared/docs/xai-grok-pricing-2026-05-02.png`. Chief Accountants
reference for May A/B test cost analysis.

---

## PART 16: Hand-off to agents (Saturday afternoon)

### 16.1 Open Claude Code in AgentCompanies

```bash
cd "/Applications/DrAntoniou Projects/AgentCompanies"
claude
```

Chief of Staff role activates here. See `CHIEF_OF_STAFF.md`.

### 16.2 Bootstrap Paperclip

See `shared/docs/paperclip-import-guide.md`.

### 16.3 Founder's Saturday afternoon

- Read Brand/Design naming proposals (~15 min — 6 companies)
- Approve names → trigger any new domain registrations
- Read McKinsey + YC critiques (~15 min)
- Approve Week 1 plans (~20 min)
- Concise: approve Trump book cover direction
- Concise: decide pseudonym vs real-name strategy
- Plutus Street: specify Plutopath signal export endpoint (~30 min,
  founder's infrastructure work)

**Total founder Saturday afternoon: ~90-120 min of decisions.**

---

## Saturday EOD checklist

By end of Saturday:
- [ ] All ~70 environment variables in `.env`
- [ ] 4-5 new domains registered (others pre-owned)
- [ ] 7-9 Render services live with stub
- [ ] Supabase project + 6 schemas created
- [ ] Stripe account + Connect activated
- [ ] Distribution platforms (YouTube, TikTok, Meta, Patreon)
      authenticated for relevant companies
- [ ] Civic data API keys (Congress, OpenStates, OpenSecrets,
      ProPublica) for Campaign Receipts
- [ ] Wearable OAuth apps for HealthBrew
- [ ] Plutopath signal export endpoint specified
- [ ] All monitoring (Sentry, UptimeRobot) configured
- [ ] DeepSeek + Grok pricing screenshots saved
- [ ] Chief of Staff role briefing posted

By Sunday EOD:
- [ ] Each active company has live HTTPS landing page
- [ ] Brand books v1 committed (6 brand systems)
- [ ] First Patreon pages live (NT Ministry)
- [ ] All initial agent personas active in Paperclip
- [ ] First Reddit organic engagement across active companies
- [ ] Concise: top books identified, covers approved, landing pages
      stubbed

---

## Cut entirely from portfolio (no provisioning)

These were in earlier iterations but CUT 2026-05-02:
- **Physician Nexus Letters** (malpractice + license exposure)
- **Prior Auth SaaS** (HIPAA Business Associate complexity)
- **Health Info Product** (founder didn't have IP)
- **Trading Live spectator concept** (replaced by Plutus Street with
  live video as feature)
- **Estate Planning** (cannot outspend LegalZoom)

NO provisioning Saturday for these. Specs preserved in git history
of `companies/physician-letters/` and `companies/prior-auth/` (now
deleted folders) if ever revisited.

---

## Render MCP Reinstall (if needed)

```bash
cd "/Applications/DrAntoniou Projects/AgentCompanies"
RENDER_KEY=$(grep "^RENDER_API_KEY=" .env | cut -d'=' -f2-)
claude mcp add render https://mcp.render.com/mcp \
  --transport http \
  --scope local \
  --header "Authorization: Bearer ${RENDER_KEY}"
```

Then `claude mcp list` should show: `render: ✓ Connected`.

---

## Total Saturday founder time estimate

- Part 1-2 (pre-flight + Gmail): 60 min
- Part 3 (Supabase): 20 min
- Part 4 (Cloudflare domains): 45 min
- Part 5 (Render services): 35 min
- Part 6 (Stripe): 60-90 min
- Part 7 (Content tools): 30 min
- Part 8 (Distribution platforms): 60-90 min
- Part 9 (Civic data sources): 30 min
- Part 10-11 (Maps + Wearables): 35-50 min
- Part 12 (Plutopath endpoint): 30 min
- Part 13-14 (Monitoring + skip outreach): 15 min
- Part 15 (Final verification): 15 min
- Part 16 (Hand-off): 30 min

**Total Saturday: 5-7 hours.**

Sunday: ~30-60 min of approvals + reading + Compliance reviews.

After Sunday, ZERO execution work for the founder. Chief of Staff
takes over filtering and synthesis.
