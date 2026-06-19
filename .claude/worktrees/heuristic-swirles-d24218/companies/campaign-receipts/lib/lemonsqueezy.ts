// Lemon Squeezy helpers for CampaignReceipts paid subscriptions.
//
// Founder pricing lock 2026-05-30: TWO separate, independently-purchasable
// monthly subscriptions (NO annual):
//   - 'newsletter' — $9/mo — the weekly Friday money-trail email.
//   - 'software'   — $45/mo — the /investigate donor-intelligence dossiers.
//
// Each is its own product/variant in the LS dashboard. We read variant IDs
// from env (LS API doesn't support programmatic product creation). Until a
// product's variant ID is set the checkout helper for it throws — that's
// intentional; the /pricing page + /api/checkout handle the
// "not configured yet" state gracefully.

const STORE_URL = process.env.LEMONSQUEEZY_STORE_URL || 'https://demiurgiclabs.lemonsqueezy.com'

export type CrProduct = 'newsletter' | 'software'

const ENV_KEY: Record<CrProduct, string> = {
  newsletter: 'LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER',
  software: 'LEMONSQUEEZY_CR_VARIANT_ID_SOFTWARE',
}

const PRODUCT_LABEL: Record<CrProduct, string> = {
  newsletter: 'Campaign Receipts — Weekly Newsletter',
  software: 'Campaign Receipts — Donor Intelligence',
}

function variantIdFor(product: CrProduct): string {
  const id = process.env[ENV_KEY[product]]
  if (!id) {
    throw new Error(
      `${ENV_KEY[product]} is not set. Create the "${PRODUCT_LABEL[product]}" ` +
        'product in Lemon Squeezy and add its variant ID to .env.',
    )
  }
  return id
}

export function isCheckoutConfigured(product: CrProduct): boolean {
  try {
    variantIdFor(product)
    return true
  } catch {
    return false
  }
}

// Resolve which CR product a LS variant_id maps to (used by the webhook to
// decide whether a subscription is the newsletter or the software entitlement).
export function productForVariantId(variantId: string | null): CrProduct | null {
  if (!variantId) return null
  if (variantId === process.env.LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER) return 'newsletter'
  if (variantId === process.env.LEMONSQUEEZY_CR_VARIANT_ID_SOFTWARE) return 'software'
  return null
}

// Build a checkout URL with prefilled customer fields + a user_id we can match
// back to the cr_users row in the webhook. checkout[custom] round-trips through
// LS and lands in meta.custom_data on the subscription_created event. We also
// stamp the product so the webhook can attribute it even if variant IDs drift.
export function buildCheckoutUrl(opts: {
  product: CrProduct
  userId: string
  email: string
  sandbox?: boolean
}): string {
  const variantId = variantIdFor(opts.product)
  const url = new URL(`${STORE_URL}/checkout/buy/${variantId}`)
  url.searchParams.set('checkout[email]', opts.email)
  url.searchParams.set('checkout[custom][user_id]', opts.userId)
  url.searchParams.set('checkout[custom][app]', 'campaign-receipts')
  url.searchParams.set('checkout[custom][product]', opts.product)
  if (opts.sandbox) url.searchParams.set('checkout[custom][test]', 'true')
  return url.toString()
}
