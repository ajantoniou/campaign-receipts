// /api/email/subscribe — CR-side email capture for the /2024-trump-campaign-promises
// landing page. Mirrors the SEALED-side endpoint pattern but does not depend on a
// CR-side `email_subscribers` table (CR auth uses cr_users / cr_subscribers for
// paid Stripe access; the marketing list lives in Mailchimp, shared across the
// portfolio).
//
// Submits to the SAME Mailchimp audience the SEALED notify-form uses so the
// 2024-archive-landing source-tag routes into both nurture flows (CR follow-on +
// SEALED book sales). No double opt-in confirmation email duplication concern —
// Mailchimp handles that.

import { NextRequest, NextResponse } from 'next/server'

const _rl = new Map<string, { c: number; r: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const e = _rl.get(ip)
  if (!e || e.r <= now) {
    _rl.set(ip, { c: 1, r: now + 900_000 })
    return false
  }
  return ++e.c > 5
}

function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!user || !domain) return 'invalid'
  return `${user.slice(0, 2)}***@${domain}`
}

async function addToMailchimp(
  email: string,
  firstName: string | null,
  sourceBookId: string | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.MAILCHIMP_API_KEY
    const listId = process.env.MAILCHIMP_AUDIENCE_ID
    const dcRegion = process.env.MAILCHIMP_DC_REGION || 'us1'

    if (!apiKey || !listId) {
      console.warn('[subscribe][mailchimp] credentials not configured')
      return { success: false, error: 'Mailchimp not configured' }
    }

    const auth = Buffer.from(`anystring:${apiKey}`).toString('base64')
    const payload = {
      email_address: email,
      status: 'pending', // double opt-in
      merge_fields: {
        FNAME: firstName || '',
        SOURCE: sourceBookId || 'campaign-receipts',
      },
      tags: sourceBookId
        ? [sourceBookId, 'new-subscriber', 'campaign-receipts']
        : ['new-subscriber', 'campaign-receipts'],
    }

    const response = await fetch(
      `https://${dcRegion}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { title?: string }
      const mcTitle = typeof errorData.title === 'string' ? errorData.title.slice(0, 120) : ''
      console.error(
        `[subscribe][mailchimp] status=${response.status}${
          mcTitle ? ` title="${mcTitle}"` : ''
        } email=${maskEmail(email)}`,
      )
      return { success: false, error: `Mailchimp error: ${response.status}` }
    }

    console.info(`[subscribe][mailchimp] ok email=${maskEmail(email)}`)
    return { success: true }
  } catch (error) {
    console.error('[subscribe][mailchimp]', String(error))
    return { success: false, error: String(error) }
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    let email: string | null = null
    let firstName: string | null = null
    let sourceBookId: string | null = null

    const ct = request.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = (await request.json().catch(() => ({}))) as {
        email?: string
        first_name?: string
        source_book_id?: string
      }
      email = body.email ?? null
      firstName = body.first_name ?? null
      sourceBookId = body.source_book_id ?? null
    } else {
      const formData = await request.formData()
      email = (formData.get('email') as string) || null
      firstName = (formData.get('first_name') as string) || null
      sourceBookId = (formData.get('source_book_id') as string) || null
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const result = await addToMailchimp(email, firstName, sourceBookId)
    if (!result.success) {
      // Don't fail the user-facing flow — the email may already be subscribed
      // (common case). Mailchimp returns 400 with title 'Member Exists' which
      // we log but treat as a soft success at the UI layer.
      return NextResponse.json(
        { message: 'Already subscribed or pending confirmation' },
        { status: 200 },
      )
    }

    return NextResponse.json({ message: 'Subscribed successfully' }, { status: 200 })
  } catch (error) {
    console.error('[subscribe] endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
