#!/usr/bin/env node
// Seed the directory.politicians and directory.promises tables from seed-data.json
// Usage: npm run seed:profiles

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const T = {
  politicians: 'cr_politicians',
  promises: 'cr_promises',
}

// Today, used to decide whether a term is in progress.
const TODAY = new Date()

// Branch-aware current term computation.
// Promises are graded for the term that begins AFTER the campaign cycle
// that produced them. If that term is still in progress on TODAY, the
// promise is 'pending' (Not Yet Rated). If the politician is a former
// officeholder (in_office_to set), we use that as the term end.
function computeTermForPolitician(p) {
  const branch = (p.branch || '').toLowerCase()
  const since = p.in_office_since ? new Date(p.in_office_since) : null
  const to = p.in_office_to ? new Date(p.in_office_to) : null

  if (!since) return { term_start: null, term_end: null }

  if (to) {
    // Former officeholder: clamp to last known term ending at `to`.
    const lengthYears = branch === 'senate' ? 6 : branch === 'house' ? 2 : 4
    const start = new Date(to)
    start.setFullYear(start.getFullYear() - lengthYears)
    return {
      term_start: start.toISOString().slice(0, 10),
      term_end: to.toISOString().slice(0, 10),
    }
  }

  if (branch === 'senate') {
    const offset = Math.floor((TODAY.getFullYear() - since.getFullYear()) / 6) * 6
    const startYear = since.getFullYear() + offset
    return {
      term_start: `${startYear}-01-03`,
      term_end: `${startYear + 6}-01-03`,
    }
  }
  if (branch === 'house') {
    const y = TODAY.getFullYear() % 2 === 1 ? TODAY.getFullYear() : TODAY.getFullYear() - 1
    return { term_start: `${y}-01-03`, term_end: `${y + 2}-01-03` }
  }
  if (branch === 'president') {
    const offset = Math.floor((TODAY.getFullYear() - since.getFullYear()) / 4) * 4
    const startYear = since.getFullYear() + offset
    return { term_start: `${startYear}-01-20`, term_end: `${startYear + 4}-01-20` }
  }
  if (branch === 'governor') {
    const offset = Math.floor((TODAY.getFullYear() - since.getFullYear()) / 4) * 4
    const start = new Date(since)
    start.setFullYear(start.getFullYear() + offset)
    const end = new Date(start)
    end.setFullYear(end.getFullYear() + 4)
    return {
      term_start: start.toISOString().slice(0, 10),
      term_end: end.toISOString().slice(0, 10),
    }
  }
  // Other (mayors, AGs, etc.) — leave term_end null; verdicts default to 'graded' only
  // for explicitly past tenure.
  return { term_start: p.in_office_since, term_end: null }
}

function deriveVerdictStatus(termEnd) {
  if (!termEnd) return 'graded'
  return new Date(termEnd) > TODAY ? 'pending' : 'graded'
}

const dataPath = join(__dirname, 'seed-data.json')
const trumpPath = join(__dirname, 'seed-trump.json')
const batch20Path = join(__dirname, 'seed-batch-20.json')
const batch15Path = join(__dirname, 'seed-batch-15-standard.json')
const chunk1Path = join(__dirname, 'seed-chunk-1-dem-senators.json')
const bulkPath = join(__dirname, 'seed-bulk-generated.json')
const historicalPath = join(__dirname, 'seed-historical-2016-cycle.json')
const historicalBatch2Path = join(__dirname, 'seed-historical-2016-cycle-batch2.json')
const trump2016Path = join(__dirname, 'seed-trump-2016-cycle.json')
const predecessorsPath = join(__dirname, 'seed-historical-predecessors.json')

const profiles = [
  JSON.parse(readFileSync(trumpPath, 'utf-8')),
  ...JSON.parse(readFileSync(dataPath, 'utf-8')),
  ...JSON.parse(readFileSync(batch20Path, 'utf-8')),
  ...JSON.parse(readFileSync(batch15Path, 'utf-8')),
  ...JSON.parse(readFileSync(chunk1Path, 'utf-8')),
  ...JSON.parse(readFileSync(bulkPath, 'utf-8')),
  ...JSON.parse(readFileSync(historicalPath, 'utf-8')),
  ...JSON.parse(readFileSync(historicalBatch2Path, 'utf-8')),
  ...JSON.parse(readFileSync(predecessorsPath, 'utf-8')),
  ...JSON.parse(readFileSync(trump2016Path, 'utf-8')),
]

console.log(`Seeding ${profiles.length} politicians...`)

let politicianCount = 0
let promiseCount = 0

for (const entry of profiles) {
  const { politician, promises } = entry

  // Compute term scoping once per politician; reused on the promise insert.
  // The seed file may override by passing current_term_start/end explicitly
  // (e.g., Trump's 2016 cycle once SEALED-145 is ingested).
  const computed = computeTermForPolitician(politician)
  const termStart = politician.current_term_start || computed.term_start
  const termEnd = politician.current_term_end || computed.term_end
  const cycleYear = termStart ? Number(termStart.slice(0, 4)) - 1 : null
  const verdictStatus = deriveVerdictStatus(termEnd)
  politician.current_term_start = termStart
  politician.current_term_end = termEnd

  // Upsert politician — preserve review_tier if already set in DB.
  const { data: existing, error: lookupErr } = await supabase
    .from(T.politicians)
    .select('id, review_tier')
    .eq('slug', politician.slug)
    .maybeSingle()
  if (lookupErr) {
    console.error(`Lookup error for ${politician.slug}:`, lookupErr.message)
    continue
  }

  let politicianId
  if (existing) {
    // If the politician already has a review_tier in DB, keep it unless the
    // seed file explicitly overrides. This protects manual UPDATEs (e.g.,
    // promoting standard → full after the 3-pass review runs).
    const updatePayload = { ...politician }
    if (existing.review_tier && !politician.review_tier) {
      delete updatePayload.review_tier
    }
    // Predecessor pointer: protected the same way as review_tier. Seed files
    // generally don't set it (it's edited directly in the DB), so don't
    // overwrite a populated value with a missing one.
    if (!('predecessor_slug' in politician)) {
      delete updatePayload.predecessor_slug
    }
    // Aggregate scorecard fields are derived from cr_promises (respecting
    // graded vs pending). NEVER overwrite them from the seed file, which
    // computed them naively before term-scoping existed. They get recomputed
    // by a post-seed SQL pass.
    delete updatePayload.scorecard_kept
    delete updatePayload.scorecard_partial
    delete updatePayload.scorecard_broken
    delete updatePayload.scorecard_you_decide
    delete updatePayload.scorecard_total
    delete updatePayload.scorecard_pending
    delete updatePayload.scorecard_graded_total
    delete updatePayload.scorecard_percentage_kept
    const { error: updateErr } = await supabase
      .from(T.politicians)
      .update(updatePayload)
      .eq('slug', politician.slug)
    if (updateErr) {
      console.error(`Update error for ${politician.slug}:`, updateErr.message)
      continue
    }
    politicianId = existing.id
    console.log(`  ✓ Updated ${politician.name} (tier: ${updatePayload.review_tier || existing.review_tier})`)
  } else {
    // Strip seed-file scorecard aggregates on insert too — the DB-derived
    // values computed from cr_promises are the source of truth.
    const {
      scorecard_kept: _sk, scorecard_partial: _sp, scorecard_broken: _sb,
      scorecard_you_decide: _syd, scorecard_total: _st, scorecard_pending: _spd,
      scorecard_graded_total: _sgt, scorecard_percentage_kept: _spk,
      ...insertPayload
    } = politician
    const { data: inserted, error: insertErr } = await supabase
      .from(T.politicians)
      .insert({ ...insertPayload, review_tier: politician.review_tier || 'standard' })
      .select('id')
      .single()
    if (insertErr) {
      console.error(`Insert error for ${politician.slug}:`, insertErr.message)
      continue
    }
    politicianId = inserted.id
    console.log(`  ✓ Inserted ${politician.name}`)
  }
  politicianCount++

  // Clear existing promises for this politician (so re-runs are idempotent)
  await supabase.from(T.promises).delete().eq('politician_id', politicianId)

  // Insert promises
  const promiseRows = promises.map((p) => {
    const pTermStart = p.term_start || termStart
    const pTermEnd = p.term_end || termEnd
    const pCycle = p.cycle_year || (pTermStart ? Number(String(pTermStart).slice(0, 4)) - 1 : cycleYear)
    const pVerdictStatus = p.verdict_status || (pTermEnd ? deriveVerdictStatus(pTermEnd) : verdictStatus)
    return {
      politician_id: politicianId,
      promise_number: p.promise_number,
      promise_text: p.promise_text,
      promise_type: p.promise_type || null,
      promise_date: p.promise_date || null,
      promise_source_url: p.promise_source_url || null,
      category: p.category || null,
      verdict: p.verdict,
      verdict_reasoning: p.verdict_reasoning || null,
      case_study_narrative: p.case_study_narrative || null,
      is_featured: Boolean(p.is_featured),
      featured_quadrant: p.featured_quadrant || null,
      term_start: pTermStart,
      term_end: pTermEnd,
      cycle_year: pCycle,
      verdict_status: pVerdictStatus,
    }
  })

  if (promiseRows.length > 0) {
    const { error: promiseErr } = await supabase.from(T.promises).insert(promiseRows)
    if (promiseErr) {
      console.error(`  ✗ Promise insert error for ${politician.slug}:`, promiseErr.message)
    } else {
      promiseCount += promiseRows.length
      console.log(`    → inserted ${promiseRows.length} promises`)
    }
  }
}

console.log(`\nDone. ${politicianCount} politicians, ${promiseCount} promises.`)

// Recompute politician-level scorecard aggregates from cr_promises so
// graded vs pending counts are correct after any seed run.
console.log('\nRecomputing politician scorecard aggregates from cr_promises...')
const { error: rpcErr } = await supabase.rpc('cr_recompute_scorecards')
if (rpcErr) {
  // Fallback: do it inline via select+upsert. Slower but doesn't require
  // creating the RPC function up front.
  console.log(`(no RPC available, recomputing inline: ${rpcErr.message || 'unknown'})`)
  const { data: agg, error: aggErr } = await supabase
    .from('cr_promises')
    .select('politician_id, verdict, verdict_status')
  if (aggErr) {
    console.error('Recompute aggregate fetch failed:', aggErr.message)
  } else {
    const byPol = new Map()
    for (const r of agg) {
      const slot = byPol.get(r.politician_id) || { kept: 0, partial: 0, broken: 0, you_decide: 0, graded_total: 0, pending: 0, total: 0 }
      slot.total += 1
      if (r.verdict_status === 'pending') {
        slot.pending += 1
      } else if (r.verdict_status === 'graded') {
        slot.graded_total += 1
        if (r.verdict === 'KEPT') slot.kept += 1
        else if (r.verdict === 'PARTIAL') slot.partial += 1
        else if (r.verdict === 'BROKEN') slot.broken += 1
        else if (r.verdict === 'YOU_DECIDE') slot.you_decide += 1
      }
      byPol.set(r.politician_id, slot)
    }
    for (const [politician_id, s] of byPol) {
      const pct = s.graded_total > 0 ? Math.round((s.kept / s.graded_total) * 1000) / 10 : null
      await supabase.from('cr_politicians').update({
        scorecard_kept: s.kept,
        scorecard_partial: s.partial,
        scorecard_broken: s.broken,
        scorecard_you_decide: s.you_decide,
        scorecard_total: s.total,
        scorecard_pending: s.pending,
        scorecard_graded_total: s.graded_total,
        scorecard_percentage_kept: pct,
        scorecard_limited_corpus: s.total < 12,
      }).eq('id', politician_id)
    }
    console.log(`Recomputed ${byPol.size} politician scorecards.`)
  }
}
