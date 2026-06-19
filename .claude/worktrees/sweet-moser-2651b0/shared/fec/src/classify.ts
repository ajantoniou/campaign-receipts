// @portfolio/fec — pure classifier functions
//
// STATUS: spec stub. These pure functions encode the canonical rules
// for how FEC totals → donor_profile classification AND how donors → industries.
// Both consumers must use the same rules to keep classifications consistent.

import type { CandidateTotals, DonorProfile, RawDonor } from './schema.js'

/**
 * Classify a politician's donor profile based on cycle totals.
 *
 * Rules (in evaluation order):
 *   self-funded:  self_funded_pct >= 25%
 *   corporate:    pac_pct >= 30% (or top industries are corporate sectors — TODO)
 *   grassroots:   individual_pct >= 70% AND large_donor_pct <= 50%
 *   mixed:        anything else
 *   unknown:      if totals is null/undefined
 */
export function classifyDonorProfile(_totals: CandidateTotals | null): DonorProfile {
  throw new Error(
    'classifyDonorProfile not yet implemented. See shared/fec/README.md for the spec.',
  )
}

/**
 * Roll up raw donors by industry using OpenSecrets industry codes.
 * Returns industries sorted by total contribution, descending.
 */
export function rollUpByIndustry(_donors: RawDonor[]): Array<{
  industry_code: string
  industry_label: string
  total_contributions: number
  donor_count: number
}> {
  throw new Error(
    'rollUpByIndustry not yet implemented. See shared/fec/README.md for the spec.',
  )
}

/**
 * Compute an influence score (0-100) measuring how aligned a politician's
 * voting record is with their top donor industries.
 *
 * Used by BillsTracker to surface "sponsor's donors had a stake in this bill"
 * signals. Also surfaced on CampaignReceipts as a meta-metric.
 *
 * Score interpretation:
 *   0-30:   weak alignment
 *   31-60:  moderate alignment
 *   61-100: strong alignment
 */
export function computeInfluenceScore(_opts: {
  donorIndustries: Array<{ industry_label: string; total: number }>
  votesOnIndustryBills: Array<{ industry_label: string; vote: 'aligned' | 'against' | 'neutral' }>
}): number {
  throw new Error(
    'computeInfluenceScore not yet implemented. See shared/fec/README.md for the spec.',
  )
}
