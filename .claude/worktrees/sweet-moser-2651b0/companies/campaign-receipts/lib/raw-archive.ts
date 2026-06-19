// Append-only archive of every external API response we hit.
// Per docs/DATA_MOAT.md — owns the data so we can sell derived
// products + survive upstream shape-changes.
//
// Server-only. Fire-and-forget — failure to archive should never
// block an ingest pipeline.

import { supabaseService } from './supabase'

type Source = 'congress.gov' | 'fec.gov' | 'wikipedia' | 'openstates' | 'clerk.senate.gov' | 'clerk.house.gov'

export async function archiveApiResponse(
  source: Source,
  endpoint: string,
  params: Record<string, unknown> | null,
  response: unknown,
): Promise<void> {
  try {
    await supabaseService.from('cr_raw_api_snapshots').insert({
      source,
      endpoint,
      params: params || {},
      response,
    })
  } catch (err) {
    // Never block on archive failure.
    console.warn(`raw-archive: ${endpoint} failed: ${(err as Error).message}`)
  }
}
