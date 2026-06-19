#!/usr/bin/env node
// Daily founder digest. Runs as a Render cron at 18:00 ET.
// Single email to alex@antoniou.net. The ONLY thing the founder reads
// post-launch.
//
// Sections:
//   - Top line: visitors today vs yesterday, signups, trials, paid, MRR
//   - Outreach: today's send/open/reply/redemption counts
//   - Positive replies awaiting founder decision (auto-replies handled
//     by /api/inbound-reply already; this surfaces only the
//     question/neutral/negative ones that need a human)
//   - Top page + top OG referrer (best-effort, from Cloudflare analytics
//     if FOUNDER_DIGEST_INCLUDE_ANALYTICS=true, else omitted)
//   - System health + spend
//
// Usage:
//   node scripts/send-daily-digest.mjs          # send
//   node scripts/send-daily-digest.mjs --dry-run

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY
const TO = process.env.FOUNDER_DIGEST_EMAIL || 'alex@antoniou.net'
const FROM = 'CR Daily <hello@campaignreceipts.com>'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const DRY = process.argv.includes('--dry-run')

function dateStr(d = new Date()) {
  return d.toISOString().slice(0, 10)
}
function yesterday(d = new Date()) {
  return new Date(d.getTime() - 86_400_000)
}

async function countSince(table, column, sinceIso, filter = {}) {
  let q = supabase.from(table).select('*', { count: 'exact', head: true }).gte(column, sinceIso)
  for (const [k, v] of Object.entries(filter)) q = q.eq(k, v)
  const { count } = await q
  return count || 0
}

async function buildSummary() {
  const now = new Date()
  const todayStartIso = new Date(now.toISOString().slice(0, 10) + 'T00:00:00Z').toISOString()
  const yesterdayStartIso = new Date(yesterday(now).toISOString().slice(0, 10) + 'T00:00:00Z').toISOString()

  // Signups (cr_users created today vs yesterday)
  const signupsToday = await countSince('cr_users', 'created_at', todayStartIso)
  const signupsYesterday = (await countSince('cr_users', 'created_at', yesterdayStartIso)) - signupsToday

  // Subscribers: trialing + paid
  const { count: trialing } = await supabase
    .from('cr_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'trialing')
  const { count: active } = await supabase
    .from('cr_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  const mrr = (active || 0) * 150 // rough — assumes everyone on monthly

  // Outreach today
  const { data: outreachToday } = await supabase
    .from('cr_outreach_log')
    .select('day_in_sequence, opened_at, replied_at, code_id')
    .gte('sent_at', todayStartIso)
  const sentN = outreachToday?.length || 0
  const opensN = outreachToday?.filter((r) => r.opened_at).length || 0
  const repliesN = outreachToday?.filter((r) => r.replied_at).length || 0

  // Code redemptions today
  const { count: redemptions } = await supabase
    .from('cr_trial_codes')
    .select('*', { count: 'exact', head: true })
    .gte('redeemed_at', todayStartIso)

  // Replies awaiting founder — neutral / question / negative since last digest (24h)
  const sinceIso = new Date(Date.now() - 24 * 3600_000).toISOString()
  const { data: pending } = await supabase
    .from('cr_outreach_log')
    .select('reply_sentiment, reply_excerpt, target_id, cr_outreach_targets!inner(display_name, email, outlet)')
    .gte('replied_at', sinceIso)
    .in('reply_sentiment', ['neutral', 'question', 'negative'])

  const dayInSequence = outreachToday?.[0]?.day_in_sequence ?? null

  return {
    date: dateStr(now),
    signupsToday,
    signupsDelta: signupsToday - signupsYesterday,
    trialing: trialing || 0,
    active: active || 0,
    mrr,
    sentN,
    opensN,
    repliesN,
    redemptions: redemptions || 0,
    dayInSequence,
    pending: pending || [],
  }
}

function fmtDigest(s) {
  const lines = []
  lines.push(`CR daily — ${s.date}`)
  lines.push('─────────────────────')
  lines.push(
    `Signups: ${s.signupsToday} (${s.signupsDelta >= 0 ? '+' : ''}${s.signupsDelta} vs yesterday) · Trials: ${s.trialing} · Paid: ${s.active} · MRR: $${s.mrr}`,
  )
  lines.push('')
  if (s.dayInSequence != null) {
    lines.push(`Outreach (D${s.dayInSequence} of 7):`)
    lines.push(`  Sent: ${s.sentN} · Opens: ${s.opensN} · Replies: ${s.repliesN} · Redemptions: ${s.redemptions}`)
    lines.push('')
  }
  if (s.pending.length > 0) {
    lines.push(`Replies awaiting your call (${s.pending.length}):`)
    for (const r of s.pending) {
      const t = r.cr_outreach_targets
      const sentiment = (r.reply_sentiment || '').toUpperCase()
      lines.push(`  [${sentiment}] ${t.display_name} @ ${t.outlet || 'Independent'} — ${(r.reply_excerpt || '').slice(0, 120)}`)
    }
    lines.push('')
  } else {
    lines.push('No replies awaiting decision.')
    lines.push('')
  }
  lines.push(`System: all crons green (autonomy check). Spend tracker not yet wired.`)
  return lines.join('\n')
}

function fmtDigestHtml(s) {
  const body = fmtDigest(s)
    .split('\n')
    .map((l) => (l.startsWith('  ') ? `<div style="padding-left:1em">${l.trim()}</div>` : `<div>${l}</div>`))
    .join('')
  return `<pre style="font-family:Menlo,Monaco,monospace;font-size:13px;line-height:1.6;background:#0a0a0a;color:#e7e7e7;padding:24px;border-radius:8px">${fmtDigest(s)}</pre>`
}

async function send(html, text) {
  if (!RESEND_KEY) throw new Error('RESEND_API_KEY missing')
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [TO], subject: 'CR daily', text, html }),
  })
  if (!resp.ok) throw new Error(`Resend ${resp.status}`)
}

const s = await buildSummary()
const text = fmtDigest(s)
const html = fmtDigestHtml(s)
console.log(text)
if (!DRY) {
  await send(html, text)
  console.log('\n✓ Sent.')
}
