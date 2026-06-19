import { NextRequest, NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { allowAndLogSubmission, clientIp } from '@/lib/form-guard'
import { sendMail } from '@/lib/mail'
import {
  buildConfirmationUrl,
  newsletterConfirmationEmail,
  normalizeNewsletterSignup,
} from '@/lib/newsletter-signup'

export const dynamic = 'force-dynamic'

const _rl = new Map<string, { c: number; r: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const e = _rl.get(ip)
  if (!e || e.r <= now) {
    _rl.set(ip, { c: 1, r: now + 900_000 })
    return false
  }
  return ++e.c > 8
}

export async function POST(req: NextRequest) {
  // Rightmost XFF hop via clientIp — the leftmost entry is client-spoofable.
  const ip = clientIp(req) || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 })
  }

  const body = (await req.json().catch(() => null)) as unknown
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const signup = normalizeNewsletterSignup(body)
  if (!signup.ok) {
    return NextResponse.json({ error: signup.error }, { status: 400 })
  }

  // Bot and rate-capped exits claim confirmationSent: true so the response
  // is byte-identical to a real success — a probing bot can't binary-search
  // the cap boundary. The client only renders a generic success state.
  if (signup.value.bot) {
    return NextResponse.json({ ok: true, confirmationSent: true })
  }

  const { email, source, sourceSlug } = signup.value

  // Durable caps (3/email/hr, 10/IP/hr in cr_form_submissions) on top of
  // the in-memory limiter above, which resets on deploy and is per instance.
  const allowed = await allowAndLogSubmission({ form: 'newsletter', email, req })
  if (!allowed) {
    return NextResponse.json({ ok: true, confirmationSent: true })
  }
  const { error } = await supabaseService
    .from('cr_free_subscribers')
    .upsert(
      {
        email,
        source,
        source_slug: sourceSlug,
        consent_marketing: true,
        unsubscribed_at: null,
      },
      { onConflict: 'email' },
    )

  if (error) {
    console.error('cr_free_subscribers upsert failed:', error.message)
    return NextResponse.json({ error: 'signup failed' }, { status: 500 })
  }

  const secret = process.env.NEWSLETTER_CONFIRM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'
  let confirmationSent = false

  if (secret) {
    const confirmUrl = buildConfirmationUrl({ email, baseUrl: site, secret, source })
    const mail = newsletterConfirmationEmail(confirmUrl)
    const sent = await sendMail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      from: 'team',
      tags: [
        { name: 'category', value: 'newsletter-confirmation' },
        { name: 'source', value: source },
      ],
    })
    confirmationSent = sent.ok
    if (!sent.ok) {
      console.error('newsletter confirmation send failed:', sent.error)
    }
  }

  return NextResponse.json({ ok: true, confirmationSent })
}
