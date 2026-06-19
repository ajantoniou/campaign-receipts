#!/usr/bin/env node
// Backfill cr_politicians.bioguide via Congress.gov members API.
//
// Why: name-based matching of roll-call votes to our politician corpus
// gave us 13% coverage. Bioguide is the canonical Congress.gov ID.
// Once backfilled, roll-call → politician joins are exact.
//
// Strategy:
//   1. Fetch all current congressional members (both chambers, last 3
//      congresses) from Congress.gov /member endpoint.
//   2. Match by (firstName + lastName, state, branch) to our cr_politicians.
//   3. Update cr_politicians.bioguide.
//   4. Update cr_roll_calls.politician_id where it was null but the
//      bioguide is now mapped.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_KEY = process.env.CONGRESS_API_KEY || process.env.FEC_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY || !API_KEY) {
  console.error('Missing env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const BASE = 'https://api.congress.gov/v3'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function norm(s) {
  return (s || '').toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
}

// Full state name → 2-letter code (Congress.gov returns full names).
const STATE_TO_CODE = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA','colorado':'CO',
  'connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA','hawaii':'HI','idaho':'ID',
  'illinois':'IL','indiana':'IN','iowa':'IA','kansas':'KS','kentucky':'KY','louisiana':'LA',
  'maine':'ME','maryland':'MD','massachusetts':'MA','michigan':'MI','minnesota':'MN',
  'mississippi':'MS','missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV',
  'new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC',
  'north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR','pennsylvania':'PA',
  'rhode island':'RI','south carolina':'SC','south dakota':'SD','tennessee':'TN','texas':'TX',
  'utah':'UT','vermont':'VT','virginia':'VA','washington':'WA','west virginia':'WV',
  'wisconsin':'WI','wyoming':'WY','district of columbia':'DC',
}

async function api(path, params = {}) {
  const qs = new URLSearchParams({ api_key: API_KEY, format: 'json', ...params })
  const url = `${BASE}${path}?${qs}`
  const resp = await fetch(url)
  if (resp.status === 429) {
    await sleep(60_000)
    return api(path, params)
  }
  if (!resp.ok) throw new Error(`Congress.gov ${resp.status} ${path}`)
  return resp.json()
}

async function fetchAllMembers() {
  // /member returns ALL members across all congresses, paginated 250/page.
  // Most recent congresses first when sorted by updateDate desc.
  const all = []
  let offset = 0
  while (true) {
    const data = await api('/member', { limit: 250, offset, currentMember: 'true' })
    const items = data?.members || []
    if (items.length === 0) break
    all.push(...items)
    if (items.length < 250) break
    offset += 250
    await sleep(150)
  }
  return all
}

async function main() {
  console.log('# Backfill bioguide IDs')
  const members = await fetchAllMembers()
  console.log(`Fetched ${members.length} current members from Congress.gov`)

  const { data: pols } = await supabase
    .from('cr_politicians')
    .select('id, name, branch, state, bioguide')
    .in('branch', ['Senate', 'House', 'President'])
  console.log(`${pols.length} federal politicians in cr_politicians`)

  // Build lookup tables for tolerant matching. Congress.gov returns
  // `name` as "Last, First Middle" and `state` as full state name.
  const memberByKey = new Map()
  for (const m of members) {
    // Parse "Last, First Middle..." → lastName + firstName
    const nameParts = (m.name || '').split(',').map((s) => s.trim())
    const lastName = nameParts[0] || ''
    const firstNameAndMore = (nameParts[1] || '').split(/\s+/)
    const firstName = firstNameAndMore[0] || ''
    const state = STATE_TO_CODE[(m.state || '').toLowerCase()] || ''
    if (!state || !lastName) continue
    // chamber is "House of Representatives" or "Senate"
    const chamberRaw = m.terms?.item?.[0]?.chamber || ''
    const branch = chamberRaw === 'Senate' ? 'Senate' : 'House'
    const key1 = `${norm(lastName)}|${state}|${branch}`
    const key2 = `${norm(firstName + ' ' + lastName)}|${state}`
    const key3 = `${norm(firstName + ' ' + lastName)}` // last-resort match when our state value differs
    if (!memberByKey.has(key1)) memberByKey.set(key1, m.bioguideId)
    if (!memberByKey.has(key2)) memberByKey.set(key2, m.bioguideId)
    if (!memberByKey.has(key3)) memberByKey.set(key3, m.bioguideId)
  }
  console.log(`Built ${memberByKey.size} bioguide lookup keys`)

  let updated = 0
  for (const p of pols) {
    if (p.bioguide) continue
    const parts = p.name.trim().split(/\s+/)
    const firstName = parts[0]
    const lastName = parts[parts.length - 1]
    const k1 = `${norm(lastName)}|${p.state}|${p.branch}`
    const k2 = `${norm(firstName + ' ' + lastName)}|${p.state}`
    const k3 = `${norm(firstName + ' ' + lastName)}`
    const bioguide = memberByKey.get(k1) || memberByKey.get(k2) || memberByKey.get(k3)
    if (!bioguide) continue
    const { error } = await supabase
      .from('cr_politicians')
      .update({ bioguide })
      .eq('id', p.id)
    if (!error) {
      updated++
      console.log(`  ✓ ${p.name} (${p.state}-${p.branch[0]}) → ${bioguide}`)
    }
  }

  console.log(`\nBackfilled ${updated} bioguide IDs.`)
  console.log('Now joining cr_roll_calls.politician_id by bioguide…')

  // Join: pull bioguide→politician_id map, update cr_roll_calls in batches.
  const { data: polWithBio } = await supabase
    .from('cr_politicians')
    .select('id, bioguide')
    .not('bioguide', 'is', null)
  const bioMap = new Map((polWithBio || []).map((r) => [r.bioguide, r.id]))

  let joined = 0
  for (const [bioguide, polId] of bioMap) {
    const { error: uErr, count } = await supabase
      .from('cr_roll_calls')
      .update({ politician_id: polId }, { count: 'exact' })
      .eq('bioguide', bioguide)
      .is('politician_id', null)
    if (!uErr && count) joined += count
  }

  console.log(`Linked ${joined} previously-unmatched roll-call rows to politicians.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
