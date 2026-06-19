#!/usr/bin/env node
// FEC PAC->candidate backfill.
//
// For each politician with a fec_candidate_id, find their principal committee,
// pull Schedule A line F3-11C ("Contributions From Other Political Committees"),
// aggregate by contributing committee_id, upsert the committee entity into
// cr_committees and the edge into cr_pac_contributions.
//
// This is the cross-politician spine: a PAC's FEC committee_id recurs identically
// on every candidate it funds, so cr_pac_contributions(committee_id) is the join.
//
// Idempotent: upsert on cr_committees.committee_id and on
// cr_pac_contributions(committee_id, politician_id, cycle). Safe to re-run.
//
// Usage:
//   node scripts/fec-pac-contributions.mjs                 # all pols w/ fec id
//   node scripts/fec-pac-contributions.mjs --limit 20
//   node scripts/fec-pac-contributions.mjs --slugs aoc,ted-cruz
//   node scripts/fec-pac-contributions.mjs --cycle 2024

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FEC_KEY = process.env.FEC_API_KEY || 'DEMO_KEY'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const FEC_BASE = 'https://api.open.fec.gov/v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// args
const argv = process.argv.slice(2)
function argVal(flag) {
  const i = argv.indexOf(flag)
  return i >= 0 ? argv[i + 1] : null
}
const LIMIT = argVal('--limit') ? Number(argVal('--limit')) : null
const SLUGS = argVal('--slugs') ? argVal('--slugs').split(',').map((s) => s.trim()) : null
const CYCLE = argVal('--cycle') || '2024'

async function fecGet(path, params = {}) {
  const qs = new URLSearchParams({ api_key: FEC_KEY })
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) v.forEach((x) => qs.append(k, String(x)))
    else qs.append(k, String(v))
  }
  const url = `${FEC_BASE}${path}?${qs.toString()}`
  const resp = await fetch(url)
  if (resp.status === 429) {
    await sleep(60_000)
    const retry = await fetch(url)
    if (!retry.ok) throw new Error(`FEC ${retry.status} after retry: ${path}`)
    return retry.json()
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`FEC ${resp.status}: ${path} — ${body.slice(0, 160)}`)
  }
  return resp.json()
}

async function fetchPrincipalCommitteeId(candidateId, cycle) {
  const data = await fecGet(`/candidate/${candidateId}/committees/`, {
    cycle,
    designation: 'P',
  })
  const results = data.results || []
  if (!results.length) {
    const fb = await fecGet(`/candidate/${candidateId}/committees/`, { cycle })
    return (fb.results || [])[0]?.committee_id || null
  }
  return results[0].committee_id
}

// Reuse the same CR industry classifier philosophy at the committee level.
function classifyCommitteeIndustry(name, connectedOrg, orgTypeFull) {
  const hay = `${name || ''} ${connectedOrg || ''}`.toLowerCase()
  const RX = [
    [/\b(realtor|real estate|home build|mortgage banker)\b/, 'Real estate'],
    [/\b(machinist|teamster|seiu|afl-?cio|uaw|afscme|electrical worker|ibew|carpenter|laborer|postal worker|teacher|nea|aft|union|labor)\b/, 'Labor unions'],
    [/\b(aipac|j street|israel|club for growth|nra|rifle|planned parenthood|sierra|chamber of commerce|emily|democracy|progress)\b/, 'Political organizations'],
    [/\b(bank|financ|capital|invest|securit|insurance|credit union|hedge)\b/, 'Finance'],
    [/\b(pharma|health|hospital|physician|medical|drug)\b/, 'Pharmaceuticals & Healthcare'],
    [/\b(oil|gas|energy|petroleum|coal|exxon|chevron|koch)\b/, 'Oil & Gas'],
    [/\b(lockheed|raytheon|northrop|boeing|defense|general dynamics|l3)\b/, 'Defense'],
    [/\b(google|meta|amazon|microsoft|apple|tech|software|semiconductor|crypto|coinbase|fairshake)\b/, 'Big Tech'],
  ]
  for (const [rx, label] of RX) if (rx.test(hay)) return label
  if (orgTypeFull && /labor/i.test(orgTypeFull)) return 'Labor unions'
  if (orgTypeFull && /trade|membership/i.test(orgTypeFull)) return 'Political organizations'
  return null
}

// Pull all F3-11C records for a committee in a cycle, aggregate by contributor cmte.
async function fetchPacContributions(committeeId, cycle) {
  const agg = new Map() // contributor committee_id -> {name, meta, total, count, lastDate}
  let lastIndexes = null
  let page = 0
  const MAX_PAGES = 20 // 100/page => up to 2000 records; PAC counts are small
  while (page < MAX_PAGES) {
    const params = {
      committee_id: committeeId,
      two_year_transaction_period: cycle,
      line_number: 'F3-11C',
      per_page: 100,
      sort: '-contribution_receipt_amount',
    }
    if (lastIndexes) {
      params.last_index = lastIndexes.last_index
      params.last_contribution_receipt_amount = lastIndexes.last_contribution_receipt_amount
    }
    const data = await fecGet('/schedules/schedule_a/', params)
    const results = data.results || []
    for (const r of results) {
      const cid = r.contributor_id || r.contributor_committee_id
      if (!cid) continue // skip records without a committee id (memo/earmark noise)
      const amt = Number(r.contribution_receipt_amount || 0)
      const cur = agg.get(cid) || {
        name: r.contributor_name || r.donor_committee_name || cid,
        meta: r.contributor || {},
        total: 0,
        count: 0,
        lastDate: null,
      }
      cur.total += amt
      cur.count += 1
      const d = r.contribution_receipt_date ? r.contribution_receipt_date.slice(0, 10) : null
      if (d && (!cur.lastDate || d > cur.lastDate)) cur.lastDate = d
      if (!cur.meta || !cur.meta.committee_id) cur.meta = r.contributor || cur.meta
      agg.set(cid, cur)
    }
    const li = data.pagination?.last_indexes
    if (!li || results.length < 100) break
    lastIndexes = li
    page++
    await sleep(250)
  }
  return agg
}

async function run() {
  let q = supabase
    .from('cr_politicians')
    .select('id, slug, name, fec_candidate_id')
    .not('fec_candidate_id', 'is', null)
  if (SLUGS) q = q.in('slug', SLUGS)
  const { data: pols, error } = await q
  if (error) {
    console.error('load politicians:', error.message)
    process.exit(1)
  }
  const list = LIMIT ? pols.slice(0, LIMIT) : pols
  console.log(`Processing ${list.length} politicians (cycle ${CYCLE}, key ${FEC_KEY === 'DEMO_KEY' ? 'DEMO' : 'real'})`)

  let totalEdges = 0
  let totalCommittees = 0
  let i = 0
  for (const p of list) {
    i++
    try {
      const cmteId = await fetchPrincipalCommitteeId(p.fec_candidate_id, CYCLE)
      if (!cmteId) {
        console.log(`[${i}/${list.length}] ${p.slug}: no principal committee`)
        continue
      }
      const agg = await fetchPacContributions(cmteId, CYCLE)
      if (agg.size === 0) {
        console.log(`[${i}/${list.length}] ${p.slug}: 0 PAC contributions`)
        continue
      }

      // Upsert committee entities
      const committeeRows = []
      for (const [cid, v] of agg) {
        const m = v.meta || {}
        const orgTypeFull = m.organization_type_full || null
        committeeRows.push({
          committee_id: cid,
          name: v.name,
          committee_type: m.committee_type || null,
          committee_type_full: m.committee_type_full || null,
          designation: m.designation || null,
          designation_full: m.designation_full || null,
          organization_type: m.organization_type || null,
          organization_type_full: orgTypeFull,
          connected_org_name: m.affiliated_committee_name || null,
          is_leadership_pac: m.designation === 'D' || (m.committee_type === 'O'),
          industry_label: classifyCommitteeIndustry(v.name, m.affiliated_committee_name, orgTypeFull),
          party: m.party || null,
          state: m.state || null,
          last_synced_at: new Date().toISOString(),
        })
      }
      const { error: cErr } = await supabase
        .from('cr_committees')
        .upsert(committeeRows, { onConflict: 'committee_id' })
      if (cErr) {
        console.log(`  ! cr_committees: ${cErr.message}`)
        continue
      }
      totalCommittees += committeeRows.length

      // Upsert edges
      const edgeRows = []
      for (const [cid, v] of agg) {
        edgeRows.push({
          committee_id: cid,
          politician_id: p.id,
          recipient_committee_id: cmteId,
          cycle: CYCLE,
          total_amount: v.total,
          contribution_count: v.count,
          last_contribution_date: v.lastDate,
          updated_at: new Date().toISOString(),
        })
      }
      const { error: eErr } = await supabase
        .from('cr_pac_contributions')
        .upsert(edgeRows, { onConflict: 'committee_id,politician_id,cycle' })
      if (eErr) {
        console.log(`  ! cr_pac_contributions: ${eErr.message}`)
        continue
      }
      totalEdges += edgeRows.length
      console.log(`[${i}/${list.length}] ${p.slug}: ${edgeRows.length} PAC edges`)
    } catch (e) {
      console.log(`[${i}/${list.length}] ${p.slug}: ERR ${e.message}`)
    }
    await sleep(300)
  }
  console.log(`\nDone. ${totalEdges} edges, ${totalCommittees} committee upserts (deduped on key).`)
}

run()
