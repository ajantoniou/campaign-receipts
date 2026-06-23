#!/usr/bin/env node
//
// scripts/classify-donor-industry.mjs — tag NAMED donor employers by industry.
//
// The exposé chain needs: "[named industry-Y companies] funded X". This classifies
// the named-employer donors in cr_money_events (donor_to_politician) into the SAME
// industry taxonomy used for committees/PACs (so a donor industry can match a bill's
// beneficiary industry). HONESTY RULE (per the FEC-data expert): never guess — a donor
// is labeled only on a clear keyword hit; occupation codes stay unclassified.
//
// Writes cr_donor_industry(donor_key, donor_name, industry). Idempotent upsert.
//
// Usage: node scripts/classify-donor-industry.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry-run')

// SAME taxonomy + labels as classify-committee-industry.mjs (kept in sync so the
// exposé match compares like-for-like). Order matters: specific before broad.
const RULES = [
  // Transportation FIRST so "Union Pacific" (railroad) isn't caught by "union".
  ['Transportation', /\b(airlines?|aviation|american airlines|delta air|united airlines|southwest airlines|union pacific|norfolk southern|csx|burlington northern|railroad|fedex|ups inc|trucking|maritime)\b/i],
  ['Labor unions', /\b(labor union|afl-cio|afscme|teamster|unite here|seiu|uaw|ibew|laborers|carpenters|machinists|firefighters|nea |aft |communication workers|longshore|pipefitters|plumbers|steelworkers|\bunion\b)\b/i],
  ['Finance', /\b(bank|bancorp|financial|capital|securities|investment|asset manag|private equity|hedge|insur|visa|mastercard|goldman|morgan|citigroup|wells fargo|blackstone|apollo|blackrock|kkr|carlyle|credit union|mortgage)\b/i],
  ['Oil & Gas', /\b(oil|gas|petroleum|exxon|chevron|conocophillips|marathon|pipeline|drilling|fossil|coal|refin|diamondback|halliburton)\b/i],
  ['Big Tech', /\b(google|alphabet|meta|facebook|amazon|microsoft|apple inc|oracle|nvidia|qualcomm|semiconductor|software|internet|silicon|cloud computing|salesforce|palantir|tiktok|bytedance)\b/i],
  ['Crypto', /\b(crypto|blockchain|coinbase|bitcoin|digital asset|web3|fairshake|ripple|kraken)\b/i],
  ['Defense', /\b(defense|defence|lockheed|raytheon|northrop|boeing|general dynamics|general atomics|aerospace|missile|weapons|l3harris|huntington ingalls|anduril)\b/i],
  ['Pharmaceuticals & Healthcare', /\b(pharma|hospital|medic|biotech|\bdrug\b|pfizer|merck|amgen|abbvie|eli lilly|johnson & johnson|nurses|physician|dental|blue cross|health system|healthcare)\b/i],
  ['Real estate', /\b(real estate|realtor|realty|property|homebuild|apartment|developer|related companies)\b/i],
  ['Agriculture', /\b(farm|agricult|crop|cattle|dairy|poultry|grain|cotton|sugar|ranchers|soybean|cargill)\b/i],
  ['Telecom', /\b(telecom|verizon|at&t|comcast|t-mobile|broadband|wireless|cable|charter communications)\b/i],
  ['Transportation', /\b(airlines?|aviation|american airlines|delta air|united airlines|southwest airlines|boeing|union pacific|railroad|fedex|ups |trucking|maritime)\b/i],
]
// Occupation codes / non-employer names → never an industry.
const OCCUPATION = /^(self-?employed|self employed|self|homemaker|retired|retried|individual|none|not employed|unemployed|entrepreneur|ceo|president|owner|investor|attorney|consultant|physician|executive|information requested|requested|best efforts|na|n\/a|not applicable|refused)\b/i

function classify(name) {
  const n = String(name || '').trim()
  if (!n || OCCUPATION.test(n)) return null
  for (const [label, re] of RULES) if (re.test(n)) return label
  return null // honest: unclassified named employer
}

async function selectAllDonors() {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('cr_money_events').select('entity_key').eq('entity_type', 'donor_to_politician').range(from, from + 999)
    if (error) throw new Error(error.message)
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

async function main() {
  console.log(`[${new Date().toISOString()}] Classifying donor industries${DRY ? ' (DRY RUN)' : ''}`)
  const rows = await selectAllDonors()
  // distinct donor names from entity_key "...|donor:{name}|cyc:..."
  const names = new Map() // name → donor_key (the bare name)
  for (const r of rows) {
    const m = String(r.entity_key).match(/donor:([^|]+)/)
    if (m) { const nm = m[1].trim().toLowerCase(); if (!names.has(nm)) names.set(nm, nm) }
  }
  const classified = []
  for (const nm of names.keys()) { const ind = classify(nm); if (ind) classified.push({ donor_key: nm, donor_name: nm, industry: ind, updated_at: new Date().toISOString() }) }
  const tally = {}
  for (const c of classified) tally[c.industry] = (tally[c.industry] || 0) + 1
  console.log(`Distinct named donors: ${names.size} · classified: ${classified.length}`)
  console.log('By industry:', JSON.stringify(tally))
  console.log('Samples:', classified.slice(0, 12).map((c) => `${c.donor_name}=${c.industry}`).join(' | '))
  if (DRY) { console.log('DRY RUN — nothing written.'); return }
  // upsert in chunks
  for (let i = 0; i < classified.length; i += 500) {
    const { error } = await supabase.from('cr_donor_industry').upsert(classified.slice(i, i + 500), { onConflict: 'donor_key' })
    if (error) { console.error('upsert error:', error.message); process.exit(1) }
  }
  console.log(`Wrote ${classified.length} donor→industry rows.`)
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
