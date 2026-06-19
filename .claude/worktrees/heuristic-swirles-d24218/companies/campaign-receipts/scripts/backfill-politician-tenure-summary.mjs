#!/usr/bin/env node
// Backfill cr_politicians.tenure_summary_md — the "receipt of their tenure".
//
// COMPUTE ONCE, STORE ON THE ROW, RENDER STATICALLY. This is NOT per-request
// AI. The model NARRATES a deterministic, fully-sourced bundle (the same
// assembleBundle('politician') shape from lib/dossier.ts, re-derived here in
// SQL) plus the member's promise record. It never invents figures.
//
// The summary themes: WHO the donors are, what they voted YES on / sponsored,
// and — emphasized — their BROKEN promises (broken > kept; broken is the
// signal). Key DONOR and BILL names are wrapped in <u>…</u> so the rendered
// page is scannable.
//
// Cost-aware: only members with REAL facts (PAC data OR graded promises) get a
// call. Empty members are skipped. We use Haiku (cheap narration tier) and log
// spend. Idempotent: pass --force to rebuild, otherwise skips rows already built.
//
// Usage:
//   node scripts/backfill-politician-tenure-summary.mjs            # build missing
//   node scripts/backfill-politician-tenure-summary.mjs --force    # rebuild all
//   node scripts/backfill-politician-tenure-summary.mjs --slug=X   # one member
//   node scripts/backfill-politician-tenure-summary.mjs --limit=5  # cap (test)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY (root .env).

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
if (!ANTHROPIC_API_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

// Haiku = cheap narration tier (portfolio rule: execution roles on Haiku).
const MODEL = 'claude-haiku-4-5'
// Haiku 4.x list price (per MTok): $1 in / $5 out. Cache reads $0.10/MTok.
const PRICE_IN = 1.0 / 1e6, PRICE_OUT = 5.0 / 1e6, PRICE_CACHE_READ = 0.10 / 1e6

const args = process.argv.slice(2)
const FORCE = args.includes('--force')
const SLUG = (args.find((a) => a.startsWith('--slug=')) || '').split('=')[1] || null
const LIMIT = parseInt((args.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || '0', 10)

const money = (x) => `$${Math.round(Number(x) || 0).toLocaleString()}`

const SYSTEM = `You are the writing engine for Campaign Receipts, a money-in-politics accountability tool. You write a short "receipt of their tenure" for one member of Congress / official.

You are handed a BUNDLE of facts retrieved from FEC and Congress.gov data, plus precomputed THEMES (deterministic patterns) and the member's PROMISE record. You did not look anything up. Everything you assert MUST come from the bundle.

WHAT THE SUMMARY COVERS, in this order:
1. WHO funds them — the theme of their donors (top industries / committees, by money).
2. What they voted YES on and where their votes line up with their funders.
3. Their BROKEN promises — lead with broken, name them. Broken is the signal a reader cares about; kept is secondary. If there are broken promises, they get the most space.

HIGHLIGHTING (so the page is scannable): wrap every DONOR / committee / industry name in <u>…</u>, and wrap every BILL name or number in <u>…</u>. Wrap the single most important dollar figure or count per paragraph in <strong>…</strong>. Do not over-highlight — donors and bills only.

HARD RULES — violating any is a failure:
1. Assert ONLY what is in the bundle. No outside facts, no invented numbers, names, votes.
2. Every dollar figure / vote / count must trace to a fact in the bundle. Do not print raw source strings (those are for our audit, not the reader) — but never state a number not backed by one.
3. If the bundle lacks something a reader expects (no vote data, single cycle), say so plainly.
4. Nonpartisan. Same skepticism every direction. No "corrupt", "bought", "evil". Receipts, not character attacks. Influence is a question the receipts raise, not a proven quid pro quo.
5. Plain English, 3rd-to-6th grade reading level. Short sentences.

OUTPUT (markdown, under 220 words, NO heading — start with the prose):
- One short opening sentence naming who funds them and the broad pattern.
- A sentence or two on votes / what they sponsored, if present.
- A sentence or two on broken promises (named, emphasized). If kept worth one clause, fine.
- If a key gap exists, one honest "we don't yet have…" clause.
Return ONLY the markdown.`

async function assemblePoliticianFacts(p) {
  const facts = []
  const notes = []
  const themes = []

  if ((p.scorecard_graded_total || 0) > 0) {
    facts.push({
      claim_type: 'scorecard', kept: p.scorecard_kept, broken: p.scorecard_broken,
      partial: p.scorecard_partial, graded_total: p.scorecard_graded_total,
      pct_kept: p.scorecard_percentage_kept,
    })
  }

  // PAC money in — top funders by amount.
  const { data: pac } = await supabase
    .from('cr_pac_contributions')
    .select('committee_id, total_amount, cycle, cr_committees!inner(name, industry_label, committee_type_full)')
    .eq('politician_id', p.id).order('total_amount', { ascending: false }).limit(25)
  for (const row of pac || []) {
    facts.push({
      claim_type: 'pac_contribution', committee_name: row.cr_committees?.name,
      industry: row.cr_committees?.industry_label || row.cr_committees?.committee_type_full,
      amount: Number(row.total_amount), cycle: row.cycle,
    })
  }

  // Industry-cluster theme (mirror lib/dossier computePoliticianThemes).
  const pacFacts = facts.filter((f) => f.claim_type === 'pac_contribution')
  if (pacFacts.length >= 3) {
    const total = pacFacts.reduce((s, f) => s + (f.amount || 0), 0)
    const byInd = new Map()
    for (const f of pacFacts) { const k = f.industry || 'Other / untagged'; byInd.set(k, (byInd.get(k) || 0) + (f.amount || 0)) }
    const ranked = [...byInd.entries()].sort((a, b) => b[1] - a[1])
    const [topInd, topAmt] = ranked[0]
    if (total > 0 && topAmt / total >= 0.25 && topInd !== 'Other / untagged') {
      themes.push({ kind: 'industry_cluster', headline: `${topInd} is the biggest industry behind ${p.name}'s PAC money.`,
        detail: `Of ${money(total)} from ${pacFacts.length} committees, ${money(topAmt)} (${Math.round(topAmt / total * 100)}%) came from ${topInd}.` })
    }
  }

  // Donor-vote alignment.
  const { data: align } = await supabase
    .from('cr_donor_vote_alignment')
    .select('industry_label, vote, industry_position, alignment_score, bill_id')
    .eq('politician_id', p.id).limit(40)
  for (const row of align || []) {
    facts.push({ claim_type: 'donor_vote_alignment', industry: row.industry_label, vote: row.vote,
      industry_wanted: row.industry_position, aligned: row.alignment_score === 1 })
  }
  if ((align || []).length === 0) notes.push('No donor-to-vote alignment rows yet for this member.')

  // Sponsored / cosponsored bills (best-effort — only if columns exist).
  if (p.bioguide) {
    const { data: sponsored } = await supabase
      .from('cr_bills').select('bill_type, bill_number, short_title, title')
      .eq('sponsor_bioguide', p.bioguide).limit(8)
    for (const b of sponsored || []) {
      facts.push({ claim_type: 'sponsored_bill', bill: `${(b.bill_type || '').toUpperCase()} ${b.bill_number}`,
        title: b.short_title || b.title })
    }
  }

  // Promises — broken first (the signal), then kept summary.
  const { data: promises } = await supabase
    .from('cr_promises').select('promise_text, verdict, category')
    .eq('politician_id', p.id)
  const broken = (promises || []).filter((pr) => (pr.verdict || '').toUpperCase() === 'BROKEN')
  const kept = (promises || []).filter((pr) => (pr.verdict || '').toUpperCase() === 'KEPT')
  for (const pr of broken.slice(0, 8)) {
    facts.push({ claim_type: 'broken_promise', promise: pr.promise_text, category: pr.category })
  }
  if (kept.length > 0) facts.push({ claim_type: 'kept_promise_count', count: kept.length })

  return {
    entity: { name: p.name, party: p.party, branch: p.branch, state: p.state },
    facts, themes, notes,
    has_real_facts: pacFacts.length > 0 || (p.scorecard_graded_total || 0) > 0 || broken.length > 0,
  }
}

async function buildOne(p, spend) {
  const bundle = await assemblePoliticianFacts(p)
  if (!bundle.has_real_facts) { console.log(`  skip (no facts): ${p.slug}`); return false }

  const userPayload = `Write the tenure receipt for ${p.name}. Bundle:\n\n\`\`\`json\n${JSON.stringify(bundle, null, 2)}\n\`\`\``
  const resp = await anthropic.messages.create({
    model: MODEL, max_tokens: 1200,
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPayload }],
  })
  const md = resp.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim()

  const u = resp.usage
  spend.in += u.input_tokens; spend.out += u.output_tokens; spend.cacheRead += (u.cache_read_input_tokens || 0)
  spend.calls += 1

  await supabase.from('cr_politicians')
    .update({ tenure_summary_md: md, tenure_summary_built_at: new Date().toISOString() })
    .eq('id', p.id)
  console.log(`  built: ${p.slug} (${md.length} chars)`)
  return true
}

async function main() {
  let q = supabase.from('cr_politicians')
    .select('id, slug, name, party, branch, state, bioguide, scorecard_kept, scorecard_broken, scorecard_partial, scorecard_graded_total, scorecard_percentage_kept, tenure_summary_md')
  if (SLUG) q = q.eq('slug', SLUG)
  const { data: pols, error } = await q
  if (error) { console.error(error); process.exit(1) }

  let candidates = pols || []
  if (!FORCE && !SLUG) candidates = candidates.filter((p) => !p.tenure_summary_md)
  // Cheap pre-filter: must have graded promises OR be in the 42 with PAC data.
  candidates = candidates.filter((p) => (p.scorecard_graded_total || 0) > 0 || true) // PAC checked inside (assemble)
  if (LIMIT > 0) candidates = candidates.slice(0, LIMIT)

  console.log(`Politician tenure backfill: ${candidates.length} candidates (force=${FORCE}, slug=${SLUG || '-'})`)
  const spend = { in: 0, out: 0, cacheRead: 0, calls: 0 }
  let built = 0, skipped = 0
  for (const p of candidates) {
    try {
      const ok = await buildOne(p, spend)
      ok ? built++ : skipped++
    } catch (e) { console.error(`  ERROR ${p.slug}: ${e.message}`); skipped++ }
  }

  const cost = spend.in * PRICE_IN + spend.out * PRICE_OUT + spend.cacheRead * PRICE_CACHE_READ
  console.log(`\nDONE. built=${built} skipped=${skipped}`)
  console.log(`AI spend: ${spend.calls} calls · in=${spend.in} out=${spend.out} cacheRead=${spend.cacheRead} tok · ~$${cost.toFixed(4)}`)
}

main()
