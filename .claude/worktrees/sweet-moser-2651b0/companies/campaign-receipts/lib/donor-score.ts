// Donor-funding score — the lead metric for the "donor intelligence"
// repositioning (eng/DONOR-INTELLIGENCE-REPOSITIONING-PLAN.md, Phase 1).
//
// Replaces "X% promises kept · N graded" as the headline stat with a
// money-first read of WHO funds a politician, derived purely from the
// already-100%-populated cr_campaign_finance columns — no new data, no FEC
// spend. Pure functions; mirrors the one-place-for-the-rule convention of
// lib/fec-industry.ts.
//
// The "corporate-funded score" is a 0–100 signal of how much of a
// politician's money comes from institutional/large sources (PACs + large
// individual donors) vs. small-dollar grassroots. Higher = more
// corporate/institutional. It is intentionally simple and transparent: a
// blend of pac_pct (share from PACs) and large_donor_pct (share from
// >$200 itemized donors). Both are percentages already on the row.

export type CampaignFinance = {
  pac_pct: number | string | null
  large_donor_pct: number | string | null
  individual_pct: number | string | null
  self_funded_pct: number | string | null
  total_raised: number | string | null
}

const num = (v: number | string | null | undefined): number => {
  if (v == null) return 0
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? n : 0
}

/**
 * 0–100 corporate-funded score. Weights PAC money slightly above large-donor
 * money (PAC dollars are the more direct institutional-influence signal), then
 * clamps. Returns null when there's no finance row to score (caller falls back
 * to the promise stat so cards never render empty).
 */
export function corporateFundedScore(cf: CampaignFinance | null | undefined): number | null {
  if (!cf) return null
  const pac = num(cf.pac_pct)
  const large = num(cf.large_donor_pct)
  // If a row exists but every signal is zero/empty, treat as unscored.
  if (pac === 0 && large === 0 && num(cf.individual_pct) === 0) return null
  const score = 0.6 * pac + 0.4 * large
  return Math.max(0, Math.min(100, Math.round(score)))
}

export type DonorHeadline = {
  // Short label for the funding character, e.g. "Corporate-funded".
  label: string
  // The headline value string, e.g. "72 / 100" or "81% small-dollar".
  value: string
  // Which verdict-tone bucket to color it with (reuses the brand stamp tones).
  tone: 'broken' | 'partial' | 'kept' | 'neutral'
  // Optional context line, e.g. "$74.1M raised".
  context: string | null
}

/** Format a raised-dollar total compactly: $74.1M, $912K, $0. */
export function fmtRaised(v: number | string | null | undefined): string {
  const n = num(v)
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

/**
 * The Phase-1 "Money headline" for a politician card/masthead. Leads with the
 * corporate-vs-grassroots character. `donorProfile` is the existing enum on
 * cr_politicians (corporate/grassroots/self-funded/mixed/unknown) — used for
 * the label/tone when present; the score gives the number.
 *
 * Returns null when there's no usable finance data, so callers keep showing the
 * promise stat as the fallback (per the plan — never an empty card).
 */
export function donorHeadline(
  cf: CampaignFinance | null | undefined,
  donorProfile?: string | null,
): DonorHeadline | null {
  const score = corporateFundedScore(cf)
  if (score == null) return null

  const individual = num(cf!.individual_pct)
  const selfFunded = num(cf!.self_funded_pct)
  const raised = fmtRaised(cf!.total_raised)
  const profile = (donorProfile || '').toLowerCase()

  // Self-funded only when it's a meaningful share (per plan 2a — niche).
  if (selfFunded >= 40 || profile === 'self-funded' || profile === 'self funded') {
    return {
      label: 'Self-funded',
      value: `${Math.round(selfFunded)}% own money`,
      tone: 'partial',
      context: `${raised} raised`,
    }
  }

  // Grassroots when the score is low AND small-dollar share is high.
  if (score <= 35 && individual >= 50) {
    return {
      label: 'Grassroots-funded',
      value: `${Math.round(individual)}% small-dollar`,
      tone: 'kept',
      context: `${raised} raised`,
    }
  }

  // Default: corporate/institutional read, scaled by the score.
  return {
    label: 'Corporate-funded',
    value: `${score} / 100`,
    tone: score >= 60 ? 'broken' : 'neutral',
    context: `${raised} raised`,
  }
}
