#!/usr/bin/env node
//
// scripts/detect-new-connections.mjs  —  Stage C+D of the Friday Receipts engine.
//
// Reads the append-only cr_money_events journal, finds connections that are NEW
// this week (first_seen_week == this Monday) OR materially grown (delta >= floor),
// scores them, dedupes vs already-written articles, enforces >=1 per branch, takes
// the top ~8, and writes them to cr_story_candidates for the Opus article stage.
//
// Branch mapping (cr_politicians.branch -> newsletter branch):
//   President -> Executive ; House -> House ; Senate -> Senate ;
//   Governor/Mayor -> States ; Other/null -> States (catch-all)
//
// Score (additive, log-compressed dollars):
//   log10(amount+1)*40 + (new?300:0) + min(delta/10000,200)
//   + (foreign?250:0) + alignment_extremity*150 + (pac_to_bill?120:0)
//
// Idempotent: clears + rewrites this week's cr_story_candidates; writes
// cr_weekly_runs.stage_detect. Safe to re-run.
//
// Usage:
//   node scripts/detect-new-connections.mjs            # write candidates
//   node scripts/detect-new-connections.mjs --dry-run  # print, no writes
//   node scripts/detect-new-connections.mjs --week-of=YYYY-MM-DD

import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-of='))?.split('=')[1]

const GROWTH_FLOOR = Number(process.env.DETECT_GROWTH_FLOOR ?? 250000) // $ delta to count "notable growth"
const TARGET = Number(process.env.DETECT_TARGET ?? 8)                  // candidates to emit

// Generic catch-all buckets that aren't a money-influence STORY (e.g. "Individual
// / Retired" is $5.8B of aggregate small-dollar giving, not a connection). A
// pac_to_bill event whose industry is one of these is dropped; donor_to_politician
// with a generic donor name is also dropped.
const GENERIC_LABELS = new Set([
  'individual / retired', 'individual', 'retired', 'uncategorized', 'unknown',
  'other', 'n/a', 'misc', 'unitemized',
])
function isGeneric(key) {
  // entity_key for bills ends in "ind:{label}"; for donors "donor:{name}".
  const m = key.match(/(?:ind|donor):(.+?)(?:\|cyc:|$)/)
  return m ? GENERIC_LABELS.has(m[1]) : false
}

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
const WEEK_OF = weekArg || isoMonday()
const sha1 = (s) => crypto.createHash('sha1').update(s).digest('hex')
const usd = (n) => `$${(Number(n) / 1e6).toFixed(2)}M`

function mapBranch(b) {
  if (b === 'President') return 'Executive'
  if (b === 'House') return 'House'
  if (b === 'Senate') return 'Senate'
  return 'States' // Governor, Mayor, Other, null
}

async function selectAll(table, columns, applyFilter) {
  const out = []
  for (let from = 0; ; from += 1000) {
    let q = supabase.from(table).select(columns).range(from, from + 999)
    if (applyFilter) q = applyFilter(q)
    const { data, error } = await q
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

async function main() {
  console.log(`[${new Date().toISOString()}] Detecting new connections for week_of=${WEEK_OF}${DRY ? ' (DRY RUN)' : ''}`)

  // 1) Pull this week's NEW or NOTABLY-GROWN events.
  const events = await selectAll('cr_money_events',
    'id, entity_type, entity_key, politician_id, committee_id, bill_id, branch, label, amount, delta_amount, first_seen_week, last_seen_week',
    (q) => q.eq('last_seen_week', WEEK_OF))
  const fresh = events.filter((e) =>
    (e.first_seen_week === WEEK_OF || Number(e.delta_amount) >= GROWTH_FLOOR) &&
    !isGeneric(e.entity_key))
  console.log(`Events seen this week: ${events.length} · new-or-grown (non-generic): ${fresh.length}`)

  if (fresh.length === 0) {
    console.log('No new connections this week.')
    if (!DRY) {
      await supabase.from('cr_weekly_runs').upsert(
        { week_of: WEEK_OF, stage_detect: { candidates_found: 0, by_branch: {} }, updated_at: new Date().toISOString() },
        { onConflict: 'week_of' })
    }
    return
  }

  // 2) Enrich: politician names/slugs, alignment extremity, foreign flags.
  const polIds = [...new Set(fresh.map((e) => e.politician_id).filter(Boolean))]
  const pols = polIds.length
    ? await selectAll('cr_politicians', 'id, name, slug, party, state, branch', (q) => q.in('id', polIds))
    : []
  const polById = new Map(pols.map((p) => [p.id, p]))

  // alignment extremity = max |alignment_score| per politician (0..1)
  const align = polIds.length
    ? await selectAll('cr_donor_vote_alignment', 'politician_id, alignment_score', (q) => q.in('politician_id', polIds))
    : []
  const alignByPol = new Map()
  for (const a of align) {
    const v = Math.abs(Number(a.alignment_score) || 0)
    alignByPol.set(a.politician_id, Math.max(alignByPol.get(a.politician_id) || 0, v))
  }

  // foreign flag = politician appears in foreign-donor records
  const foreign = polIds.length
    ? await selectAll('cr_foreign_donor_records', 'politician_id', (q) => q.in('politician_id', polIds))
    : []
  const foreignSet = new Set(foreign.map((f) => f.politician_id))

  // 3) Score.
  const scored = fresh.map((e) => {
    const isNew = e.first_seen_week === WEEK_OF
    const amt = Number(e.amount) || 0
    const delta = Number(e.delta_amount) || 0
    const alignEx = e.politician_id ? (alignByPol.get(e.politician_id) || 0) : 0
    const isForeign = e.politician_id ? foreignSet.has(e.politician_id) : false
    const score =
      Math.log10(amt + 1) * 40 +
      (isNew ? 300 : 0) +
      Math.min(delta / 10000, 200) +
      (isForeign ? 250 : 0) +
      alignEx * 150 +
      (e.entity_type === 'pac_to_bill' ? 120 : 0)
    const pol = e.politician_id ? polById.get(e.politician_id) : null
    const branch = pol ? mapBranch(pol.branch) : 'States'
    return { e, pol, branch, amt, delta, isNew, isForeign, alignEx, score }
  })

  // 4) Dedupe vs articles written in the last 60 days (entity_key stamped in source_refs).
  const recentArticles = await selectAll('cr_articles', 'source_refs, published_at',
    (q) => q.eq('kind', 'weekly_story').gte('published_at', new Date(Date.now() - 60 * 864e5).toISOString()))
  const coveredKeys = new Set()
  for (const a of recentArticles) {
    const refs = Array.isArray(a.source_refs) ? a.source_refs : []
    for (const r of refs) { if (r && r.entity_key) coveredKeys.add(r.entity_key) }
  }
  const candidates = scored
    .filter((c) => !coveredKeys.has(c.e.entity_key))
    .sort((a, b) => b.score - a.score)

  // 5) Compose the slate. Favor NAMED-POLITICIAN stories (concrete, nameable) and
  //    cap bill-industry aggregates so they don't flood the slate with near-dupes.
  //    Dedupe bill events by (bill_id, industry) and keep only the strongest few.
  const MAX_BILL_EVENTS = Number(process.env.DETECT_MAX_BILL ?? 2)
  const polCands = candidates.filter((c) => c.pol)            // donor/pac → named politician
  const billCands = candidates.filter((c) => !c.pol)          // pac_to_bill aggregates
  const picked = []
  const seenKey = new Set()

  // (a) >=1 named-politician story per branch where one exists.
  for (const br of ['Executive', 'House', 'Senate', 'States']) {
    const top = polCands.find((c) => c.branch === br && !seenKey.has(c.e.entity_key))
    if (top) { picked.push(top); seenKey.add(top.e.entity_key) }
  }
  // (b) up to MAX_BILL_EVENTS strongest distinct bill-industry stories.
  let billUsed = 0
  for (const c of billCands) {
    if (billUsed >= MAX_BILL_EVENTS) break
    if (!seenKey.has(c.e.entity_key)) { picked.push(c); seenKey.add(c.e.entity_key); billUsed++ }
  }
  // (c) fill remaining slots with the next-best named-politician stories.
  for (const c of polCands) {
    if (picked.length >= TARGET) break
    if (!seenKey.has(c.e.entity_key)) { picked.push(c); seenKey.add(c.e.entity_key) }
  }
  picked.sort((a, b) => b.score - a.score)

  const byBranch = {}
  for (const c of picked) byBranch[c.branch] = (byBranch[c.branch] || 0) + 1
  console.log(`Picked ${picked.length} candidates — by branch: ${JSON.stringify(byBranch)}`)
  for (const c of picked.slice(0, TARGET)) {
    console.log(`  [${c.branch}] score ${Math.round(c.score)} | ${usd(c.amt)} | ${c.pol ? c.pol.name : c.e.label}${c.isForeign ? ' [foreign]' : ''}${c.isNew ? ' [new]' : ' [grown]'}`)
  }

  if (DRY) { console.log('DRY RUN — no candidates written.'); return }

  // 6) Write cr_story_candidates (clear this week first for idempotency).
  await supabase.from('cr_story_candidates').delete().eq('week_of', WEEK_OF)
  const rows = picked.map((c, i) => ({
    week_of: WEEK_OF,
    rank: i + 1,
    branch: c.branch,
    event_id: c.e.id,
    dedupe_hash: sha1(c.e.entity_key),
    headline: c.pol
      ? `${c.pol.name}: ${usd(c.amt)} ${c.e.entity_type === 'pac_to_politician' ? 'in PAC money' : 'in new donor money'}`
      : c.e.label,
    source_refs: [{
      entity_key: c.e.entity_key,
      entity_type: c.e.entity_type,
      amount: c.amt,
      politician_id: c.e.politician_id,
      politician_name: c.pol?.name || null,
      politician_slug: c.pol?.slug || null,
      party: c.pol?.party || null,
      state: c.pol?.state || null,
      committee_id: c.e.committee_id,
      bill_id: c.e.bill_id,
      is_new: c.isNew,
      is_foreign: c.isForeign,
    }],
    score: Math.round(c.score),
  }))
  const { error } = await supabase.from('cr_story_candidates').insert(rows)
  if (error) { console.error('insert error:', error.message); process.exit(1) }

  await supabase.from('cr_weekly_runs').upsert(
    { week_of: WEEK_OF, stage_detect: { candidates_found: rows.length, by_branch: byBranch }, updated_at: new Date().toISOString() },
    { onConflict: 'week_of' })
  console.log(`Wrote ${rows.length} story candidates for ${WEEK_OF}.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
