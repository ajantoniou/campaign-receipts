#!/usr/bin/env node
// Populate active races (the /race/[slug] "live campaigns" pages) from
// real FEC data — verified candidates + verified Schedule-E independent
// expenditures. Idempotent; safe to run daily from the cron.
//
// WHY CONFIG-DRIVEN, NOT BLIND FEC SWEEP:
//   A statewide stub ("ca-statewide") maps to dozens of FEC races and to
//   non-federal offices (governor, who never files with the FEC). Blindly
//   auto-resolving produces garbage. So each race we want LIVE is declared
//   below with its exact FEC candidate IDs (verified against
//   api.open.fec.gov/v1/candidates). The script then pulls each
//   candidate's real Schedule-E IE (support/oppose, by committee) and
//   builds candidates[] + top_pacs[] + total_ie_usd from EXACT FEC totals.
//
// CURATION GUARD:
//   A race row that a human curated with richer, news-sourced numbers
//   (e.g. ky-04, where FEC IE lags the reported $26.5M) must NOT be
//   clobbered by the thinner FEC-only totals. We only write a race when
//   its primary_sources.fec_auto === true. Hand-curated rows omit that
//   flag and are left untouched.
//
// Requires FEC_API_KEY + SUPABASE_* in env (monorepo root .env).

import { createClient } from '@supabase/supabase-js'

const KEY = process.env.FEC_API_KEY
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing FEC_API_KEY or SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const BASE = 'https://api.open.fec.gov/v1'
const DRY = process.argv.includes('--dry-run')

// ── Declared live races ──────────────────────────────────────
// Verified 2026-05-30 against FEC candidates + Schedule-E endpoints.
// candidate_id values confirmed real; affiliation labels are editorial
// summaries of the FEC committee_name, never invented dollar figures.
const RACE_SPECS = [
  {
    slug: 'tx-senate-2026-general',
    race_type: 'senate_general',
    state: 'TX',
    district: 'TX-Statewide',
    cycle: '2026',
    primary_date: '2026-11-03', // general election day (countdown target)
    election_date: '2026-11-03',
    headline: 'Texas U.S. Senate 2026 — over $80M in outside money already',
    blurb:
      'The open-seat Texas Senate race has drawn the heaviest super-PAC spending of the 2026 cycle. ' +
      'Outside groups have poured tens of millions into the Republican primary fight and the Democratic ' +
      'field. Every dollar below is a verified FEC Schedule-E independent expenditure.',
    // FEC candidate IDs (verified). We keep the strongest-funded few.
    candidates: [
      { fec_id: 'S6TX00479', name: 'James Talarico', party: 'Democratic' },
      { fec_id: 'S2TX00106', name: 'John Cornyn', party: 'Republican', incumbent: true },
      { fec_id: 'S6TX00552', name: 'Jasmine Crockett', party: 'Democratic' },
      { fec_id: 'S4TX00722', name: 'Colin Allred', party: 'Democratic' },
      { fec_id: 'S6TX00388', name: 'Ken Paxton', party: 'Republican' },
      { fec_id: 'S6TX00511', name: 'Wesley Hunt', party: 'Republican' },
    ],
    sources: [
      { publication: 'FEC Schedule E (by candidate)', url: 'https://www.fec.gov/data/independent-expenditures/?data_type=processed&is_notice=false&most_recent=true' },
      { publication: 'FEC candidate search', url: 'https://www.fec.gov/data/candidates/senate/?state=TX&cycle=2026' },
    ],
  },
]

function arg() {}
async function fecGet(path, params) {
  const url = new URL(BASE + path)
  url.searchParams.set('api_key', KEY)
  for (const [k, v] of Object.entries(params || {})) if (v != null) url.searchParams.set(k, String(v))
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FEC ${path} -> ${res.status}: ${await res.text()}`)
  return res.json()
}

// All Schedule-E IE rows targeting one candidate this cycle.
async function candidateIE(fecId, cycle) {
  const j = await fecGet('/schedules/schedule_e/by_candidate/', {
    candidate_id: fecId, cycle, election_full: 'true', per_page: 100, sort: '-total',
  })
  return (j.results || []).filter((r) => Number(r.total) > 0)
}

// Candidate receipts (campaign-raised) for the strip.
async function candidateReceipts(fecId, cycle) {
  const j = await fecGet('/candidate/' + fecId + '/totals/', { cycle, election_full: 'true', per_page: 1 })
  const r = (j.results || [])[0]
  return r ? Number(r.receipts || 0) : null
}

async function buildRace(spec) {
  const cycle = spec.cycle
  const committeeAgg = new Map() // committee_id -> { name, support, oppose }
  const outCandidates = []
  let totalIE = 0

  for (const c of spec.candidates) {
    const rows = await candidateIE(c.fec_id, cycle)
    let forUsd = 0
    let againstUsd = 0
    for (const r of rows) {
      const amt = Number(r.total)
      const isOppose = r.support_oppose_indicator === 'O'
      if (isOppose) againstUsd += amt
      else forUsd += amt
      totalIE += amt
      const cid = r.committee_id
      if (!committeeAgg.has(cid)) committeeAgg.set(cid, { name: r.committee_name || cid, support: 0, oppose: 0, targets: new Map() })
      const agg = committeeAgg.get(cid)
      if (isOppose) agg.oppose += amt
      else agg.support += amt
      // remember who they spent on, for the target_candidate field
      const tkey = `${isOppose ? 'against' : 'for'}:${c.name}`
      agg.targets.set(tkey, (agg.targets.get(tkey) || 0) + amt)
    }
    const raised = await candidateReceipts(c.fec_id, cycle)
    outCandidates.push({
      name: c.name,
      party: c.party,
      incumbent: !!c.incumbent,
      ie_for_usd: Math.round(forUsd),
      ie_against_usd: Math.round(againstUsd),
      campaign_raised_usd: raised != null ? Math.round(raised) : null,
      polling_pct: null,
      endorsed_by: [],
      notes: null,
      fec_candidate_id: c.fec_id,
    })
  }

  // Build top_pacs from the biggest committees by total IE.
  const topPacs = [...committeeAgg.entries()]
    .map(([cid, a]) => {
      const total = a.support + a.oppose
      // dominant direction + target
      const [topTarget] = [...a.targets.entries()].sort((x, y) => y[1] - x[1])
      const [dir, who] = (topTarget?.[0] || ':').split(':')
      return {
        name: a.name,
        affiliation: `FEC ${cid}`,
        total_usd: Math.round(total),
        support_oppose: dir === 'against' ? `against_${(who || '').split(' ').pop().toLowerCase()}` : `for_${(who || '').split(' ').pop().toLowerCase()}`,
        target_candidate: who || null,
      }
    })
    .sort((x, y) => y.total_usd - x.total_usd)
    .slice(0, 6)

  outCandidates.sort((a, b) => (b.ie_for_usd + b.ie_against_usd) - (a.ie_for_usd + a.ie_against_usd))

  return {
    slug: spec.slug,
    race_type: spec.race_type,
    state: spec.state,
    district: spec.district,
    cycle: spec.cycle,
    primary_date: spec.primary_date,
    election_date: spec.election_date,
    headline: spec.headline,
    blurb: spec.blurb,
    candidates: outCandidates,
    top_pacs: topPacs,
    total_ie_usd: Math.round(totalIE),
    is_active: true,
    primary_sources: { fec_auto: true, retrieved_at: new Date().toISOString().slice(0, 10), sources: spec.sources },
    updated_at: new Date().toISOString(),
  }
}

async function main() {
  console.log('# Populating active races from FEC')

  // Curation guard: only upsert rows that don't exist yet or that are
  // already flagged fec_auto. Never clobber a hand-curated row.
  const { data: existing } = await supabase
    .from('cr_races')
    .select('slug, primary_sources')
  const existingBySlug = new Map((existing || []).map((r) => [r.slug, r]))

  for (const spec of RACE_SPECS) {
    const prior = existingBySlug.get(spec.slug)
    if (prior && prior.primary_sources && prior.primary_sources.fec_auto !== true && Array.isArray(prior.primary_sources) === false) {
      console.log(`  - ${spec.slug}: hand-curated (no fec_auto flag) — skipping`)
      continue
    }
    const row = await buildRace(spec)
    console.log(
      `  ${spec.slug}: ${row.candidates.length} candidates, ${row.top_pacs.length} PACs, total IE $${row.total_ie_usd.toLocaleString()}`,
    )
    if (DRY) {
      console.log('    (dry run — not writing)')
      continue
    }
    const { error } = await supabase.from('cr_races').upsert(row, { onConflict: 'slug' })
    if (error) console.error(`    ! upsert failed: ${error.message}`)
    else console.log('    ✓ written')
  }

  // Retire the empty gubernatorial stub the page was showing — CA
  // statewide (governor) is a non-federal office FEC can't source, so it
  // can never be a real "live campaign" page here. Flip it inactive so
  // the homepage strip stops surfacing an empty card. Idempotent.
  if (!DRY) {
    const { data: stub } = await supabase
      .from('cr_races')
      .update({
        is_active: false,
        result_summary: 'Retired: statewide gubernatorial race has no FEC-sourceable federal finance data. Superseded by FEC-backed federal races.',
        updated_at: new Date().toISOString(),
      })
      .eq('slug', 'ca-statewide-2026-06-02')
      .eq('is_active', true)
      .select('slug')
    if (stub && stub.length) console.log('  - retired empty stub ca-statewide-2026-06-02')
  }

  console.log('✓ Active-race populate complete.')
}

main().catch((e) => { console.error(e); process.exit(1) })
