#!/usr/bin/env node
//
// scripts/classify-bill-effect.mjs — what does each bill actually DO, and who benefits?
//
// The exposé chain needs more than a bill title: it needs the EFFECT — "cuts the
// capital-gains tax → benefits Finance" — so we can match a sponsor's bill to that
// sponsor's industry donors. Haiku reads the title (the only text we have; summary is
// null) and returns {beneficiary_industry, mechanism, plain_effect} ONLY when the
// effect is genuinely clear from the title. Otherwise null — we do NOT guess what a
// vaguely-named bill does (that's how you get false "tech tax break" claims).
//
// Strictly factual + non-causal: describes what the bill WOULD do, never asserts a deal.
// beneficiary_industry uses the project taxonomy (Finance, Big Tech, Defense, …).
//
// Writes cr_bill_effect(bill_id, beneficiary_industry, mechanism, plain_effect, confidence).
// Only classifies bills sponsored by a tracked politician (the exposé surface), missing
// rows, unless --all / --force.
//
// Usage: node scripts/classify-bill-effect.mjs [--dry-run] [--limit=N] [--force]

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5'
const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const FORCE = args.includes('--force')
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0)

const INDUSTRIES = ['Finance', 'Big Tech', 'Telecom', 'Defense', 'Oil & Gas', 'Energy', 'Pharmaceuticals & Healthcare', 'Real estate', 'Agriculture', 'Crypto', 'Transportation', 'Labor unions']

function buildPrompt(bills) {
  return `You are a nonpartisan legislative analyst. For each bill, decide whether its TITLE clearly implies it would materially benefit (or is written for) ONE specific industry, and if so, how.

Return STRICT JSON: an array, one object per bill in order, each:
  {"bill_id": "<id>", "beneficiary_industry": <one of the list or null>, "mechanism": "<short: e.g. cuts a tax, loosens a rule, awards contracts, preempts regulation>" , "plain_effect": "<one factual sentence on what the bill would do>", "confidence": "high"|"medium"|"low"}

INDUSTRY LIST (use EXACTLY one of these, or null): ${INDUSTRIES.join(', ')}

HARD RULES:
- ONLY assign a beneficiary_industry if the title makes the beneficiary CLEAR. Procedural bills ("Providing for consideration of…", "Relating to a national emergency…"), renaming/commemorative bills, and vague acronym titles → beneficiary_industry = null, confidence "low".
- NEVER guess. If you're unsure which industry, return null. A wrong industry tag is worse than null.
- plain_effect describes what the bill WOULD do — factual, present/conditional tense. NO motive, NO causation, NO "in exchange for", NO "to reward donors". Just the policy effect.
- confidence "high" only when the title names the policy + the beneficiary is unambiguous (e.g. "Capital Gains Tax Reduction Act" → Finance, high). Otherwise "medium"/"low".

BILLS:
${JSON.stringify(bills.map((b) => ({ bill_id: b.id, title: b.title })), null, 2)}

Return only the JSON array.`
}

async function classifyBatch(bills) {
  const resp = await anthropic.messages.create({ model: MODEL, max_tokens: 3000, messages: [{ role: 'user', content: buildPrompt(bills) }] })
  let t = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
  t = t.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  let arr
  try { arr = JSON.parse(t) } catch { console.error('non-JSON from model:', t.slice(0, 160)); return [] }
  return Array.isArray(arr) ? arr : []
}

async function main() {
  console.log(`[${new Date().toISOString()}] Classifying bill effects${DRY ? ' (DRY RUN)' : ''}`)
  // tracked politicians' bioguides → only classify bills they sponsor (the exposé surface)
  const { data: pols } = await supabase.from('cr_politicians').select('bioguide').not('bioguide', 'is', null)
  const bios = new Set((pols || []).map((p) => p.bioguide))
  let bills = []
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from('cr_bills').select('id, title, sponsor_bioguide').range(from, from + 999)
    if (!data || !data.length) break
    bills.push(...data); if (data.length < 1000) break
  }
  bills = bills.filter((b) => b.title && b.sponsor_bioguide && bios.has(b.sponsor_bioguide))
  if (!FORCE) {
    const { data: done } = await supabase.from('cr_bill_effect').select('bill_id')
    const seen = new Set((done || []).map((d) => d.bill_id))
    bills = bills.filter((b) => !seen.has(b.id))
  }
  if (LIMIT) bills = bills.slice(0, LIMIT)
  console.log(`Bills to classify: ${bills.length}`)
  if (!bills.length) { console.log('Nothing to do.'); return }

  const out = []
  for (let i = 0; i < bills.length; i += 20) {
    const batch = bills.slice(i, i + 20)
    const res = await classifyBatch(batch)
    const byId = new Map(res.map((r) => [r.bill_id, r]))
    for (const b of batch) {
      const r = byId.get(b.id)
      if (!r) continue
      const ind = INDUSTRIES.includes(r.beneficiary_industry) ? r.beneficiary_industry : null
      out.push({ bill_id: b.id, beneficiary_industry: ind, mechanism: (r.mechanism || '').slice(0, 200) || null, plain_effect: (r.plain_effect || '').slice(0, 400) || null, confidence: r.confidence || 'low', updated_at: new Date().toISOString() })
    }
    console.log(`  classified ${Math.min(i + 20, bills.length)}/${bills.length}`)
  }
  const withInd = out.filter((o) => o.beneficiary_industry)
  console.log(`Got ${out.length} results; ${withInd.length} have a beneficiary industry.`)
  console.log('Sample (industry-tagged):')
  withInd.slice(0, 10).forEach((o) => console.log(`  [${o.confidence}] ${o.beneficiary_industry}: ${o.plain_effect}`))
  if (DRY) { console.log('DRY RUN — nothing written.'); return }
  for (let i = 0; i < out.length; i += 500) {
    const { error } = await supabase.from('cr_bill_effect').upsert(out.slice(i, i + 500), { onConflict: 'bill_id' })
    if (error) { console.error('upsert error:', error.message); process.exit(1) }
  }
  console.log(`Wrote ${out.length} bill-effect rows (${withInd.length} industry-tagged).`)
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
