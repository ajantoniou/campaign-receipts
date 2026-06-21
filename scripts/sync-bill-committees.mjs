#!/usr/bin/env node
//
// scripts/sync-bill-committees.mjs  —  Phase 2a: bill → committee of jurisdiction.
//
// For each bill in cr_bills, fetch its committee referral(s) from Congress.gov and
// write cr_bill_committees. This completes the "gatekeeper of jurisdiction" chain:
// we can now say "Bill B was REFERRED TO Committee C, and sponsor X sits on/chairs
// Committee C" — the bill is actually before that committee, not just a seat the
// sponsor happens to hold.
//
// Maps Congress.gov systemCode (e.g. "sscm00") → the congress-legislators thomas_id
// (e.g. "SSCM") used in cr_congress_committees / cr_committee_assignments, so the
// referral joins to the roster.
//
// Idempotent: upsert on (bill_id, committee_name). Processes bills missing a
// referral first; --all re-checks everything. Throttled for the data.gov key.
//
// Usage:
//   node scripts/sync-bill-committees.mjs [--dry-run] [--limit=N] [--all]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_KEY = process.env.CONGRESS_API_KEY || process.env.FEC_API_KEY // data.gov key works for both
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
if (!API_KEY) { console.error('Missing FEC_API_KEY / CONGRESS_API_KEY (data.gov)'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const ALL = args.includes('--all')
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 150)
const BASE = 'https://api.congress.gov/v3'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(path) {
  const url = `${BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${API_KEY}&format=json`
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { headers: { accept: 'application/json' } })
    if (r.status === 429) { await sleep(2000 * (attempt + 1)); continue }
    if (!r.ok) throw new Error(`congress ${r.status} ${path}`)
    return r.json()
  }
  throw new Error(`congress ${path}: rate-limited`)
}

// Congress.gov systemCode → congress-legislators thomas_id. systemCode is the
// thomas_id lowercased with a trailing "00" for the full committee (subcommittees
// use other suffixes). Upper-case + strip a trailing "00" to recover the thomas_id.
function thomasIdFromSystemCode(code) {
  if (!code) return null
  const up = code.toUpperCase()
  return up.endsWith('00') ? up.slice(0, -2) : up
}

async function selectAllBills() {
  const out = []
  for (let from = 0; ; from += 1000) {
    let q = supabase.from('cr_bills').select('id, congress, bill_type, bill_number').range(from, from + 999)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

async function main() {
  console.log(`[${new Date().toISOString()}] Syncing bill→committee referrals${DRY ? ' (DRY RUN)' : ''}`)
  let bills = await selectAllBills()

  if (!ALL) {
    // Only bills without a referral yet (incremental).
    const { data: have } = await supabase.from('cr_bill_committees').select('bill_id')
    const haveSet = new Set((have || []).map((r) => r.bill_id))
    bills = bills.filter((b) => !haveSet.has(b.id))
  }
  bills = bills.slice(0, LIMIT)
  console.log(`Bills to process: ${bills.length}${ALL ? ' (all)' : ' (missing referral)'}`)

  // Map thomas_id → committee name for validation/joins.
  const { data: ccs } = await supabase.from('cr_congress_committees').select('thomas_id, name, chamber')
  const ccByThomas = new Map((ccs || []).map((c) => [c.thomas_id, c]))

  let processed = 0, withRef = 0, rows = 0
  for (const b of bills) {
    try {
      const d = await api(`/bill/${b.congress}/${b.bill_type}/${b.bill_number}/committees`)
      await sleep(800) // ~75/min, safe under data.gov
      const committees = d.committees || []
      processed++
      if (!committees.length) continue
      withRef++
      const payload = committees.map((c) => {
        const thomas = thomasIdFromSystemCode(c.systemCode)
        const activities = (c.activities || []).map((a) => a.name).join(', ')
        return {
          bill_id: b.id,
          thomas_id: ccByThomas.has(thomas) ? thomas : null,
          committee_name: c.name,
          chamber: (c.chamber || '').toLowerCase() || null,
          activity: activities || null,
          updated_at: new Date().toISOString(),
        }
      })
      if (DRY) {
        console.log(`  ${b.bill_type.toUpperCase()}${b.bill_number}: ${payload.map((p) => `${p.committee_name}${p.thomas_id ? '' : ' [unmapped]'}`).join('; ')}`)
        rows += payload.length
        continue
      }
      for (const p of payload) {
        const { error } = await supabase.from('cr_bill_committees').upsert(p, { onConflict: 'bill_id,committee_name' })
        if (error) console.error(`  upsert ${b.bill_type}${b.bill_number}:`, error.message)
        else rows++
      }
    } catch (e) {
      console.error(`  ${b.bill_type}${b.bill_number}: ${e.message}`)
    }
  }
  console.log(`Processed ${processed} bills, ${withRef} had referrals, ${rows} committee rows ${DRY ? '(dry)' : 'written'}.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
