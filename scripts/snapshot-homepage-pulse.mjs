#!/usr/bin/env node
//
// scripts/snapshot-homepage-pulse.mjs
//
// Populator for cr_homepage_pulse. Runs daily. Reads recent activity
// from existing CR tables and writes ticker-ready items with
// REAL-AS-OF timestamps (the underlying event time, NOT cron-run time
// — credibility anchor per founder rev-7).
//
// Sources scanned each run:
//   1. cr_promises -- recent verdict_at changes  -> kind='verdict_change'
//   2. cr_races    -- updated_at on active races -> kind='race_spend_delta'
//   3. cr_foreign_donor_records -- source_date <= 30d -> kind='fec_filing'
//   4. cr_weekly_snapshot -- new week_ending rows  -> kind='top_donor_flip'
//   5. cr_bills    -- introduced_at <= 30d         -> kind='new_bill'
//
// Idempotent via UPSERT on (source_kind, source_id). Expired items
// (expires_at < now) get pruned in the same run.
//
// Usage:
//   node scripts/snapshot-homepage-pulse.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const DRY = process.argv.includes('--dry-run')

// ── Helpers ────────────────────────────────────────────────

const now = new Date()
const ms = (h) => h * 60 * 60 * 1000

function expiresFor(kind) {
  // Different kinds have different "freshness" lifespans on the ticker.
  switch (kind) {
    case 'fec_filing':
    case 'pac_filing':
      return new Date(now.getTime() + ms(72)) // 3 days
    case 'race_spend_delta':
    case 'new_bill':
      return new Date(now.getTime() + ms(48)) // 2 days
    case 'verdict_change':
    case 'top_donor_flip':
    case 'verdict_under_review':
      return new Date(now.getTime() + ms(24)) // 1 day
    default:
      return new Date(now.getTime() + ms(24))
  }
}

function fmtMoney(n) {
  if (n == null) return ''
  const v = Number(n)
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

// ── Source 1: foreign-donor records (FEC filings) ────────────

async function pulseFromForeignDonors() {
  const since = new Date(now.getTime() - ms(24 * 30)).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('cr_foreign_donor_records')
    .select('id, recipient_name, amount_usd, category, source_date, source_publication, source_url, short_summary')
    .gte('source_date', since)
    .order('source_date', { ascending: false })
    .limit(40)

  return ((data) || []).map((r) => {
    const cat = r.category?.replace(/_/g, ' ') || 'filing'
    const amount = r.amount_usd ? fmtMoney(r.amount_usd) : ''
    return {
      kind: 'fec_filing',
      title: amount
        ? `${amount} · ${cat} · ${r.recipient_name?.slice(0, 60) || ''}`
        : `${cat} · ${r.recipient_name?.slice(0, 60) || ''}`,
      subtitle: r.source_publication || null,
      href: r.source_url || '/foreign-donors',
      source_id: String(r.id),
      source_kind: 'cr_foreign_donor_records',
      real_as_of_at: new Date(r.source_date).toISOString(),
      expires_at: expiresFor('fec_filing').toISOString(),
      priority: 60,
    }
  })
}

// ── Source 2: active races with recent updates ────────────────

async function pulseFromRaces() {
  const { data } = await supabase
    .from('cr_races')
    .select('id, slug, district, state, headline, primary_date, total_ie_usd, total_spend_usd, updated_at, is_active')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(10)

  return ((data) || []).map((r) => {
    const ie = r.total_ie_usd ? fmtMoney(r.total_ie_usd) : null
    const total = r.total_spend_usd ? fmtMoney(r.total_spend_usd) : null
    const title = total
      ? `${r.district || r.state} race · ${total} total spend`
      : ie
        ? `${r.district || r.state} race · ${ie} super-PAC IE`
        : `Race tracker · ${r.district || r.state}`
    return {
      kind: 'race_spend_delta',
      title,
      subtitle: r.headline?.slice(0, 80) || null,
      href: `/race/${r.slug}`,
      source_id: r.id,
      source_kind: 'cr_races',
      real_as_of_at: new Date(r.updated_at).toISOString(),
      expires_at: expiresFor('race_spend_delta').toISOString(),
      priority: 70, // races push higher (closest to founder-flagged "live")
    }
  })
}

// ── Source 3: new bills introduced ────────────────────────────

async function pulseFromBills() {
  const since = new Date(now.getTime() - ms(24 * 14)).toISOString().slice(0, 10)
  const { data } = await supabase
    .from('cr_bills')
    .select('id, congress, bill_type, bill_number, title, short_title, introduced_at')
    .gte('introduced_at', since)
    .order('introduced_at', { ascending: false })
    .limit(10)

  return ((data) || []).map((b) => {
    const billLabel = `${b.bill_type?.toUpperCase()}${b.bill_number}`
    const shortTitle = (b.short_title || b.title || '').slice(0, 80)
    return {
      kind: 'new_bill',
      title: `New bill · ${billLabel} · ${shortTitle}`,
      subtitle: `Congress ${b.congress}`,
      href: `/bill/${b.congress}/${b.bill_number}`,
      source_id: String(b.id),
      source_kind: 'cr_bills',
      real_as_of_at: new Date(b.introduced_at).toISOString(),
      expires_at: expiresFor('new_bill').toISOString(),
      priority: 55,
    }
  })
}

// ── Source 4: latest weekly-snapshot picks ────────────────────

async function pulseFromWeeklySnapshot() {
  const { data } = await supabase
    .from('cr_weekly_snapshot')
    .select(`
      id, week_ending, top_donor_industry, top_donor_industry_total_usd,
      industry_concentration_pct, was_receipt_of_week, shock_score,
      politician:cr_politicians!inner(slug, name, party, state)
    `)
    .order('week_ending', { ascending: false })
    .limit(5)

  return ((data) || []).map((s) => {
    const p = s.politician
    const conc = s.industry_concentration_pct ? ` (${Math.round(s.industry_concentration_pct * 100)}%)` : ''
    return {
      kind: 'top_donor_flip',
      title: s.was_receipt_of_week
        ? `Receipt of the Week · ${p?.name}`
        : `Top donor: ${s.top_donor_industry || '—'} · ${p?.name}`,
      subtitle: s.top_donor_industry
        ? `${fmtMoney(s.top_donor_industry_total_usd)} from ${s.top_donor_industry}${conc}`
        : null,
      href: `/r/${p?.slug || ''}`,
      source_id: String(s.id),
      source_kind: 'cr_weekly_snapshot',
      real_as_of_at: new Date(s.week_ending + 'T13:00:00Z').toISOString(),
      expires_at: expiresFor('top_donor_flip').toISOString(),
      priority: s.was_receipt_of_week ? 90 : 65,
    }
  })
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  console.log(`# CR homepage pulse · ${now.toISOString()}${DRY ? ' (DRY RUN)' : ''}`)

  const [foreign, races, bills, weekly] = await Promise.all([
    pulseFromForeignDonors(),
    pulseFromRaces(),
    pulseFromBills(),
    pulseFromWeeklySnapshot(),
  ])

  const all = [...foreign, ...races, ...bills, ...weekly]
  console.log(`  foreign:${foreign.length} races:${races.length} bills:${bills.length} weekly:${weekly.length} = ${all.length} items`)

  if (DRY) {
    console.log('\n[dry-run] sample items:')
    for (const item of all.slice(0, 10)) {
      console.log(`  · ${item.kind} | ${item.title.slice(0, 80)}`)
    }
    return
  }

  // Prune expired first.
  const { error: pruneErr } = await supabase
    .from('cr_homepage_pulse')
    .delete()
    .lt('expires_at', now.toISOString())
  if (pruneErr) console.error('Prune failed:', pruneErr.message)

  // Upsert deduped on (source_kind, source_id).
  // Supabase doesn't support upsert on a non-unique composite without
  // a unique constraint, so we manually dedupe: try insert, ignore on
  // conflict via insert-with-onConflict-then-ignore (PostgREST gives
  // 409 instead, so we wrap in try/catch per row).
  let inserted = 0
  let skipped = 0
  for (const item of all) {
    if (!item.source_id) continue
    // Check existence.
    const { data: existing } = await supabase
      .from('cr_homepage_pulse')
      .select('id')
      .eq('source_kind', item.source_kind)
      .eq('source_id', item.source_id)
      .maybeSingle()
    if (existing) {
      skipped++
      continue
    }
    const { error } = await supabase.from('cr_homepage_pulse').insert(item)
    if (error) {
      console.error(`  ! insert failed for ${item.source_kind}/${item.source_id}: ${error.message}`)
      continue
    }
    inserted++
  }

  console.log(`\n✓ inserted=${inserted}, skipped=${skipped} (already on ticker)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
