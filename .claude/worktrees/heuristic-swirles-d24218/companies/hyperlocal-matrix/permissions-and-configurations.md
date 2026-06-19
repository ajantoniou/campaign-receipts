# Hyperlocal Matrix — Permissions & Configurations

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
| Render | 1 web service `hyperlocal-app` + 1 background worker `hyperlocal-worker` | $0 free → $14/mo each |
| Supabase | Add `hyperlocal_matrix` schema to shared project | Free → $25 Pro at 500+ users |
| Cloudflare | Register 1 domain | $10/yr |

### Gmail

| Account | Purpose |
|---|---|
| `hyperlocal.matrix@gmail.com` (or similar) | Stripe, support, Resend sender, business owner reply-to |

Add to `.env`:
- `HYPERLOCAL_GMAIL_ADDRESS`
- `HYPERLOCAL_GMAIL_APP_PASSWORD`
- `HYPERLOCAL_DOMAIN`

---

## Service-specific APIs

### Identity & Verification

| Service | Env vars | Cost |
|---|---|---|
| Stripe Identity | (uses Stripe master keys) | $1.50/verification |
| Stripe (master) | `HYPERLOCAL_STRIPE_SECRET_KEY`, `HYPERLOCAL_STRIPE_PUBLISHABLE_KEY`, `HYPERLOCAL_STRIPE_WEBHOOK_SECRET` | 2.9% + 30¢ trans |

**Stripe Identity verification template ID** — created Saturday after
account setup. Add as `HYPERLOCAL_STRIPE_IDENTITY_VERIFICATION_TEMPLATE_ID`.

### Payments

| Service | Env vars | Cost |
|---|---|---|
| Stripe Connect (Express) | (master keys + Connect-specific) | 2.9% + 30¢ + 0.25% Connect fee |
| Stripe Subscriptions | (master keys) | included in Stripe |

### Maps & Geo

| Service | Env vars | Cost |
|---|---|---|
| Mapbox | `HYPERLOCAL_MAPBOX_API_KEY` | Free 50K req/mo |
| Geocoding (Mapbox or Google) | (in Mapbox) | Free tier covers v1 |

### Real-time chat

| Service | Env vars | Cost |
|---|---|---|
| Supabase Realtime | (uses Supabase keys) | Included with Supabase |

### Email

| Service | Env vars | Cost |
|---|---|---|
| Resend | `HYPERLOCAL_RESEND_API_KEY` | Free 3K/mo → $20 Pro |

### Push notifications

| Service | Env vars | Cost |
|---|---|---|
| Web Push (browser) | VAPID keys: `HYPERLOCAL_VAPID_PUBLIC_KEY`, `HYPERLOCAL_VAPID_PRIVATE_KEY` | Free |

### Outreach (shared with NT Directory)

| Service | Env vars | Cost |
|---|---|---|
| LinkedIn Sales Navigator | (manual login, no API) | $99/mo (shared if possible) |
| Apollo.io | `APOLLO_API_KEY` | $49/mo (shared) |
| Instantly.ai | `INSTANTLY_API_KEY` | $37/mo (shared) |
| Vapi | `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID` | $0.05-0.10/min, $50/mo cap |

### Monitoring

| Service | Env vars | Cost |
|---|---|---|
| Sentry | `HYPERLOCAL_SENTRY_DSN` | Free tier |
| UptimeRobot | (login) | Free tier |
| Plausible | `HYPERLOCAL_PLAUSIBLE_DOMAIN` | $9/mo (after revenue) |

### NCMEC reporting

| Service | Env vars | Cost |
|---|---|---|
| NCMEC CyberTipline | (manual API after registration; legal req for CSAM) | Free |

CTO must register the platform with NCMEC for automated reporting
capability before public launch.

---

## OAuth flows founder must complete Saturday

1. Create Gmail (~10 min)
2. Cloudflare register domain (~10 min)
3. Render: create web service + background worker (~10 min)
4. Supabase: create schema (~5 min if shared project, ~15 min if new)
5. Stripe: account create + KYC + Connect onboarding application (~30
   min — Stripe KYC is the ONE thing only founder can do)
6. Stripe Identity: create verification template (~10 min)
7. Mapbox signup (~5 min)
8. Resend signup + domain verify (~15 min)
9. Generate VAPID keys for Web Push (~5 min via web tool)
10. NCMEC platform registration (~30 min — Legal Compliance writes the
    application, founder signs)

**Total founder Saturday morning: ~2-3 hours** (less than NT Channel
because no content distribution platforms)

---

## Legal compliance requirements (BEFORE public launch)

Legal Compliance Watcher writes these. Founder reviews + approves.

- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Moderation Policy public
- [ ] 18+ certification flow
- [ ] CC verification disclaimer
- [ ] CAN-SPAM email footer (physical address from virtual mailbox)
- [ ] AI voice script with 30-sec AI disclosure
- [ ] DNC scrubbing process
- [ ] CCPA notice for CA visitors
- [ ] GDPR data export endpoint
- [ ] Account deletion flow
- [ ] NCMEC reporting mechanism + admin runbook
- [ ] Incident response playbook
- [ ] Stripe positioning statement (for high-risk merchant review)

---

## Permissions / Access Roles

| Role | Read | Write |
|---|---|---|
| CEO | All | Plans, decisions |
| CTO + Engineers | Code, schema, deploys | Code, schema, deploys |
| Community Moderator | Mod queue, audit log | Mod actions only |
| Legal Compliance Watcher | All | Compliance docs |
| Brand/Design | All public-facing drafts | Brand book, creative |
| Sales & Partnership | CRM, prospects | Outreach templates, CRM |
| Head of Growth | Analytics, drafts | Growth experiments |
| Chief Accountant | Billing dashboards | Ledger only |
| McKinsey/YC | All | Reviews only |

**No agent EVER has read access to user PII** (real email, IP, CC token)
beyond what's strictly needed for moderation. This is enforced via
Supabase RLS.

---

## Disaster recovery

If a key is leaked:
- CTO rotates immediately
- Chief Accountant audits last 48h
- Founder notified within 1h
- For Stripe key: also rotate webhook secrets

If Stripe account suspended:
- Pause all subscriptions (no new charges)
- Notify all paying customers within 24h
- Founder + Legal Compliance Watcher work with Stripe to resolve
- DO NOT switch to alternative processor without Legal Compliance
  approval (high-risk processors expensive + can damage brand)

If Supabase outage:
- Read-only mode if possible
- Status page update
- Email all affected users

If CSAM detected:
- Community Moderator triggers NCMEC report immediately
- Legal Compliance + Founder notified within 1h
- Affected channel/posts hidden immediately
- Evidence preserved per NCMEC + legal counsel guidance
- DO NOT engage publicly until legal counsel approves
