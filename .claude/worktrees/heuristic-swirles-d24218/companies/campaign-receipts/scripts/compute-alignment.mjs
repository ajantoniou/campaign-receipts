#!/usr/bin/env node
// Compute donor-to-vote alignment scores.
//
// For each (politician, bill) pair where:
//   - the politician has industry-tagged donors (cr_industry_breakdown)
//   - the bill has industry-tagged positions (cr_bill_industry_positions)
//   - the politician voted on the bill (cr_roll_calls.vote IN ('Yea','Nay'))
// We score:
//   +1 alignment if politician's vote aligned with their top-donor industry's position
//   -1 if they broke from it
//   0 otherwise (skipped)
//
// Output: rows in cr_donor_vote_alignment, one per (politician, bill, industry).
//
// Run as nightly Render cron post-launch. Idempotent — uses upsert.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const DRY = process.argv.includes('--dry-run')

// "Yea on support, Nay on oppose" = aligned; the inverse = broke.
function scoreAlignment(vote, industryPosition) {
  if (!['Yea', 'Nay'].includes(vote)) return 0
  if (industryPosition === 'mixed') return 0
  if (vote === 'Yea' && industryPosition === 'support') return 1
  if (vote === 'Nay' && industryPosition === 'oppose') return 1
  if (vote === 'Yea' && industryPosition === 'oppose') return -1
  if (vote === 'Nay' && industryPosition === 'support') return -1
  return 0
}

async function main() {
  console.log('# Computing donor-to-vote alignment')

  // Pull all industry positions
  const { data: positions } = await supabase
    .from('cr_bill_industry_positions')
    .select('bill_id, industry_label, position')
  console.log(`${positions.length} industry positions`)

  // Group positions by bill_id for fast lookup
  const positionsByBill = new Map()
  for (const p of positions) {
    if (!positionsByBill.has(p.bill_id)) positionsByBill.set(p.bill_id, [])
    positionsByBill.get(p.bill_id).push(p)
  }

  // Pull all roll-calls with matched politicians. Only score votes on
  // bills that have industry positions tagged (huge filter, makes
  // the result set manageable).
  const taggedBillIds = Array.from(positionsByBill.keys())
  const votes = []
  let from = 0
  const PAGE = 1000
  while (true) {
    const { data, error } = await supabase
      .from('cr_roll_calls')
      .select('politician_id, bill_id, vote')
      .not('politician_id', 'is', null)
      .eq('is_procedural', false) // SCRUB: exclude rule resolutions / "providing
      // for consideration" / disposition-of-Senate-amendment / motions / journal /
      // quorum. These are procedural, not substantive policy votes. Scoring them
      // inflated alignment (e.g. Turner "7/7 Defense" included 2 rule votes).
      // See scripts/classify-procedural.mjs for the classification rules.
      .in('bill_id', taggedBillIds)
      .in('vote', ['Yea', 'Nay'])
      .range(from, from + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    votes.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  console.log(`${votes.length} graded roll-call votes on industry-tagged bills`)

  // Pull industry-breakdown per politician — which industries are their top donor base
  const { data: indByPol } = await supabase
    .from('cr_industry_breakdown')
    .select('politician_id, industry_label, rank, total_contributions')
  // Keep only top 5 per politician (their "donor industry profile").
  // Map industry_label -> $ received, so each alignment row carries the real
  // dollar amount for the "took $X from [industry], then voted [Y]" card.
  const indByPolMap = new Map() // politician_id -> Map(industry_label -> total$)
  for (const r of indByPol) {
    if (!indByPolMap.has(r.politician_id)) indByPolMap.set(r.politician_id, new Map())
    if (r.rank <= 5) indByPolMap.get(r.politician_id).set(r.industry_label, r.total_contributions)
  }
  console.log(`${indByPolMap.size} politicians with donor-industry profiles`)

  // Compute alignments
  const alignments = []
  for (const v of votes) {
    const billPositions = positionsByBill.get(v.bill_id)
    if (!billPositions) continue
    const polIndustries = indByPolMap.get(v.politician_id)
    if (!polIndustries) continue

    for (const bp of billPositions) {
      // Only score against industries this politician is actually funded by
      if (!polIndustries.has(bp.industry_label)) continue
      const score = scoreAlignment(v.vote, bp.position)
      if (score === 0) continue
      alignments.push({
        politician_id: v.politician_id,
        bill_id: v.bill_id,
        industry_label: bp.industry_label,
        alignment_score: score,
        vote: v.vote,
        industry_position: bp.position,
        total_from_industry: polIndustries.get(bp.industry_label) ?? null,
      })
    }
  }

  console.log(`Computed ${alignments.length} alignment scores`)
  if (DRY) {
    console.log('(dry run — not writing)')
    return
  }

  if (alignments.length === 0) return

  // --rebuild: clear the table first so rows that NO LONGER qualify (e.g. now
  // excluded as procedural) are removed, not just left stale by upsert.
  if (process.argv.includes('--rebuild')) {
    const { error } = await supabase
      .from('cr_donor_vote_alignment')
      .delete()
      .not('politician_id', 'is', null)
    if (error) console.log(`  ! rebuild delete: ${error.message}`)
    else console.log('  (rebuild) cleared existing alignment rows')
  }

  // Dedupe on (politician_id, bill_id, industry_label)
  const dedup = new Map()
  for (const a of alignments) dedup.set(`${a.politician_id}|${a.bill_id}|${a.industry_label}`, a)
  const unique = Array.from(dedup.values())
  console.log(`After dedupe: ${unique.length} unique alignment rows`)

  for (let i = 0; i < unique.length; i += 500) {
    const batch = unique.slice(i, i + 500)
    const { error } = await supabase
      .from('cr_donor_vote_alignment')
      .upsert(batch, { onConflict: 'politician_id,bill_id,industry_label' })
    if (error) console.log(`  ! batch ${i}: ${error.message}`)
  }
  console.log('✓ Alignment compute complete.')
}

main().catch((e) => { console.error(e); process.exit(1) })
