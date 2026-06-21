// Lemon Squeezy webhook for CampaignReceipts paid subscriptions.
//
// The only sold product is the 'newsletter' ($9/mo); the legacy 'software'
// product is retired but still resolvable for any pre-existing subs.
// The product is keyed off the LS variant_id in the payload (see
// productForVariantId). One row per (user_id, product) in cr_subscribers, so a
// user can hold one, the other, or both.
//
// Events we handle (all subscription lifecycle):
//   subscription_created          → insert cr_subscribers row, status='trialing' or 'active'
//   subscription_updated          → refresh status + current_period_end
//   subscription_cancelled        → mark canceled (access continues until period_end)
//   subscription_expired          → mark expired (immediate)
//   subscription_payment_success  → ensure status='active' + bump current_period_end
//   subscription_payment_failed   → status='past_due'
//
// Signature verification + 5-min freshness window match the SEALED
// webhook in companies/concise-sealed.

import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { productForVariantId, type CrProduct } from '@/lib/lemonsqueezy'

export const dynamic = 'force-dynamic'

const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || ''

const HANDLED_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_expired',
  'subscription_payment_success',
  'subscription_payment_failed',
])

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!WEBHOOK_SECRET || !signatureHeader || rawBody.length === 0) return false
  try {
    const signature = Buffer.from(signatureHeader, 'hex')
    if (signature.length === 0) return false
    const hmac = Buffer.from(
      crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody, 'utf8').digest('hex'),
      'hex',
    )
    if (hmac.length !== signature.length) return false
    return crypto.timingSafeEqual(hmac, signature)
  } catch (err) {
    console.error('LS signature verification failed:', err)
    return false
  }
}

function mapStatus(lsStatus: string): 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired' {
  switch (lsStatus) {
    case 'on_trial':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'cancelled':
    case 'paused':
      return 'canceled'
    case 'expired':
    case 'unpaid':
      return 'expired'
    default:
      return 'active'
  }
}

// Find (or create) the cr_users row this subscription belongs to.
// LS gives us either a passed-through user_id in meta.custom_data OR
// just an email; we handle both so an unauthenticated checkout still
// provisions a user.
async function resolveUserId(opts: {
  customUserId: string | null
  email: string
}): Promise<string | null> {
  if (opts.customUserId) {
    const { data } = await supabaseService
      .from('cr_users')
      .select('id')
      .eq('id', opts.customUserId)
      .maybeSingle()
    if (data?.id) return data.id
  }

  const email = opts.email.toLowerCase().trim()
  if (!email) return null

  const { data: existing } = await supabaseService
    .from('cr_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing?.id) return existing.id

  const { data: created, error } = await supabaseService
    .from('cr_users')
    .insert({ email })
    .select('id')
    .single()
  if (error) {
    console.error('LS webhook: failed to create cr_users row', error)
    return null
  }
  return created.id
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature')

  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 })
  }
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName: string = payload?.meta?.event_name || ''
  const createdAt: string | undefined = payload?.meta?.created_at
  if (createdAt) {
    const age = Date.now() - new Date(createdAt).getTime()
    if (age > 5 * 60_000 || age < -60_000) {
      return NextResponse.json({ error: 'Event too old or future-dated' }, { status: 400 })
    }
  }

  // Ignore events we don't care about (SEALED order events, etc.).
  if (!HANDLED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: true, ignored: eventName }, { status: 200 })
  }

  // The subscription_* event payloads expose the LS subscription
  // object as `data` and the custom checkout data on meta.custom_data.
  const attributes = payload?.data?.attributes ?? {}
  const subscriptionId = String(payload?.data?.id ?? '')
  const lsStatus = String(attributes?.status ?? 'active')
  const email: string = attributes?.user_email || ''
  const customerId = attributes?.customer_id ? String(attributes.customer_id) : null
  const renewsAt: string | null = attributes?.renews_at || null
  const endsAt: string | null = attributes?.ends_at || null
  const trialEndsAt: string | null = attributes?.trial_ends_at || null
  const variantId = attributes?.variant_id ? String(attributes.variant_id) : null

  const custom = payload?.meta?.custom_data ?? {}
  const customUserId: string | null = custom?.user_id ? String(custom.user_id) : null

  // Which CR product is this subscription for? The variant_id is authoritative
  // (it maps to exactly one of the two products); custom.product is the fallback
  // when the variant IDs drift or the checkout was opened outside our flow.
  const variantProduct = productForVariantId(variantId)
  const customProduct: CrProduct | null =
    custom?.product === 'newsletter' || custom?.product === 'software'
      ? (custom.product as CrProduct)
      : null
  const product: CrProduct | null = variantProduct ?? customProduct

  // Only attribute to a CR user when this looks like a CR subscription AND we
  // can tell which of the two products it is. app=campaign-receipts is set by
  // buildCheckoutUrl; a known variant ID is the shared-link fallback.
  const isCrSub = custom?.app === 'campaign-receipts' || variantProduct != null
  if (!isCrSub || !product) {
    return NextResponse.json(
      { ok: true, ignored: 'not a recognized CR product subscription' },
      { status: 200 },
    )
  }

  const userId = await resolveUserId({ customUserId, email })
  if (!userId) {
    console.warn('LS webhook: no user resolvable for', { eventName, email })
    return NextResponse.json({ ok: true, ignored: 'no user' }, { status: 200 })
  }

  const mappedStatus = mapStatus(lsStatus)
  const currentPeriodEnd = renewsAt || endsAt || null

  // subscription_cancelled keeps access until the period end —
  // status stays 'active' until the period actually ends, then LS
  // sends subscription_expired which we map to 'expired'.
  const finalStatus =
    eventName === 'subscription_cancelled' && currentPeriodEnd && new Date(currentPeriodEnd).getTime() > Date.now()
      ? 'canceled'
      : eventName === 'subscription_payment_failed'
        ? 'past_due'
        : mappedStatus

  const { error } = await supabaseService.from('cr_subscribers').upsert(
    {
      user_id: userId,
      product,
      tier: 'pro',
      status: finalStatus,
      source: 'lemonsqueezy',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      trial_ends_at: trialEndsAt,
      current_period_end: currentPeriodEnd,
      commercial_license: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,product' },
  )

  if (error) {
    console.error('LS webhook: failed to upsert cr_subscribers', error)
    return NextResponse.json({ error: 'DB upsert failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, event: eventName, user_id: userId }, { status: 200 })
}
