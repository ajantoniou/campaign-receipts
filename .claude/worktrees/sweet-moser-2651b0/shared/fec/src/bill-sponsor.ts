// @portfolio/fec — BillsTracker-specific helper
//
// STATUS: spec stub. The function the future BillsTracker project calls when
// rendering a bill page. Returns the campaign-finance profile of each sponsor.
//
// This is the key reuse point: BillsTracker doesn't need to know anything about
// FEC API internals; it just calls this function with bill info and gets back
// a normalized "who funded each sponsor" object ready to render.

import type { FECClient, BillSponsorFinance } from './schema.js'

interface SponsorInput {
  legislator_id: string
  name: string
  state: string
  office: 'senator' | 'representative'
  cycles?: string[]
}

/**
 * For a given bill, return the campaign-finance profile of each sponsor + co-sponsor.
 *
 * Caches per-sponsor data for 30 days (sponsors change rarely; donor data updates quarterly).
 * Returns immediately from cache if available; triggers background refresh if cache > 30 days old.
 */
export async function getBillSponsorFinance(
  _client: FECClient,
  _opts: {
    billId: string
    sponsors: SponsorInput[]
  },
): Promise<BillSponsorFinance> {
  throw new Error(
    'getBillSponsorFinance not yet implemented. See shared/fec/README.md for the spec.',
  )
}
