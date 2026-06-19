#!/usr/bin/env node
// Hand-tagged industry positions for high-confidence bills.
//
// Each row: "industry X's stance on this bill is support|oppose"
// based on public lobbying records, trade-association statements,
// and published analyses. These are the bills where the alignment
// score is journalist-citable.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const SEEDS = [
  { titleSubstr: 'national defense authorization act for fiscal year 2026', positions: [
    { industry: 'Defense', position: 'support', source: 'AIA + major defense contractors consistently support NDAA' }] },
  { titleSubstr: 'department of defense appropriations act, 2026', positions: [
    { industry: 'Defense', position: 'support', source: 'AIA + defense contractors support DoD appropriations' }] },
  { titleSubstr: 'protecting american energy production act', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'API + IPAA lobbying records' }] },
  { titleSubstr: 'national coal council reestablishment act', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'National Mining Association advocacy' }] },
  { titleSubstr: 'promoting cross-border energy infrastructure act', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'INGAA + API testimony' }] },
  { titleSubstr: 'mining regulatory clarity act', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'NMA supportive testimony' }] },
  { titleSubstr: 'electric supply chain act', positions: [
    { industry: 'Big Tech', position: 'support', source: 'Semiconductor + grid-tech industry support' }] },
  { titleSubstr: 'made-in-america defense act', positions: [
    { industry: 'Defense', position: 'support', source: 'Domestic defense contractors support' }] },
  { titleSubstr: 'do no harm in medicaid act', positions: [
    { industry: 'Pharmaceuticals & Healthcare', position: 'oppose', source: 'AHIP + hospital associations oppose Medicaid cuts' }] },
  { titleSubstr: 'homeowner energy freedom act', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'Gas utilities favor electrification rollback' },
    { industry: 'Big Tech', position: 'oppose', source: 'EV + clean energy firms oppose rollback' }] },
  { titleSubstr: 'advanced clean cars ii', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'API + AFPM advocacy against CA EV mandate' },
    { industry: 'Big Tech', position: 'oppose', source: 'EV manufacturers (Tesla, Rivian) opposed disapproval' }] },
  { titleSubstr: 'advanced clean trucks', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'API + trucking-fuel coalition' },
    { industry: 'Big Tech', position: 'oppose', source: 'Clean-tech + EV-truck makers opposed' }] },
  { titleSubstr: 'coastal plain oil and gas leasing program', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'Disapproval reverses BLM restrictions; oil&gas supports leasing' }] },
  { titleSubstr: 'overdraft lending: very large financial institutions', positions: [
    { industry: 'Finance', position: 'support', source: 'ABA + bank lobby support disapproval of overdraft limits' }] },
  { titleSubstr: 'bank merger act', positions: [
    { industry: 'Finance', position: 'support', source: 'BPI + ABA support looser merger review' }] },
  { titleSubstr: 'defining larger participants of a market for general-use digital consumer payment', positions: [
    { industry: 'Big Tech', position: 'support', source: 'Apple + Google + payment-app companies support disapproval' },
    { industry: 'Crypto', position: 'support', source: 'Crypto payment apps support disapproval' }] },
  { titleSubstr: 'continuing appropriations', positions: [
    { industry: 'Defense', position: 'support', source: 'Defense contractors broadly support CR passage' },
    { industry: 'Pharmaceuticals & Healthcare', position: 'support', source: 'Healthcare providers depend on continued funding' }] },
  { titleSubstr: 'energy organization act', positions: [
    { industry: 'Oil & Gas', position: 'support', source: 'Critical-minerals supply chain favors fossil + mining' }] },
  { titleSubstr: 'regulation of payment stablecoins', positions: [
    { industry: 'Crypto', position: 'support', source: 'Coinbase, Circle, Blockchain Association support stablecoin clarity' },
    { industry: 'Finance', position: 'mixed', source: 'Bank lobby divided' }] },
  { titleSubstr: 'regulation of the offer and sale of digital commodities', positions: [
    { industry: 'Crypto', position: 'support', source: 'Crypto exchanges + Blockchain Association support market-structure clarity' }] },
  { titleSubstr: 'born-alive abortion survivors', positions: [
    { industry: 'Pharmaceuticals & Healthcare', position: 'oppose', source: 'ACOG + major hospital associations oppose criminalization' }] },
]

async function main() {
  const { data: bills } = await supabase.from('cr_bills').select('id, title')
  console.log(`# Tagging industry positions across ${bills.length} bills`)
  const rows = []
  let matched = 0
  for (const seed of SEEDS) {
    const sub = seed.titleSubstr.toLowerCase()
    const hits = bills.filter((b) => (b.title || '').toLowerCase().includes(sub))
    if (hits.length === 0) {
      console.log(`  ? no bills matched: "${seed.titleSubstr}"`)
      continue
    }
    matched += hits.length
    for (const b of hits) {
      for (const p of seed.positions) {
        rows.push({
          bill_id: b.id,
          industry_label: p.industry,
          position: p.position,
          is_human_verified: true,
          source: p.source,
        })
      }
    }
  }
  console.log(`Matched ${matched} bills → ${rows.length} position tags (pre-dedupe)`)
  // Dedupe on (bill_id, industry_label) — last write wins per key.
  const dedup = new Map()
  for (const r of rows) dedup.set(`${r.bill_id}|${r.industry_label}`, r)
  const unique = Array.from(dedup.values())
  console.log(`After dedupe: ${unique.length} unique rows`)
  if (unique.length === 0) return
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100)
    const { error } = await supabase
      .from('cr_bill_industry_positions')
      .upsert(batch, { onConflict: 'bill_id,industry_label' })
    if (error) console.log(`  ! batch ${i}: ${error.message}`)
  }
  console.log(`✓ Tagged.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
