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

const isOrchestrator = process.argv.includes('--orchestrate')
const now = new Date()
const hour = now.getUTCHours()
const day = now.getUTCDay()
const date = now.getUTCDate()
const isMonday = day === 1

// Helper to run external scripts
function runStep(name, args) {
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 60 - name.length))}`)
  const result = spawnSync('node', args, { stdio: 'inherit', cwd: process.cwd() })
  if (result.status !== 0) {
    console.error(`! ${name} failed with exit code ${result.status}`)
    return false
  }
  return true
}

// ── DB Maintenance ──
async function archivePastRaces() {
  console.log(`\n── archive-past-races ${'─'.repeat(45)}`)
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supaUrl || !supaKey) return false
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } })
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  today.setUTCDate(today.getUTCDate() - 1)
  const { data, error } = await supabase.from('cr_races')
    .update({ is_active: false, result_summary: 'Race ended.', updated_at: new Date().toISOString() })
    .eq('is_active', true).lt('primary_date', today.toISOString().slice(0, 10)).select('slug')
  console.log(`  archived ${data?.length || 0} past races`)
  return !error
}

async function purgeExpiredAuth() {
  console.log(`\n── purge-expired-auth ${'─'.repeat(45)}`)
  const supaUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supaUrl || !supaKey) return false
  const supabase = createClient(supaUrl, supaKey, { auth: { persistSession: false } })
  const n = new Date().toISOString()
  const { data: s } = await supabase.from('cr_sessions').delete().lt('expires_at', n).select('token')
  const { data: l } = await supabase.from('cr_magic_links').delete().or(`consumed_at.not.is.null,expires_at.lt.${n}`).select('token')
  console.log(`  deleted ${s?.length || 0} sessions, ${l?.length || 0} magic links`)
  return true
}

// ── Execution Logic ──
const results = {}

// Hourly jobs
results.newsletterSend = runStep('weekly-newsletter-send', ['scripts/weekly-newsletter-send.mjs'])
results.syncMarkets = runStep('sync-markets', ['scripts/sync-markets.mjs'])
results.syncPolymarket = runStep('sync-polymarket', ['scripts/sync-polymarket.mjs'])
results.marketAlertNotify = runStep('market-alert-notify', ['scripts/market-alert-notify.mjs'])
results.updateAlpha = runStep('update-alpha', ['scripts/cron-update-alpha.mjs'])
results.marketAlerts = runStep('market-alerts', ['scripts/cron-market-alerts.mjs'])

if (isOrchestrator) {
  console.log(`\n=== Running Master Orchestrator (UTC Day: ${day}, Hour: ${hour}) ===`)

  // 04:00 UTC Sunday
  if (day === 0 && hour === 4) results.fecWeekly = runStep('fec-sync-weekly', ['scripts/fec-sync.mjs', '--all-federal', '--cycle=2024'])
  // 06:00 UTC Monday
  if (day === 1 && hour === 6) results.billsWeekly = runStep('seed-bills', ['scripts/seed-bills.mjs', '--congress=119'])
  // 08:00 UTC Daily (Compute Nightly)
  if (hour === 8) {
    results.alignment = runStep('compute-alignment', ['scripts/compute-alignment.mjs'])
    results.billMoney = runStep('compute-bill-money-trail', ['scripts/compute-bill-money-trail.mjs'])
  }

  // 13:00 UTC (9am ET)
  if (hour === 13) {
    results.archive = await archivePastRaces()
    results.races = runStep('populate-active-races', ['scripts/populate-active-races.mjs'])
    results.purgeAuth = await purgeExpiredAuth()
  }

  // 22:00 UTC Thursday (Weekly content generation)
  if (hour === 22 && day === 4) {
    results.contentBuild = runStep('weekly-content-build', ['scripts/weekly-content-build.mjs'])
  }
} else {
  // Manual trigger via npm script or console (runs the daily 13:00 payload)
  results.archive = await archivePastRaces()
  results.races = runStep('populate-active-races', ['scripts/populate-active-races.mjs'])
  results.alignment = runStep('compute-alignment', ['scripts/compute-alignment.mjs'])
  results.billMoney = runStep('compute-bill-money-trail', ['scripts/compute-bill-money-trail.mjs'])
  results.purgeAuth = await purgeExpiredAuth()
}

// Summary
const anyFailed = Object.values(results).some((v) => !v)
for (const [k, v] of Object.entries(results)) console.log(`  ${v ? '✓' : '✗'} ${k}`)
process.exit(anyFailed ? 1 : 0)
