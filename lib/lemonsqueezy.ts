// Lemon Squeezy helpers for CampaignReceipts paid subscriptions.
//
// Model (founder 2026-06-20): donor-influence DATA is free. The ONLY paid
// product is the weekly newsletter, offered in three plans:
//   - newsletter (monthly)  — $12/mo
//   - newsletter-annual     — $96/yr ("$8/mo, 2 months free"); the DEFAULT plan
//   - newsletter-founding    — $79/yr, locked, first 1,000 members
// All three map to the SAME entitlement (product='newsletter') for the webhook.
// The legacy 'software' product is retired (data is free) but kept resolvable so
// any pre-existing software subscriptions still attribute correctly.
//
// Each plan is its own product/variant in the LS dashboard. We read variant IDs
// from env (LS API doesn't support programmatic product creation). Until a plan's
// variant ID is set, the checkout helper for it throws — intentional; the
// /pricing page + /api/checkout handle the "not configured yet" state gracefully.

const STORE_URL = process.env.LEMONSQUEEZY_STORE_URL || 'https://demiurgiclabs.lemonsqueezy.com'

// A checkout SKU = a specific purchasable plan. Each maps to one LS variant.
export type CrPlan = 'newsletter' | 'newsletter-annual' | 'newsletter-founding' | 'software'

// Legacy alias: callers/webhook still pass 'newsletter'|'software' as the
// entitlement PRODUCT. Every newsletter-* plan grants the 'newsletter' product.
export type CrProduct = 'newsletter' | 'software'

const ENV_KEY: Record<CrPlan, string> = {
  newsletter: 'LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER',
  'newsletter-annual': 'LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER_ANNUAL',
  'newsletter-founding': 'LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER_FOUNDING',
  software: 'LEMONSQUEEZY_CR_VARIANT_ID_SOFTWARE',
}

const PLAN_LABEL: Record<CrPlan, string> = {
  newsletter: 'Campaign Receipts — Weekly Newsletter (Monthly)',
  'newsletter-annual': 'Campaign Receipts — Weekly Newsletter (Annual)',
  'newsletter-founding': 'Campaign Receipts — Weekly Newsletter (Founding Member)',
  software: 'Campaign Receipts — Donor Intelligence (retired)',
}

// Which entitlement product a checkout plan grants.
export function productForPlan(plan: CrPlan): CrProduct {
  return plan === 'software' ? 'software' : 'newsletter'
}

function variantIdFor(plan: CrPlan): string {
  const id = process.env[ENV_KEY[plan]]
  if (!id) {
    throw new Error(
      `${ENV_KEY[plan]} is not set. Create the "${PLAN_LABEL[plan]}" ` +
        'plan in Lemon Squeezy and add its variant ID to .env.',
    )
  }
  return id
}

export function isCheckoutConfigured(plan: CrPlan): boolean {
  try {
    variantIdFor(plan)
    return true
  } catch {
    return false
  }
}

// Resolve which entitlement PRODUCT a LS variant_id grants (used by the webhook).
// All newsletter-* variants grant 'newsletter'; the software variant grants 'software'.
export function productForVariantId(variantId: string | null): CrProduct | null {
  if (!variantId) return null
  if (
    variantId === process.env.LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER ||
    variantId === process.env.LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER_ANNUAL ||
    variantId === process.env.LEMONSQUEEZY_CR_VARIANT_ID_NEWSLETTER_FOUNDING
  ) {
    return 'newsletter'
  }
  if (variantId === process.env.LEMONSQUEEZY_CR_VARIANT_ID_SOFTWARE) return 'software'
  return null
}

// Build a checkout URL with prefilled customer fields + a user_id we can match
// back to the cr_users row in the webhook. checkout[custom] round-trips through
// LS and lands in meta.custom_data on the subscription_created event. We stamp
// the entitlement product so the webhook can attribute it even if variant IDs drift.
export function buildCheckoutUrl(opts: {
  plan: CrPlan
  userId: string
  email: string
  sandbox?: boolean
}): string {
  const variantId = variantIdFor(opts.plan)
  const url = new URL(`${STORE_URL}/checkout/buy/${variantId}`)
  url.searchParams.set('checkout[email]', opts.email)
  url.searchParams.set('checkout[custom][user_id]', opts.userId)
  url.searchParams.set('checkout[custom][app]', 'campaign-receipts')
  url.searchParams.set('checkout[custom][product]', productForPlan(opts.plan))
  url.searchParams.set('checkout[custom][plan]', opts.plan)
  if (opts.sandbox) url.searchParams.set('checkout[custom][test]', 'true')
  return url.toString()
}
