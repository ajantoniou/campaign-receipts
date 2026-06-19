# Concise — Permissions & Configurations

Complete inventory of every API key, third-party service, and
integration this company needs.

---

## Required: Saturday morning

### LLM APIs (already in .env)

| Service | Env var | Status |
|---|---|---|
| Anthropic Claude | `ANTHROPIC_API_KEY` | ✅ shared |
| DeepSeek | `DEEPSEEK_API_KEY` | ✅ shared |
| Render Platform | `RENDER_API_KEY` | ✅ shared |

### Hosting & DB

| Service | Action | Cost |
|---|---|---|
| Render | 1 web service `concise` | Free → $7 when justified |
| Supabase | Add `concise` schema to shared project | Free tier |
| Cloudflare | Register 1 domain | $10/yr |

### Gmail

| Account | Purpose |
|---|---|
| `concise.books@gmail.com` (or alternate from Brand) | Stripe, support, Resend sender |

Add to `.env`:
- `CONCISE_GMAIL_ADDRESS`
- `CONCISE_GMAIL_APP_PASSWORD`
- `CONCISE_DOMAIN`

### Google Drive access (CRITICAL — for existing book IP)

Founder grants access to CONCISE Drive folder via:
- Service account credential file → stored in Render env
  `CONCISE_GDRIVE_SERVICE_ACCOUNT_JSON` (base64-encoded)
- OR personal Drive download link → manually downloaded by CTO once,
  stored in Supabase Storage

**Recommend:** manual download, store in Supabase Storage. Avoids
ongoing Drive API integration complexity for v1.

---

## Service-specific APIs

### Payments

| Service | Env vars | Cost |
|---|---|---|
| Stripe | `CONCISE_STRIPE_SECRET_KEY`, `CONCISE_STRIPE_PUBLISHABLE_KEY`, `CONCISE_STRIPE_WEBHOOK_SECRET` | 2.9% + 30¢ |
| Stripe Payment Links | (use dashboard) | Free |

**Stripe products to create:**
- "Concise MCAT Bundle (3 books)" — $49-99 (founder approves price)
- "Concise MCAT Book #1 (individual)" — $19-29
- "Concise MCAT Book #2 (individual)" — $19-29
- "Concise MCAT Book #3 (individual)" — $19-29
- "Concise Trump Election Promises Book" — $9-19
- Other titles as launched

**No Stripe Connect needed.** Founder receives all sales directly.

### Email

| Service | Env vars | Cost |
|---|---|---|
| Resend | `CONCISE_RESEND_API_KEY` | Free 3K/mo → $20 Pro |

Domain verification needed (SPF, DKIM via Cloudflare).

### Distribution platforms (organic, OAuth-based)

| Platform | Env vars | Notes |
|---|---|---|
| Reddit | (account credentials manually for v1) | Manual posting Phase 1 |
| TikTok for Developers | `CONCISE_TIKTOK_CLIENT_KEY`, etc. | Same flow as other companies |
| Twitter (founder's existing pseudonym handle?) | `CONCISE_X_*` if posting | Founder decides if Concise gets own handle or uses pseudonym |
| Amazon (existing) | (no API integration needed) | Continue passive sales |

### Analytics & Monitoring

| Service | Env vars | Cost |
|---|---|---|
| Sentry | `CONCISE_SENTRY_DSN` | Free tier |
| UptimeRobot | (login) | Free tier |
| Plausible | `CONCISE_PLAUSIBLE_DOMAIN` | $9/mo (after revenue) |

### Image generation (for cover redesigns)

| Service | Env vars | Cost |
|---|---|---|
| Midjourney OR Flux | Shared with NT Channel: `NT_MIDJOURNEY_API_KEY` or `FLUX_API_KEY` | Shared cost |

OR Brand/Design uses founder's existing Canva Pro / Figma if available.

---

## OAuth flows founder must complete Saturday

1. Create Gmail (~10 min)
2. Cloudflare register domain (~10 min)
3. Render web service create (~5 min)
4. Stripe products create (~30 min — KYC may already be done)
5. Resend signup + domain verify (~15 min)
6. TikTok for Developers (~30 min) — if Concise gets own handle
7. Provide CONCISE Drive folder access (~10 min — share folder OR
   download books locally for upload)

**Total: ~1.5-2 hours Saturday** (lowest of active companies — no
distribution platform OAuth, no business verification, no broker
integration).

---

## Permissions / Access Roles

| Role | Read | Write |
|---|---|---|
| CEO | All | Plans, decisions |
| CTO | Code, schema, deploys, books | Code, schema, deploys |
| Brand/Design | All drafts, books | Brand book, creative, cover variants |
| Head of Growth | Analytics, drafts | Growth experiments, content drafts |
| Chief Accountant | Billing dashboards (Stripe + Amazon if exposed) | Ledger only |
| McKinsey/YC | All | Reviews only |

**Sensitive:** founder's existing book content + pseudonym + (maybe)
real name + MD credential. Agents respect founder's privacy
preferences — don't expose pseudonym ↔ real name link in public-facing
content unless founder approves.

---

## Compliance configurations (BEFORE first publish)

- [ ] Privacy Policy live
- [ ] Terms of Service live
- [ ] Refund policy (recommend: 30-day no-questions-asked for
      digital products; or "no refunds, all sales final" if simpler
      — founder's call)
- [ ] CAN-SPAM-compliant email footer
- [ ] FTC affiliate disclosure (when affiliate Phase 2 launches)
- [ ] GDPR/CCPA notices
- [ ] Stripe tax handling for digital goods (sales tax in applicable
      states; Stripe Tax handles automatically)

---

## Disaster recovery

If a key is leaked:
- CTO rotates immediately
- Founder notified within 1h

If Stripe account flagged for content (controversial Trump book):
- Position to Stripe: "Educational political commentary; standard
  publishing"
- Have backup processor ready: Gumroad ($10/mo + 10% per sale, no
  approval needed for political content)

If Amazon listings flagged due to direct-sale activities:
- Maintain professional separation: direct-sale brand may differ
  from Amazon pseudonym (founder approves)
- Don't import Amazon reviews to direct site (Amazon ToS issue)

If existing Amazon revenue drops as direct sales grow:
- Track separately; net should grow
- If net DROPS, pause direct-sale promotion of that title; investigate
  cannibalization
