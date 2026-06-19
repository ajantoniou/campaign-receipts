// /api/comp-request — public-facing form submission endpoint.
//
// Replaces the prior mailto:alex@ flow per rev-7 strategy panel:
// "Conversion attribution + faster reply." Captures UTM params from
// cold-email URLs so we can tell which subject line drove conversions.
//
// Inserts into cr_comp_requests + (best-effort) fires a notification
// to the founder via Resend so latency stays low.

import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { allowAndLogSubmission } from '@/lib/form-guard'

export const dynamic = 'force-dynamic'

type RequestBody = {
  // Honeypot — hidden field humans never see; form bots fill it. The
  // client components also short-circuit on it, but direct POSTs skip
  // the client, so the check that matters is the server one below.
  website?: string
  request_type: 'comp_code' | 'pro_waitlist' | 'tip' | 'engine_waitlist' | 'feedback' | 'friday_receipts'
  name: string
  email: string
  outlet?: string
  role?: string
  story_topic?: string
  notes?: string
  engine?: 'bills' | 'donor_to_vote' | 'donor_to_bill' | 'tips_to_verdicts'
  willingness_to_pay?: '45' | '95' | '245' | '350' | '495' | 'free_only'
  // Paid-product price-discovery (journalist database + bill-donor newsletter)
  product?: 'journalist-database' | 'bill-donor-newsletter'
  price_band?: string
  use_case?: string
  feedback_topic?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
}

export async function POST(req: Request) {
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  // Validation
  if (!body.request_type || !['comp_code', 'pro_waitlist', 'tip', 'engine_waitlist', 'feedback', 'friday_receipts'].includes(body.request_type)) {
    return NextResponse.json({ error: 'request_type required' }, { status: 400 })
  }
  // Friday Receipts signup is email-only (no name field). Everything
  // else requires name.
  if (body.request_type !== 'friday_receipts' && (!body.name || body.name.trim().length < 2)) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return NextResponse.json({ error: 'valid email required' }, { status: 400 })
  }

  // Anti-spam: drop disposable email domains. Light-touch — only blocks
  // the most-abused ones; full validation runs in the founder digest.
  const disposable = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com', 'throwaway.email']
  const emailDomain = body.email.split('@')[1].toLowerCase()
  // Every reject branch below returns the BARE success shape ({ ok: true },
  // matching the real success at the bottom) so a probing bot can't tell
  // dropped from accepted.
  if (disposable.includes(emailDomain)) {
    return NextResponse.json({ ok: true })
  }

  // Honeypot + durable hourly caps (this endpoint also emails the founder
  // per submission, so unthrottled abuse floods a human inbox). Caps are
  // keyed per request_type so a journalist clicking "notify me" on several
  // politician pages doesn't burn the budget for a tip submission.
  if (body.website) {
    return NextResponse.json({ ok: true })
  }
  const allowed = await allowAndLogSubmission({
    form: `comp-request:${body.request_type}`,
    email: body.email,
    req,
    maxPerEmailPerHour: 5,
  })
  if (!allowed) {
    return NextResponse.json({ ok: true })
  }

  const ua = req.headers.get('user-agent') || null
  const ref = req.headers.get('referer') || null

  const { error } = await supabaseService
    .from('cr_comp_requests')
    .insert({
      request_type: body.request_type,
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      outlet: body.outlet?.trim() || null,
      role: body.role?.trim() || null,
      story_topic: body.story_topic?.trim() || null,
      notes: body.notes?.trim() || null,
      engine: body.engine || null,
      willingness_to_pay: body.willingness_to_pay || null,
      product: body.product || null,
      price_band: body.price_band?.trim() || null,
      use_case: body.use_case?.trim() || null,
      feedback_topic: body.feedback_topic?.trim() || null,
      utm_source: body.utm_source || null,
      utm_medium: body.utm_medium || null,
      utm_campaign: body.utm_campaign || null,
      utm_content: body.utm_content || null,
      user_agent: ua,
      referrer: ref,
    })

  if (error) {
    console.error('cr_comp_requests insert failed:', error.message)
    return NextResponse.json({ error: 'submission failed; please email alex@campaignreceipts.com directly' }, { status: 500 })
  }

  // Best-effort Resend notification to founder (don't block the user
  // response on email send latency).
  const RESEND_KEY = process.env.RESEND_API_KEY
  if (RESEND_KEY) {
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'CampaignReceipts <alerts@campaignreceipts.com>',
        to: ['antonioualfred+campaignreceipts@gmail.com'],
        subject: `[CR] ${body.request_type}${body.product ? ' · ' + body.product : ''}${body.price_band ? ' · ' + body.price_band : ''} · ${body.name}${body.outlet ? ' · ' + body.outlet : ''}`,
        text: `New ${body.request_type} request:\n\nName: ${body.name}\nEmail: ${body.email}\nOutlet: ${body.outlet || '—'}\nRole: ${body.role || '—'}\nProduct: ${body.product || '—'}\nPrice band: ${body.price_band || '—'}\nTopic: ${body.story_topic || '—'}\nNotes: ${body.notes || '—'}\n\nUTM: ${body.utm_source || '—'} / ${body.utm_medium || '—'} / ${body.utm_campaign || '—'} / ${body.utm_content || '—'}\nReferrer: ${ref || '—'}\nUA: ${ua?.slice(0, 200) || '—'}`,
      }),
    }).catch((e) => console.error('Resend notify failed:', e))
  }

  return NextResponse.json({ ok: true })
}
