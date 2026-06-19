#!/usr/bin/env node
//
// scripts/snapshot-weekly.mjs
//
// Monday 8am ET cron. Computes the weekly money snapshot per the
// engagement panel (2026-05-19): for every politician, score
// (industry_concentration_pct * recent_vote_alignment_extremity),
// pick the top-1 with R/D alternation enforced over rolling 4-week
// window, write to cr_weekly_snapshot.
//
// This populates the franchise primitive that powers:
//   - Receipt of the Week (homepage hero + /receipt/[week])
//   - Money Race of the Week (deferred to phase 2)
//   - Industry Flip of the Month (deferred)
//   - Promise vs Paycheck (deferred)
//
// Per panel: nonpartisan-by-construction. The R/D alternation is
// enforced at SELECT time so we never publish 4 R-corruption picks in
// a row (or 4 D-corruption picks in a row). Independents break ties.
//
// Idempotent: a re-run for the same week_ending re-computes and
// re-upserts. Safe to run multiple times Monday morning.
//
// Usage:
//   node scripts/snapshot-weekly.mjs [--week-ending=YYYY-MM-DD] [--dry-run]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-ending='))?.split('=')[1]

// ── Helpers ────────────────────────────────────────────────

/** Most recent Sunday (ISO week-ending). */
function thisWeekEnding() {
  const d = new Date()
  const day = d.getUTCDay() // 0 = Sun
  const diff = (day + 7) % 7 // days back to last Sunday
  d.setUTCDate(d.getUTCDate() - diff)
  return d.toISOString().slice(0, 10)
}

const WEEK_ENDING = weekArg || thisWeekEnding()

function logHeader() {
  console.log(`# CR weekly snapshot — week_ending=${WEEK_ENDING}${DRY ? ' (DRY RUN)' : ''}`)
}

// ── Scoring ────────────────────────────────────────────────
//
// Per-politician shock_score = base + extremity_bonus
//   base               = top_donor_industry_total / total_raised, in
//                        [0, 1]. High concentration = potential capture.
//   extremity_bonus    = max alignment-rate distance from 50% across
//                        all (politician, industry) bins where n>=5.
//                        100% or 0% aligned both score 0.5; 50% scores 0.
//                        Adds to base so the row that surfaces is BOTH
//                        donor-concentrated AND vote-aligned (or
//                        vote-broken-from in a defensible "broke ranks"
//                        framing).
//
// Per panel: amber-accented card, not red/blue. R/D alternation is
// enforced AFTER scoring, at the selection step.

async function computeScores() {
  // 1. Per-politician total raised (sum of top-20 industries).
  const { data: indBreakdown } = await supabase
    .from('cr_industry_breakdown')
    .select('politician_id, industry_label, total_contributions, rank')
    .order('rank', { ascending: true })

  // Aggregate per politician.
  const polTotals = new Map() // politician_id -> { total, top_industry, top_amount }
  for (const row of indBreakdown || []) {
    const cur = polTotals.get(row.politician_id) || { total: 0, top_industry: null, top_amount: 0 }
    cur.total += Number(row.total_contributions || 0)
    if (row.rank === 1) {
      cur.top_industry = row.industry_label
      cur.top_amount = Number(row.total_contributions || 0)
    }
    polTotals.set(row.politician_id, cur)
  }

  // 2. Per-politician extremity bonus from donor_vote_alignment.
  const { data: alignments } = await supabase
    .from('cr_donor_vote_alignment')
    .select('politician_id, industry_label, alignment_score')
  const alignAgg = new Map() // "polId::industry" -> {aligned, total}
  for (const row of alignments || []) {
    const key = `${row.politician_id}::${row.industry_label}`
    const cur = alignAgg.get(key) || { aligned: 0, total: 0 }
    cur.total++
    if (row.alignment_score === 1) cur.aligned++
    alignAgg.set(key, cur)
  }
  const extremityByPol = new Map() // politician_id -> { industry, extremity, alignedWith, n }
  for (const [key, v] of alignAgg) {
    if (v.total < 5) continue
    const pct = v.aligned / v.total
    const extremity = Math.abs(pct - 0.5) * 2 // 0..1
    if (extremity < 0.6) continue // need pct <= 20% or >= 80%
    const [polId, industry] = key.split('::')
    const cur = extremityByPol.get(polId)
    if (!cur || extremity > cur.extremity) {
      extremityByPol.set(polId, {
        industry,
        extremity,
        alignedWith: pct > 0.5, // true = voted WITH donors, false = broke from
        n: v.total,
      })
    }
  }

  // 3. Combine into shock_score per politician.
  const scored = []
  for (const [polId, totals] of polTotals) {
    if (totals.total === 0) continue
    const concentration = Math.min(totals.top_amount / totals.total, 1)
    const ext = extremityByPol.get(polId)
    const extremityBonus = ext ? ext.extremity : 0
    // Weighted: concentration matters more for the franchise headline
    // ("top donor industry is X% of all money raised") but the extremity
    // is what makes the vote-side punchline land.
    const shock_score = concentration * 0.6 + extremityBonus * 0.4
    scored.push({
      politician_id: polId,
      shock_score,
      concentration,
      top_industry: totals.top_industry,
      top_industry_total: totals.top_amount,
      ext, // null if no extreme alignment
    })
  }
  scored.sort((a, b) => b.shock_score - a.shock_score)
  return scored
}

// ── R/D alternation over 4-week rolling window ────────────

async function getRecentPicks(weekEnding) {
  // Pull the last 4 weeks' picks (excluding this week) to enforce
  // alternation. If the last 4 picks were all R, this week must be D
  // (or I). Same logic in reverse.
  const { data } = await supabase
    .from('cr_weekly_snapshot')
    .select('week_ending, politician_id, cr_politicians!inner(party)')
    .lt('week_ending', weekEnding)
    .eq('was_receipt_of_week', true)
    .order('week_ending', { ascending: false })
    .limit(4)
  return (data || []).map((r) => r.cr_politicians?.party).filter(Boolean)
}

function partyConstraint(recentParties) {
  // If the last 4 picks have been ≥3 of the same party, force the
  // other party (or independent) this week.
  const rCount = recentParties.filter((p) => p === 'Republican').length
  const dCount = recentParties.filter((p) => p === 'Democratic').length
  if (rCount >= 3) return (p) => p !== 'Republican'
  if (dCount >= 3) return (p) => p !== 'Democratic'
  // Default: no constraint, but still mildly prefer alternation from
  // the most recent pick.
  if (recentParties.length === 0) return () => true
  const last = recentParties[0]
  return (p) => p !== last
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  logHeader()

  const scored = await computeScores()
  console.log(`Scored ${scored.length} politicians`)

  const recentParties = await getRecentPicks(WEEK_ENDING)
  console.log(`Recent 4-week picks (party): ${recentParties.join(', ') || '(none)'}`)
  const allow = partyConstraint(recentParties)

  // Pull politician metadata for the top 50 candidates so we can
  // apply the party constraint without re-querying per row.
  const topCandidates = scored.slice(0, 50)
  const polIds = topCandidates.map((s) => s.politician_id)
  const { data: polRows } = await supabase
    .from('cr_politicians')
    .select('id, slug, name, party, branch, state')
    .in('id', polIds)
  const polById = new Map((polRows || []).map((p) => [p.id, p]))

  // Pick the first candidate that satisfies the alternation constraint
  // AND we haven't picked in the last 8 weeks (don't repeat too often).
  const { data: prior8 } = await supabase
    .from('cr_weekly_snapshot')
    .select('politician_id')
    .eq('was_receipt_of_week', true)
    .order('week_ending', { ascending: false })
    .limit(8)
  const recentlyPicked = new Set((prior8 || []).map((r) => r.politician_id))

  let pick = null
  for (const cand of topCandidates) {
    const pol = polById.get(cand.politician_id)
    if (!pol) continue
    if (!allow(pol.party)) continue
    if (recentlyPicked.has(cand.politician_id)) continue
    pick = { ...cand, politician: pol }
    break
  }

  if (!pick) {
    console.error('No eligible pick this week (constraint exhausted?). Falling back to top candidate.')
    const fallbackCand = topCandidates[0]
    pick = { ...fallbackCand, politician: polById.get(fallbackCand.politician_id) }
  }

  // Write a snapshot row for the pick (the franchise winner) plus
  // the next 4 runners-up (for Money Race / Industry Flip / Promise
  // vs Paycheck candidates in future weeks).
  const rowsToInsert = []
  const winnerRow = {
    week_ending: WEEK_ENDING,
    politician_id: pick.politician_id,
    top_donor_industry: pick.top_industry,
    top_donor_industry_total_usd: pick.top_industry_total,
    industry_concentration_pct: Number(pick.concentration.toFixed(4)),
    recent_vote_id: null,
    recent_vote_bill_title: pick.ext ? `Industry: ${pick.ext.industry}` : null,
    recent_vote_position: pick.ext ? (pick.ext.alignedWith ? 'aligned' : 'broke_from') : null,
    recent_vote_aligned_with_donors: pick.ext ? pick.ext.alignedWith : null,
    shock_score: Number(pick.shock_score.toFixed(4)),
    fec_filing_id: null, // populated by share-card render step
    fec_filing_url: null,
    was_receipt_of_week: true,
    cycle: '2026',
  }
  rowsToInsert.push(winnerRow)

  // Also record the next 4 for franchise variety. These don't get
  // the was_receipt_of_week flag.
  const runnersUp = topCandidates
    .filter((c) => c.politician_id !== pick.politician_id)
    .slice(0, 4)
  for (const cand of runnersUp) {
    const pol = polById.get(cand.politician_id)
    if (!pol) continue
    rowsToInsert.push({
      week_ending: WEEK_ENDING,
      politician_id: cand.politician_id,
      top_donor_industry: cand.top_industry,
      top_donor_industry_total_usd: cand.top_industry_total,
      industry_concentration_pct: Number(cand.concentration.toFixed(4)),
      recent_vote_id: null,
      recent_vote_bill_title: cand.ext ? `Industry: ${cand.ext.industry}` : null,
      recent_vote_position: cand.ext ? (cand.ext.alignedWith ? 'aligned' : 'broke_from') : null,
      recent_vote_aligned_with_donors: cand.ext ? cand.ext.alignedWith : null,
      shock_score: Number(cand.shock_score.toFixed(4)),
      was_receipt_of_week: false,
      cycle: '2026',
    })
  }

  console.log(`\nReceipt of the Week pick: ${pick.politician.name} (${pick.politician.party}-${pick.politician.state})`)
  console.log(`  Top donor industry: ${pick.top_industry} ($${pick.top_industry_total.toLocaleString()})`)
  console.log(`  Concentration: ${(pick.concentration * 100).toFixed(1)}%`)
  if (pick.ext) {
    console.log(`  Vote alignment: ${pick.ext.industry} -- ${pick.ext.alignedWith ? 'voted WITH donors' : 'broke FROM donors'} (n=${pick.ext.n}, extremity=${pick.ext.extremity.toFixed(2)})`)
  }
  console.log(`  shock_score: ${pick.shock_score.toFixed(3)}`)
  console.log(`\nRunners-up to record (for future franchise use): ${runnersUp.length}`)

  if (DRY) {
    console.log(`\n[dry-run] would upsert ${rowsToInsert.length} row(s)`)
    return
  }

  // Upsert. ON CONFLICT (week_ending, politician_id) -> update.
  const { error } = await supabase
    .from('cr_weekly_snapshot')
    .upsert(rowsToInsert, { onConflict: 'week_ending,politician_id' })
  if (error) {
    console.error('Upsert failed:', error.message)
    process.exit(1)
  }
  console.log(`\n✓ Wrote ${rowsToInsert.length} snapshot rows for week_ending=${WEEK_ENDING}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
