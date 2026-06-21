#!/usr/bin/env node
//
// scripts/classify-committee-industry.mjs  —  Phase 1b: industry coding for PACs.
//
// Fills cr_committees.industry_label for committees that lack one, by keyword-
// matching the committee NAME + connected_org_name against a sector crosswalk that
// REUSES the taxonomy already in the table (Finance, Oil & Gas, Defense, Big Tech,
// Labor unions, Pharmaceuticals & Healthcare, Real estate, Political organizations)
// plus a few common sectors. Articles say "industry not classified" too often; this
// gives defensible sector attribution where the name makes it unambiguous.
//
// HONESTY RULE (per the FEC-data expert): never guess. A committee only gets a label
// when a keyword clearly implies the sector; otherwise it stays NULL ("Unclassified"
// in the UI) and the article must disclose that. This classifies the OBVIOUS ones
// (e.g. "...BANK...PAC" → Finance) and leaves the rest honestly blank.
//
// Idempotent: only writes committees where industry_label IS NULL (never overwrites
// human/FEC-set labels). Safe to re-run.
//
// Usage:
//   node scripts/classify-committee-industry.mjs [--dry-run] [--overwrite]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry-run')
const OVERWRITE = process.argv.includes('--overwrite')

// Ordered rules: first match wins. Keep keywords specific to avoid false sector
// attribution (the whole point is defensibility). Word-ish boundaries via spaces.
const RULES = [
  ['Labor unions', /\b(union|afl-cio|afscme|teamster|unite here|seiu|uaw|ibew|laborers|carpenters|machinists|firefighters|nea |aft |communication workers|longshore|pipefitters|plumbers|steelworkers)\b/i],
  ['Finance', /\b(bank|bancorp|financial|capital|securities|investment|asset manag|private equity|hedge|insur|visa|mastercard|goldman|morgan|citigroup|wells fargo|blackstone|credit union|mortgage)\b/i],
  ['Oil & Gas', /\b(oil|gas|petroleum|energy|exxon|chevron|conocophillips|marathon|pipeline|drilling|fossil|coal|refin)\b/i],
  ['Big Tech', /\b(tech|google|alphabet|meta|facebook|amazon|microsoft|apple inc|oracle|nvidia|semiconductor|software|internet|silicon|cloud|data)\b/i],
  ['Crypto', /\b(crypto|blockchain|coinbase|bitcoin|digital asset|web3|fairshake)\b/i],
  ['Defense', /\b(defense|defence|lockheed|raytheon|northrop|boeing|general dynamics|aerospace|missile|weapons|l3harris|huntington ingalls)\b/i],
  ['Pharmaceuticals & Healthcare', /\b(pharma|health|hospital|medic|biotech|drug|pfizer|merck|amgen|abbvie|insur.*health|nurses|physician|dental|blue cross)\b/i],
  ['Real estate', /\b(real estate|realtor|realty|property|homebuild|apartment|construction|developer)\b/i],
  ['Agriculture', /\b(farm|agricult|crop|cattle|dairy|poultry|grain|cotton|sugar|ranchers|soybean)\b/i],
  ['Telecom', /\b(telecom|verizon|at&t|comcast|t-mobile|broadband|wireless|cable)\b/i],
  // Political organizations LAST — it's the broadest catch (leadership PACs, party
  // committees, ideological PACs) and we only want it when nothing more specific hit.
  ['Political organizations', /\b(victory fund|leadership pac|for congress|for senate|for america|majority|freedom|patriots|conservative|progressive|democrats|republican|action fund|values|liberty)\b/i],
]

function classify(name, org) {
  const hay = `${name || ''} ${org || ''}`
  for (const [label, re] of RULES) if (re.test(hay)) return label
  return null // honest: unclassified
}

async function selectAll(filter) {
  const out = []
  for (let from = 0; ; from += 1000) {
    let q = supabase.from('cr_committees').select('committee_id, name, connected_org_name, industry_label').range(from, from + 999)
    if (filter) q = filter(q)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

async function main() {
  console.log(`[${new Date().toISOString()}] Classifying committee industries${DRY ? ' (DRY RUN)' : ''}${OVERWRITE ? ' [overwrite]' : ''}`)
  const all = await selectAll(OVERWRITE ? null : (q) => q.is('industry_label', null))
  console.log(`Committees to classify: ${all.length}`)

  const updates = []
  const tally = {}
  for (const c of all) {
    const label = classify(c.name, c.connected_org_name)
    if (label) { updates.push({ committee_id: c.committee_id, industry_label: label }); tally[label] = (tally[label] || 0) + 1 }
  }
  const unclassified = all.length - updates.length
  console.log(`Classified ${updates.length}; left unclassified ${unclassified} (${Math.round(unclassified / all.length * 100)}%).`)
  console.log('By sector:', JSON.stringify(tally))

  if (DRY) {
    console.log('\nSample classifications:')
    for (const u of updates.slice(0, 8)) {
      const c = all.find((x) => x.committee_id === u.committee_id)
      console.log(`  ${u.industry_label.padEnd(28)} ← ${(c.name || '').slice(0, 45)}`)
    }
    console.log('DRY RUN — no writes.')
    return
  }
  for (let i = 0; i < updates.length; i += 200) {
    for (const u of updates.slice(i, i + 200)) {
      const { error } = await supabase.from('cr_committees').update({ industry_label: u.industry_label }).eq('committee_id', u.committee_id)
      if (error) console.error('  update err:', error.message)
    }
  }
  console.log(`Updated ${updates.length} committee industry labels.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
