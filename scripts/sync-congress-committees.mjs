#!/usr/bin/env node
//
// scripts/sync-congress-committees.mjs
//
// Syncs congressional committees + memberships from the open, maintained
// unitedstates/congress-legislators dataset, and refreshes the bioguide↔FEC
// crosswalk on cr_politicians. This unlocks the "gatekeeper of jurisdiction"
// money-to-vote archetype: does a bill's sponsor sit on the committee with
// jurisdiction, and in what role.
//
// Sources (all public JSON, no key):
//   committees-current.json         — code → name, chamber, jurisdiction, subcommittees
//   committee-membership-current.json — committee code → [{bioguide, title, rank, party}]
//   legislators-current.json        — bioguide ↔ fec[] crosswalk (+ confirms membership)
//
// Idempotent: upserts on stable keys (thomas_id, (thomas_id,bioguide)). Re-run-safe.
//
// Usage: node scripts/sync-congress-committees.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry-run')

const BASE = 'https://unitedstates.github.io/congress-legislators'
async function getJSON(file) {
  const r = await fetch(`${BASE}/${file}`, { headers: { accept: 'application/json' } })
  if (!r.ok) throw new Error(`${file}: HTTP ${r.status}`)
  return r.json()
}

function roleFromTitle(title) {
  if (!title) return 'member'
  const t = title.toLowerCase()
  if (t.includes('chair') && t.includes('vice')) return 'Vice Chair'
  if (t.includes('chair')) return 'Chair'
  if (t.includes('ranking')) return 'Ranking Member'
  return title
}

async function main() {
  console.log(`[${new Date().toISOString()}] Syncing congressional committees${DRY ? ' (DRY RUN)' : ''}`)

  const [committees, membership, legislators] = await Promise.all([
    getJSON('committees-current.json'),
    getJSON('committee-membership-current.json'),
    getJSON('legislators-current.json'),
  ])
  console.log(`Fetched ${committees.length} committees, ${Object.keys(membership).length} rosters, ${legislators.length} legislators.`)

  // 1) Committees (+ subcommittees flattened with parent_id).
  const cRows = []
  for (const c of committees) {
    cRows.push({
      thomas_id: c.thomas_id, parent_id: null, chamber: c.type || null,
      name: c.name, jurisdiction: c.jurisdiction || null,
      jurisdiction_source: c.jurisdiction_source || null, updated_at: new Date().toISOString(),
    })
    for (const sub of (c.subcommittees || [])) {
      cRows.push({
        thomas_id: c.thomas_id + sub.thomas_id, parent_id: c.thomas_id,
        chamber: c.type || null, name: `${c.name}: ${sub.name}`,
        jurisdiction: null, jurisdiction_source: null, updated_at: new Date().toISOString(),
      })
    }
  }

  // 2) Assignments from the membership map (keys are committee/subcommittee codes).
  const aRows = []
  for (const [code, members] of Object.entries(membership)) {
    for (const m of (members || [])) {
      if (!m.bioguide) continue
      aRows.push({
        thomas_id: code, bioguide: m.bioguide, party: m.party || null,
        role: roleFromTitle(m.title), rank: m.rank ?? null, updated_at: new Date().toISOString(),
      })
    }
  }

  // 3) bioguide↔FEC crosswalk refresh for cr_politicians missing an fec id.
  const fecByBioguide = new Map()
  for (const l of legislators) {
    const bio = l.id?.bioguide
    const fec = l.id?.fec
    if (bio && Array.isArray(fec) && fec.length) fecByBioguide.set(bio, fec[fec.length - 1]) // most recent
  }

  if (DRY) {
    console.log(`Would upsert ${cRows.length} committees, ${aRows.length} assignments.`)
    console.log(`Crosswalk available for ${fecByBioguide.size} bioguides.`)
    const chairs = aRows.filter((a) => a.role === 'Chair').length
    console.log(`Sample roles: ${chairs} chairs across all committees/subcommittees.`)
    console.log('DRY RUN — no writes.')
    return
  }

  // Upsert committees first (assignments FK to them). Only insert assignments whose
  // committee code we actually have a row for (avoid FK violations on stray codes).
  for (let i = 0; i < cRows.length; i += 500) {
    const { error } = await supabase.from('cr_congress_committees').upsert(cRows.slice(i, i + 500), { onConflict: 'thomas_id' })
    if (error) console.error('committee upsert:', error.message)
  }
  const validCodes = new Set(cRows.map((c) => c.thomas_id))
  const validAssigns = aRows.filter((a) => validCodes.has(a.thomas_id))
  const dropped = aRows.length - validAssigns.length
  for (let i = 0; i < validAssigns.length; i += 500) {
    const { error } = await supabase.from('cr_committee_assignments').upsert(validAssigns.slice(i, i + 500), { onConflict: 'thomas_id,bioguide' })
    if (error) console.error('assignment upsert:', error.message)
  }

  // Backfill fec_candidate_id where missing.
  let fixed = 0
  const { data: pols } = await supabase.from('cr_politicians').select('id, bioguide, fec_candidate_id').not('bioguide', 'is', null)
  for (const p of (pols || [])) {
    if (p.fec_candidate_id) continue
    const fec = fecByBioguide.get(p.bioguide)
    if (fec) {
      const { error } = await supabase.from('cr_politicians').update({ fec_candidate_id: fec }).eq('id', p.id)
      if (!error) fixed++
    }
  }

  console.log(`Upserted ${cRows.length} committees, ${validAssigns.length} assignments (${dropped} dropped: code not in committee list).`)
  console.log(`Backfilled fec_candidate_id for ${fixed} politicians.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
