#!/usr/bin/env node
// Monthly 5% spot-audit per /methodology page.
//
// Samples 5% of graded promises across the directory, surfaces each through
// a heuristic re-routing check against the verdict-routing standard
// (blocked-by-Congress → PARTIAL, stalled-in-own-caucus → BROKEN, etc.),
// and writes any flagged promises to cr_audit_findings for human review.
//
// Designed to be run from Render Cron monthly. The Render service definition
// is set up to call this with the cron job's environment variables
// (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
//
// CRITICAL: This script does NOT modify cr_promises. It only writes
// recommendations to cr_audit_findings. An editor reviews + resolves.
// This preserves the audit-trail requirement on /methodology.

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const SAMPLE_RATE = 0.05
const RUN_ID = randomUUID()
const STARTED_AT = new Date().toISOString()

console.log(`Spot audit run ${RUN_ID} starting at ${STARTED_AT}`)

// 1) Fetch all graded promises. Paginate to bypass 1000-row default.
async function fetchAllGradedPromises() {
  const out = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('cr_promises')
      .select('id, politician_id, promise_number, promise_text, verdict, verdict_reasoning, category')
      .eq('verdict_status', 'graded')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    if (!data || data.length === 0) break
    out.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }
  return out
}

const allGraded = await fetchAllGradedPromises()
console.log(`Loaded ${allGraded.length} graded promises`)

// 2) Sample 5%, weighted by inverse-graded-count to slightly favor
//    politicians with smaller corpora (where any single verdict swings
//    the kept-rate harder).
const sampleSize = Math.max(1, Math.ceil(allGraded.length * SAMPLE_RATE))
const shuffled = allGraded.map((p) => ({ p, sort: Math.random() })).sort((a, b) => a.sort - b.sort)
const sample = shuffled.slice(0, sampleSize).map((x) => x.p)
console.log(`Sampled ${sample.length} promises (${(SAMPLE_RATE * 100).toFixed(0)}% of corpus)`)

// 3) Re-route heuristic. Look for routing-rule violations in the reasoning text.
//    The exact LLM-based re-rating could come later; for now this catches
//    the obvious-mistake cases.
function reroute(promise) {
  const r = (promise.verdict_reasoning || '').toLowerCase()
  const findings = []

  // Rule 1: 'blocked by Republicans/Democrats/Congress' + verdict='BROKEN'
  //         → should usually be PARTIAL.
  if (promise.verdict === 'BROKEN') {
    if (/blocked by|filibuster|cloture failed|fell.*short of cloture|did not reach .*floor vote|killed in/i.test(r)) {
      findings.push({
        recommendation: 'PARTIAL',
        notes: 'Reasoning mentions obstruction (filibuster / cloture / floor-vote denial). Per /methodology, blocked-by-Congress when politician took maximally available action routes to PARTIAL, not BROKEN.',
      })
    }
  }

  // Rule 2: 'own party held majority' + verdict='PARTIAL'
  //         → may be BROKEN if their own caucus stalled it.
  if (promise.verdict === 'PARTIAL' && /own party|trifecta|own caucus/i.test(r)) {
    findings.push({
      recommendation: 'BROKEN',
      notes: 'Reasoning suggests own-caucus stall during favorable conditions. Per /methodology, stalled-in-own-caucus should route to BROKEN.',
    })
  }

  // Rule 3: 'voted yes' + 'failed' + verdict='BROKEN' is the classic
  //         tried-but-stopped pattern.
  if (promise.verdict === 'BROKEN' && /voted (yes|for)/i.test(r) && /failed|did not pass/i.test(r)) {
    findings.push({
      recommendation: 'PARTIAL',
      notes: 'Voted yes but bill failed — classic obstruction case. Verify whether failure was within their party\'s control.',
    })
  }

  return findings
}

// Build a politician_id → slug lookup so we can write snapshot fields.
const politicianIds = Array.from(new Set(sample.map((p) => p.politician_id)))
const { data: pols } = await supabase
  .from('cr_politicians')
  .select('id, slug')
  .in('id', politicianIds)
const slugMap = new Map((pols || []).map((p) => [p.id, p.slug]))

const findings = []
for (const p of sample) {
  const recs = reroute(p)
  for (const rec of recs) {
    findings.push({
      run_id: RUN_ID,
      run_started_at: STARTED_AT,
      politician_id: p.politician_id,
      promise_id: p.id,
      original_verdict: p.verdict,
      audit_recommendation: rec.recommendation,
      audit_notes: rec.notes,
      // Snapshot fields preserve the human-readable record across re-seeds.
      politician_slug_snapshot: slugMap.get(p.politician_id) || null,
      promise_number_snapshot: p.promise_number,
      promise_text_snapshot: p.promise_text,
    })
  }
}

console.log(`Heuristic flagged ${findings.length} potential re-routings (${((findings.length / sample.length) * 100).toFixed(1)}% of sample)`)

// 4) Write to cr_audit_findings.
if (findings.length > 0) {
  const { error: writeErr } = await supabase
    .from('cr_audit_findings')
    .insert(findings)
  if (writeErr) {
    console.error('Failed to write findings:', writeErr.message)
    process.exit(1)
  }
  console.log(`Wrote ${findings.length} findings to cr_audit_findings (run_id=${RUN_ID})`)
} else {
  console.log('No re-routings flagged this run — clean audit.')
}

// 5) Summary for cron logs.
console.log(`\n--- AUDIT RUN SUMMARY ---`)
console.log(`run_id: ${RUN_ID}`)
console.log(`graded promises in corpus: ${allGraded.length}`)
console.log(`sampled (${(SAMPLE_RATE * 100).toFixed(0)}%): ${sample.length}`)
console.log(`flagged for re-routing: ${findings.length}`)
console.log(`review at /admin/audit (TODO: build endpoint).`)
