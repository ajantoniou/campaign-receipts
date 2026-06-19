#!/usr/bin/env node
// Classify each cr_roll_calls row as procedural vs substantive and persist
// the result in cr_roll_calls.is_procedural.
//
// WHY: The Votes leaderboard / cr_donor_vote_alignment was scoring procedural
// RULE resolutions ("Providing for consideration of H.R. ...", hres 354/426/580/
// 722/873, the House-rules adoption hres 5, dispositions of Senate amendments)
// as if they were substantive policy votes. A viewer assumes "voted with
// Defense" means a vote ON a defense bill, not a vote to bring it to the floor.
// Scoring rule votes inflates alignment and is an overclaim. This flag lets the
// alignment compute exclude them.
//
// CLASSIFICATION RULES (conservative — a journalist must trust this).
// A roll-call is PROCEDURAL if EITHER:
//   (1) Its question text matches a procedural-question pattern, OR
//   (2) (question is null/empty — the common case in this DB) its BILL is a
//       procedural vehicle by bill_type + title.
//
// Procedural QUESTION patterns (regex, case-insensitive):
//   - "previous question"
//   - "motion to recommit"
//   - "motion to table"
//   - "ordering the previous question"
//   - "approv(e|ing|al of) the journal" / "the journal"
//   - "quorum"
//   - "motion to adjourn"
//   - "on agreeing to the resolution, as amended" ONLY when bill is a rule res
//     (covered by bill-level rule below, not the question rule)
//
// Procedural BILL patterns:
//   - bill_type='hres' AND title matches one of:
//       * /^Providing for consideration of\b/         (rule resolutions)
//       * /^Relating to consideration of\b/            (rule resolutions)
//       * /^Providing for disposition of\b/            (disposition of Sen. amdt)
//       * /^Providing that section .* shall have no force/ (rules-housekeeping)
//       * /^Adopting the Rules of the House\b/         (House-rules adoption)
//       * /^Waiving\b/ (standalone waiver resolutions)
//
// EXPLICITLY NOT procedural (substantive — left false):
//   - hjres / sjres "Providing for congressional disapproval ..." (CRA votes —
//     these REPEAL an agency rule; a real policy vote). The hres that brings a
//     CRA to the floor IS procedural; the hjres/sjres itself is NOT.
//   - hres simple resolutions of substance (censure, impeachment, condemning,
//     honoring, expressing support) — these carry no industry position anyway,
//     but we deliberately do NOT mark them procedural; they are floor statements,
//     not rule mechanics.
//   - hr / s / hconres bills — substantive by default.
//
// Idempotent: re-running recomputes from scratch and upserts the flag.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing SUPABASE env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const DRY = process.argv.includes('--dry-run')

const PROC_QUESTION = [
  /previous question/i,
  /motion to recommit/i,
  /motion to table/i,
  /motion to adjourn/i,
  /\bquorum\b/i,
  /approv(e|ing|al)?\b.*\bjournal\b/i,
]

const PROC_BILL_TITLE = [
  /^Providing for consideration of\b/i,
  /^Relating to consideration of\b/i,
  /^Providing for disposition of\b/i,
  /^Providing that section .* shall have no force/i,
  /^Adopting the Rules of the House\b/i,
  /^Waiving\b/i,
]

function isProcedural(question, billType, billTitle) {
  const q = (question || '').trim()
  if (q) {
    for (const re of PROC_QUESTION) if (re.test(q)) return true
  }
  if (billType === 'hres' && billTitle) {
    for (const re of PROC_BILL_TITLE) if (re.test(billTitle)) return true
  }
  return false
}

async function main() {
  console.log('# Classifying procedural roll-calls')

  // bill_id -> { bill_type, title }
  const bills = new Map()
  {
    let from = 0; const PAGE = 1000
    while (true) {
      const { data, error } = await supabase
        .from('cr_bills').select('id, bill_type, title').range(from, from + PAGE - 1)
      if (error) throw error
      if (!data || data.length === 0) break
      for (const b of data) bills.set(b.id, b)
      if (data.length < PAGE) break
      from += PAGE
    }
  }
  console.log(`${bills.size} bills loaded`)

  const rolls = []
  {
    let from = 0; const PAGE = 1000
    while (true) {
      const { data, error } = await supabase
        .from('cr_roll_calls').select('id, bill_id, question, is_procedural').range(from, from + PAGE - 1)
      if (error) throw error
      if (!data || data.length === 0) break
      rolls.push(...data)
      if (data.length < PAGE) break
      from += PAGE
    }
  }
  console.log(`${rolls.length} roll-calls loaded`)

  const updates = []
  let procCount = 0
  for (const r of rolls) {
    const b = r.bill_id ? bills.get(r.bill_id) : null
    const proc = isProcedural(r.question, b?.bill_type, b?.title)
    if (proc) procCount++
    if (proc !== r.is_procedural) updates.push({ id: r.id, is_procedural: proc })
  }
  console.log(`Classified ${procCount} of ${rolls.length} roll-calls as procedural`)
  console.log(`${updates.length} rows need updating`)

  if (DRY) { console.log('(dry run — not writing)'); return }

  // Update only the changed rows, batched by target value (two UPDATEs max worth
  // of ids). Avoids upsert (which could mis-handle NOT NULL cols on insert).
  const toTrue = updates.filter((u) => u.is_procedural).map((u) => u.id)
  const toFalse = updates.filter((u) => !u.is_procedural).map((u) => u.id)
  for (const [val, ids] of [[true, toTrue], [false, toFalse]]) {
    for (let i = 0; i < ids.length; i += 200) {
      const batch = ids.slice(i, i + 200)
      const { error } = await supabase
        .from('cr_roll_calls').update({ is_procedural: val }).in('id', batch)
      if (error) console.log(`  ! ${val} batch ${i}: ${error.message}`)
    }
  }
  console.log('✓ Procedural classification complete.')
}

main().catch((e) => { console.error(e); process.exit(1) })
