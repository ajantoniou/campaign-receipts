#!/usr/bin/env node
// "Worst Broken Promise of the Week" picker. Runs Monday 06:00 ET.
//
// Picks the highest-impact BROKEN verdict published in the prior 7
// days. Impact = the politician's `page_views_30d` (rough proxy for
// audience care) × 1, plus a content-quality bonus if the promise
// has receipts attached. Writes one row per ISO week to cr_weekly.
//
// If nothing new BROKEN in last 7 days, picks the highest-impact
// BROKEN promise of all time that hasn't been featured yet.

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const DRY = process.argv.includes('--dry-run')

// ISO week + year for "now"
function isoWeek(d = new Date()) {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tmp - yearStart) / 86400_000 + 1) / 7)
  return { iso_year: tmp.getUTCFullYear(), iso_week: weekNo }
}

const { iso_year, iso_week } = isoWeek()

// Already picked this week? Idempotent guard.
const { data: existing } = await supabase
  .from('cr_weekly')
  .select('promise_id')
  .eq('iso_year', iso_year)
  .eq('iso_week', iso_week)
  .maybeSingle()

if (existing && !DRY) {
  console.log(`Already picked for ${iso_year}-W${iso_week}: ${existing.promise_id}`)
  process.exit(0)
}

// Candidate set: BROKEN verdicts, not yet featured. We don't have
// promise.created_at reliably populated across the corpus, so the
// "prior 7 days" filter would be unreliable — instead, rank all
// BROKEN promises not already in cr_weekly, by politician traffic.
const { data: candidates } = await supabase
  .from('cr_promises')
  .select(
    'id, promise_text, verdict, verdict_reasoning, case_study_narrative, politician_id, cr_politicians!inner(slug, name, party, state, page_views_30d, scorecard_broken)',
  )
  .eq('verdict', 'BROKEN')
  .eq('verdict_status', 'graded')
  .order('id', { ascending: false })
  .limit(500)

if (!candidates || candidates.length === 0) {
  console.log('No graded BROKEN candidates to pick from')
  process.exit(0)
}

const { data: alreadyFeatured } = await supabase.from('cr_weekly').select('promise_id')
const featured = new Set((alreadyFeatured || []).map((r) => r.promise_id))

const ranked = candidates
  .filter((c) => !featured.has(c.id))
  .map((c) => {
    const pol = c.cr_politicians
    const views = pol?.page_views_30d || 0
    const brokenCount = pol?.scorecard_broken || 0
    // Score: traffic + small bonus for politicians with many broken
    // promises (story consistency), small bonus for having a
    // case-study narrative (writable content vs sterile entry).
    const score = views + brokenCount * 50 + (c.case_study_narrative ? 200 : 0)
    return { ...c, _score: score }
  })
  .sort((a, b) => b._score - a._score)

if (ranked.length === 0) {
  console.log('Every BROKEN promise has been featured; expand corpus or wait for new verdicts.')
  process.exit(0)
}

const pick = ranked[0]
const pol = pick.cr_politicians

const headline = `${pol.name} — broken: ${pick.promise_text.slice(0, 120)}${pick.promise_text.length > 120 ? '…' : ''}`
const blurb =
  pick.verdict_reasoning?.trim() ||
  pick.case_study_narrative?.slice(0, 400) ||
  `${pol.name} (${pol.party[0]}-${pol.state}) failed to deliver on this campaign promise.`

const row = {
  iso_year,
  iso_week,
  promise_id: pick.id,
  politician_id: pick.politician_id,
  headline,
  blurb,
  share_image_url: `https://campaignreceipts.com/weekly/opengraph-image?year=${iso_year}&week=${iso_week}`,
}

console.log(`Week ${iso_year}-W${iso_week} pick:`)
console.log(`  ${pol.name} (${pol.party[0]}-${pol.state}) — score ${pick._score}`)
console.log(`  ${pick.promise_text.slice(0, 200)}`)

if (DRY) {
  console.log('\n(dry run — not writing)')
  process.exit(0)
}

const { error } = await supabase.from('cr_weekly').insert(row)
if (error) {
  console.error('Insert failed:', error.message)
  process.exit(1)
}
console.log('\n✓ Wrote cr_weekly row.')
