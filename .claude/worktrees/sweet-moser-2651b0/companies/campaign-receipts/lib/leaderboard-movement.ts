// lib/leaderboard-movement.ts
//
// Reads cr_leaderboard_history to compute ↑↓ delta per politician
// per bucket. Returns one of:
//   { kind: 'up', positions: 3 }    -- moved up 3 spots since last week
//   { kind: 'down', positions: 2 }  -- moved down 2 spots
//   { kind: 'new' }                 -- not on last week's leaderboard
//   { kind: 'flat' }                -- same rank as last week
//   { kind: 'gone' }                -- on last week's, not on this week's
//
// Per founder rev-7 (2026-05-19): credibility moat is FAKE-FREE
// movement. If the history table has zero prior weeks, we return
// 'new' for every politician (which is honest) instead of inventing
// arrows.

import { supabaseService } from './supabase'

export type Movement =
  | { kind: 'up'; positions: number }
  | { kind: 'down'; positions: number }
  | { kind: 'new' }
  | { kind: 'flat' }
  | { kind: 'gone' }

type LeaderboardBucket =
  | 'most_kept'
  | 'most_broken'
  | 'most_shock_score'
  | 'foreign_funded'
  | 'biggest_donor_shift'

/**
 * Get movement for a list of politicians in a given bucket. Returns a
 * Map<politicianId, Movement>. Politicians not in the map are 'new'
 * (no prior-week rank).
 *
 * Cheap query: pulls two weeks of history rows for the bucket, joins
 * in JS. Fast even at full 20-row leaderboards.
 */
export async function getBucketMovement(
  bucket: LeaderboardBucket,
  currentWeekEnding: string,
): Promise<Map<string, Movement>> {
  // Pull the current + prior week.
  const { data: history } = await supabaseService
    .from('cr_leaderboard_history')
    .select('politician_id, rank, week_ending')
    .eq('bucket', bucket)
    .order('week_ending', { ascending: false })
    .limit(60) // 20 current + 20 prior + slack

  const rows = (history as { politician_id: string; rank: number; week_ending: string }[] | null) || []

  // Find the prior week_ending (the next-most-recent distinct date).
  const distinctWeeks = Array.from(new Set(rows.map((r) => r.week_ending))).sort().reverse()
  const priorWeek = distinctWeeks.find((w) => w !== currentWeekEnding)

  const current = new Map<string, number>()
  const prior = new Map<string, number>()
  for (const r of rows) {
    if (r.week_ending === currentWeekEnding) current.set(r.politician_id, r.rank)
    if (r.week_ending === priorWeek) prior.set(r.politician_id, r.rank)
  }

  const out = new Map<string, Movement>()
  for (const [pid, currentRank] of current) {
    if (!priorWeek) {
      out.set(pid, { kind: 'new' })
      continue
    }
    const priorRank = prior.get(pid)
    if (priorRank == null) {
      out.set(pid, { kind: 'new' })
      continue
    }
    const delta = priorRank - currentRank // positive = improved (moved up)
    if (delta === 0) out.set(pid, { kind: 'flat' })
    else if (delta > 0) out.set(pid, { kind: 'up', positions: delta })
    else out.set(pid, { kind: 'down', positions: -delta })
  }
  return out
}

export function formatMovement(m: Movement | undefined | null): string {
  if (!m) return ''
  switch (m.kind) {
    case 'up':
      return `↑ +${m.positions}`
    case 'down':
      return `↓ −${m.positions}`
    case 'new':
      return 'NEW'
    case 'flat':
      return '—'
    case 'gone':
      return 'OFF'
  }
}

export function movementToneClass(m: Movement | undefined | null): string {
  if (!m) return 'text-ink-3'
  switch (m.kind) {
    case 'up':
      return 'text-kept' // sage — moving up is "improving"
    case 'down':
      return 'text-broken' // coral — moving down on most-broken means flipping; on most-kept means falling
    case 'new':
      // Design-pass 2026-05-19: text-amber-stat (#E8A33D) fails WCAG AA
      // against bone/paper backgrounds (~3.1:1). text-amber-text
      // (#B8821C) reads at 4.6:1 — same warning-light intent, AA pass.
      return 'text-amber-text'
    default:
      return 'text-ink-3'
  }
}
