#!/usr/bin/env node
//
// scripts/record-finance-events.mjs  —  A′: the money-event journaler.
//
// WHY: the live FEC tables are DESTRUCTIVE (cr_top_donors is delete+reinsert per
// (politician,cycle); cr_bill_money_trail is fully truncated/rebuilt). So you
// cannot diff "this week vs last week" from them. This script writes an
// APPEND-ONLY ledger (cr_money_events) keyed by a natural connection key. The
// FIRST time a connection is seen, first_seen_week = the current ISO Monday;
// re-runs only update last_amount / delta_amount. detect-new-connections.mjs then
// finds "new this week" = rows whose first_seen_week == this Monday.
//
// Run it at the END of each FEC ingest (fec-sync, fec-pac-contributions) and after
// compute-bill-money-trail, so the journal tracks every connection as it appears.
//
// Connection types journaled:
//   donor_to_politician  key: pol:{politician_id}|donor:{norm_name}|cyc:{cycle}
//   pac_to_politician    key: pac:{committee_id}|pol:{politician_id}|cyc:{cycle}
//   pac_to_bill          key: bill:{bill_id}|ind:{industry_label}
//
// Idempotent: upsert on (entity_type, entity_key). Safe to re-run any time.
//
// Usage:
//   node scripts/record-finance-events.mjs            # journal current state
//   node scripts/record-finance-events.mjs --dry-run  # count only, no writes
//   node scripts/record-finance-events.mjs --week-of=YYYY-MM-DD  # override ISO Monday

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-of='))?.split('=')[1]

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
const WEEK_OF = weekArg || isoMonday()
const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')

// Page through a table in chunks (Supabase caps at 1000/req).
async function selectAll(table, columns) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    out.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return out
}

// Upsert one event. INSERT path stamps first_seen_week; CONFLICT path computes
// delta vs the previously-recorded amount.
async function upsertEvents(rows) {
  if (DRY || rows.length === 0) return rows.length
  let written = 0
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500)
    // Fetch existing amounts so we can compute delta + preserve first_seen_week.
    const keys = batch.map((r) => r.entity_key)
    const { data: existing } = await supabase
      .from('cr_money_events')
      .select('entity_type, entity_key, amount, first_seen_week')
      .in('entity_key', keys)
    const exMap = new Map((existing || []).map((e) => [`${e.entity_type}|${e.entity_key}`, e]))

    const payload = batch.map((r) => {
      const prev = exMap.get(`${r.entity_type}|${r.entity_key}`)
      const prevAmount = prev ? Number(prev.amount) : 0
      return {
        ...r,
        last_amount: prevAmount,
        delta_amount: r.amount - prevAmount,
        first_seen_week: prev ? prev.first_seen_week : WEEK_OF,
        last_seen_week: WEEK_OF,
      }
    })
    const { error } = await supabase
      .from('cr_money_events')
      .upsert(payload, { onConflict: 'entity_type,entity_key' })
    if (error) { console.error('upsert error:', error.message); continue }
    written += payload.length
  }
  return written
}

async function main() {
  console.log(`[${new Date().toISOString()}] Journaling money events for week_of=${WEEK_OF}${DRY ? ' (DRY RUN)' : ''}`)

  // Branch lookup for politicians (denormalized onto events for fast detection).
  const pols = await selectAll('cr_politicians', 'id, branch')
  const branchById = new Map(pols.map((p) => [p.id, p.branch]))

  // 1) donor_to_politician (from cr_top_donors)
  const donors = await selectAll('cr_top_donors',
    'politician_id, donor_name, cycle, total_contributed, industry_label, is_pac')
  const donorEvents = donors
    .filter((d) => d.politician_id && d.donor_name && Number(d.total_contributed) > 0)
    .map((d) => ({
      entity_type: 'donor_to_politician',
      entity_key: `pol:${d.politician_id}|donor:${norm(d.donor_name)}|cyc:${d.cycle}`,
      politician_id: d.politician_id,
      committee_id: null,
      bill_id: null,
      branch: branchById.get(d.politician_id) || null,
      label: `${d.donor_name} → politician (${d.cycle})`,
      amount: Number(d.total_contributed),
      contribution_count: 0,
    }))

  // 2) pac_to_politician (from cr_pac_contributions)
  const pacs = await selectAll('cr_pac_contributions',
    'committee_id, politician_id, cycle, total_amount, contribution_count')
  const pacEvents = pacs
    .filter((p) => p.committee_id && p.politician_id && Number(p.total_amount) > 0)
    .map((p) => ({
      entity_type: 'pac_to_politician',
      entity_key: `pac:${p.committee_id}|pol:${p.politician_id}|cyc:${p.cycle}`,
      politician_id: p.politician_id,
      committee_id: p.committee_id,
      bill_id: null,
      branch: branchById.get(p.politician_id) || null,
      label: `PAC ${p.committee_id} → politician (${p.cycle})`,
      amount: Number(p.total_amount),
      contribution_count: Number(p.contribution_count || 0),
    }))

  // 3) pac_to_bill (from cr_bill_money_trail — industry money behind a bill)
  const trails = await selectAll('cr_bill_money_trail',
    'bill_id, industry_label, total_from_industry, n_sponsors_funded')
  const billEvents = trails
    .filter((t) => t.bill_id && t.industry_label && Number(t.total_from_industry) > 0)
    .map((t) => ({
      entity_type: 'pac_to_bill',
      entity_key: `bill:${t.bill_id}|ind:${norm(t.industry_label)}`,
      politician_id: null,
      committee_id: null,
      bill_id: t.bill_id,
      branch: null, // bills aren't branch-scoped; detection assigns by sponsor later
      label: `${t.industry_label} money → bill`,
      amount: Number(t.total_from_industry),
      contribution_count: Number(t.n_sponsors_funded || 0),
    }))

  const all = [...donorEvents, ...pacEvents, ...billEvents]
  console.log(`Candidates — donors:${donorEvents.length} pac→pol:${pacEvents.length} pac→bill:${billEvents.length} total:${all.length}`)

  const written = await upsertEvents(all)
  console.log(DRY ? `DRY RUN — would upsert ${all.length} events.` : `Upserted ${written} money events.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
