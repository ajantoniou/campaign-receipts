#!/usr/bin/env node
//
// scripts/snapshot-leaderboard-history.mjs
//
// Weekly populator for cr_leaderboard_history. Runs every Monday
// alongside snapshot-weekly.mjs. Without this, the ↑↓ movement
// indicators on the TrendingReceiptsStrip and leaderboards would be
// faked — and faking deltas would torpedo the credibility moat per
// the panel.
//
// Snapshots four buckets: most_kept, most_broken, most_shock_score,
// foreign_funded.
//
// Usage:
//   node scripts/snapshot-leaderboard-history.mjs [--week-ending=YYYY-MM-DD] [--dry-run]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-ending='))?.split('=')[1]

function thisWeekEnding() {
  const d = new Date()
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - ((day + 7) % 7))
  return d.toISOString().slice(0, 10)
}

const WEEK_ENDING = weekArg || thisWeekEnding()

// ── Buckets ───────────────────────────────────────────────

async function buildMostKept() {
  const { data } = await supabase
    .from('cr_politicians')
    .select('id, scorecard_percentage_kept, scorecard_graded_total')
    .gte('scorecard_graded_total', 8)
    .order('scorecard_percentage_kept', { ascending: false, nullsFirst: false })
    .limit(20)
  return (data || []).map((r, i) => ({
    bucket: 'most_kept',
    politician_id: r.id,
    rank: i + 1,
    value: Number(r.scorecard_percentage_kept || 0),
  }))
}

async function buildMostBroken() {
  const { data } = await supabase
    .from('cr_politicians')
    .select('id, scorecard_percentage_kept, scorecard_graded_total')
    .gte('scorecard_graded_total', 8)
    .order('scorecard_percentage_kept', { ascending: true, nullsFirst: false })
    .limit(20)
  return (data || []).map((r, i) => ({
    bucket: 'most_broken',
    politician_id: r.id,
    rank: i + 1,
    value: Number(r.scorecard_percentage_kept || 0),
  }))
}

async function buildMostShockScore() {
  // Reads the current week's snapshot output.
  const { data } = await supabase
    .from('cr_weekly_snapshot')
    .select('politician_id, shock_score')
    .eq('week_ending', WEEK_ENDING)
    .order('shock_score', { ascending: false })
    .limit(20)
  return (data || []).map((r, i) => ({
    bucket: 'most_shock_score',
    politician_id: r.politician_id,
    rank: i + 1,
    value: Number(r.shock_score || 0),
  }))
}

// foreign_funded would require a per-politician aggregation of
// cr_foreign_donor_records; cr_foreign_donor_records is currently
// indexed by recipient_name string, not politician_id. Defer.

async function main() {
  console.log(`# CR leaderboard history · week_ending=${WEEK_ENDING}${DRY ? ' (DRY RUN)' : ''}`)

  const [kept, broken, shock] = await Promise.all([
    buildMostKept(),
    buildMostBroken(),
    buildMostShockScore(),
  ])
  const rows = [
    ...kept.map((r) => ({ ...r, week_ending: WEEK_ENDING })),
    ...broken.map((r) => ({ ...r, week_ending: WEEK_ENDING })),
    ...shock.map((r) => ({ ...r, week_ending: WEEK_ENDING })),
  ]
  console.log(`  most_kept=${kept.length} most_broken=${broken.length} most_shock_score=${shock.length} = ${rows.length} rows`)

  if (DRY) {
    console.log('\n[dry-run] sample shock_score top 5:')
    for (const r of shock.slice(0, 5)) {
      console.log(`  rank=${r.rank} pol=${r.politician_id.slice(0, 8)}... value=${r.value.toFixed(3)}`)
    }
    return
  }

  const { error } = await supabase
    .from('cr_leaderboard_history')
    .upsert(rows, { onConflict: 'week_ending,bucket,politician_id' })
  if (error) {
    console.error('Upsert failed:', error.message)
    process.exit(1)
  }
  console.log(`\n✓ Wrote ${rows.length} leaderboard-history rows for week_ending=${WEEK_ENDING}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
