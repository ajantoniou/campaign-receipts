#!/usr/bin/env node
// Ingest bills + roll-call votes from Congress.gov for the donor-to-vote
// correlation engine.
//
// Strategy: only ingest bills that received a recorded roll-call vote
// (those are the bills we can score against donor industries). The
// 118th Congress has ~19k bills total but only ~500-700 received
// roll-call votes — that's our target set.
//
// API: api.congress.gov v3, uses our existing data.gov FEC_API_KEY.
// Rate limit: 1000/hr. At ~5 reqs per bill (lookup, votes, sponsors,
// summary) → ~200 bills/hr → 2-3hr for the 119th + 118th congresses.
//
// HOUSE ONLY for v1: Congress.gov v3 API exposes house-vote/{congress}
// but the senate-vote endpoint is not yet published (data lives at
// clerk.senate.gov but isn't surfaced via the v3 API as of 2026). We
// note "Senate alignment data coming soon" in the UI and ship with
// House. Senate adds later when api.congress.gov publishes it.
//
// Usage:
//   node scripts/seed-bills.mjs --congress=119
//   node scripts/seed-bills.mjs --congress=119 --limit=50  (smoke test)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_KEY = process.env.CONGRESS_API_KEY || process.env.FEC_API_KEY // data.gov key works for both

if (!SUPABASE_URL || !SUPABASE_KEY || !API_KEY) {
  console.error('Missing SUPABASE_* or API key env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=')
    return [k, rest.length ? rest.join('=') : true]
  }),
)
const CONGRESS = Number(args.congress || 119)
const LIMIT = args.limit ? Number(args.limit) : null

const BASE = 'https://api.congress.gov/v3'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(path, params = {}) {
  const qs = new URLSearchParams({ api_key: API_KEY, format: 'json', ...params })
  const url = `${BASE}${path}?${qs}`
  const resp = await fetch(url)
  if (resp.status === 429) {
    console.log('  ! rate limited, sleeping 60s')
    await sleep(60_000)
    return api(path, params)
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Congress.gov ${resp.status} ${path}: ${body.slice(0, 200)}`)
  }
  return resp.json()
}

// Load politician bioguide map up front so we don't re-query per vote.
async function buildBioguideMap() {
  // Politicians in cr_politicians have fec_candidate_id but Congress.gov
  // uses bioguide IDs. Map by name where possible — we'll need a more
  // robust crosswalk eventually, but this gets us coverage on the
  // ~310 federal politicians we already have.
  const { data } = await supabase
    .from('cr_politicians')
    .select('id, name, branch, state')
    .in('branch', ['Senate', 'House', 'President'])
  return new Map((data || []).map((p) => [normalizeName(p.name), p]))
}

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Step 1: fetch list of roll-call vote events.
async function fetchRollCallVoteList(chamber) {
  // Only House is exposed via Congress.gov v3 API. Senate returns 404.
  if (chamber !== 'house') return []
  const all = []
  let offset = 0
  const PAGE = 250
  while (true) {
    let data
    try {
      data = await api(`/house-vote/${CONGRESS}`, { limit: PAGE, offset })
    } catch (err) {
      console.log(`  ! ${chamber} vote list fetch failed: ${err.message}`)
      break
    }
    const items = data?.houseRollCallVotes || []
    if (items.length === 0) break
    all.push(...items)
    if (LIMIT && all.length >= LIMIT) break
    if (items.length < PAGE) break
    offset += PAGE
    await sleep(150)
  }
  return LIMIT ? all.slice(0, LIMIT) : all
}

// Step 2: for one vote event, fetch member-level vote rows.
async function fetchMembersForVote(chamber, rollNumber, sessionNumber = 1) {
  if (chamber !== 'house') return []
  const path = `/house-vote/${CONGRESS}/${sessionNumber}/${rollNumber}/members`
  try {
    const data = await api(path)
    // Shape: { houseRollCallVoteMemberVotes: { results: [...] } }
    return data?.houseRollCallVoteMemberVotes?.results || []
  } catch (err) {
    return []
  }
}

// Step 3: dedupe bills referenced by votes, fetch each bill's
// metadata + sponsor.
async function fetchBillDetail(billUrl) {
  if (!billUrl) return null
  try {
    const resp = await fetch(`${billUrl}&api_key=${API_KEY}`)
    if (!resp.ok) return null
    const data = await resp.json()
    return data?.bill || null
  } catch {
    return null
  }
}

function normalizeVote(v) {
  const x = (v || '').toLowerCase()
  if (x === 'yea' || x === 'aye' || x === 'yes') return 'Yea'
  if (x === 'nay' || x === 'no') return 'Nay'
  if (x === 'present') return 'Present'
  return 'Not Voting'
}

async function main() {
  console.log(`# Congress.gov ingest — Congress ${CONGRESS}${LIMIT ? ` (limit ${LIMIT})` : ''}`)
  const polMap = await buildBioguideMap()
  console.log(`Politician map: ${polMap.size} entries`)

  let billsInserted = 0
  let votesInserted = 0
  let votesSkipped = 0

  for (const chamber of ['house', 'senate']) {
    console.log(`\n→ ${chamber} roll-call vote events`)
    const voteEvents = await fetchRollCallVoteList(chamber)
    console.log(`  ${voteEvents.length} vote events`)

    for (const evt of voteEvents) {
      const rollNumber = evt.rollCallNumber || evt.rollNumber
      const sessionNumber = evt.sessionNumber || 1
      // Congress.gov shape: legislationType + legislationNumber + legislationUrl
      const legType = (evt.legislationType || '').toLowerCase()
      const legNumber = evt.legislationNumber ? Number(evt.legislationNumber) : null

      if (!legType || !legNumber) {
        votesSkipped++
        continue
      }

      // Fetch bill metadata via /bill/{congress}/{type}/{number}
      const billApiUrl = `${BASE}/bill/${evt.congress}/${legType}/${legNumber}?format=json&api_key=${API_KEY}`
      let billDetail
      try {
        const resp = await fetch(billApiUrl)
        if (!resp.ok) {
          votesSkipped++
          continue
        }
        billDetail = (await resp.json())?.bill
      } catch {
        votesSkipped++
        continue
      }
      await sleep(120)
      if (!billDetail) {
        votesSkipped++
        continue
      }

      const sponsorBio = billDetail.sponsors?.[0]?.bioguideId || null
      const coSponsorBios = (billDetail.cosponsors?.items || []).map((c) => c.bioguideId).filter(Boolean)

      const billRow = {
        congress: billDetail.congress,
        bill_type: (billDetail.type || legType).toLowerCase(),
        bill_number: Number(billDetail.number || legNumber),
        title: billDetail.title || '(untitled)',
        summary: billDetail.summary || billDetail.summaries?.[0]?.text || null,
        sponsor_bioguide: sponsorBio,
        co_sponsor_bioguides: coSponsorBios,
        status: billDetail.latestAction?.text || null,
        introduced_at: billDetail.introducedDate || null,
        latest_action_at: billDetail.latestAction?.actionDate
          ? new Date(billDetail.latestAction.actionDate).toISOString()
          : null,
        congress_gov_url: evt.legislationUrl || `https://www.congress.gov/bill/${billDetail.congress}/${legType}/${legNumber}`,
      }

      const { data: upserted, error: billErr } = await supabase
        .from('cr_bills')
        .upsert(billRow, { onConflict: 'congress,bill_type,bill_number' })
        .select('id')
        .single()
      if (billErr || !upserted) {
        console.log(`  ! bill upsert failed: ${billErr?.message}`)
        votesSkipped++
        continue
      }
      billsInserted++

      // Now pull member-level votes for this event
      const memberVotes = await fetchMembersForVote(chamber, rollNumber, sessionNumber)
      await sleep(120)

      // Batch-insert member votes for this event (much faster than per-row).
      const voteRows = []
      for (const mv of memberVotes) {
        const bioguide = mv.bioguideID || mv.bioguideId
        const voteVal = normalizeVote(mv.voteCast || mv.vote_position || mv.vote)
        if (!bioguide) continue
        const memberName = normalizeName(`${mv.firstName || ''} ${mv.lastName || ''}`)
        const pol = polMap.get(memberName)
        voteRows.push({
          congress: CONGRESS,
          chamber,
          roll_number: rollNumber,
          voted_at: evt.startDate ? new Date(evt.startDate).toISOString() : null,
          question: evt.voteQuestion || evt.question || null,
          bill_id: upserted.id,
          politician_id: pol?.id || null,
          bioguide,
          vote: voteVal,
        })
      }
      if (voteRows.length > 0) {
        const { error: vErr } = await supabase
          .from('cr_roll_calls')
          .upsert(voteRows, { onConflict: 'congress,chamber,roll_number,bioguide' })
        if (!vErr) votesInserted += voteRows.length
        else console.log(`  ! roll-call batch: ${vErr.message}`)
      }

      if (billsInserted % 25 === 0) {
        console.log(`  …${billsInserted} bills, ${votesInserted} votes`)
      }
    }
  }

  console.log(`\nDone. bills=${billsInserted}, votes=${votesInserted}, skipped=${votesSkipped}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
