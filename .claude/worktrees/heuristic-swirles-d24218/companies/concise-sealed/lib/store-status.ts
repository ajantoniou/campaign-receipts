/**
 * Store status derived from actual config state — no manual toggle env vars.
 *
 * Buy mode activates when the resolved checkout URL (env var if set, else
 * default in `lib/checkout-urls.ts`) is a real `creativelabs2016` Lemon
 * Squeezy URL — not the old placeholder slugs from before the store went
 * live. The default in `checkout-urls.ts` is the real live URL, so unless
 * an env var explicitly downgrades to the placeholder, mode is `'buy'`.
 *
 * Sold-out mode: set NEXT_PUBLIC_SEALED_SOLD_OUT=true for limited-run gates.
 */

import { sealedCheckoutUrls } from './checkout-urls'

const PLACEHOLDER_STANDARD = 'https://demiurgiclabs.lemonsqueezy.com/checkout/buy/sealed-standard'
const PLACEHOLDER_BUNDLE = 'https://demiurgiclabs.lemonsqueezy.com/checkout/buy/sealed-bundle'

function hasRealCheckoutUrls(): boolean {
  const { standard, bundle } = sealedCheckoutUrls
  if (!standard || standard === PLACEHOLDER_STANDARD) return false
  if (!bundle || bundle === PLACEHOLDER_BUNDLE) return false
  return true
}

export const isStoreApproved = hasRealCheckoutUrls()

export const isSoldOut =
  typeof process.env.NEXT_PUBLIC_SEALED_SOLD_OUT === 'string' &&
  process.env.NEXT_PUBLIC_SEALED_SOLD_OUT.toLowerCase() === 'true'

export type StoreCtaMode = 'notify' | 'buy' | 'sold_out'

export function getStoreCtaMode(): StoreCtaMode {
  if (isSoldOut) return 'sold_out'
  if (!isStoreApproved) return 'notify'
  return 'buy'
}
