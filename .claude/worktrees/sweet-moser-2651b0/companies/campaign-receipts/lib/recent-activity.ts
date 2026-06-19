// lib/recent-activity.ts — the FREE "recently updated" feed.
//
// Reads the cr_recent_activity UNION view (migration 009). All committees share
// one last_synced_at, so a pure timestamp sort would bury politicians/bills under
// 2,268 PACs. We pull the freshest N per type, then interleave round-robin so the
// feed shows a mix of politician | donor | bill | vote rows — each linking to the
// (gated) dossier.

import { supabaseService } from './supabase'
import type { EntityType } from './dossier'

export type RecentRow = {
  entity_type: EntityType
  entity_id: string
  label: string
  teaser: string
  updated_at: string | null
}

const TYPES: EntityType[] = ['politician', 'donor', 'bill', 'vote']

export async function getRecentActivity(limit = 24): Promise<RecentRow[]> {
  const perType = Math.ceil(limit / 2) // pull extra, interleave, trim
  const byType: Record<string, RecentRow[]> = {}

  await Promise.all(
    TYPES.map(async (t) => {
      const { data } = await supabaseService
        .from('cr_recent_activity')
        .select('entity_type, entity_id, label, teaser, updated_at')
        .eq('entity_type', t)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(perType)
      byType[t] = (data || []) as RecentRow[]
    }),
  )

  // Round-robin interleave so the feed reads as a mix, not 24 PACs.
  const out: RecentRow[] = []
  let added = true
  let i = 0
  while (out.length < limit && added) {
    added = false
    for (const t of TYPES) {
      const row = byType[t]?.[i]
      if (row) {
        out.push(row)
        added = true
        if (out.length >= limit) break
      }
    }
    i++
  }
  return out
}
