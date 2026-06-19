#!/usr/bin/env node
// FEC Schedule-E independent-expenditure sourcing for a race card.
//
// Given an FEC candidate id (or a name to search) and a cycle, prints the
// committees that spent FOR or AGAINST that candidate, with EXACT dollar totals
// and committee ids — the verified raw material for a `cr_races.top_pacs`
// "Who Paid to Beat Them" card.
//
// WHY THIS IS A SOURCING TOOL, NOT AN AUTO-WRITER:
//   cr_races.top_pacs is a CURATED content asset (rounded narrative dollars,
//   human-written affiliation labels, editorial support_oppose framing). FEC
//   Schedule E gives raw per-committee totals that must be editorially mapped
//   to candidates and labeled before they ship. Auto-overwriting curated cards
//   with raw FEC rows would DEGRADE trusted content. So this script PRINTS
//   verified data for an editor to build a card from; it never writes top_pacs.
//
// Usage:
//   node scripts/fec-race-ie.mjs --candidate H8MO01143 --cycle 2024
//   node scripts/fec-race-ie.mjs --name "Cori Bush" --office H --cycle 2024
//
// Requires FEC_API_KEY in env (from monorepo root .env).

const KEY = process.env.FEC_API_KEY
if (!KEY) { console.error('Missing FEC_API_KEY'); process.exit(1) }
const BASE = 'https://api.open.fec.gov/v1'

function arg(flag, def) {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : def
}

async function fecGet(path, params) {
  const url = new URL(BASE + path)
  url.searchParams.set('api_key', KEY)
  for (const [k, v] of Object.entries(params || {})) if (v != null) url.searchParams.set(k, v)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FEC ${path} -> ${res.status}: ${await res.text()}`)
  return res.json()
}

async function resolveCandidate(name, office) {
  const j = await fecGet('/candidates/search/', { q: name, office, per_page: 5 })
  const r = (j.results || [])[0]
  if (!r) throw new Error(`No FEC candidate match for "${name}"`)
  console.error(`# resolved "${name}" -> ${r.candidate_id} (${r.name}, ${r.state}${r.district || ''})`)
  return r.candidate_id
}

async function main() {
  const cycle = arg('--cycle', '2024')
  let candidate = arg('--candidate')
  const name = arg('--name')
  const office = arg('--office', 'H').toLowerCase() === 's' ? 'senate'
    : arg('--office', 'H').toLowerCase() === 'h' ? 'house' : arg('--office', 'H')
  if (!candidate && name) candidate = await resolveCandidate(name, office)
  if (!candidate) { console.error('Provide --candidate <FEC id> or --name "<name>"'); process.exit(1) }

  const j = await fecGet('/schedules/schedule_e/by_candidate/', {
    candidate_id: candidate, cycle, election_full: 'true', per_page: 50, sort: '-total',
  })
  const rows = (j.results || []).filter((r) => Number(r.total) > 0)
  if (rows.length === 0) { console.error('No Schedule E IE rows for this candidate/cycle.'); return }

  console.log(`# Independent expenditures targeting ${candidate}, cycle ${cycle}`)
  console.log(`# direction  amount        committee_id  committee_name`)
  for (const r of rows) {
    const dir = r.support_oppose_indicator === 'O' ? 'AGAINST' : r.support_oppose_indicator === 'S' ? 'FOR    ' : '?      '
    const amt = ('$' + Math.round(Number(r.total)).toLocaleString()).padEnd(13)
    console.log(`${dir}  ${amt} ${r.committee_id}  ${r.committee_name || ''}`)
  }
  console.log(`# ${rows.length} committees. Editor: build the top_pacs card from the FOR/AGAINST rows above (cite committee_id).`)
}

main().catch((e) => { console.error(e); process.exit(1) })
