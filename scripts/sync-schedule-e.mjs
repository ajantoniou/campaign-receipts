#!/usr/bin/env node
//
// scripts/sync-schedule-e.mjs  —  Phase 3: live independent-expenditure feed.
//
// Pulls openFEC Schedule E (independent expenditures — outside money spent FOR or
// AGAINST a candidate) incrementally and writes cr_schedule_e. IEs ≥$10k carry
// 48-hour / 24-hour reporting deadlines, so this is the freshest "outside money
// dropped this week" signal — the kind of thing Friday Receipts should catch live
// ("a super PAC just spent $2M opposing X").
//
// INCREMENTAL via cr_ingest_runs cursor: keyed on min_load_date (when FEC ingested
// the filing) so each hourly run only pulls newly-disclosed rows. Resumable: the
// cursor is the resume point; a crash loses at most one window.
//
// Idempotent: upsert on sub_id. Safe to re-run / overlap windows.
//
// Usage:
//   node scripts/sync-schedule-e.mjs [--dry-run] [--cycle=2026] [--since=YYYY-MM-DD] [--max-pages=N]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FEC_KEY = process.env.FEC_API_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
if (!FEC_KEY) { console.error('Missing FEC_API_KEY'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const CYCLE = Number(args.find((a) => a.startsWith('--cycle='))?.split('=')[1] ?? 2026)
const sinceArg = args.find((a) => a.startsWith('--since='))?.split('=')[1]
const MAX_PAGES = Number(args.find((a) => a.startsWith('--max-pages='))?.split('=')[1] ?? 10)
const JOB = `schedule-e-${CYCLE}`
const BASE = 'https://api.open.fec.gov/v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fecGet(params) {
  const qs = new URLSearchParams({ api_key: FEC_KEY, ...params })
  const url = `${BASE}/schedules/schedule_e/?${qs}`
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { accept: 'application/json' } })
    if (r.status === 429) { await sleep(65000); continue }
    if (!r.ok) throw new Error(`FEC ${r.status}: ${(await r.text()).slice(0, 120)}`)
    return r.json()
  }
  throw new Error('FEC: rate-limited')
}

async function getCursor() {
  if (sinceArg) return sinceArg
  const { data } = await supabase.from('cr_ingest_runs').select('cursor').eq('job', JOB).maybeSingle()
  // default: last 7 days if no cursor yet
  return data?.cursor || new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10)
}

async function main() {
  const since = await getCursor()
  console.log(`[${new Date().toISOString()}] Schedule E ${CYCLE} since load_date ${since}${DRY ? ' (DRY RUN)' : ''}`)

  let lastIndex = null, lastDate = null, pages = 0, total = 0, maxLoad = since
  do {
    const params = {
      cycle: String(CYCLE), per_page: '100', sort: '-expenditure_date',
      min_load_date: since,
    }
    if (lastIndex) { params.last_index = lastIndex; params.last_expenditure_date = lastDate }
    const d = await fecGet(params)
    await sleep(600)
    const results = d.results || []
    if (!results.length) break
    pages++

    const rows = results.map((r) => ({
      sub_id: String(r.sub_id),
      spender_committee_id: r.committee_id || null,
      spender_name: r.committee?.name || null,
      candidate_id: r.candidate_id || null,
      candidate_name: r.candidate_name || null,
      support_oppose: r.support_oppose_indicator || null,
      amount: Number(r.expenditure_amount || 0),
      expenditure_date: r.expenditure_date ? r.expenditure_date.slice(0, 10) : null,
      dissemination_date: r.dissemination_date ? r.dissemination_date.slice(0, 10) : null,
      cycle: CYCLE,
      load_date: r.load_date ? r.load_date.slice(0, 10) : null,
      updated_at: new Date().toISOString(),
    })).filter((r) => r.sub_id && r.amount)
    for (const r of rows) if (r.load_date && r.load_date > maxLoad) maxLoad = r.load_date

    if (DRY) {
      if (pages === 1) for (const r of rows.slice(0, 5)) console.log(`  ${r.support_oppose} $${r.amount.toLocaleString()} → ${r.candidate_name || r.candidate_id} by ${r.spender_name || r.spender_committee_id}`)
    } else {
      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase.from('cr_schedule_e').upsert(rows.slice(i, i + 200), { onConflict: 'sub_id' })
        if (error) console.error('  upsert:', error.message)
      }
    }
    total += rows.length
    const pg = d.pagination?.last_indexes
    lastIndex = pg?.last_index || null
    lastDate = pg?.last_expenditure_date || null
  } while (lastIndex && pages < MAX_PAGES)

  console.log(`Pages ${pages}, rows ${total}${DRY ? ' (dry)' : ' upserted'}. New cursor load_date: ${maxLoad}`)
  if (!DRY) {
    await supabase.from('cr_ingest_runs').upsert(
      { job: JOB, cursor: maxLoad, last_run_at: new Date().toISOString(), last_status: 'ok', rows_last_run: total, updated_at: new Date().toISOString() },
      { onConflict: 'job' })
  }
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
