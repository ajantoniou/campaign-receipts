# LemonSqueezy Billing Playbook (portfolio-wide)

**Source:** built + battle-tested on HealthBrew (2026-05-30). Share with Cliros,
EstimateProof, Campaign Receipts to standardize checkout / cancel / refund.

This is the canonical pattern for **self-service** subscription billing on
LemonSqueezy (LS): checkout, in-app cancel, 3-day refund, no-repeat free trial,
and letting an AI assistant answer billing questions safely. Every piece was
adversarially reviewed; the security notes are non-negotiable.

---

## 0. The golden rules (read these first)

1. **The API is the source of truth, NOT the dashboard.** The LS dashboard can
   show a "free trial" toggle that did NOT actually set `has_free_trial: true`
   on the variant. ALWAYS verify variant config via the API before wiring it.
   (We shipped HealthBrew nearly charging first-timers $25 because the env
   pointed at a no-trial variant. Caught only by querying the API.)
2. **A "product" is not a "variant."** Checkout needs a **variant** id. Every
   product has ≥1 variant (even single-price ones). A product id passed where a
   variant id is expected → 404 / broken checkout. Verify which is which.
3. **Never put a payment field into a client response or an LLM prompt.** API
   key, card data, full address, email, customer_id, raw LS payloads — all stay
   server-side.
4. **Resolve the subscription/invoice id SERVER-SIDE from YOUR DB, scoped to the
   authed user.** Never accept an LS id from the client. This is what prevents
   one user acting on another's billing (IDOR).
5. **Money actions need an atomic claim BEFORE the external call**, plus a
   **webhook backstop**. Check-then-act around a network call = double-charge /
   double-refund race.
6. **Verify variant/product IDs with the API and bake them as code fallbacks**
   so a missing/wrong env var can't silently break or mis-price checkout.

---

## 1. Verify your LS catalog (do this for every company)

```bash
KEY=<LEMONSQUEEZY_API_KEY>
H=(-H "Authorization: Bearer $KEY" -H "Accept: application/vnd.api+json")

# Your store(s) — get the slug/domain (the customer billing portal lives here)
curl -s "${H[@]}" "https://api.lemonsqueezy.com/v1/stores"        # .data[].attributes.{slug,domain,url}

# Products
curl -s "${H[@]}" "https://api.lemonsqueezy.com/v1/products"      # find your product id

# Variants under a product — THIS is what checkout uses
curl -s "${H[@]}" "https://api.lemonsqueezy.com/v1/variants?filter[product_id]=<PRODUCT_ID>"
#   check each: attributes.has_free_trial (bool!), trial_interval(_count),
#   interval, price (cents), status ('published' vs 'pending'=draft), is_subscription
```

**Checklist per variant you intend to use:**
- `status: published` (a `pending` draft won't sell)
- `has_free_trial` is the REAL flag — `true` for a trial variant, `false` for a
  pay-now variant. (Ignore stray `trial_interval` values when the bool is false.)
- `price` is in **cents**.

**No-repeat-trial pattern needs TWO variants:** a trial variant
(`has_free_trial:true`) for first-timers, and a no-trial variant
(`has_free_trial:false`) for returning users. The trial is set at the variant
level and CANNOT be stripped per-checkout via the API — so you route returning
users to a different variant.

> HealthBrew reference mapping (example):
> - `1726009` "Default" — 28-day trial → $25/mo  → first-timers
> - `1695351` "Returning Brewer" — $25/mo no trial → returning users

---

## 2. Checkout (create a checkout via API)

`POST /v1/checkouts`. Pre-fill the email + a `custom.user_id` so the webhook can
link the subscription back to your user. Pick the variant by trial-eligibility.

```ts
// /api/checkout (server route). Env (with verified fallbacks):
//   LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID,
//   LEMONSQUEEZY_<CO>_VARIANT_ID         (trial / first-timer)
//   LEMONSQUEEZY_<CO>_NOTRIAL_VARIANT_ID (no-trial / returning)
const variantId = hadTrial ? noTrialVariantId : trialVariantId
const body = {
  data: { type: 'checkouts', attributes: {
    checkout_data: { email, custom: { user_id, company: '<co>' } },
    product_options: { enabled_variants: [Number(variantId)], redirect_url, receipt_link_url },
  }, relationships: {
    store: { data: { type: 'stores', id: storeId } },
    variant: { data: { type: 'variants', id: variantId } },
  }},
}
// → POST with Authorization: Bearer; response.data.attributes.url is the checkout link
```

**No-repeat-free-trial logic** (route returning users to the no-trial variant):
- `users.had_trial boolean` flag, stamped by the webhook on first `on_trial`/`active`.
- **Cross-row backstop** at checkout: if `had_trial` is false, also check for any
  prior subscription by lower(email) AND an **email-keyed `trial_ledger` that does
  NOT cascade on account deletion** (so delete-account + re-signup can't farm a
  new trial). If found, treat as `had_trial=true` and write it back.
- **REVOKE UPDATE on `had_trial` from the client roles** so a user can't flip it
  back to false (column-level REVOKE survives a future blanket table grant).

---

## 3. Webhook (the reconciler — your source of durable truth)

Signature-verify every webhook (HMAC over the raw body with the signing secret).
Handle these events: `subscription_created`, `_updated`, `_payment_success`,
`_payment_failed`, `_cancelled`, `_resumed`, `_expired`.

**CRITICAL shape gotcha:** for `subscription_payment_success/_failed`, the
`data` object is a **subscription-INVOICE**, NOT a subscription:
- subscription events: `data.id` = subscription id, `attrs.status`,
  `attrs.renews_at`, `attrs.ends_at`, `attrs.cancelled`, `attrs.urls.customer_portal`
- invoice events: `data.id` = invoice id, `attrs.subscription_id`,
  `attrs.status` ('paid'|'refunded'), `attrs.total` (cents), `attrs.refunded`

If you treat an invoice event as a subscription (use `data.id` as the sub id),
you corrupt the subscription row on every payment. **Branch on event name and
handle invoice events separately + return early.**

Store, per subscription: `status`, `current_period_end` (= renews_at ?? ends_at),
`cancel_at_period_end`, `cancelled_at`, `provider_subscription_id`,
`provider_customer_id`, `customer_portal_url`, and — for refunds —
`last_invoice_id`, `last_invoice_paid_at`, `last_invoice_total_cents`.

**Webhook is the backstop for every money action** (cancel, refund, trial stamp).
Even if an API route's DB write is lost, the webhook reconciles independently —
so make webhook writes idempotent (`WHERE flag = false`).

---

## 4. Access gate (who keeps access)

Allow access when ANY: founder/beta, OR a live subscription:
- `active` / `on_trial` / `past_due` **AND** `current_period_end` still in the
  future (+ a few days grace). A stale `active` row with an elapsed period must
  NOT grant free access.
- `cancelled` **AND** `current_period_end > now()` — a cancelled user keeps the
  month they already paid for (paid-through window).

**FAIL CLOSED on a DB error** in a paywall gate (deny + send to /pricing to
retry). Failing open grants everyone access on any blip.

---

## 5. In-app cancel (no redirect)

`DELETE /v1/subscriptions/{id}` → status becomes `cancelled` with `ends_at` =
end of paid period; the customer keeps access until then.

- Resolve `{id}` server-side from the authed user's own row (never client input).
- Optimistic local update; the webhook confirms.
- Optional: capture a one-tap cancel reason (allowlisted values, parameterized
  insert) for churn insight.
- Idempotent on already-cancelled/expired.

---

## 6. Refund (money OUT — most dangerous; review every line)

`POST /v1/subscription-invoices/{invoiceId}/refund` (omit `amount` = full refund).

Example policy (HealthBrew): **full refund if charged ≤3 days ago AND never
refunded before**, then cancel. The AI assistant SURFACES the option; the
**system enforces the rule** — never let an LLM decide refunds.

**The two CRITICAL holes we found + fixed (do NOT skip these):**

1. **TOCTOU double-refund race.** Two concurrent requests both pass a
   check-then-act `had_refund` guard before either writes, both refund.
   **Fix: ATOMIC CLAIM before the LS call** —
   `UPDATE users SET had_refund=true WHERE id=$1 AND had_refund=false RETURNING id`.
   Only the row that comes back proceeds to call LS. If LS then fails, **roll
   back the claim** so the user can retry.
2. **LS-succeeds / DB-write-fails re-refund.** If the flag write fails after a
   successful refund, the next request refunds again. **Fix:** claim is durable
   before the LS call (point 1) **+** a **webhook refund backstop** that sets
   `had_refund=true` when an invoice reports `refunded:true` / `status:refunded`
   (idempotent, scoped to the user).

Eligibility window is computed from `last_invoice_paid_at` **stored by the
webhook** — never from client input (no window bypass).

---

## 7. Letting an AI assistant answer billing questions (safely)

To let a support bot answer "when's my next charge / did my refund go through /
what did I pay," give it a **scoped summary**, not API access:

- A server helper takes the **authed userId**, reads the LS ids **you stored for
  that user** (`WHERE user_id = $1`), and fetches ONLY that user's own
  subscription (`/v1/subscriptions/{your stored id}`).
- Project to a **small safe summary**: plan, status, next charge date, last
  payment, trial end, refund eligibility. **No** card/address/email/customer_id/
  raw payload. The id is never taken from the chat message.
- **6s timeout** on the LS fetch + **cache fallback** to your DB row, fetched
  **concurrently** with other context so it's off the critical path.
- Inject into the **support** assistant's system prompt only (keep money talk
  out of other assistant surfaces).

---

## 8. Customer billing portal / cancel link

- The reliable per-customer portal URL comes from the webhook
  (`attrs.urls.customer_portal` — a signed, expiring link). Store it; prefer it.
- Store-level fallback: `https://<store-slug>.lemonsqueezy.com/billing`
  (get `<store-slug>` from `/v1/stores`). Verify the subdomain — don't guess it.
- LS has **no separate "customer portal" setting** to enable; the portal exists
  per-subscription automatically.

---

## 9. Per-company adoption checklist

- [ ] Run §1 catalog verification; record product id + variant ids + which is
      trial vs no-trial.
- [ ] Set env: `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, the variant id(s).
      Bake verified ids as code fallbacks.
- [ ] Webhook: signature verify + the invoice-shape branch (§3). Store the
      fields in §3.
- [ ] Access gate with period-end + fail-closed (§4).
- [ ] In-app cancel (§5).
- [ ] Refund only if the product offers one — with the atomic-claim + webhook
      backstop (§6). Skip if no refund policy.
- [ ] If you have a support bot, the scoped billing summary (§7).
- [ ] DB columns: subscriptions(provider_subscription_id, provider_customer_id,
      status, current_period_end, cancel_at_period_end, customer_portal_url,
      last_invoice_id, last_invoice_paid_at, last_invoice_total_cents);
      users(had_trial, had_refund) + a non-cascading trial_ledger if you offer a
      free trial.
- [ ] Adversarially review every money-OUT path (refund) and every money-state
      path (cancel, trial routing) before shipping.

---

## 10. Pricing reference (LS fees)

LS is Merchant of Record (handles tax/VAT). They take a transaction fee per
sale — confirm current rate in your dashboard. You never touch card data
(PCI handled by LS). Customer-facing legal: LS is the seller of record.
