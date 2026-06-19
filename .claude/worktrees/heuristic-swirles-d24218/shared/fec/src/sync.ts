// @portfolio/fec — sync orchestrator
//
// STATUS: spec stub. The high-level per-politician pipeline.
// Consumer projects call this and upsert the returned rows into their own tables.

import type { FECClient, Politician, SyncResult } from './schema.js'

/**
 * Run the full FEC sync for one politician across one or more cycles.
 *
 * Pipeline:
 *   1. Lookup FEC candidate ID by name + state + office (cached)
 *   2. For each cycle:
 *      a. Fetch candidate totals
 *      b. Fetch top donors
 *      c. Fetch contributions by size
 *      d. Compute industry rollup
 *      e. Classify donor profile
 *   3. Return a normalized result object
 *
 * The result is project-agnostic — consumer upserts it into their prefixed tables.
 */
export async function syncPoliticianFinance(
  _client: FECClient,
  _politician: Politician,
): Promise<SyncResult> {
  throw new Error(
    'syncPoliticianFinance not yet implemented. See shared/fec/README.md for the spec.',
  )
}
