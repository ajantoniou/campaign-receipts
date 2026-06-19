#!/usr/bin/env node
//
// scripts/seed-causal-timeline.mjs
//
// Editorial seed loader for CausalTimeline rollout.
//
// Per the Phase B post-build conversion/engagement panel (2026-05-19):
// CausalTimeline should ship first on 3-5 hand-picked bill pages where
// the chronology is genuinely tight, NOT as a sitewide auto-generated
// dossier component. This script is the load-mechanism for those picks.
//
// Workflow:
//   1. Founder + editorial pick 3-5 bills where the donation → vote →
//      outcome chain is documentable end-to-end with primary sources.
//   2. Fill in the PICKS array below — each entry is {congress,
//      bill_type, bill_number, next_event_date, next_event_label,
//      nodes: [...]}.
//   3. Run: node scripts/seed-causal-timeline.mjs
//
// The script is idempotent — it deletes existing timeline nodes for
// each seeded bill before re-inserting, and upserts the next_event_*
// fields on cr_bills. Re-runs are safe.
//
// IMPORTANT: This file ships with PICKS = []. That is intentional.
// Inventing picks here would be the "AI assumption flaw" — chronologies
// have to be cited to primary sources, not guessed. The migration
// (004_bill_causal_timeline.sql) is live; this script is the loader
// waiting on real editorial input.

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
)

// ─────────────────────────────────────────────────────────────────────
// FOUNDER + EDITORIAL: fill this in.
//
// Shape per pick:
// {
//   congress: 119,
//   bill_type: 'hr',            // matches cr_bills.bill_type (lowercase)
//   bill_number: 1234,
//   next_event_date: '2026-06-12',          // ISO date or null
//   next_event_label: 'Floor vote',         // or null
//   nodes: [
//     { sort_index: 1, kind: 'donation', title: 'Pharma PAC → Sponsor',
//       amount_usd: 250000, event_date: '2025-09-01',
//       href: 'https://www.fec.gov/data/...', meta: 'Pharmaceuticals/Health' },
//     { sort_index: 2, kind: 'bill', title: 'HR-1234 introduced',
//       event_date: '2025-11-14', href: 'https://www.congress.gov/...', meta: 'Sponsor + 11 co-sponsors' },
//     { sort_index: 3, kind: 'vote', title: 'House floor vote',
//       event_date: '2026-03-02', href: 'https://clerk.house.gov/...', meta: '221-204' },
//     { sort_index: 4, kind: 'outcome', title: 'Signed into law',
//       event_date: '2026-04-10', href: '...', meta: 'Public Law 119-12' },
//   ],
// }
//
// Each `nodes` entry maps 1:1 to a row in cr_bill_timeline_nodes.
// kind must be one of: donation, bill, vote, outcome, event.
// ─────────────────────────────────────────────────────────────────────
const PICKS = []

async function findBillId(congress, billType, billNumber) {
  const { data, error } = await supabase
    .from('cr_bills')
    .select('id')
    .eq('congress', congress)
    .eq('bill_type', billType)
    .eq('bill_number', billNumber)
    .maybeSingle()
  if (error) throw error
  return data?.id || null
}

async function seedPick(pick) {
  const billId = await findBillId(pick.congress, pick.bill_type, pick.bill_number)
  if (!billId) {
    console.error(`  ✗ ${pick.congress}/${pick.bill_type}/${pick.bill_number}: not in cr_bills — skipping`)
    return false
  }

  // 1) Upsert next_event_* on the bill row.
  const { error: updErr } = await supabase
    .from('cr_bills')
    .update({
      next_event_date: pick.next_event_date || null,
      next_event_label: pick.next_event_label || null,
    })
    .eq('id', billId)
  if (updErr) {
    console.error(`  ✗ ${pick.bill_type}-${pick.bill_number} cr_bills update:`, updErr.message)
    return false
  }

  // 2) Clear + re-insert timeline nodes (idempotent).
  const { error: delErr } = await supabase
    .from('cr_bill_timeline_nodes')
    .delete()
    .eq('bill_id', billId)
  if (delErr) {
    console.error(`  ✗ ${pick.bill_type}-${pick.bill_number} delete-existing:`, delErr.message)
    return false
  }

  const rows = (pick.nodes || []).map((n) => ({
    bill_id: billId,
    sort_index: n.sort_index,
    kind: n.kind,
    title: n.title,
    amount_usd: n.amount_usd ?? null,
    event_date: n.event_date ?? null,
    href: n.href ?? null,
    meta: n.meta ?? null,
  }))
  if (rows.length === 0) {
    console.log(`  · ${pick.bill_type}-${pick.bill_number}: no nodes (next_event_* set only)`)
    return true
  }
  const { error: insErr } = await supabase
    .from('cr_bill_timeline_nodes')
    .insert(rows)
  if (insErr) {
    console.error(`  ✗ ${pick.bill_type}-${pick.bill_number} insert nodes:`, insErr.message)
    return false
  }
  console.log(`  ✓ ${pick.bill_type}-${pick.bill_number}: ${rows.length} nodes seeded`)
  return true
}

async function main() {
  if (PICKS.length === 0) {
    console.log('No PICKS defined yet. Edit scripts/seed-causal-timeline.mjs')
    console.log('and add 3-5 entries to the PICKS array, then re-run.')
    console.log('See header comment for the shape per pick.')
    process.exit(0)
  }
  console.log(`Seeding ${PICKS.length} bill timelines…`)
  let ok = 0
  for (const pick of PICKS) {
    if (await seedPick(pick)) ok++
  }
  console.log(`\nDone. ${ok}/${PICKS.length} succeeded.`)
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
