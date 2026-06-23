#!/usr/bin/env node
//
// scripts/sync-committee-jurisdiction.mjs — the MISSING LINK for NYT-worthy stories.
//
// Maps each congressional committee (THOMAS code) → the industry/industries it
// REGULATES. This is the jurisdiction that makes "gatekeeper" stories real: a
// member who CHAIRS the committee that writes the rules for an industry, while that
// same industry funds them, is a story with a WHY. "Finance touches 180 bills" is not.
//
// Source: public-record committee jurisdictions (House/Senate rules). Hand-curated for
// the 33 standing committees — this is civics, not a guess. Industry labels match the
// existing taxonomy used by classify-committee-industry.mjs / pac_to_bill events.
//
// Writes cr_committee_jurisdiction(thomas_id, committee_name, chamber, industries[]).
// Idempotent: upsert on thomas_id.
//
// Usage: node scripts/sync-committee-jurisdiction.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry-run')

// thomas_id → { name, chamber, industries[] }. industries use the project taxonomy:
// Finance, Big Tech, Defense, Oil & Gas, Pharmaceuticals & Healthcare, Real Estate,
// Crypto, Agriculture, Labor unions, Telecom, Transportation, Energy. A committee may
// regulate several; the gatekeeper match fires when a member's donor industry is in
// the list AND the money is large.
const JURISDICTION = {
  // ── Senate ──
  SSBK: { name: 'Banking, Housing, and Urban Affairs', chamber: 'Senate', industries: ['Finance', 'Real Estate', 'Crypto'] },
  SSFI: { name: 'Finance', chamber: 'Senate', industries: ['Finance', 'Pharmaceuticals & Healthcare', 'Crypto'] }, // taxes, trade, Medicare/Medicaid
  SSCM: { name: 'Commerce, Science, and Transportation', chamber: 'Senate', industries: ['Big Tech', 'Telecom', 'Transportation'] },
  SSAS: { name: 'Armed Services', chamber: 'Senate', industries: ['Defense'] },
  SSEG: { name: 'Energy and Natural Resources', chamber: 'Senate', industries: ['Oil & Gas', 'Energy'] },
  SSEV: { name: 'Environment and Public Works', chamber: 'Senate', industries: ['Oil & Gas', 'Energy', 'Transportation'] },
  SSHR: { name: 'Health, Education, Labor, and Pensions', chamber: 'Senate', industries: ['Pharmaceuticals & Healthcare', 'Labor unions'] },
  SSAF: { name: 'Agriculture, Nutrition, and Forestry', chamber: 'Senate', industries: ['Agriculture', 'Crypto'] }, // CFTC → crypto derivatives
  SSGA: { name: 'Homeland Security and Governmental Affairs', chamber: 'Senate', industries: ['Defense'] },
  // ── House ──
  HSBA: { name: 'Financial Services', chamber: 'House', industries: ['Finance', 'Real Estate', 'Crypto'] },
  HSWM: { name: 'Ways and Means', chamber: 'House', industries: ['Finance', 'Pharmaceuticals & Healthcare'] }, // taxes, trade, Medicare
  HSIF: { name: 'Energy and Commerce', chamber: 'House', industries: ['Big Tech', 'Telecom', 'Pharmaceuticals & Healthcare', 'Oil & Gas', 'Energy'] },
  HSAS: { name: 'Armed Services', chamber: 'House', industries: ['Defense'] },
  HSII: { name: 'Natural Resources', chamber: 'House', industries: ['Oil & Gas', 'Energy'] },
  HSPW: { name: 'Transportation and Infrastructure', chamber: 'House', industries: ['Transportation', 'Real Estate'] },
  HSAG: { name: 'Agriculture', chamber: 'House', industries: ['Agriculture', 'Crypto'] },
  HSED: { name: 'Education and Workforce', chamber: 'House', industries: ['Labor unions'] },
  HSSY: { name: 'Science, Space, and Technology', chamber: 'House', industries: ['Big Tech'] },
  HSHM: { name: 'Homeland Security', chamber: 'House', industries: ['Defense'] },
}

async function main() {
  console.log(`[${new Date().toISOString()}] Committee jurisdiction map${DRY ? ' (DRY RUN)' : ''}`)
  const rows = Object.entries(JURISDICTION).map(([thomas_id, v]) => ({
    thomas_id, committee_name: v.name, chamber: v.chamber, industries: v.industries, updated_at: new Date().toISOString(),
  }))
  console.log(`Committees mapped: ${rows.length}`)
  for (const r of rows) console.log(`  ${r.thomas_id}  ${r.chamber.padEnd(6)} ${r.committee_name}  →  ${r.industries.join(', ')}`)
  if (DRY) { console.log('DRY RUN — nothing written.'); return }
  const { error } = await supabase.from('cr_committee_jurisdiction').upsert(rows, { onConflict: 'thomas_id' })
  if (error) { console.error('upsert error:', error.message); process.exit(1) }
  console.log(`Wrote ${rows.length} committee jurisdictions.`)
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
