# MVP — Lemon Squeezy checkout smoke (Concise / SEALED)

Single end-to-end path for the **SEALED** SKU (MoR = Lemon Squeezy). No secrets in this file — use env names only.

## 0) Which app actually serves buyers

- The **Concise** Next app (`companies/concise`) is mostly the stub home + API routes; it **308-permanent-redirects** `/sealed` to the SEALED deploy (`next.config.js` → `https://sealed-press.onrender.com`).
- **Live landing + buy buttons:** `companies/concise-sealed` (e.g. Render service `sealed-press`).
- **Webhook you configure in Lemon Squeezy** must hit the **same public origin** as the app that is meant to receive orders (today: **sealed-press**), not the generic Concise stub unless you deliberately point LS there.

## 1) Prerequisites (env / dashboard)

1. In Render (or local): `LEMONSQUEEZY_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — same names as monorepo `.env` (see portfolio rules).
2. On the **SEALED** app: optional public checkout overrides `NEXT_PUBLIC_SEALED_CHECKOUT_STANDARD_URL` / `NEXT_PUBLIC_SEALED_CHECKOUT_BUNDLE_URL` (see `companies/concise-sealed/lib/checkout-urls.ts`). If unset, defaults are LS-hosted URLs under `demiurgiclabs.lemonsqueezy.com`.
3. **Buy CTAs:** `NEXT_PUBLIC_STORE_APPROVED=true` on the SEALED deploy so the Standard button is shown (`companies/concise-sealed/lib/store-status.ts`).
4. In **Lemon Squeezy** → Webhooks: URL = `https://<your-sealed-public-host>/api/lemon-squeezy/webhook` signing secret = same as `LEMONSQUEEZY_WEBHOOK_SECRET`.

## 2) Buyer smoke (human or test card) — **Standard SKU only** for MVP

1. Open `https://sealed-press.onrender.com` (or hit `https://<concise-host>/sealed` on the Concise app — **308** permanent redirect per `companies/concise/next.config.js` — and land on sealed-press).
2. With **checkout live** (`NEXT_PUBLIC_STORE_APPROVED=true` → buy mode in `companies/concise-sealed/lib/store-status.ts`), use the **Standard** purchase CTA only — href resolves via `sealedCheckoutUrls.standard` in `companies/concise-sealed/lib/checkout-urls.ts`. (Bundle is a separate SKU; omit for first smoke.)
3. Complete LS checkout (use **Lemon Squeezy test mode** / sandbox per their docs if you must avoid real money). Typical Stripe-style test card where applicable: `4242 4242 4242 4242`.
4. Confirm MoR **PDF / download email** arrives within ~60s.

## 3) Where the webhook lands (code map)

| Piece | Path |
|-------|------|
| Webhook handler (SEALED deploy) | `companies/concise-sealed/app/api/lemon-squeezy/webhook/route.ts` |
| HMAC | Header `X-Signature` vs raw body — `LEMONSQUEEZY_WEBHOOK_SECRET` |
| Events handled | `order_created`, `subscription_created` (others return 200 + `ignored`) |
| DB write | Upsert into **`public.email_subscribers`** (service role; not `concise` schema) |

**Parallel implementation (Concise monolith):** `companies/concise/app/api/lemon-squeezy/webhook/route.ts` uses the same LS contract but targets Supabase schema **`concise`** (`db: { schema: 'concise' }`). Only use one **public** webhook URL in LS; pick the service you actually deploy.

## 4) Automated fixture (no browser)

From monorepo root with `.env` loaded:

- `cd companies/concise-sealed && npm run verify:ls-webhook` — offline HMAC + payload gate (no secrets in output).
- `cd companies/concise-sealed && npm run verify:ls-webhook:integration -- https://<sealed-host>/api/lemon-squeezy/webhook` — signed `order_created` POST + polls **`public.email_subscribers`** for fixture email (`scripts/verify-ls-webhook-fixture.mjs`).

## 5) Pass criteria

1. LS webhook delivery shows **200** for a real or fixture `order_created` with valid signature.
2. Row appears for the buyer email in **`public.email_subscribers`** (tags include `lemonsqueezy`, event name, `test-mode` or `production`).
3. Optional: post-purchase redirect to `/thank-you` on SEALED matches LS dashboard “Thank you / redirect URL” settings (separate from webhook).

---
*Issue: CON-156 — numbered recipe + code pointers, no secrets.*
