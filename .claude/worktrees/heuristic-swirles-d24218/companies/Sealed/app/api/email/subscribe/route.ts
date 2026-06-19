import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { maskEmail } from '@/lib/subscriber-log'

const _rl = new Map<string, { c: number; r: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now(); const e = _rl.get(ip)
  if (!e || e.r <= now) { _rl.set(ip, { c: 1, r: now + 900_000 }); return false }
  return ++e.c > 5
}

async function addToMailchimp(
  email: string,
  firstName: string | null,
  sourceBookId: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiKey = process.env.MAILCHIMP_API_KEY
    const listId = process.env.MAILCHIMP_AUDIENCE_ID
    const dcRegion = process.env.MAILCHIMP_DC_REGION || 'us1'

    if (!apiKey || !listId) {
      console.warn('Mailchimp credentials not configured')
      return { success: false, error: 'Mailchimp not configured' }
    }

    const auth = Buffer.from(`anystring:${apiKey}`).toString('base64')

    const payload = {
      email_address: email,
      status: 'pending', // double opt-in
      merge_fields: {
        FNAME: firstName || '',
        SOURCE: sourceBookId || 'sealed',
      },
      tags: sourceBookId ? [sourceBookId, 'new-subscriber'] : ['new-subscriber'],
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
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}) as { title?: string })
      const mcTitle = typeof errorData.title === 'string' ? errorData.title.slice(0, 120) : ''
      console.error(
        `[subscribe][mailchimp] status=${response.status}${mcTitle ? ` title="${mcTitle}"` : ''} email=${maskEmail(email)}`,
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

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: 'Subscriber storage is not configured (missing Supabase env on host).' },
      { status: 503 }
    )
  }

  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
  try {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const firstName = formData.get('first_name') as string | null
    const sourceBookId = formData.get('source_book_id') as string | null

    // Validation
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email' },
        { status: 400 }
      )
    }

    // Insert or update email subscriber in Supabase
    const { data, error } = await supabase
      .from('email_subscribers')
      .upsert({
        email,
        first_name: firstName || null,
        source_book_id: sourceBookId || null,
        tags: [],
      })
      .select()

    if (error) {
      console.error(`[subscribe][supabase] code=${error.code ?? 'unknown'} email=${maskEmail(email)}`)
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      )
    }

    console.info(`[subscribe][supabase] ok email=${maskEmail(email)}`)

    // Sync to Mailchimp (non-blocking; log but don't fail the response)
    const mailchimpResult = await addToMailchimp(email, firstName, sourceBookId)
    if (!mailchimpResult.success) {
      console.warn(`[subscribe][mailchimp] skipped_failed email=${maskEmail(email)} err=${mailchimpResult.error ?? 'unknown'}`)
    }

    // Return success
    return NextResponse.json(
      { message: 'Subscribed successfully', data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Subscribe endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
