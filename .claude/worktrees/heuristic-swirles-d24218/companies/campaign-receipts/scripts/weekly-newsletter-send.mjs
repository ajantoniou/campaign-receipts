#!/usr/bin/env node
//
// scripts/weekly-newsletter-send.mjs  —  PHASE 2 of the weekly content engine.
//
// Runs HOURLY (Render cron `0 * * * *`). Each run sends this week's built
// issue to the subset of subscribers whose LOCAL time just hit the Friday
// 05:00 window and who have not yet been sent this issue.
//
// Why hourly-every-day instead of a single Friday cron: subscribers span
// many timezones, so "Friday 05:00 local" sweeps across ~26 hours of UTC
// (UTC-12 .. UTC+14). An hourly cron + a per-user local-time gate + a
// per-(issue,user) send ledger guarantees each subscriber gets exactly one
// send at their own Friday 05:00, with no duplicates and no missed zones.
//
// Recipients: active product='newsletter' subscribers
//   (status='active' OR canceled-with-future current_period_end).
//
// Honest failure: if Phase 1 didn't build an issue for this week, log + skip,
// never error.
//
// Usage:
//   node scripts/weekly-newsletter-send.mjs            # live send
//   node scripts/weekly-newsletter-send.mjs --dry-run  # select recipients + print, NO send, NO ledger write
//   node scripts/weekly-newsletter-send.mjs --dry-run --force-window  # ignore the Friday-05:00 gate (test recipient selection)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY.

import { createClient } from '@supabase/supabase-js'
import { appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = process.env.NEWSLETTER_FROM || 'Campaign Receipts <hello@campaignreceipts.com>'

const DRY = process.argv.includes('--dry-run')
const FORCE_WINDOW = process.argv.includes('--force-window')
const COST_LOG = join(__dirname, '.external-costs.jsonl')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

// ── Time helpers ───────────────────────────────────────────
function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}

// Returns the {weekday, hour} for `now` in the given IANA timezone.
// weekday: 0=Sun..6=Sat. Uses Intl — no external tz library.
function localParts(tz, now = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short', hour: 'numeric', hour12: false,
    })
    const parts = fmt.formatToParts(now)
    const wdStr = parts.find((p) => p.type === 'weekday')?.value
    let hourStr = parts.find((p) => p.type === 'hour')?.value
    const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    let hour = parseInt(hourStr, 10)
    if (hour === 24) hour = 0 // some ICU builds emit "24" for midnight
    return { weekday: wdMap[wdStr], hour }
  } catch {
    return null // invalid tz -> caller falls back
  }
}

// Send window: local Friday (weekday 5), hour === 5 (05:00–05:59 local).
function inFridayWindow(tz, now = new Date()) {
  if (FORCE_WINDOW) return true
  const p = localParts(tz, now) || localParts('America/New_York', now)
  if (!p) return false
  return p.weekday === 5 && p.hour === 5
}

function logCost(note) {
  try {
    appendFileSync(COST_LOG, JSON.stringify({ ts: new Date().toISOString(), issueId: 'weekly-newsletter-send', vendor: 'resend/email', cost_usd: 0, note }) + '\n')
  } catch {}
}

// ── Resend ─────────────────────────────────────────────────
async function sendOne(to, subject, html, text) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Resend ${resp.status}: ${body.slice(0, 200)}`)
  }
  const j = await resp.json().catch(() => ({}))
  return j.id || null
}

// ── MAIN ───────────────────────────────────────────────────
async function main() {
  const now = new Date()
  const weekOf = isoMonday(now)
  console.log(`PHASE 2 — weekly-newsletter-send · ${now.toISOString()} · week of ${weekOf}${DRY ? ' · DRY-RUN' : ''}`)

  // 1. Find this week's built issue. Honest skip if none.
  const { data: issue } = await supabase
    .from('cr_newsletter_issues')
    .select('id, week_of, subject, html, text_body, status')
    .eq('week_of', weekOf)
    .maybeSingle()
  if (!issue) {
    console.log(`No issue built for week ${weekOf}. Nothing to send — skipping cleanly.`)
    return
  }
  if (issue.status === 'skipped') {
    console.log(`Issue ${weekOf} marked skipped. Skipping.`)
    return
  }
  // Not-ready guard: weekly-content-build persists the issue shell (status
  // 'built') BEFORE it mints tracked links and writes the HTML, so there is a
  // brief window where the row exists with no html yet. Never send a blank
  // body — skip this hour and let the hourly retry catch it once html lands.
  // (Today the build runs Thursday and the send gates to Friday 05:00 local,
  // so they don't overlap; this guards manual reruns / slow builds / odd tz.)
  if (!issue.html || issue.html.length < 200) {
    console.log(`Issue ${weekOf} has no html yet (still building). Skipping this hour; will retry.`)
    return
  }

  // 2. Active newsletter subscribers (active OR canceled-with-future period).
  const nowIso = now.toISOString()
  const { data: subs, error: subErr } = await supabase
    .from('cr_subscribers')
    .select('user_id, status, current_period_end, product, cr_users!inner(id, email, timezone)')
    .eq('product', 'newsletter')
  if (subErr) throw new Error(`subscriber query: ${subErr.message}`)

  const active = (subs || []).filter((s) => {
    if (s.status === 'active' || s.status === 'trialing') return true
    if ((s.status === 'canceled' || s.status === 'cancelled') && s.current_period_end && s.current_period_end > nowIso) return true
    return false
  })

  // 3. Already-sent set for this issue (dedupe).
  const { data: sent } = await supabase
    .from('cr_newsletter_sends')
    .select('user_id')
    .eq('issue_id', issue.id)
  const sentSet = new Set((sent || []).map((r) => r.user_id))

  // 4. Recipients: active, unsent, AND currently inside their local Friday 05:00 window.
  const recipients = active.filter((s) => {
    const u = s.cr_users
    if (!u || !u.email) return false
    if (sentSet.has(s.user_id)) return false
    const tz = u.timezone || 'America/New_York'
    return inFridayWindow(tz, now)
  })

  console.log(`Active newsletter subs: ${active.length} · already sent this issue: ${sentSet.size} · in local-Friday-05:00 window now: ${recipients.length}`)

  if (recipients.length === 0) {
    console.log('No recipients in window this hour. (Other timezones get caught on their own hour.) Done.')
    return
  }

  if (DRY) {
    console.log('\n──── DRY-RUN: would send to ────')
    for (const s of recipients.slice(0, 25)) {
      const u = s.cr_users
      const p = localParts(u.timezone || 'America/New_York', now)
      console.log(`  ${u.email}  [tz=${u.timezone || 'America/New_York'} local=${p ? `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][p.weekday]} ${p.hour}:00` : '?'}]`)
    }
    if (recipients.length > 25) console.log(`  ... +${recipients.length - 25} more`)
    console.log(`\nsubject: ${issue.subject}`)
    console.log('(no email sent, no ledger write)')
    return
  }

  if (!RESEND_KEY) throw new Error('RESEND_API_KEY missing')

  // 5. Send + record ledger row per recipient (idempotent via unique constraint).
  let okN = 0, failN = 0
  for (const s of recipients) {
    const u = s.cr_users
    try {
      const resendId = await sendOne(u.email, issue.subject, issue.html, issue.text_body || '')
      const { error: ledgerErr } = await supabase
        .from('cr_newsletter_sends')
        .insert({ issue_id: issue.id, user_id: s.user_id, email: u.email, resend_id: resendId })
      if (ledgerErr && !/duplicate key/i.test(ledgerErr.message)) {
        console.warn(`  [warn] ledger write failed for ${u.email}: ${ledgerErr.message}`)
      }
      okN++
    } catch (e) {
      failN++
      console.warn(`  [fail] ${u.email}: ${e.message}`)
    }
  }
  logCost(`sent ${okN} for issue ${weekOf}`)

  // 6. Mark issue 'sent' once every active sub has a ledger row.
  const { count: totalSent } = await supabase
    .from('cr_newsletter_sends')
    .select('*', { count: 'exact', head: true })
    .eq('issue_id', issue.id)
  if ((totalSent || 0) >= active.length && active.length > 0) {
    await supabase.from('cr_newsletter_issues').update({ status: 'sent', updated_at: now.toISOString() }).eq('id', issue.id)
    console.log('All active subscribers covered — issue marked sent.')
  } else if (issue.status === 'built') {
    await supabase.from('cr_newsletter_issues').update({ status: 'sending', updated_at: now.toISOString() }).eq('id', issue.id)
  }

  console.log(`\n✓ Sent ${okN}, failed ${failN}. (${totalSent || 0}/${active.length} total covered for this issue.)`)
}

main().catch((e) => {
  // Never hard-fail the cron loop on transient errors — log + exit 0 so the
  // next hourly run retries unsent recipients.
  console.error('ERROR (non-fatal, will retry next hour):', e.message)
  process.exit(0)
})
