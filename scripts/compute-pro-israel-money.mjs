#!/usr/bin/env node
//
// scripts/compute-pro-israel-money.mjs
//
// Aggregates pro-Israel PAC money per politician into cr_pro_israel_money, keeping
// SUPPORT and OPPOSE strictly separate. This is the load-bearing correctness rule:
// UDP (AIPAC's super PAC) is IE-only and spends most of its money OPPOSING its
// targets (it spent millions to defeat Bowman & Bush) — counting that as "funding"
// them would be both wrong and libelous. So:
//   - IE money (super PACs): cr_schedule_e, which carries the support_oppose flag.
//   - direct contributions (normal PACs like AIPAC PAC / DMFI): cr_pac_to_candidate
//     (these ARE contributions to the candidate, always "support").
//
// Two camps, labeled distinctly: 'aipac' (hawkish: UDP, AIPAC PAC, DMFI, USI) and
// 'jstreet' (dovish/two-state: J Street PAC) — never lumped together.
//
// Idempotent: clears + recomputes. Usage: node scripts/compute-pro-israel-money.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry-run')

// Canonical committees. IE-only super PACs vs direct-contribution PACs handled
// differently. (committee_id, label, camp, is_ie_only)
const COMMITTEES = [
  { id: 'C00799031', label: 'United Democracy Project (AIPAC)', camp: 'aipac', ieOnly: true },
  { id: 'C00797670', label: 'AIPAC PAC', camp: 'aipac', ieOnly: false },
  { id: 'C00710848', label: 'DMFI PAC', camp: 'aipac', ieOnly: false },
  { id: 'C00127811', label: 'U.S. Israel PAC', camp: 'aipac', ieOnly: false },
  { id: 'C00441949', label: 'J Street PAC', camp: 'jstreet', ieOnly: false },
]
const byId = new Map(COMMITTEES.map((c) => [c.id, c]))
const IE_IDS = COMMITTEES.filter((c) => c.ieOnly).map((c) => c.id)
const ALL_IDS = COMMITTEES.map((c) => c.id)

async function selectAll(table, columns, filter) {
  const out = []
  for (let from = 0; ; from += 1000) {
    let q = supabase.from(table).select(columns).range(from, from + 999)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

async function main() {
  console.log(`[${new Date().toISOString()}] Computing pro-Israel money${DRY ? ' (DRY RUN)' : ''}`)

  // key: `${candidate_id}|${camp}` -> { supported, opposed, spenders:Map }
  const agg = new Map()
  const bump = (cid, camp, field, amt, spenderLabel) => {
    if (!cid) return
    const k = `${cid}|${camp}`
    const e = agg.get(k) || { candidate_id: cid, camp, supported: 0, opposed: 0, spenders: new Map() }
    e[field] += amt
    e.spenders.set(spenderLabel, (e.spenders.get(spenderLabel) || 0) + amt)
    agg.set(k, e)
  }

  // 1) IE money from Schedule E (super PACs) — split by support/oppose.
  const se = await selectAll('cr_schedule_e', 'spender_committee_id, candidate_id, support_oppose, amount',
    (q) => q.in('spender_committee_id', ALL_IDS))
  let ieS = 0, ieO = 0
  for (const r of se) {
    const c = byId.get(r.spender_committee_id); if (!c) continue
    const amt = Number(r.amount) || 0
    if (r.support_oppose === 'O') { bump(r.candidate_id, c.camp, 'opposed', amt, c.label); ieO += amt }
    else { bump(r.candidate_id, c.camp, 'supported', amt, c.label); ieS += amt }
  }
  console.log(`Schedule E (IE): $${Math.round(ieS).toLocaleString()} support, $${Math.round(ieO).toLocaleString()} oppose`)

  // 2) Direct contributions from cr_pac_to_candidate — NON-IE-only committees only
  //    (IE-only committees' pas2 rows conflate S/O, so we EXCLUDE them here and rely
  //    on Schedule E above for them). These are always "support" (real contributions).
  const directIds = COMMITTEES.filter((c) => !c.ieOnly).map((c) => c.id)
  const edges = await selectAll('cr_pac_to_candidate', 'committee_id, candidate_id, total',
    (q) => q.in('committee_id', directIds))
  let dir = 0
  for (const e of edges) {
    const c = byId.get(e.committee_id); if (!c) continue
    const amt = Number(e.total) || 0
    bump(e.candidate_id, c.camp, 'supported', amt, c.label); dir += amt
  }
  console.log(`Direct contributions: $${Math.round(dir).toLocaleString()}`)

  // 3) Resolve candidate metadata.
  const cids = [...new Set([...agg.values()].map((e) => e.candidate_id))]
  const meta = new Map()
  for (let i = 0; i < cids.length; i += 300) {
    const { data } = await supabase.from('cr_fec_candidates').select('candidate_id, name, office, state, party, bioguide').in('candidate_id', cids.slice(i, i + 300))
    for (const c of data || []) meta.set(c.candidate_id, c)
  }
  // politician_id via bioguide
  const bios = [...meta.values()].map((m) => m.bioguide).filter(Boolean)
  const polByBio = new Map()
  for (let i = 0; i < bios.length; i += 300) {
    const { data } = await supabase.from('cr_politicians').select('id, bioguide').in('bioguide', bios.slice(i, i + 300))
    for (const p of data || []) polByBio.set(p.bioguide, p.id)
  }

  const rows = [...agg.values()].map((e) => {
    const m = meta.get(e.candidate_id) || {}
    const top = [...e.spenders.entries()].sort((a, b) => b[1] - a[1])[0]
    return {
      candidate_id: e.candidate_id,
      politician_id: m.bioguide ? (polByBio.get(m.bioguide) || null) : null,
      name: m.name || null, office: m.office || null, state: m.state || null, party: m.party || null,
      camp: e.camp,
      supported_usd: Math.round(e.supported * 100) / 100,
      opposed_usd: Math.round(e.opposed * 100) / 100,
      top_spender: top ? top[0] : null,
      computed_at: new Date().toISOString(),
    }
  }).filter((r) => r.supported_usd > 0 || r.opposed_usd > 0)

  console.log(`\nComputed ${rows.length} candidate-camp rows.`)
  const topSup = rows.filter((r) => r.camp === 'aipac').sort((a, b) => b.supported_usd - a.supported_usd).slice(0, 4)
  const topOpp = rows.filter((r) => r.camp === 'aipac').sort((a, b) => b.opposed_usd - a.opposed_usd).slice(0, 4)
  console.log('Top AIPAC-camp SUPPORTED:'); topSup.forEach((r) => console.log(`  $${Math.round(r.supported_usd).toLocaleString()} ${r.name}`))
  console.log('Top AIPAC-camp OPPOSED (their targets):'); topOpp.forEach((r) => console.log(`  $${Math.round(r.opposed_usd).toLocaleString()} ${r.name}`))

  if (DRY) { console.log('\nDRY RUN — no writes.'); return }
  await supabase.from('cr_pro_israel_money').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from('cr_pro_israel_money').upsert(rows.slice(i, i + 200), { onConflict: 'candidate_id,camp' })
    if (error) console.error('  upsert:', error.message)
  }
  console.log(`Wrote ${rows.length} rows to cr_pro_israel_money.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
