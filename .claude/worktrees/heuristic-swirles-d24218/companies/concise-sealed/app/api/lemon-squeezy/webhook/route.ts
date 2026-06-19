import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

// Same route shape as `companies/concise` for Lemon Squeezy dashboard URL stability.
// Inserts use `public.email_subscribers` (see `supabase/migrations/001_email_subscribers.sql`), not `concise.*`.

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET

const orderEvents = new Set(['order_created', 'subscription_created'])

function verifySignature(rawBody: string, signatureHeader: string | null) {
  if (!WEBHOOK_SECRET || !signatureHeader || rawBody.length === 0) {
    return false
  }

  try {
    // Lemon Squeezy: X-Signature is the HMAC-SHA256 of the raw body, hex-encoded (see LS Next.js webhook guide).
    const signature = Buffer.from(signatureHeader, 'hex')
    if (signature.length === 0) {
      return false
    }

    const hmac = Buffer.from(
      crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody, 'utf8').digest('hex'),
      'hex'
    )

    if (hmac.length !== signature.length) {
      return false
    }

    return crypto.timingSafeEqual(hmac, signature)
  } catch (error) {
    console.error('Lemon Squeezy webhook signature verification failed:', error)
    return false
  }
}

function getFirstName(name?: string | null): string | null {
  if (!name) return null
  const firstWord = name.trim().split(/\s+/)[0]
  return firstWord || null
}

/** `public.email_subscribers.source_book_id` is TEXT — allow UUIDs or slugs like `sealed` (migration 001). */
function normalizeSourceBookId(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return null
  }
  const t = value.trim()
  if (!t || t.length > 256) {
    return null
  }
  return t
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature')

  if (!WEBHOOK_SECRET) {
    console.error('Missing Lemon Squeezy webhook secret')
    return NextResponse.json(
      { error: 'Webhook configuration missing' },
      { status: 500 }
    )
  }

  if (!verifySignature(rawBody, signature)) {
    console.warn('Rejected Lemon Squeezy webhook: invalid signature')
    return NextResponse.json(
      { error: 'Invalid webhook signature' },
      { status: 401 }
    )
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch (error) {
    console.warn('Malformed Lemon Squeezy webhook payload', { error })
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  const eventName = payload?.meta?.event_name

  const createdAt = payload?.meta?.created_at as string | undefined
  if (createdAt) {
    const age = Date.now() - new Date(createdAt).getTime()
    if (age > 5 * 60_000 || age < -60_000) {
      console.warn('Rejected stale Lemon Squeezy event', { age: Math.round(age / 1000) })
      return NextResponse.json({ error: 'Event too old' }, { status: 400 })
    }
  }

  if (!eventName || !orderEvents.has(eventName)) {
    return NextResponse.json(
      { success: true, event: eventName, ignored: true },
      { status: 200 }
    )
  }

  const attributes = payload?.data?.attributes ?? {}
  const email = attributes?.user_email
  const userName = attributes?.user_name
  const testMode = Boolean(attributes?.test_mode)

  if (!email) {
    console.warn('Webhook missing user_email', { eventName })
    return NextResponse.json(
      { success: true, event: eventName, ignored: true },
      { status: 200 }
    )
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Supabase credentials missing for Lemon Squeezy webhook')
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    )
  }

  // Same Supabase project as `/api/email/subscribe` — rows must land in `public.email_subscribers`
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const firstName = getFirstName(userName)
  const tags = ['lemonsqueezy', eventName, testMode ? 'test-mode' : 'production']

  const customData = payload?.meta?.custom_data ?? {}
  const sourceBookId = normalizeSourceBookId(
    customData?.source_book_id ?? customData?.book_id ?? null
  )

  const { error } = await supabase
    .from('email_subscribers')
    .upsert(
      {
        email,
        first_name: firstName,
        source_book_id: sourceBookId,
        tags,
        subscribed_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    )

  if (error) {
    console.error('Failed to insert subscriber from Lemon Squeezy webhook', error)
    return NextResponse.json(
      { error: 'Failed to record subscriber' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { success: true, event: eventName },
    { status: 200 }
  )
}
