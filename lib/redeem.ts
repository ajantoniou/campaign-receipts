// Trial-code redemption. Called by /redeem/[code] and by the auth
// verify flow when the user comes in via an outreach email.
//
// A code is valid if:
//   - it exists
//   - not yet redeemed
//   - not past its expires_at (this is the 7-day redemption window,
//     not the access duration)
//
// On redemption we stamp redeemed_at + redeemed_by_user_id and create
// or extend a cr_subscribers row with status='trialing' and
// trial_ends_at = now + days_granted.

import { supabaseService } from './supabase'
import type { CrProduct } from './entitlement'

export type RedeemResult =
  | { ok: true; trialEndsAt: string; daysGranted: number }
  | { ok: false; reason: 'not_found' | 'already_redeemed' | 'expired' }

// A trial code grants the data product by default (that's the $45/mo Pro
// surface — what `tier: 'pro'` and the legacy outreach comps mean). Callable
// with 'newsletter' if a future redeem flow grants that instead.
export async function redeemTrialCode(
  code: string,
  userId: string,
  product: CrProduct = 'software',
): Promise<RedeemResult> {
  const { data: row } = await supabaseService
    .from('cr_trial_codes')
    .select('code, days_granted, expires_at, redeemed_at')
    .eq('code', code)
    .maybeSingle()

  if (!row) return { ok: false, reason: 'not_found' }
  if (row.redeemed_at) return { ok: false, reason: 'already_redeemed' }
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' }

  const trialEndsAt = new Date(Date.now() + row.days_granted * 86_400_000).toISOString()

  // Don't let a trial code downgrade a customer who already has a real
  // (Lemon Squeezy) subscription for this product: the upsert below would
  // overwrite status→'trialing' and current_period_end→null, erasing their
  // paid billing period. If a billing-backed row exists, redeem is a no-op on
  // the subscription (still mark the code used so it can't be re-redeemed).
  const { data: existing } = await supabaseService
    .from('cr_subscribers')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .eq('product', product)
    .maybeSingle()

  await supabaseService
    .from('cr_trial_codes')
    .update({ redeemed_at: new Date().toISOString(), redeemed_by_user_id: userId })
    .eq('code', code)

  if (existing?.stripe_subscription_id) {
    // Already a paying customer for this product — nothing to grant.
    return { ok: true, trialEndsAt, daysGranted: row.days_granted }
  }

  // cr_subscribers PK is (user_id, product) — must include `product` and
  // conflict on the composite key, matching the LS webhook upsert. A bare
  // onConflict:'user_id' would error (no such unique constraint) and a missing
  // product would violate NOT NULL / never match an entitlement read.
  await supabaseService.from('cr_subscribers').upsert(
    {
      user_id: userId,
      product,
      tier: 'pro',
      status: 'trialing',
      source: 'trial_code',
      trial_ends_at: trialEndsAt,
      current_period_end: null, // a trial has no billing period yet
      commercial_license: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,product' },
  )

  return { ok: true, trialEndsAt, daysGranted: row.days_granted }
}
