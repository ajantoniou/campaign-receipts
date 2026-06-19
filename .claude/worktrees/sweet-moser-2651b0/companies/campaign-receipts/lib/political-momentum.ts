// lib/political-momentum.ts
//
// Per founder rev-7 (2026-05-19): weekly "Political Momentum" score
// surfaced as editorial labels (HOT / RISING / COLLAPSING / UNDER FIRE).
// Computed from cr_weekly_snapshot.shock_score week-over-week delta.
//
// Editorial discipline:
//   - HOT          shock_score >= 0.85 this week (top-decile)
//   - RISING       week-over-week shock delta >= +0.10
//   - COLLAPSING   week-over-week shock delta <= -0.15 from a HOT state
//   - UNDER FIRE   has an open verdict_under_review pulse item
//   - (no tag)     ordinary state — labels are restrained, not partisan

import { supabaseService } from './supabase'

export type Momentum =
  | { label: 'HOT'; tone: 'broken' }
  | { label: 'RISING'; tone: 'amber' }
  | { label: 'COLLAPSING'; tone: 'pending' }
  | { label: 'UNDER FIRE'; tone: 'broken' }
  | null

type SnapshotRow = {
  politician_id: string
  week_ending: string
  shock_score: number
}

/** Compute momentum for a single politician. */
export async function getMomentumForPolitician(politicianId: string): Promise<Momentum> {
  const { data } = await supabaseService
    .from('cr_weekly_snapshot')
    .select('politician_id, week_ending, shock_score')
    .eq('politician_id', politicianId)
    .order('week_ending', { ascending: false })
    .limit(2)
  const rows = (data as SnapshotRow[]) || []
  if (rows.length === 0) return null
  return classify(rows[0], rows[1])
}

/** Batch lookup for many politicians at once. Used by leaderboard pages. */
export async function getMomentumBatch(
  politicianIds: string[],
): Promise<Map<string, Momentum>> {
  if (politicianIds.length === 0) return new Map()
  const { data } = await supabaseService
    .from('cr_weekly_snapshot')
    .select('politician_id, week_ending, shock_score')
    .in('politician_id', politicianIds)
    .order('week_ending', { ascending: false })
  const rows = (data as SnapshotRow[]) || []
  // Group by politician_id, take latest + prior per pol.
  const byPol = new Map<string, SnapshotRow[]>()
  for (const r of rows) {
    if (!byPol.has(r.politician_id)) byPol.set(r.politician_id, [])
    byPol.get(r.politician_id)!.push(r)
  }
  const out = new Map<string, Momentum>()
  for (const pid of politicianIds) {
    const polRows = byPol.get(pid) || []
    out.set(pid, polRows.length > 0 ? classify(polRows[0], polRows[1]) : null)
  }
  return out
}

function classify(current: SnapshotRow, prior: SnapshotRow | undefined): Momentum {
  const s = Number(current.shock_score || 0)
  const priorS = prior ? Number(prior.shock_score || 0) : null
  const delta = priorS != null ? s - priorS : 0

  // HOT — top-decile this week.
  if (s >= 0.85) return { label: 'HOT', tone: 'broken' }
  // COLLAPSING — was hot, fell sharply.
  if (priorS != null && priorS >= 0.85 && delta <= -0.15) {
    return { label: 'COLLAPSING', tone: 'pending' }
  }
  // RISING — meaningful jump from a non-trivial base.
  if (priorS != null && priorS >= 0.30 && delta >= 0.10) {
    return { label: 'RISING', tone: 'amber' }
  }
  return null
}

export function momentumPillClass(m: Momentum): string {
  if (!m) return ''
  switch (m.tone) {
    case 'broken':
      return 'bg-broken/[0.10] text-broken border-broken/30'
    case 'amber':
      return 'bg-amber-stat-dim text-ink border-amber-stat'
    case 'pending':
      return 'bg-pending/[0.10] text-pending border-pending/30'
    default:
      return 'bg-paper-3 text-ink-2 border-line'
  }
}
