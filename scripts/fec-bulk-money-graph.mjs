#!/usr/bin/env node
//
// scripts/fec-bulk-money-graph.mjs  —  Phase 1: the FEC bulk money graph.
//
// Downloads FEC bulk data and builds the rigorous committee→candidate edge graph.
// This is the keystone for money-to-vote connections: because the SAME giving
// committee_id appears on every candidate a PAC funds, one load gives BOTH
//   - "who funded the sponsor"  (edges where candidate_id = sponsor)
//   - "who else those PACs funded" (other edges sharing the committee_id)
// without any per-candidate API grind. All on stable FEC IDs (no name matching).
//
// Files (per 2-yr cycle YY): bulk-downloads/{YYYY}/
//   pas2{YY}.zip → itpas2.txt  — committee→candidate contributions (the edge)
//   cn{YY}.zip   → cn.txt       — candidate master (names, office, state)
//
// pas2 layout (pipe-delimited, no header):
//   0 CMTE_ID  = the GIVING committee (the filer making the contribution)
//   13 TRANSACTION_DT (MMDDYYYY) | 14 TRANSACTION_AMT (can be negative = refund)
//   15 OTHER_ID = recipient's committee | 16 CAND_ID = recipient candidate
// The real edge is CMTE_ID (giver) → CAND_ID (recipient). We aggregate by
// (CMTE_ID, CAND_ID, cycle) and NET negatives so refunds reduce the total.
//
// Idempotent: upsert on (committee_id, candidate_id, cycle) / candidate_id.
// Re-run-safe; safe to run per-cycle.
//
// Usage:
//   node scripts/fec-bulk-money-graph.mjs --cycle=2024 [--dry-run]
//   node scripts/fec-bulk-money-graph.mjs --cycles=2020,2022,2024,2026

import { createClient } from '@supabase/supabase-js'
import { createWriteStream, createReadStream, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import { execFileSync } from 'node:child_process'
import { pipeline } from 'node:stream/promises'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const cyclesArg = args.find((a) => a.startsWith('--cycles='))?.split('=')[1]
const cycleArg = args.find((a) => a.startsWith('--cycle='))?.split('=')[1]
const CYCLES = (cyclesArg ? cyclesArg.split(',') : [cycleArg || '2024']).map((c) => parseInt(c, 10))

const BULK = (cycle, name) => `https://www.fec.gov/files/bulk-downloads/${cycle}/${name}${String(cycle).slice(2)}.zip`

async function download(url, dest) {
  const r = await fetch(url, { redirect: 'follow' })
  if (!r.ok) throw new Error(`download ${url}: HTTP ${r.status}`)
  await pipeline(r.body, createWriteStream(dest))
}

function unzip(zipPath, outDir) {
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', outDir])
}

const fecDate = (s) => {
  // MMDDYYYY → YYYY-MM-DD
  if (!s || s.length !== 8) return null
  return `${s.slice(4, 8)}-${s.slice(0, 2)}-${s.slice(2, 4)}`
}

async function loadCandidateMaster(txtPath, cycle) {
  // cn.txt layout: 0 CAND_ID | 1 CAND_NAME | 2 CAND_PTY_AFFILIATION | 3 ... |
  //   actual: CAND_ID,CAND_NAME,CAND_PTY_AFFILIATION,CAND_ELECTION_YR,CAND_OFFICE_ST,
  //   CAND_OFFICE,CAND_OFFICE_DISTRICT,...  (office at idx 5, st idx 4, district idx 6)
  const rows = new Map()
  const rl = createInterface({ input: createReadStream(txtPath), crlfDelay: Infinity })
  for await (const line of rl) {
    const f = line.split('|')
    if (!f[0]) continue
    rows.set(f[0], {
      candidate_id: f[0], name: f[1] || null, party: f[2] || null,
      state: f[4] || null, office: f[5] || null, district: f[6] || null,
      updated_at: new Date().toISOString(),
    })
  }
  const arr = [...rows.values()]
  if (DRY) { console.log(`  cn${cycle}: ${arr.length} candidates (dry)`); return arr.length }
  for (let i = 0; i < arr.length; i += 500) {
    const { error } = await supabase.from('cr_fec_candidates').upsert(arr.slice(i, i + 500), { onConflict: 'candidate_id' })
    if (error) console.error('  cand upsert:', error.message)
  }
  return arr.length
}

async function loadPas2(txtPath, cycle) {
  // Aggregate committee→candidate edges in-memory keyed by other_id|cand_id.
  const edges = new Map()
  let parsed = 0
  const rl = createInterface({ input: createReadStream(txtPath), crlfDelay: Infinity })
  for await (const line of rl) {
    const f = line.split('|')
    const giver = f[0]    // CMTE_ID = the GIVING committee (filer)
    const cand = f[16]    // CAND_ID = recipient candidate
    const amt = Number(f[14] || 0)
    if (!giver || !cand || !amt) continue
    // Drop committee-gives-to-its-own-candidate self-loops (PCC internal / JFC pass-
    // through to the candidate's own committee) — not a third-party money connection.
    if (giver === f[15]) continue
    parsed++
    const k = `${giver}|${cand}`
    const e = edges.get(k)
    const d = fecDate(f[13])
    // Net negatives (refunds) into the total; count only positive contributions.
    if (e) { e.total += amt; if (amt > 0) e.count++; if (d && amt > 0 && (!e.last_date || d > e.last_date)) e.last_date = d }
    else edges.set(k, { committee_id: giver, candidate_id: cand, cycle, total: amt, count: amt > 0 ? 1 : 0, last_date: amt > 0 ? d : null })
  }
  // Keep only edges with a positive net total (a real, non-refunded contribution).
  const arr = [...edges.values()]
    .filter((e) => e.total > 0)
    .map((e) => ({ ...e, total: Math.round(e.total * 100) / 100, updated_at: new Date().toISOString() }))
  console.log(`  pas2 ${cycle}: ${parsed} txns → ${arr.length} committee→candidate edges`)
  if (DRY) {
    const top = arr.sort((a, b) => b.total - a.total).slice(0, 3)
    for (const t of top) console.log(`    e.g. ${t.committee_id} → ${t.candidate_id}: $${t.total.toLocaleString()} (${t.count}x)`)
    return arr.length
  }
  for (let i = 0; i < arr.length; i += 1000) {
    const { error } = await supabase.from('cr_pac_to_candidate').upsert(arr.slice(i, i + 1000), { onConflict: 'committee_id,candidate_id,cycle' })
    if (error) console.error('  edge upsert:', error.message)
  }
  return arr.length
}

async function main() {
  console.log(`[${new Date().toISOString()}] FEC bulk money graph — cycles ${CYCLES.join(',')}${DRY ? ' (DRY RUN)' : ''}`)
  for (const cycle of CYCLES) {
    const dir = mkdtempSync(join(tmpdir(), `fec-${cycle}-`))
    try {
      console.log(`\nCycle ${cycle}:`)
      // candidate master
      const cnZip = join(dir, 'cn.zip')
      await download(BULK(cycle, 'cn'), cnZip); unzip(cnZip, dir)
      await loadCandidateMaster(join(dir, 'cn.txt'), cycle)
      // pas2 edges
      const pasZip = join(dir, 'pas2.zip')
      await download(BULK(cycle, 'pas2'), pasZip); unzip(pasZip, dir)
      await loadPas2(join(dir, 'itpas2.txt'), cycle)
    } catch (e) {
      console.error(`  cycle ${cycle} FAILED: ${e.message}`)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  }
  // Backfill bioguide onto cr_fec_candidates from the politician crosswalk.
  if (!DRY) {
    const { data: pols } = await supabase.from('cr_politicians').select('bioguide, fec_candidate_id').not('fec_candidate_id', 'is', null).not('bioguide', 'is', null)
    let linked = 0
    for (const p of (pols || [])) {
      const { error } = await supabase.from('cr_fec_candidates').update({ bioguide: p.bioguide }).eq('candidate_id', p.fec_candidate_id)
      if (!error) linked++
    }
    console.log(`\nLinked bioguide onto ${linked} fec_candidates.`)
  }
  console.log('Done.')
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
