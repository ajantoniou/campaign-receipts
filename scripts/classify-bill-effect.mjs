#!/usr/bin/env node
//
// scripts/classify-bill-effect.mjs — READ THE ACTUAL BILL, not just the title.
//
// Founder 2026-06-23: "Can't you read the bills? Humans won't, but if you do you'll
// pull out the obvious donor influence." Yes. Titles lie ("Kayla Hamilton Act" sounds
// generic; it's a child-trafficking bill — NOT the finance story a title-classifier
// guessed). This fetches the full bill text from congress.gov, and Haiku reads the
// SUBSTANCE: which industry it materially benefits, the specific provisions that do it
// (the buried section a human skims past), and a plain factual effect.
//
// Source: api.congress.gov v3 /text endpoint (FEC_API_KEY / data.gov key works), then
// the Formatted Text .htm. Cached in cr_bill_text. Strictly factual, never causal.
//
// Writes cr_bill_effect(bill_id, beneficiary_industry, mechanism, plain_effect,
//   key_provisions[], confidence, read_full_text). Only bills sponsored by a tracked
// politician, missing rows, unless --all/--force.
//
// Usage: node scripts/classify-bill-effect.mjs [--dry-run] [--limit=N] [--force]

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const MODEL = 'claude-haiku-4-5'
const API_KEY = process.env.CONGRESS_API_KEY || process.env.FEC_API_KEY
const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const FORCE = args.includes('--force')
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] || 0)

const INDUSTRIES = ['Finance', 'Big Tech', 'Telecom', 'Defense', 'Oil & Gas', 'Energy', 'Pharmaceuticals & Healthcare', 'Real estate', 'Agriculture', 'Crypto', 'Transportation', 'Labor unions']
const MAX_TEXT = 45000 // chars of bill text fed to the model (keeps cost sane; most bills fit)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripHtml = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()

// Fetch the latest Formatted-Text version of a bill, cache it.
async function fetchBillText(bill) {
  const { data: cached } = await supabase.from('cr_bill_text').select('full_text, text_url').eq('bill_id', bill.id).maybeSingle()
  if (cached?.full_text && !FORCE) return cached.full_text
  const legType = (bill.bill_type || '').toLowerCase()
  const idxUrl = `https://api.congress.gov/v3/bill/${bill.congress}/${legType}/${bill.bill_number}/text?api_key=${API_KEY}&format=json`
  try {
    const r = await fetch(idxUrl); if (!r.ok) return null
    const j = await r.json()
    const versions = j.textVersions || []
    if (!versions.length) return null
    // latest version, prefer Formatted Text (.htm)
    const last = versions[versions.length - 1]
    const fmt = (last.formats || []).find((f) => /formatted text/i.test(f.type)) || (last.formats || [])[0]
    if (!fmt?.url) return null
    const tr = await fetch(fmt.url, { headers: { 'User-Agent': 'CampaignReceipts/1.0 (contact@campaignreceipts.com)' } })
    if (!tr.ok) return null
    const text = stripHtml(await tr.text()).slice(0, MAX_TEXT)
    if (text.length < 200) return null
    if (!DRY) await supabase.from('cr_bill_text').upsert({ bill_id: bill.id, text_url: fmt.url, text_chars: text.length, full_text: text, fetched_at: new Date().toISOString() }, { onConflict: 'bill_id' })
    return text
  } catch { return null }
}

function buildPrompt(bill, text) {
  return `You are a nonpartisan legislative analyst reading the ACTUAL TEXT of a bill (not just its title — titles can be misleading). Determine whether the bill materially benefits ONE specific industry, and pull out the SPECIFIC provisions that do so.

Return STRICT JSON:
{"beneficiary_industry": <one of the list or null>, "mechanism": "<short: cuts a tax / loosens a rule / awards contracts / preempts regulation / creates a carve-out>", "plain_effect": "<one factual sentence on what the bill does>", "key_provisions": ["<the specific section/provision that benefits the industry, quoted or closely paraphrased>", ...up to 3], "confidence": "high"|"medium"|"low"}

INDUSTRY LIST (use EXACTLY one, or null): ${INDUSTRIES.join(', ')}

HARD RULES:
- Base everything on the TEXT, not the title. If the title implies one thing but the text is about another, go with the text.
- beneficiary_industry = null unless the text clearly, materially benefits a specific industry (a carve-out, deregulation, funding, tax change, contract, or preemption that lands on that industry). Commemorative/procedural/naming bills, or broad public-interest bills with no industry tilt → null.
- key_provisions must be grounded in the text — cite the section or paraphrase the actual provision. If you cannot point to a specific provision, beneficiary_industry should be null.
- plain_effect & provisions are FACTUAL. No motive, no causation, no "to reward donors", no "in exchange for".
- A wrong industry tag is worse than null. When unsure, null.

BILL: ${bill.bill_type?.toUpperCase()} ${bill.bill_number} — "${bill.title}"

FULL TEXT (may be truncated):
${text}

Return only the JSON object.`
}

async function classifyOne(bill, text) {
  const resp = await anthropic.messages.create({ model: MODEL, max_tokens: 800, messages: [{ role: 'user', content: buildPrompt(bill, text) }] })
  let t = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
  t = t.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  try { return JSON.parse(t) } catch { return null }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Classifying bill effects FROM FULL TEXT${DRY ? ' (DRY RUN)' : ''}`)
  if (!API_KEY) { console.error('Missing CONGRESS_API_KEY / FEC_API_KEY'); process.exit(1) }
  const { data: pols } = await supabase.from('cr_politicians').select('bioguide').not('bioguide', 'is', null)
  const bios = new Set((pols || []).map((p) => p.bioguide))
  let bills = []
  for (let from = 0; ; from += 1000) {
    const { data } = await supabase.from('cr_bills').select('id, title, bill_type, bill_number, congress, sponsor_bioguide').range(from, from + 999)
    if (!data || !data.length) break
    bills.push(...data); if (data.length < 1000) break
  }
  bills = bills.filter((b) => b.title && b.sponsor_bioguide && bios.has(b.sponsor_bioguide))
  if (!FORCE) {
    const { data: done } = await supabase.from('cr_bill_effect').select('bill_id, read_full_text')
    const readDone = new Set((done || []).filter((d) => d.read_full_text).map((d) => d.bill_id))
    bills = bills.filter((b) => !readDone.has(b.id)) // re-do title-only rows with full text
  }
  if (LIMIT) bills = bills.slice(0, LIMIT)
  console.log(`Bills to read: ${bills.length}`)
  if (!bills.length) { console.log('Nothing to do.'); return }

  const out = []
  let read = 0, noText = 0
  for (const b of bills) {
    const text = await fetchBillText(b)
    if (!text) { noText++; out.push({ bill_id: b.id, beneficiary_industry: null, mechanism: null, plain_effect: null, key_provisions: null, confidence: 'low', read_full_text: false, updated_at: new Date().toISOString() }); continue }
    read++
    const r = await classifyOne(b, text)
    if (!r) { continue }
    const ind = INDUSTRIES.includes(r.beneficiary_industry) ? r.beneficiary_industry : null
    out.push({
      bill_id: b.id, beneficiary_industry: ind,
      mechanism: (r.mechanism || '').slice(0, 200) || null,
      plain_effect: (r.plain_effect || '').slice(0, 500) || null,
      key_provisions: Array.isArray(r.key_provisions) ? r.key_provisions.slice(0, 3) : null,
      confidence: r.confidence || 'low', read_full_text: true, updated_at: new Date().toISOString(),
    })
    if (read % 10 === 0) console.log(`  read ${read} bills (${out.filter((o) => o.beneficiary_industry).length} industry-tagged)…`)
    await sleep(200) // be gentle to congress.gov
  }
  const withInd = out.filter((o) => o.beneficiary_industry)
  console.log(`Read full text of ${read} bills (${noText} had no text); ${withInd.length} materially benefit an industry.`)
  console.log('Sample (from the actual text):')
  withInd.slice(0, 8).forEach((o) => console.log(`  [${o.confidence}] ${o.beneficiary_industry}: ${o.plain_effect}\n     provisions: ${(o.key_provisions || []).join(' | ').slice(0, 160)}`))
  if (DRY) { console.log('DRY RUN — nothing written.'); return }
  for (let i = 0; i < out.length; i += 500) {
    const { error } = await supabase.from('cr_bill_effect').upsert(out.slice(i, i + 500), { onConflict: 'bill_id' })
    if (error) { console.error('upsert error:', error.message); process.exit(1) }
  }
  console.log(`Wrote ${out.length} bill-effect rows (${withInd.length} industry-tagged, from full text).`)
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
