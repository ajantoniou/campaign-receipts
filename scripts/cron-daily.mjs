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

// Orchestrate by DEFAULT. The whole pipeline is day/hour-gated and only fires in
// the orchestrator branch, so a deployed start command that forgets --orchestrate
// would silently disable Friday Receipts (which is exactly what happened on Render).
// Make it the default; require an explicit --manual to run the old one-shot path.
const isOrchestrator = !process.argv.includes('--manual')
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

// ── Trigger the Docker video render worker (separate service with ffmpeg/rsvg) ──
// The worker is SUSPENDED between runs (scale-to-zero, ~$0 idle). We RESUME it via the
// Render API, wait for /health, then POST. After it finishes it stays up briefly; a
// separate weekly suspend (Fri) puts it back to sleep — or leave it (it idles cheap on
// starter). Resume needs RENDER_API_KEY + VIDEO_WORKER_SERVICE_ID in the cron env.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function resumeVideoWorker() {
  const key = process.env.RENDER_API_KEY
  const svc = process.env.VIDEO_WORKER_SERVICE_ID
  if (!key || !svc) { console.log('  (no RENDER_API_KEY/VIDEO_WORKER_SERVICE_ID — assuming worker already up)'); return }
  try {
    await fetch(`https://api.render.com/v1/services/${svc}/resume`, { method: 'POST', headers: { Authorization: `Bearer ${key}` } })
    console.log('  resume requested — waiting for /health…')
  } catch (e) { console.error(`  resume call failed: ${e.message}`) }
}
async function waitForHealth(url, maxMs = 180000) {
  const started = Date.now()
  while (Date.now() - started < maxMs) {
    try { const r = await fetch(`${url.replace(/\/$/, '')}/health`, { signal: AbortSignal.timeout(8000) }); if (r.ok) return true } catch { /* not up yet */ }
    await sleep(10000)
  }
  return false
}
async function triggerVideoWorker() {
  const url = process.env.VIDEO_WORKER_URL
  const token = process.env.VIDEO_WORKER_TOKEN
  if (!url || !token) { console.log('video worker: VIDEO_WORKER_URL/TOKEN not set — skipping video trigger'); return false }
  console.log(`\n── trigger video worker ${'─'.repeat(40)}`)
  await resumeVideoWorker()
  const healthy = await waitForHealth(url)
  if (!healthy) { console.error('! video worker did not become healthy in time — skipping'); return false }
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/produce-weekly`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cr-token': token }, body: '{}',
    })
    console.log(`video worker responded ${r.status}: ${(await r.text()).slice(0, 200)}`)
    return r.ok
  } catch (e) { console.error(`! video worker trigger failed: ${e.message}`); return false }
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
// Schedule E (independent expenditures) — pull newly-disclosed outside money every
// hour via the cr_ingest_runs cursor, so the 48/24hr IE notices land same-day and
// "a super PAC just dropped $X" is genuinely live for the weekly story detection.
results.scheduleE = runStep('sync-schedule-e', ['scripts/sync-schedule-e.mjs'])

if (isOrchestrator) {
  console.log(`\n=== Running Master Orchestrator (UTC Day: ${day}, Hour: ${hour}) ===`)

  // 04:00 UTC Sunday
  if (day === 0 && hour === 4) results.fecWeekly = runStep('fec-sync-weekly', ['scripts/fec-sync.mjs', '--all-federal', '--cycle=2024'])
  // 06:00 UTC Monday
  if (day === 1 && hour === 6) results.billsWeekly = runStep('seed-bills', ['scripts/seed-bills.mjs', '--congress=119'])
  // 07:00 UTC Monday — bill→committee referral (new bills) + recent Senate votes,
  // so the gatekeeper chain + the Senate side of "the record" stay current.
  if (day === 1 && hour === 7) {
    results.billCommittees = runStep('sync-bill-committees', ['scripts/sync-bill-committees.mjs', '--limit=200'])
    results.senateVotes = runStep('sync-senate-rollcalls', ['scripts/sync-senate-rollcalls.mjs', '--recent=40'])
    // Bill-effect classifier (what each bill does + who benefits) — needs bills synced
    // above; feeds the exposé match in detect-new-connections.
    results.billEffect = runStep('classify-bill-effect', ['scripts/classify-bill-effect.mjs'])
  }

  // 08:00 UTC Daily (Compute Nightly)
  if (hour === 8) {
    results.alignment = runStep('compute-alignment', ['scripts/compute-alignment.mjs'])
    results.billMoney = runStep('compute-bill-money-trail', ['scripts/compute-bill-money-trail.mjs'])
    // A′: journal the freshly-computed money state into the append-only ledger so
    // detection can find "what's new this week" (live FEC tables overwrite).
    results.journalEvents = runStep('record-finance-events', ['scripts/record-finance-events.mjs'])
  }

  // 06:00 UTC Sunday — rebuild the FEC money graph (bulk pas2) + classify new
  // committee industries. Weekly is plenty (FEC bulk refreshes weekly).
  if (day === 0 && hour === 6) {
    results.moneyGraph = runStep('fec-bulk-money-graph', ['scripts/fec-bulk-money-graph.mjs', '--cycles=2024,2026'])
    results.classifyIndustry = runStep('classify-committee-industry', ['scripts/classify-committee-industry.mjs'])
    results.committees = runStep('sync-congress-committees', ['scripts/sync-congress-committees.mjs'])
    // Exposé-engine inputs: committee→industry jurisdiction map + named-donor→industry tags.
    results.committeeJurisdiction = runStep('sync-committee-jurisdiction', ['scripts/sync-committee-jurisdiction.mjs'])
    results.donorIndustry = runStep('classify-donor-industry', ['scripts/classify-donor-industry.mjs'])
    // Pro-Israel money tracker: refresh the pro-Israel committees' full Schedule E
    // (support+oppose) then recompute the per-politician summary.
    const PRO_ISRAEL = 'C00799031,C00797670,C00710848,C00127811,C00441949'
    results.proIsraelSE24 = runStep('schedule-e-proisrael-2024', ['scripts/sync-schedule-e.mjs', '--cycle=2024', `--committees=${PRO_ISRAEL}`, '--max-pages=20'])
    results.proIsraelSE26 = runStep('schedule-e-proisrael-2026', ['scripts/sync-schedule-e.mjs', '--cycle=2026', `--committees=${PRO_ISRAEL}`, '--max-pages=20'])
    results.proIsraelCompute = runStep('compute-pro-israel-money', ['scripts/compute-pro-israel-money.mjs'])
  }

  // ── AI INVESTIGATIVE JOURNALIST — daily pass (founder 2026-07-02: 47,000 filings/wk
  //    is too many stories for one weekly pass). Mon/Tue/Wed/Fri/Sat/Sun 10:00: find the
  //    single deepest fresh MATERIAL story (≥$100K guardrail, cross-week + same-week
  //    dedup) and publish it. Slug-idempotent; Thursday's weekly pass tops the slate to
  //    8 and bundles everything into Friday Receipts. Rulebook:
  //    eng/AI-INVESTIGATIVE-JOURNALIST.md. Disable with CR_DAILY_STORY=off.
  if (day !== 4 && hour === 10 && process.env.CR_DAILY_STORY !== 'off') {
    results.dailyDetect = runStep('detect-daily-story', ['scripts/detect-new-connections.mjs', '--daily'])
    results.dailyStory = runStep('generate-daily-story', ['scripts/generate-weekly-stories.mjs'])
  }

  // ── Friday Receipts chain (Thursday UTC, finishing before the earliest
  //    local-Friday-05:00 send at Thu 15:00 UTC for UTC+14). ──
  // 10:00 Thu — detect new money connections, rank, write story candidates.
  if (day === 4 && hour === 10) results.detect = runStep('detect-new-connections', ['scripts/detect-new-connections.mjs'])
  // 11:00 Thu — generate the 6 branch articles with Opus, then attach any related
  //   live Kalshi market to each story (content only; renders only on real match).
  if (day === 4 && hour === 11) {
    results.stories = runStep('generate-weekly-stories', ['scripts/generate-weekly-stories.mjs'])
    results.kalshiMatch = runStep('match-kalshi-markets', ['scripts/match-kalshi-markets.mjs'])
  }
  // 12:00 Thu — first make the ~5-min audio briefing (TTS) and record its public URL
  //   on the issue, THEN build the issue HTML so it can embed the "Listen" link.
  //   (Audio requires python3 + ELEVENLABS_API_KEY on the worker; build runs even if
  //   audio fails — the issue just ships without an audio link.)
  if (day === 4 && hour === 12) {
    results.audioBriefing = runStep('build-audio-briefing', ['scripts/build-audio-briefing.mjs'])
    results.newsletterBuild = runStep('weekly-newsletter-build', ['scripts/weekly-newsletter-build.mjs'])
  }

  // 14:00 Thu — trigger the YouTube video machine on the Docker render worker.
  //   The cron (node runtime) has no ffmpeg/rsvg; the worker does the render +
  //   upload (long-form + 2 shorts, PUBLIC, every description driving the $9
  //   newsletter). Fire-and-log; no-op if the worker URL/token aren't configured.
  if (day === 4 && hour === 14) results.videoTrigger = await triggerVideoWorker()

  // 13:00 UTC Saturday — viral digest: email founder the most-clicked title.
  if (day === 6 && hour === 13) results.viralDigest = runStep('weekly-viral-digest', ['scripts/weekly-viral-digest.mjs'])

  // 13:00 UTC (9am ET)
  if (hour === 13) {
    results.archive = await archivePastRaces()
    results.races = runStep('populate-active-races', ['scripts/populate-active-races.mjs'])
    results.purgeAuth = await purgeExpiredAuth()
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
