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
const BILL_AMOUNT_FLOOR = Number(process.env.DETECT_BILL_FLOOR ?? 250000) // min industry→bill $ to be a real story
const TARGET = Number(process.env.DETECT_TARGET ?? 8)                  // candidates to emit

// Generic / occupation-code buckets that are NOT a money-influence STORY. These
// dominate FEC data and produce hollow "stories" with no punchline:
//   - "Individual / Retired" is $Bs of aggregate small-dollar giving, not a connection.
//   - "self-employed", "homemaker", "entrepreneur" etc. are how INDIVIDUALS self-report
//     occupation — there's no donor, no industry, no influence thread. (Founder
//     2026-06-23: "Cruz $22M from retirees — what? what's the punchline?" Exactly —
//     there isn't one. Drop them.)
// A pac_to_bill whose industry is generic is dropped; a donor_to_politician whose
// donor name is an occupation code is dropped.
const GENERIC_LABELS = new Set([
  'individual / retired', 'individual', 'retired', 'uncategorized', 'unknown',
  'other', 'n/a', 'misc', 'unitemized',
  'self', 'self employed', 'self-employed', 'selfemployed', 'homemaker', 'home maker',
  'entrepreneur', 'none', 'not employed', 'unemployed', 'ceo', 'president', 'owner',
  'investor', 'attorney', 'consultant', 'physician', 'business owner', 'executive',
  'information requested', 'information requested per best efforts', 'requested',
  'best efforts', 'na', 'not applicable', 'refused',
])
function labelOf(key) {
  const m = String(key).match(/(?:ind|donor):(.+?)(?:\|cyc:|$)/)
  return m ? m[1].trim().toLowerCase() : null
}
function isGeneric(key) {
  const l = labelOf(key)
  if (!l) return false
  if (GENERIC_LABELS.has(l)) return true
  // occupation-ish phrases that aren't a named company/industry
  if (/^information requested/.test(l)) return true
  if (/\b(self[ -]?employed|homemaker|retired|unemployed|not employed)\b/.test(l)) return true
  return false
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

  // ── JURISDICTION MATCH (the NYT "why"): a bill→industry money flow is a STORY when
  //    the bill is referred to a committee that REGULATES that industry, chaired by a
  //    named member. "Finance money behind a bill headed to the Financial Services
  //    Committee — chaired by X." That's the mechanism, not "finance touches 180 bills".
  const billEventIds = [...new Set(fresh.filter((e) => e.entity_type === 'pac_to_bill' && e.bill_id).map((e) => e.bill_id))]
  const jurRows = await selectAll('cr_committee_jurisdiction', 'thomas_id, committee_name, chamber, industries')
  const indByCommittee = new Map(jurRows.map((j) => [j.thomas_id, (j.industries || []).map((s) => String(s).toLowerCase())]))
  const nameByCommittee = new Map(jurRows.map((j) => [j.thomas_id, { name: j.committee_name, chamber: j.chamber }]))
  const billCommittees = new Map() // bill_id → [thomas_id(parent)]
  if (billEventIds.length) {
    const bc = await selectAll('cr_bill_committees', 'bill_id, thomas_id', (q) => q.in('bill_id', billEventIds))
    for (const r of bc) {
      if (!r.thomas_id) continue
      const t = r.thomas_id.slice(0, 4)
      if (!indByCommittee.has(t)) continue
      if (!billCommittees.has(r.bill_id)) billCommittees.set(r.bill_id, new Set())
      billCommittees.get(r.bill_id).add(t)
    }
  }
  // committee chairs (parent committees), name-resolved.
  const allChairs = await selectAll('cr_committee_assignments', 'thomas_id, bioguide, role', (q) => q.eq('role', 'Chair'))
  const chairBioByCommittee = new Map()
  for (const a of allChairs) { const t = (a.thomas_id || '').slice(0, 4); if (nameByCommittee.has(t) && !chairBioByCommittee.has(t)) chairBioByCommittee.set(t, a.bioguide) }
  const chairBios = [...new Set(chairBioByCommittee.values())]
  const chairPols = chairBios.length ? await selectAll('cr_politicians', 'name, slug, bioguide', (q) => q.in('bioguide', chairBios)) : []
  const chairByBio = new Map(chairPols.map((p) => [p.bioguide, p]))
  // For a pac_to_bill event, find the matching regulating committee (+ its chair).
  function jurisdictionMatch(e) {
    if (e.entity_type !== 'pac_to_bill' || !e.bill_id) return null
    const ind = labelOf(e.entity_key)
    const coms = billCommittees.get(e.bill_id)
    if (!ind || !coms) return null
    for (const t of coms) {
      if (indByCommittee.get(t).includes(ind)) {
        const meta = nameByCommittee.get(t)
        const chairBio = chairBioByCommittee.get(t)
        const chair = chairBio ? chairByBio.get(chairBio) : null
        return { thomas_id: t, committee_name: meta.name, chamber: meta.chamber, industry: ind, chair_name: chair?.name || null, chair_slug: chair?.slug || null }
      }
    }
    return null
  }

  // GATEKEEPER signal (journalist archetype #1): the politician (a) sponsors a bill
  // AND (b) holds a committee seat — strongest when they CHAIR / are Ranking Member.
  // This is the highest-value story signal, so it gets the biggest boost.
  const polRows = polIds.length
    ? await selectAll('cr_politicians', 'id, bioguide', (q) => q.in('id', polIds))
    : []
  const bioById = new Map(polRows.map((p) => [p.id, p.bioguide]).filter(([, b]) => b))
  const bios = [...bioById.values()]
  // committee roles for these members
  const assigns = bios.length
    ? await selectAll('cr_committee_assignments', 'bioguide, role', (q) => q.in('bioguide', bios))
    : []
  const roleByBio = new Map() // bioguide -> 'chair' | 'ranking' | 'member'
  for (const a of assigns) {
    const cur = roleByBio.get(a.bioguide)
    const rank = /Chair/i.test(a.role) ? 3 : /Ranking|Vice/i.test(a.role) ? 2 : 1
    const curRank = cur === 'chair' ? 3 : cur === 'ranking' ? 2 : cur === 'member' ? 1 : 0
    if (rank > curRank) roleByBio.set(a.bioguide, rank === 3 ? 'chair' : rank === 2 ? 'ranking' : 'member')
  }
  // which of these members are bill sponsors (gatekeeper needs sponsorship)
  const sponsorBios = new Set()
  if (bios.length) {
    const billRows = await selectAll('cr_bills', 'sponsor_bioguide', (q) => q.in('sponsor_bioguide', bios))
    for (const b of billRows) if (b.sponsor_bioguide) sponsorBios.add(b.sponsor_bioguide)
  }
  function gatekeeperFor(polId) {
    const bio = bioById.get(polId)
    if (!bio || !sponsorBios.has(bio)) return null // must be a sponsor
    const role = roleByBio.get(bio)
    if (!role) return null // must sit on a committee
    return role // 'chair' | 'ranking' | 'member'
  }

  // 3) Score.
  const scored = fresh.map((e) => {
    const isNew = e.first_seen_week === WEEK_OF
    const amt = Number(e.amount) || 0
    const delta = Number(e.delta_amount) || 0
    const alignEx = e.politician_id ? (alignByPol.get(e.politician_id) || 0) : 0
    const isForeign = e.politician_id ? foreignSet.has(e.politician_id) : false
    const gatekeeper = e.politician_id ? gatekeeperFor(e.politician_id) : null // chair|ranking|member|null
    // Gatekeeper only counts as a STORY when there's also meaningful money (the
    // journalist's "outlier concentration" bar) — a committee seat + $10k isn't news.
    const gatekeeperQualifies = gatekeeper && amt >= 100000
    const gatekeeperBoost = !gatekeeperQualifies ? 0
      : gatekeeper === 'chair' ? 400 : gatekeeper === 'ranking' ? 250 : 120
    // The jurisdiction match is the strongest signal: industry money → a bill headed
    // to the committee that REGULATES that industry. This is the NYT "why".
    const jurisdiction = jurisdictionMatch(e)
    const jurisdictionBoost = jurisdiction ? (jurisdiction.chair_name ? 600 : 450) : 0
    const score =
      Math.log10(amt + 1) * 40 +
      (isNew ? 300 : 0) +
      Math.min(delta / 10000, 200) +
      (isForeign ? 250 : 0) +
      alignEx * 150 +
      (e.entity_type === 'pac_to_bill' ? 120 : 0) +
      gatekeeperBoost +                                  // archetype #1: gatekeeper (sponsor + seat)
      jurisdictionBoost                                  // archetype #1b: industry money → its regulating committee
    const pol = e.politician_id ? polById.get(e.politician_id) : null
    const branch = pol ? mapBranch(pol.branch) : 'States'
    // REAL-CONNECTION GATE (founder 2026-06-23: "only run stories with a real
    // connection"). A story must have a genuine influence thread, not occupation
    // noise or a generic fundraising total:
    //   (a) industry-classified PAC money → a bill's sponsors (ind:<industry>), OR
    //   (b) a committee GATEKEEPER (chair/ranking/member) receiving ≥$100k from a
    //       NAMED entity (PAC/company), never an occupation code.
    // Everything else (donor:self-employed/homemaker/retired, local-business totals)
    // is dropped — the data doesn't support a punchline, so we don't air one.
    // A bill→industry thread is only a real STORY above a money floor — below ~$250k
    // the "industry funding this bill" is a coincidental tail (PACs that gave to a
    // sponsor who also happens to sponsor an unrelated bill), not a connection.
    // (Founder 2026-06-23: a "$0.14M crypto → China-prisoners resolution" segment has
    // no real thread — don't air it.)
    // A bill→industry thread is a real STORY only when the money goes to a bill headed
    // to the committee that REGULATES that industry (jurisdiction match = the "why"),
    // above the money floor. A bloc total with no regulating-committee match is NOT a
    // story (that was the hollow "finance touches 180 bills"). Named-entity gatekeepers
    // (sponsor + seat + ≥$100k from a real PAC/company) also qualify.
    const isJurisdictionBill = !!jurisdiction && amt >= BILL_AMOUNT_FLOOR
    const isNamedGatekeeper = gatekeeperQualifies && e.entity_type !== 'donor_to_politician'
    const realConnection = isJurisdictionBill || isNamedGatekeeper
    return { e, pol, branch, amt, delta, isNew, isForeign, alignEx, gatekeeper, jurisdiction, score, realConnection }
  })

  // 4) Dedupe vs articles written in the last 60 days (entity_key stamped in source_refs).
  const recentArticles = await selectAll('cr_articles', 'source_refs, published_at',
    (q) => q.eq('kind', 'weekly_story').gte('published_at', new Date(Date.now() - 60 * 864e5).toISOString()))
  const coveredKeys = new Set()
  for (const a of recentArticles) {
    const refs = Array.isArray(a.source_refs) ? a.source_refs : []
    for (const r of refs) { if (r && r.entity_key) coveredKeys.add(r.entity_key) }
  }
  const candidatesAll = scored
    .filter((c) => c.realConnection)                       // ← only real influence threads
    .filter((c) => !coveredKeys.has(c.e.entity_key))
    .sort((a, b) => b.score - a.score)
  console.log(`Real-connection candidates (after gate): ${candidatesAll.length} of ${scored.length} scored`)

  // Dedupe to ONE story per politician (keep their highest-scoring event) so the
  // slate isn't three rows of the same member's different donor edges. Bill events
  // (no politician) pass through untouched.
  const seenPol = new Set()
  const candidates = candidatesAll.filter((c) => {
    if (!c.pol) return true
    if (seenPol.has(c.pol.id)) return false
    seenPol.add(c.pol.id)
    return true
  })

  // 5) Compose the slate. With the real-connection gate, the genuine stories are
  //    industry→bill threads. Spread across DISTINCT (industry, bill) so the show
  //    has variety (finance bill, big-tech bill, crypto bill…) instead of three
  //    near-identical finance rows. Named-politician gatekeeper stories (rare —
  //    needs a named ≥$100k donor) lead when they exist.
  const polCands = candidates.filter((c) => c.pol)
  const billCands = candidates.filter((c) => !c.pol)          // pac_to_bill, industry-classified
  const picked = []
  const seenKey = new Set()
  const seenIndustry = new Set()
  const seenBill = new Set()

  // (a) named-gatekeeper stories first (strongest archetype), 1 per branch.
  for (const br of ['Executive', 'House', 'Senate', 'States']) {
    const top = polCands.find((c) => c.branch === br && !seenKey.has(c.e.entity_key))
    if (top) { picked.push(top); seenKey.add(top.e.entity_key) }
  }
  // (b) ONE story per (regulating COMMITTEE, industry). The real unit is "industry
  //     money → the committee that regulates it" (e.g. finance → Financial Services,
  //     chaired by X). Multiple bills headed to the same committee = the same story;
  //     the strongest bill stands in and bill_count carries the breadth.
  const byCommittee = new Map()
  for (const c of billCands) {
    const j = c.jurisdiction
    const key = `${j.thomas_id}|${j.industry}`
    if (!byCommittee.has(key)) byCommittee.set(key, [])
    byCommittee.get(key).push(c)
  }
  const groups = [...byCommittee.values()].map((list) => { list.sort((a, b) => b.amt - a.amt); list[0].bill_count = list.length; return list[0] })
  groups.sort((a, b) => b.score - a.score)
  for (const lead of groups) {
    if (picked.length >= TARGET) break
    picked.push(lead); seenKey.add(lead.e.entity_key)
  }
  picked.sort((a, b) => b.score - a.score)

  // Enrich bill candidates with the actual bill identity (name + what it does) so the
  // story has a real subject, not "Finance money → bill".
  const billIds = [...new Set(picked.filter((c) => !c.pol && c.e.bill_id).map((c) => c.e.bill_id))]
  const billById = new Map()
  if (billIds.length) {
    const { data: bills } = await supabase.from('cr_bills').select('id, bill_type, bill_number, congress, title, short_title').in('id', billIds)
    for (const b of bills || []) billById.set(b.id, b)
  }

  const byBranch = {}
  for (const c of picked) byBranch[c.branch] = (byBranch[c.branch] || 0) + 1
  console.log(`Picked ${picked.length} candidates — by branch: ${JSON.stringify(byBranch)}`)
  for (const c of picked.slice(0, TARGET)) {
    console.log(`  [${c.branch}] score ${Math.round(c.score)} | ${usd(c.amt)} | ${c.pol ? c.pol.name : c.e.label}${c.isForeign ? ' [foreign]' : ''}${c.isNew ? ' [new]' : ' [grown]'}`)
  }

  if (DRY) { console.log('DRY RUN — no candidates written.'); return }

  // 6) Write cr_story_candidates (clear this week first for idempotency).
  await supabase.from('cr_story_candidates').delete().eq('week_of', WEEK_OF)
  const titleCase = (s) => String(s || '').replace(/\b([a-z])/g, (m) => m.toUpperCase())
  const rows = picked.map((c, i) => {
    const bill = !c.pol && c.e.bill_id ? billById.get(c.e.bill_id) : null
    const industry = !c.pol ? titleCase(labelOf(c.e.entity_key) || '') : null
    const billName = bill ? (bill.short_title || bill.title || `${(bill.bill_type || '').toUpperCase()} ${bill.bill_number}`) : null
    const billLabel = bill ? `${(bill.bill_type || '').toUpperCase()} ${bill.bill_number}` : null
    const j = c.jurisdiction
    // The NYT headline: industry money → the bill headed to the committee that
    // REGULATES that industry, named by its chair. That's the mechanism (the "why").
    const headline = c.pol
      ? (c.gatekeeper === 'chair'
          ? `${c.pol.name} chairs the committee — and took ${usd(c.amt)}`
          : `${c.pol.name}: ${usd(c.amt)} ${c.e.entity_type === 'pac_to_politician' ? 'in PAC money' : 'in new donor money'}`)
      : (j
          ? (j.chair_name
              ? `${industry} put ${usd(c.amt)} behind bills headed to ${j.chamber} ${j.committee_name} — the panel ${j.chair_name} chairs that writes ${industry}'s rules`
              : `${industry} put ${usd(c.amt)} behind bills headed to the ${j.chamber} committee that writes ${industry}'s rules`)
          : (billName ? `${industry} PACs put ${usd(c.amt)} behind ${billName}` : `${industry} money → a bill`))
    return {
      week_of: WEEK_OF,
      rank: i + 1,
      branch: c.branch,
      event_id: c.e.id,
      dedupe_hash: sha1(c.e.entity_key),
      headline,
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
        // bill identity + industry for the storyteller (the real subject of the story)
        industry: industry || null,
        bill_name: billName,
        bill_label: billLabel,
        bill_title: bill?.title || null,
        bill_congress: bill?.congress || null,
        bill_count: c.bill_count || 1,   // # of bills headed to this committee that this industry's money sits behind
        // jurisdiction chain (the NYT "why"): committee that regulates the industry + its chair
        committee_name: j?.committee_name || null,
        committee_chamber: j?.chamber || null,
        committee_chair: j?.chair_name || null,
        committee_chair_slug: j?.chair_slug || null,
        is_new: c.isNew,
        is_foreign: c.isForeign,
        gatekeeper: c.gatekeeper,
      }],
      score: Math.round(c.score),
    }
  })
  const { error } = await supabase.from('cr_story_candidates').insert(rows)
  if (error) { console.error('insert error:', error.message); process.exit(1) }

  await supabase.from('cr_weekly_runs').upsert(
    { week_of: WEEK_OF, stage_detect: { candidates_found: rows.length, by_branch: byBranch }, updated_at: new Date().toISOString() },
    { onConflict: 'week_of' })
  console.log(`Wrote ${rows.length} story candidates for ${WEEK_OF}.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
