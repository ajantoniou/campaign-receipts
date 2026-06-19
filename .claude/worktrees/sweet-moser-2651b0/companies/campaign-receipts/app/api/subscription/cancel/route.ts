// POST /api/subscription/cancel — self-serve subscription cancel.
//
// Auth-required. Verifies the requested product sub belongs to the signed-in
// user, then calls the Lemon Squeezy API to cancel it. LS cancels at PERIOD END
// (the customer keeps access until the month they paid for runs out), then sends
// a subscription_cancelled webhook that keeps cr_subscribers in sync. We also
// mark the row 'canceled' immediately so the dashboard reflects it without
// waiting on the webhook.
//
// The LS subscription id lives on cr_subscribers.stripe_subscription_id (the
// webhook writes payload.data.id there).
//
// Body: { product: 'software' | 'newsletter' }
import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { fromUser } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const LS_API = 'https://api.lemonsqueezy.com/v1'

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }
  const product = body?.product
  if (product !== 'software' && product !== 'newsletter') {
    return NextResponse.json({ error: 'Unknown subscription.' }, { status: 400 })
  }

  // Verify the sub belongs to this user. fromUser pins .eq('user_id', user.id)
  // so a forgotten ownership filter can't leak another tenant's subscription.
  const { data: sub, error: subErr } = await fromUser('cr_subscribers', user.id)
    .select('user_id, product, status, stripe_subscription_id, current_period_end')
    .eq('product', product)
    .maybeSingle()

  // Distinguish a DB error (5xx) from a genuine not-found (404) — don't let a
  // query failure masquerade as "no such subscription".
  if (subErr) {
    console.error('cancel: cr_subscribers lookup failed', subErr)
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 })
  }
  if (!sub) return NextResponse.json({ error: 'No such subscription.' }, { status: 404 })
  if (sub.status === 'canceled' || sub.status === 'expired') {
    return NextResponse.json({ ok: true, already_canceled: true, ends_at: sub.current_period_end })
  }
  // Comp / manually-granted access has no Lemon Squeezy subscription to cancel.
  // The dashboard already hides the Cancel button for these, but a stale page
  // could still POST here — answer gracefully instead of surfacing a scary
  // billing error. Nothing to self-cancel; comps are revoked internally.
  if (!sub.stripe_subscription_id) {
    return NextResponse.json({
      ok: true,
      comp: true,
      message: 'This access was granted by CampaignReceipts and has no billing to cancel.',
    })
  }

  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  if (!apiKey) {
    console.error('cancel: LEMONSQUEEZY_API_KEY not set')
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 500 })
  }

  // LS cancel = DELETE the subscription. It cancels at period end.
  try {
    const res = await fetch(`${LS_API}/subscriptions/${sub.stripe_subscription_id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    })
    if (!res.ok && res.status !== 404) {
      const txt = await res.text().catch(() => '')
      console.error('cancel: LS API error', res.status, txt)
      return NextResponse.json(
        { error: 'We could not cancel right now. Try again or email us.' },
        { status: 502 },
      )
    }
  } catch (err) {
    console.error('cancel: LS API fetch failed', err)
    return NextResponse.json({ error: 'We could not reach billing. Try again.' }, { status: 502 })
  }

  // Mark canceled-at-period-end locally (webhook will confirm + sync).
  await fromUser('cr_subscribers', user.id)
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('product', product)

  return NextResponse.json({ ok: true, ends_at: sub.current_period_end })
}
