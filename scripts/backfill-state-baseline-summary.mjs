#!/usr/bin/env node
// Backfill cr_states.baseline_summary_md — a state's political-money baseline.
//
// COMPUTE ONCE, STORE, RENDER STATICALLY. The model NARRATES a deterministic,
// fully-sourced per-state bundle; it never invents figures.
//
// The summary covers (per founder spec):
//   1. The biggest donors of the state's FEDERAL members (where money comes from).
//   2. Republican vs Democrat money-influence split (recipient party).
//   3. Recent bills + how the state's members voted.
//   4. An AI baseline of the money picture (which donors have influence).
//   5. The governor's BROKEN promises (broken only — kept noise is cut).
//
// Cost-aware: only states with real federal PAC data OR governor broken promises
// get a call. Haiku tier; spend logged. Idempotent (--force to rebuild).
//
// Usage:
//   node scripts/backfill-state-baseline-summary.mjs            # build missing
//   node scripts/backfill-state-baseline-summary.mjs --force    # rebuild all
//   node scripts/backfill-state-baseline-summary.mjs --code=TX  # one state
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY (root .env).

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_API_KEY) { console.error('Missing env'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5'
const PRICE_IN = 1.0 / 1e6, PRICE_OUT = 5.0 / 1e6, PRICE_CACHE_READ = 0.10 / 1e6

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const CODE = (args.find((a) => a.startsWith('--code=')) || '').split('=')[1] || null

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
}
const money = (x) => `$${Math.round(Number(x) || 0).toLocaleString()}`

const SYSTEM = `You are the writing engine for Campaign Receipts. You write a short "political money baseline" for one US state — the money picture behind its FEDERAL members of Congress, plus its governor's broken promises.

You are handed a deterministic, fully-sourced BUNDLE. You did not look anything up. Everything you assert MUST come from the bundle.

WHAT THE BASELINE COVERS, in this order:
1. Where the money comes from — the biggest donors / committees / industries funding the state's federal members.
2. The Republican-vs-Democrat money split (which party's members the money flows to).
3. Recent bills the state's members voted on, and how they voted (if present).
4. The governor's BROKEN promises — name them (broken only; we cut kept-promise noise).

HIGHLIGHTING: wrap every DONOR / committee / industry name and every BILL name/number in <u>…</u>. Wrap the single most important dollar figure or count per paragraph in <strong>…</strong>. Donors and bills only.

HARD RULES (violating any is a failure):
1. Assert ONLY what is in the bundle. No outside facts, no invented numbers/names/votes.
2. Every figure must trace to a bundle fact. Do not print raw source strings.
3. If something a reader expects is missing (no vote data, only one or two members on file), say so plainly.
4. Nonpartisan. Same skepticism every direction. No "corrupt"/"bought"/"evil". Influence is a question the receipts raise.
5. Plain English, 3rd-to-6th grade reading level. Short sentences.

OUTPUT (markdown, under 240 words, NO heading — start with prose):
- Opening sentence: where the money comes from in this state.
- Sentence(s) on the R-vs-D money split.
- Sentence(s) on recent bills + votes, if present.
- Sentence(s) on the governor's broken promises, named, if present.
- One honest "we don't yet have…" clause if a key gap exists.
Return ONLY the markdown.`

async function assembleStateFacts(code) {
  const name = STATE_NAMES[code]
  const facts = []
  const notes = []

  // The state's federal members.
  const { data: members } = await supabase
    .from('cr_politicians')
    .select('id, name, party, branch')
    .eq('state', code)
    .in('branch', ['Senate', 'House'])
  const memberIds = (members || []).map((m) => m.id)

  let donorRows = []
  if (memberIds.length > 0) {
    const { data } = await supabase
      .from('cr_pac_contributions')
      .select('committee_id, total_amount, cr_committees!inner(name, industry_label), cr_politicians!inner(party)')
      .in('politician_id', memberIds)
    donorRows = data || []
  }

  // (1) Biggest donors — aggregate by committee.
  const byComm = new Map()
  let repAmt = 0, demAmt = 0, indAmt = 0, totalAmt = 0
  for (const r of donorRows) {
    const amt = Number(r.total_amount) || 0
    totalAmt += amt
    const k = r.committee_id
    const ex = byComm.get(k) || { name: r.cr_committees?.name, industry: r.cr_committees?.industry_label, amount: 0 }
    ex.amount += amt; byComm.set(k, ex)
    const party = r.cr_politicians?.party
    if (party === 'Republican') repAmt += amt
    else if (party === 'Democratic') demAmt += amt
    else indAmt += amt
  }
  const topDonors = [...byComm.values()].sort((a, b) => b.amount - a.amount).slice(0, 8)
  for (const d of topDonors) {
    facts.push({ claim_type: 'top_donor', committee_name: d.name, industry: d.industry, amount: d.amount })
  }

  // (1b) Top industries.
  const byInd = new Map()
  for (const d of byComm.values()) { const k = d.industry || 'Other / untagged'; byInd.set(k, (byInd.get(k) || 0) + d.amount) }
  const topInds = [...byInd.entries()].filter(([k]) => k !== 'Other / untagged').sort((a, b) => b[1] - a[1]).slice(0, 4)
  for (const [ind, amt] of topInds) facts.push({ claim_type: 'top_industry', industry: ind, amount: amt })

  // (2) Party money split.
  if (totalAmt > 0) {
    facts.push({ claim_type: 'party_money_split', total: totalAmt,
      republican: repAmt, democratic: demAmt, independent: indAmt,
      republican_pct: Math.round(repAmt / totalAmt * 100), democratic_pct: Math.round(demAmt / totalAmt * 100) })
  }

  // (3) Recent bills + how members voted (substantive roll calls only).
  if (memberIds.length > 0) {
    const { data: rolls } = await supabase
      .from('cr_roll_calls')
      .select('vote, voted_at, question, bill_id, cr_politicians!inner(name)')
      .in('politician_id', memberIds)
      .eq('is_procedural', false)
      .order('voted_at', { ascending: false })
      .limit(30)
    const billIds = [...new Set((rolls || []).map((r) => r.bill_id).filter(Boolean))]
    const billTitles = new Map()
    if (billIds.length > 0) {
      const { data: bills } = await supabase
        .from('cr_bills').select('id, bill_type, bill_number, short_title, title').in('id', billIds)
      for (const b of bills || []) billTitles.set(b.id, { label: `${(b.bill_type || '').toUpperCase()} ${b.bill_number}`, title: b.short_title || b.title })
    }
    // Group by bill, list how members voted.
    const byBill = new Map()
    for (const r of rolls || []) {
      const bt = r.bill_id ? billTitles.get(r.bill_id) : null
      const key = r.bill_id || r.question
      const ex = byBill.get(key) || { bill: bt?.label, title: bt?.title || r.question, votes: [] }
      ex.votes.push(`${r.cr_politicians?.name} voted ${r.vote}`)
      byBill.set(key, ex)
    }
    for (const b of [...byBill.values()].slice(0, 6)) {
      facts.push({ claim_type: 'recent_vote', bill: b.bill, title: b.title, member_votes: b.votes.slice(0, 8) })
    }
    if ((rolls || []).length === 0) notes.push('No substantive roll-call votes on file yet for this state\'s federal members.')
  }

  // (5) Governor broken promises (broken only).
  const { data: govs } = await supabase
    .from('cr_politicians').select('id, name').eq('state', code).eq('branch', 'Governor')
  let govBroken = []
  let govName = null
  for (const g of govs || []) {
    const { data: prs } = await supabase
      .from('cr_promises').select('promise_text, category').eq('politician_id', g.id).ilike('verdict', 'broken')
    if ((prs || []).length > 0) { govName = g.name; govBroken = govBroken.concat((prs || []).map((p) => p.promise_text)) }
  }
  if (govName && govBroken.length > 0) {
    facts.push({ claim_type: 'governor_broken_promises', governor: govName, broken: govBroken.slice(0, 6), broken_count: govBroken.length })
  }

  const hasRealFacts = totalAmt > 0 || govBroken.length > 0
  return {
    state: { code, name },
    member_count: memberIds.length,
    facts, notes, hasRealFacts,
    _audit: { total_pac_to_federal: totalAmt },
  }
}

async function buildOne(code, spend) {
  const bundle = await assembleStateFacts(code)
  if (!bundle.hasRealFacts) { console.log(`  skip (no facts): ${code}`); return false }

  const userPayload = `Write the political-money baseline for ${bundle.state.name}. Bundle:\n\n\`\`\`json\n${JSON.stringify(bundle, null, 2)}\n\`\`\``
  const resp = await anthropic.messages.create({
    model: MODEL, max_tokens: 1400,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPayload }],
  })
  const md = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()
  const u = resp.usage
  spend.in += u.input_tokens; spend.out += u.output_tokens; spend.cacheRead += (u.cache_read_input_tokens || 0); spend.calls += 1

  await supabase.from('cr_states').upsert({
    code, name: bundle.state.name, baseline_summary_md: md,
    baseline_facts: bundle.facts, baseline_summary_built_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'code' })
  console.log(`  built: ${code} (${md.length} chars)`)
  return true
}

async function main() {
  const codes = CODE ? [CODE.toUpperCase()] : Object.keys(STATE_NAMES)
  let candidates = codes
  if (!FORCE && !CODE) {
    const { data: built } = await supabase.from('cr_states').select('code').not('baseline_summary_md', 'is', null)
    const have = new Set((built || []).map((r) => r.code))
    candidates = codes.filter((c) => !have.has(c))
  }
  console.log(`State baseline backfill: ${candidates.length} candidates (force=${FORCE}, code=${CODE || '-'})`)
  const spend = { in: 0, out: 0, cacheRead: 0, calls: 0 }
  let built = 0, skipped = 0
  for (const code of candidates) {
    try { (await buildOne(code, spend)) ? built++ : skipped++ }
    catch (e) { console.error(`  ERROR ${code}: ${e.message}`); skipped++ }
  }
  const cost = spend.in * PRICE_IN + spend.out * PRICE_OUT + spend.cacheRead * PRICE_CACHE_READ
  console.log(`\nDONE. built=${built} skipped=${skipped}`)
  console.log(`AI spend: ${spend.calls} calls · in=${spend.in} out=${spend.out} cacheRead=${spend.cacheRead} tok · ~$${cost.toFixed(4)}`)
}

main()
