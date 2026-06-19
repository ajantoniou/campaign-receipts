#!/usr/bin/env node
// Compute donor-to-bill COALITION money trail.
//
// FOUNDER HUNCH (2026-05-30, confirmed against live data): the LEAD
// SPONSOR is the face of a bill but often takes little industry money.
// The real influence money sits with the broader coalition — the
// co-sponsors and, where roll-call data exists, the members who voted
// YES. So this script credits the FULL coalition, not just the sponsor,
// and surfaces WHERE the money concentrates.
//
// Coalition, in priority order (best signal first):
//   1. substantive YES-voters  (cr_roll_calls, is_procedural=false,
//      vote in Yea/Yes/Aye)  — the people who actually moved the bill
//   2. + cosponsors            (cr_bills.co_sponsor_bioguides)
//   3. + the lead sponsor
// All deduped to distinct politicians. When no roll-call exists for a
// bill, the coalition falls back to sponsor + cosponsors, then sponsor.
//
// For each (bill, industry) we now emit:
//   total_from_industry  = coalition industry $ (the real, large number)
//   n_sponsors_funded    = # coalition members who took that industry $
//   lead_sponsor_total   = industry $ to the lead sponsor ALONE
//   coalition_total      = same as total_from_industry (explicit name)
//   n_coalition          = same as n_sponsors_funded (explicit name)
//   coalition_kind       = 'yes_voters' | 'cosponsors' | 'sponsor'
//
// The "lead sponsor took $5k, the 204 who passed it took $63M" story is
// then (lead_sponsor_total vs coalition_total).
//
// Source tables: cr_bills, cr_roll_calls, cr_politicians,
// cr_industry_breakdown. Idempotent full recompute. Run nightly.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const DRY = process.argv.includes('--dry-run')
const YES_VOTES = new Set(['yea', 'yes', 'aye'])

// Page through a table so we never silently truncate at the 1000-row
// PostgREST default.
async function fetchAll(table, columns, tweak) {
  const out = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1)
    if (tweak) q = tweak(q)
    const { data, error } = await q
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data || []))
    if (!data || data.length < PAGE) break
  }
  return out
}

async function main() {
  console.log('# Computing bill COALITION money trail')

  // bioguide → politician_id
  const pols = await fetchAll('cr_politicians', 'id, bioguide', (q) => q.not('bioguide', 'is', null))
  const bioguideToId = new Map(pols.map((p) => [p.bioguide, p.id]))
  console.log(`${bioguideToId.size} politicians with bioguide`)

  // politician_id → [{industry,total}]
  const indRows = await fetchAll('cr_industry_breakdown', 'politician_id, industry_label, total_contributions')
  const indByPol = new Map()
  for (const r of indRows) {
    if (!r.industry_label) continue
    if (!indByPol.has(r.politician_id)) indByPol.set(r.politician_id, [])
    indByPol.get(r.politician_id).push({
      industry: r.industry_label,
      total: Number(r.total_contributions || 0),
    })
  }
  console.log(`${indRows.length} industry rows across ${indByPol.size} politicians`)

  // bill_id → Set(politician_id) of substantive YES-voters
  const rcRows = await fetchAll(
    'cr_roll_calls',
    'bill_id, politician_id, vote, is_procedural',
    (q) => q.eq('is_procedural', false).not('bill_id', 'is', null).not('politician_id', 'is', null),
  )
  const yesByBill = new Map()
  for (const r of rcRows) {
    if (!YES_VOTES.has(String(r.vote || '').toLowerCase())) continue
    if (!yesByBill.has(r.bill_id)) yesByBill.set(r.bill_id, new Set())
    yesByBill.get(r.bill_id).add(r.politician_id)
  }
  console.log(`${yesByBill.size} bills with substantive yes-voter roll calls`)

  const bills = await fetchAll('cr_bills', 'id, sponsor_bioguide, co_sponsor_bioguides')
  console.log(`${bills.length} bills`)

  const allTrails = []
  for (const bill of bills) {
    const sponsorId = bill.sponsor_bioguide ? bioguideToId.get(bill.sponsor_bioguide) : null
    const cosponsorIds = (bill.co_sponsor_bioguides || [])
      .map((b) => bioguideToId.get(b))
      .filter(Boolean)
    const yesIds = yesByBill.get(bill.id)

    // Build the coalition (deduped) by best available signal.
    const coalition = new Set()
    let coalitionKind
    if (yesIds && yesIds.size > 0) {
      coalitionKind = 'yes_voters'
      for (const id of yesIds) coalition.add(id)
      for (const id of cosponsorIds) coalition.add(id) // also credit cosponsors
      if (sponsorId) coalition.add(sponsorId)
    } else if (cosponsorIds.length > 0) {
      coalitionKind = 'cosponsors'
      for (const id of cosponsorIds) coalition.add(id)
      if (sponsorId) coalition.add(sponsorId)
    } else if (sponsorId) {
      coalitionKind = 'sponsor'
      coalition.add(sponsorId)
    } else {
      continue // nothing to credit
    }

    // Lead-sponsor-alone industry totals (the "face" money).
    const sponsorIndustry = new Map()
    if (sponsorId) {
      for (const { industry, total } of indByPol.get(sponsorId) || []) {
        sponsorIndustry.set(industry, (sponsorIndustry.get(industry) || 0) + total)
      }
    }

    // Coalition industry totals.
    const industryTotals = new Map() // industry -> { total, count }
    for (const polId of coalition) {
      const polIndustries = indByPol.get(polId)
      if (!polIndustries) continue
      for (const { industry, total } of polIndustries) {
        if (!industryTotals.has(industry)) industryTotals.set(industry, { total: 0, count: 0 })
        const v = industryTotals.get(industry)
        v.total += total
        v.count++
      }
    }
    if (industryTotals.size === 0) continue

    Array.from(industryTotals.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([industry, v], i) => {
        allTrails.push({
          bill_id: bill.id,
          industry_label: industry,
          total_from_industry: v.total, // coalition $ (kept name; now means coalition)
          n_sponsors_funded: v.count, // coalition members funded
          lead_sponsor_total: sponsorIndustry.get(industry) || 0,
          coalition_total: v.total,
          n_coalition: v.count,
          coalition_kind: coalitionKind,
          rank: i + 1,
        })
      })
  }

  console.log(`Computed ${allTrails.length} industry × bill rows`)
  if (DRY) {
    const lead = allTrails
      .filter((t) => t.rank === 1 && t.coalition_kind === 'yes_voters')
      .sort((a, b) => b.coalition_total - a.coalition_total)
      .slice(0, 5)
    console.log('\n# Top concentration (rank-1, yes-voter coalitions):')
    for (const t of lead) {
      console.log(
        `  bill=${t.bill_id.slice(0, 8)} ${t.industry_label}: lead sponsor $${Math.round(t.lead_sponsor_total).toLocaleString()}, ` +
          `coalition of ${t.n_coalition} took $${Math.round(t.coalition_total).toLocaleString()}`,
      )
    }
    console.log('(dry run — not writing)')
    return
  }
  if (allTrails.length === 0) return

  await supabase.from('cr_bill_money_trail').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  for (let i = 0; i < allTrails.length; i += 500) {
    const batch = allTrails.slice(i, i + 500)
    const { error } = await supabase.from('cr_bill_money_trail').insert(batch)
    if (error) console.log(`  ! batch ${i}: ${error.message}`)
  }
  console.log('✓ Coalition money trail compute complete.')
}

main().catch((e) => { console.error(e); process.exit(1) })
