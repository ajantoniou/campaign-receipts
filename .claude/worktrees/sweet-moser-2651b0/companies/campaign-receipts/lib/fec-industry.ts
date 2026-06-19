// FEC industry-bucket cleanup helpers.
//
// Added 2026-05-20 per ChatGPT audit + newsroom panelist's verdict:
// "Individual / Retired" appearing as a top donor industry is the
// single biggest credibility hit on the site for anyone who's worked
// with FEC data. It's an FEC bucketing artifact (unitemized retiree
// contributions from FEC's "occupation field defaulted to RETIRED"
// path) — NOT a meaningful industry.
//
// These helpers give every render-site one place to:
//   1. Detect FEC bucketing artifacts
//   2. Either FILTER them out of top-N lists (when we want real
//      industries to surface), OR
//   3. RELABEL them with an explicit "(unitemized / retiree)"
//      qualifier so a reader sees we know it's not a literal industry
//
// The strip-PNG share renderer already does its own filter in
// app/api/card/[type]/[slug]/route.tsx — this lib lets every other
// surface inherit the same behavior without copy-pasting the regex.

/** FEC industry labels that are bucketing artifacts, not real industries. */
const FEC_BUCKETING_ARTIFACTS = new Set([
  'Individual / Retired',
  'Individual/Retired',
  'INDIVIDUAL / RETIRED',
  'Retired',
  'Retiree',
  'Individual',
  'Unitemized',
  'Unitemized Receipts',
  'Not Classified',
  'Unclassified',
  // FEC occupation/employer artifacts — not industries. Named in the
  // 2026-05-30 Votes-leaderboard scope as banned headline "industries".
  'Self-Employed',
  'Self Employed',
  'SELF-EMPLOYED',
  'Homemaker',
  'HOMEMAKER',
  'None',
  'N/A',
])

/**
 * Returns true if the label is an FEC bucketing artifact rather than
 * a meaningful industry. Case-insensitive, whitespace-tolerant.
 */
export function isFecArtifact(label: string | null | undefined): boolean {
  if (!label) return true
  const norm = label.trim()
  if (FEC_BUCKETING_ARTIFACTS.has(norm)) return true
  const lower = norm.toLowerCase()
  // Catch slight variations not in the explicit set.
  if (lower === 'individual/retired' || lower === 'individual / retired') return true
  if (lower === 'retired' || lower === 'retiree' || lower === 'retirees') return true
  if (lower === 'unitemized' || lower.startsWith('unitemized ')) return true
  if (lower === 'unclassified' || lower === 'not classified') return true
  if (lower === 'self-employed' || lower === 'self employed') return true
  if (lower === 'homemaker' || lower === 'homemakers') return true
  if (lower === 'none' || lower === 'n/a' || lower === 'na') return true
  return false
}

/**
 * Filter a list of industry-label rows down to "real" industries.
 * Pass-through for any row whose label is not a bucketing artifact.
 * Useful for top-N donor breakdowns, top-industry punchlines, etc.
 */
export function filterRealIndustries<T extends { industry_label: string | null }>(
  rows: T[],
): T[] {
  return rows.filter((r) => !isFecArtifact(r.industry_label))
}

/**
 * Returns a human-readable display label for an FEC industry — adds
 * an explicit "(unitemized / retiree)" qualifier when the underlying
 * label is a bucketing artifact, so a reader sees we know it's not
 * a literal industry. Pass-through for real industries.
 *
 * Use this when you cannot filter (e.g. the dossier explicitly wants
 * to show the full breakdown including unitemized) but you want to
 * preserve methodology transparency.
 */
export function displayIndustryLabel(label: string | null | undefined): string {
  if (!label) return 'Unclassified'
  if (isFecArtifact(label)) {
    return `${label} (FEC unitemized)`
  }
  return label
}

/**
 * Tooltip copy explaining the FEC bucketing issue. Use on any UI
 * surface that surfaces the FEC artifact alongside real industries
 * so the reader can understand what they're looking at.
 */
export const FEC_ARTIFACT_TOOLTIP =
  'FEC classifies unitemized contributions and retiree donations under generic buckets — these are not real industries. We surface them for transparency but exclude them from top-industry summaries.'
