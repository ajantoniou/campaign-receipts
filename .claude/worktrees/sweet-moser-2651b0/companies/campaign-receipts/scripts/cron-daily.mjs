#!/usr/bin/env node
//
// scripts/cron-daily.mjs
//
// Single Render cron entry-point. Per founder rule (2026-05-19):
// "if one cron worker can do multiple jobs, always prefer using less
// than more." This script dispatches all CR background work — daily
// jobs run every day; weekly jobs gated to Monday; FEC backfill gated
// to Monday + a chunked --limit so it stays under Render's job timeout.
//
// Schedule on Render: 0 13 * * * (daily 9am ET).
//
// Jobs run, every day:
//   - snapshot-homepage-pulse.mjs   — refresh live-activity ticker
//   - snapshot-weekly.mjs           — receipt-of-week pick (idempotent
//                                     by week_ending, so daily re-runs
//                                     within the same ISO week are no-ops)
//   - snapshot-leaderboard-history  — snapshot today's leaderboard
//                                     ranks; ↑↓ deltas use the most-
//                                     recent prior week
//   - refresh-video-companion       — upsert kind='video_companion'
//                                     article rows so every published
//                                     YouTube long-form has a live
//                                     companion page (idempotent)
//   - purge-expired-auth            — delete expired cr_sessions + spent
//                                     cr_magic_links rows (hygiene; expired
//                                     tokens already grant no access)
//
// Jobs run, Monday only (day-of-week === 1):
//   - fec-sync.mjs --limit=400      — backfill 311 unmined politicians
//
// Each step is wrapped in a try/catch so one failure doesn't kill the
// rest. Non-zero exit code only on hard env-config errors.

import { spawnSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const isMonday = new Date().getUTCDay() === 1
const startedAt = new Date()

// ── Race auto-archival (added 2026-05-20) ────────────────────
// Any race whose primary_date is more than 24h in the past gets
// flipped to is_active=false so the ActiveRacesStrip homepage
// component stops surfacing it. We add a one-line result_summary
// placeholder so the row isn't blank; the founder fills in verified
// outcome reporting later. Idempotent — re-runs are no-ops on rows
// already inactive.
async function archivePastRaces() {
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supaUrl || !supaKey) {
    console.warn('  (archive-past-races skipped — supabase env missing)')
    return false
  }
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } })
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  today.setUTCDate(today.getUTCDate() - 1)
  const cutoff = today.toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('cr_races')
    .update({
      is_active: false,
      result_summary:
        'Race date passed. Result summary pending editorial verification.',
      updated_at: new Date().toISOString(),
    })
    .eq('is_active', true)
    .lt('primary_date', cutoff)
    .select('slug')
  if (error) {
    console.error('  ! archive-past-races failed:', error.message)
    return false
  }
  console.log(`  archived ${data?.length || 0} past races`)
  return true
}

// ── Expired-auth cleanup (added 2026-06-02, security audit) ──
// getSessionUser() already rejects (and now deletes) an expired cr_sessions
// row at read time, so this is hygiene, not a live security hole: it stops
// the table growing unbounded with dead rows. Same treatment for spent magic
// links (consumed, or past their 30-min window). Pure deletes, idempotent.
async function purgeExpiredAuth() {
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supaUrl || !supaKey) {
    console.warn('  (purge-expired-auth skipped — supabase env missing)')
    return false
  }
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } })
  const now = new Date().toISOString()
  let ok = true

  const { data: sessions, error: sErr } = await supabase
    .from('cr_sessions')
    .delete()
    .lt('expires_at', now)
    .select('token')
  if (sErr) {
    console.error('  ! purge cr_sessions failed:', sErr.message)
    ok = false
  } else {
    console.log(`  deleted ${sessions?.length || 0} expired sessions`)
  }

  // Spent magic links: either already consumed, or past their expiry window.
  const { data: links, error: lErr } = await supabase
    .from('cr_magic_links')
    .delete()
    .or(`consumed_at.not.is.null,expires_at.lt.${now}`)
    .select('token')
  if (lErr) {
    console.error('  ! purge cr_magic_links failed:', lErr.message)
    ok = false
  } else {
    console.log(`  deleted ${links?.length || 0} spent magic links`)
  }

  return ok
}

function runStep(name, args) {
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 60 - name.length))}`)
  const result = spawnSync('node', args, { stdio: 'inherit', cwd: process.cwd() })
  if (result.status !== 0) {
    console.error(`! ${name} failed with exit code ${result.status}`)
    return false
  }
  return true
}

// ── Video-companion article refresh (added 2026-05-29) ────────
// Keeps the kind='video_companion' rows in cr_articles current so
// every published CR/SEALED YouTube long-form has a Google-indexable
// companion page (per the video-companion-landing-page doctrine).
// The backfill script upserts on slug, so daily re-runs are no-ops
// for unchanged rows and self-heal any drifted copy. Runs via
// python3 (present on Render's node image). If python3 is missing,
// the step is reported as skipped rather than failing the whole cron.
function runCompanionArticleRefresh() {
  const name = 'refresh-video-companion-articles'
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 60 - name.length))}`)
  const probe = spawnSync('python3', ['--version'], { stdio: 'ignore' })
  if (probe.status !== 0) {
    console.warn('  (skipped — python3 not available on this runtime)')
    return true // non-fatal: don't fail the daily cron over a missing interpreter
  }
  const result = spawnSync(
    'python3',
    ['scripts/backfill-video-companion-articles.py'],
    { stdio: 'inherit', cwd: process.cwd(), env: process.env },
  )
  if (result.status !== 0) {
    console.error(`! ${name} failed with exit code ${result.status}`)
    return false
  }
  return true
}

const results = {}

// Daily jobs ───────────────────────────────────────────────
console.log(`\n── archive-past-races ${'─'.repeat(45)}`)
results.archive = await archivePastRaces()

// Populate active races from live FEC data (verified candidates + real
// Schedule-E IE). Runs after archival so a race that just flipped
// inactive isn't re-populated. Idempotent (upsert on slug + fec_auto
// guard never clobbers hand-curated rows).
results.races = runStep('populate-active-races', ['scripts/populate-active-races.mjs'])

// Recompute the source aggregates the leaderboard + bill pages read.
// The leaderboard reads live tables, so a daily recompute keeps both
// the vote board (cr_donor_vote_alignment) and "who paid the sponsors"
// (cr_bill_money_trail coalition trail) current as roll-call + bill
// data refreshes. Both scripts are idempotent.
results.alignment = runStep('compute-alignment', ['scripts/compute-alignment.mjs'])
results.billMoney = runStep('compute-bill-money-trail', ['scripts/compute-bill-money-trail.mjs'])

results.pulse = runStep('snapshot-homepage-pulse', ['scripts/snapshot-homepage-pulse.mjs'])
results.weekly = runStep('snapshot-weekly', ['scripts/snapshot-weekly.mjs'])
results.leaderboard = runStep('snapshot-leaderboard-history', ['scripts/snapshot-leaderboard-history.mjs'])
results.companion = runCompanionArticleRefresh()

console.log(`\n── purge-expired-auth ${'─'.repeat(45)}`)
results.purgeAuth = await purgeExpiredAuth()

// Monday-only ───────────────────────────────────────────────
if (isMonday) {
  results.fec = runStep('fec-sync (Monday backfill)', ['scripts/fec-sync.mjs', '--limit=400'])
} else {
  console.log(`\n── fec-sync skipped (not Monday; today UTC weekday=${new Date().getUTCDay()})`)
}

// Summary ───────────────────────────────────────────────────
const elapsed = Math.round((Date.now() - startedAt.getTime()) / 1000)
console.log(`\n── summary ────────────────────────────────────────────────`)
console.log(`elapsed=${elapsed}s isMonday=${isMonday}`)
for (const [k, v] of Object.entries(results)) {
  console.log(`  ${v ? '✓' : '✗'} ${k}`)
}
const anyFailed = Object.values(results).some((v) => !v)
process.exit(anyFailed ? 1 : 0)
