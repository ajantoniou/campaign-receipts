// /api/reps?state=NY — return federal politicians for a 2-letter state.
//
// State-only v1 of the FindYourReps widget. Returns Senate + Governor +
// President (national) for the matched state. House reps require
// ZIP→district census data; deferred to v2.
//
// Query parameter: ?state=XX (case-insensitive)

import { NextResponse } from 'next/server'
import { supabaseService, type Politician } from '@/lib/supabase'
import { donorHeadline } from '@/lib/donor-score'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const stateRaw = (url.searchParams.get('state') || '').toUpperCase().trim()

  if (!/^[A-Z]{2}$/.test(stateRaw)) {
    return NextResponse.json(
      { error: 'state must be a 2-letter abbreviation' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseService
    .from('cr_politicians')
    .select(
      'slug, name, branch, state, party, scorecard_percentage_kept, scorecard_graded_total, scorecard_pending, current_status, current_term_end, donor_profile, ' +
        // Embed the campaign-finance row (FK cr_campaign_finance.politician_id)
        // to power the donor-funding headline (the repositioning lead metric).
        'cr_campaign_finance ( pac_pct, large_donor_pct, individual_pct, self_funded_pct, total_raised )'
    )
    .eq('state', stateRaw)
    .in('branch', ['Senate', 'Governor', 'House'])
    .order('branch', { ascending: true })
    .order('current_term_end', { ascending: false, nullsFirst: false })

  if (error) {
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 })
  }

  // current_status is free text ("Sitting senator", "Former governor (2025…)")
  // — NOT an enum — so the only reliable signal for "in office now" is the
  // "Sitting" prefix. Keep only sitting officeholders; this drops former reps
  // (e.g. Roy Cooper, Richard Burr) that were previously leaking into results.
  const isSitting = (p: Politician) =>
    /^sitting/i.test((p.current_status || '').trim())

  // Dedup the same human appearing as two rows (e.g. Josh Stein =
  // 'josh-stein' + 'josh-stein-gov'): collapse by branch+state+last-name so a
  // duplicate person can't show twice. Keep the first (already ordered by
  // most-recent term).
  const lastName = (name: string) =>
    (name || '').trim().split(/\s+/).slice(-1)[0]?.toLowerCase() || ''

  const seen = new Set<string>()
  const picked: any[] = []
  for (const p of ((data as any[]) || []).filter(isSitting)) {
    const key = `${p.branch}|${p.state}|${lastName(p.name)}`
    if (seen.has(key)) continue
    seen.add(key)
    picked.push(p)
    if (picked.length >= 6) break
  }

  // Attach the donor-funding headline (repositioning lead metric). The embedded
  // cr_campaign_finance comes back as an array (FK) or object; normalize, then
  // compute via the shared helper. donorHeadline returns null when there's no
  // usable finance row, so the card falls back to the promise stat.
  const reps = picked.map((p) => {
    const cfRaw = p.cr_campaign_finance
    const cf = Array.isArray(cfRaw) ? cfRaw[0] ?? null : cfRaw ?? null
    const { cr_campaign_finance, ...rest } = p
    return { ...rest, donorHeadline: donorHeadline(cf, p.donor_profile) }
  })

  return NextResponse.json({ state: stateRaw, reps })
}
