// Inbound email reply handler.
// Wired to a Resend "inbound" route (configured in Resend dashboard)
// so that any reply to hello@campaignreceipts.com or
// inbound@campaignreceipts.com posts here.
//
// Flow:
//   1. Match the from-address to a cr_outreach_log row (the latest one
//      for that email).
//   2. Classify sentiment with Haiku (positive / neutral / negative /
//      question / unsubscribe).
//   3. Write replied_at, sentiment, excerpt to the log row.
//   4. For unsubscribe → silently soft-suppress that target.
//   5. For positive without questions → auto-reply with thank-you + deeper-data link.
//   6. For neutral / question / negative → queue to founder daily digest, no autoreply.

import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { sendMail } from '@/lib/mail'

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Sentiment = 'positive' | 'neutral' | 'negative' | 'question' | 'unsubscribe'

async function classifySentiment(text: string): Promise<Sentiment> {
  if (!ANTHROPIC_KEY) return 'neutral'
  const prompt = `Classify this email reply into exactly one of: positive, neutral, negative, question, unsubscribe.

- positive: enthusiastic, wants to engage, says "yes" / "interested" / "this is great"
- neutral: short ack, "thanks", noncommittal
- negative: irritated, says this isn't useful, complains
- question: asks a substantive question that needs a thoughtful reply
- unsubscribe: any request to be removed, "no thanks", "remove me", "stop emailing"

Reply with one word only.

EMAIL:
${text.slice(0, 1500)}`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 8,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!resp.ok) return 'neutral'
    const data = await resp.json()
    const word = String(data?.content?.[0]?.text || '').trim().toLowerCase()
    if (['positive', 'neutral', 'negative', 'question', 'unsubscribe'].includes(word)) return word as Sentiment
    return 'neutral'
  } catch {
    return 'neutral'
  }
}

function autoReplyPositive(firstName: string | null, compCode: string | null) {
  // Auto-responder for positive replies. Cold pitch was paywall-free
  // (per debug-agent critique); the comp code lands HERE, after the
  // journalist has engaged — not in the cold email.
  // Campaign Receipts is free site-wide. The comp code, when present,
  // routes the journalist to faster reply + the data feed — there's no
  // paid product to gate behind it yet (Friday Receipts Pro launches
  // late 2026). Per single-tier-decision-2026-05-26-revised.md.
  const redeemLine = compCode
    ? `\nYour journalist comp code: ${compCode} — reply with it on any data request and you'll jump the queue.\n`
    : ''
  const redeemHtml = compCode
    ? `<p>Your journalist comp code: <code>${compCode}</code> — reply with it on any data request and you'll jump the queue.</p>`
    : ''
  return {
    subject: 'Glad it lands — a few pointers',
    html:
`<p>Hi${firstName ? ' ' + firstName : ''},</p>
<p>Glad this is useful. Two things that might save you time:</p>
<ul>
<li><strong>OG share-images</strong> are baked into every politician page — screenshot-friendly with the campaignreceipts.com watermark.</li>
<li><strong>Custom data pull?</strong> Just reply with the angle and I'll run it. ~24hr turnaround, no charge.</li>
</ul>
${redeemHtml}
<p>— Alex</p>`,
    text: `Glad this is useful.${redeemLine}\nCustom data pull? Reply with the angle and I'll run it.\n\n— Alex`,
  }
}

export async function POST(request: Request) {
  let payload: any
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  // Resend inbound webhook payload shape (per Resend docs):
  //   { from: { email, name? }, to: [...], subject, text, html, ... }
  // We accept both that shape and a generic { email, body } fallback.
  const fromEmail = (
    payload?.from?.email ||
    payload?.from ||
    payload?.email ||
    ''
  )
    .toString()
    .toLowerCase()
    .trim()
  const fromName = payload?.from?.name || null
  const text: string =
    payload?.text ||
    payload?.body ||
    payload?.message ||
    payload?.html?.replace(/<[^>]+>/g, ' ') ||
    ''

  if (!fromEmail || !text) {
    return NextResponse.json({ ok: true, ignored: 'missing from/text' })
  }

  // Find the matching outreach target (any cohort) by email.
  const { data: target } = await supabaseService
    .from('cr_outreach_targets')
    .select('id, display_name')
    .eq('email', fromEmail)
    .maybeSingle()
  if (!target) {
    // Probably a stranger reply to hello@; log and stop.
    console.log(`inbound: no target match for ${fromEmail}`)
    return NextResponse.json({ ok: true, ignored: 'no target' })
  }

  // Find the latest cr_outreach_log row for this target (the email
  // they're replying to). Pull code_id too so we can surface a comp
  // in the auto-reply if sentiment is positive.
  const { data: logRow } = await supabaseService
    .from('cr_outreach_log')
    .select('id, day_in_sequence, code_id')
    .eq('target_id', target.id)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!logRow) {
    return NextResponse.json({ ok: true, ignored: 'no log row' })
  }

  const sentiment = await classifySentiment(text)
  const excerpt = text.slice(0, 500)

  await supabaseService
    .from('cr_outreach_log')
    .update({
      replied_at: new Date().toISOString(),
      reply_sentiment: sentiment,
      reply_excerpt: excerpt,
    })
    .eq('id', logRow.id)

  // Side effects by sentiment
  if (sentiment === 'unsubscribe') {
    // Mark the target as do-not-contact by clearing email — keeps the
    // log row intact for the digest count.
    await supabaseService.from('cr_outreach_targets').update({ email: null }).eq('id', target.id)
  } else if (sentiment === 'positive') {
    const firstName = fromName ? String(fromName).split(/\s+/)[0] : null
    const tmpl = autoReplyPositive(firstName, logRow.code_id)
    await sendMail({ to: fromEmail, ...tmpl, from: 'team' })
  }

  return NextResponse.json({ ok: true, sentiment })
}
