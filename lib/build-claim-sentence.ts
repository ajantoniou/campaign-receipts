// Shared claim-sentence + source-line builder used by both the
// politician dossier Viral Pack panel and the strip-PNG renderer.
//
// Extracted 2026-05-21 from app/api/card/[type]/[slug]/route.tsx's
// getStripData function so the dossier page and the PNG route share
// one source of truth. Per panel plan WS-A.
//
// Priority order (highest impact first — first one that has the data wins):
//   1. Extreme donor-vote alignment ("voted with X donors 12 of 14 times")
//      — most damning, citation-ready. Requires >=5 votes + >=60% extremity.
//   2. Top donor industry ("Top donor industry: Defense ($1.8M)")
//      — fallback when alignment data is sparse.
//   3. Promise scorecard ("63% kept of 27 graded promises")
//      — final fallback for politicians without FEC alignment data.
//
// Uses lib/fec-industry.ts isFecArtifact() to skip Individual/Retired
// bucketing artifacts at every priority level.

import { supabaseService } from '@/lib/supabase'
import { isFecArtifact } from '@/lib/fec-industry'

function fmtMoney(n: number): string {
  if (!n) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

/** What both surfaces consume. */
export type ClaimData = {
  candidateName: string
  seat: string
  photoUrl: string | null
  /** Statement with {{...}} placeholders for amber-highlighted spans. */
  statement: string
  /** Same statement with placeholders stripped — paste-ready caption. */
  caption: string
  /** Short human-readable source line for the source CopyChip. */
  sourceLine: string
  /** Long-form citation for the AP-style citation chip (set by builder). */
  sourceCitation: string
  facts: Array<{ k: string; v: string }>
  citeId: string
  shortUrl: string
}

const CYCLE_LABEL = 'cycle 2024'

/**
 * Load + compute the claim package for a given politician slug.
 * Returns null if the politician doesn't exist or has no data we can
 * confidently surface (no industries, no alignment, no scorecard).
 */
export async function buildClaim(slug: string): Promise<ClaimData | null> {
  const { data: pol } = await supabaseService
    .from('cr_politicians')
    .select(
      'id, slug, name, party, state, branch, photo_url, scorecard_kept, scorecard_broken, scorecard_graded_total',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (!pol) return null
  const p = pol as {
    id: string
    slug: string
    name: string
    party: string | null
    state: string | null
    branch: string | null
    photo_url: string | null
    scorecard_kept: number | null
    scorecard_broken: number | null
    scorecard_graded_total: number | null
  }

  const { data: industries } = await supabaseService
    .from('cr_industry_breakdown')
    .select('industry_label, total_contributions, rank')
    .eq('politician_id', p.id)
    .order('rank', { ascending: true })
    .limit(8)
  const topIndustry = ((industries || []) as {
    industry_label: string
    total_contributions: number
  }[]).find((i) => !isFecArtifact(i.industry_label))

  const { data: alignments } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select('industry_label, alignment_score')
    .eq('politician_id', p.id)
  const agg = new Map<string, { aligned: number; total: number }>()
  for (const a of ((alignments || []) as {
    industry_label: string
    alignment_score: number
  }[])) {
    if (isFecArtifact(a.industry_label)) continue
    if (!agg.has(a.industry_label)) agg.set(a.industry_label, { aligned: 0, total: 0 })
    const cur = agg.get(a.industry_label)!
    cur.total++
    if (a.alignment_score === 1) cur.aligned++
  }
  let extreme: { industry: string; aligned: number; total: number; pct: number } | null = null
  for (const [industry, v] of agg) {
    if (v.total < 5) continue
    const pct = v.aligned / v.total
    const extremity = Math.abs(pct - 0.5) * 2
    if (extremity < 0.6) continue
    if (!extreme || extremity > Math.abs(extreme.pct - 0.5) * 2) {
      extreme = { industry, aligned: v.aligned, total: v.total, pct }
    }
  }

  const partyShort = p.party === 'Republican' ? 'R' : p.party === 'Democratic' ? 'D' : 'I'
  const seat = `${partyShort}-${p.state || '—'} · ${p.branch || ''}`.trim()
  const lastName = p.name.split(' ').slice(-1)[0]

  let statement = ''
  let caption = ''
  let sourceLine = ''

  if (extreme && topIndustry) {
    const verb = extreme.pct >= 0.5 ? 'voted with' : 'broke from'
    statement = `${lastName} ${verb} ${extreme.industry} donors {{${extreme.aligned}/${extreme.total}}} times.`
    caption = `${p.name}: ${verb} ${extreme.industry} donors ${extreme.aligned} of ${extreme.total} roll-call votes (${CYCLE_LABEL}). Source: campaignreceipts.com/r/${p.slug}`
    sourceLine = 'FEC bulk filings + Congress.gov roll-call votes (cycle 2024).'
  } else if (topIndustry) {
    statement = `Top donor industry: ${topIndustry.industry_label}. {{${fmtMoney(topIndustry.total_contributions)}}}`
    caption = `${p.name}'s top donor industry: ${topIndustry.industry_label} (${fmtMoney(topIndustry.total_contributions)}, ${CYCLE_LABEL}). Source: campaignreceipts.com/r/${p.slug}`
    sourceLine = `FEC bulk filings, ${CYCLE_LABEL}.`
  } else if ((p.scorecard_graded_total || 0) > 0) {
    const pct = Math.round(
      ((p.scorecard_kept || 0) / Math.max(p.scorecard_graded_total || 1, 1)) * 100,
    )
    statement = `Promise scorecard: {{${pct}% kept}} of ${p.scorecard_graded_total} graded.`
    caption = `${p.name}'s campaign-promise scorecard: ${pct}% kept of ${p.scorecard_graded_total} graded. Source: campaignreceipts.com/r/${p.slug}`
    sourceLine = 'Primary-source promise tracker, campaignreceipts.com.'
  } else {
    return null
  }

  const facts: Array<{ k: string; v: string }> = []
  if (topIndustry) {
    facts.push({
      k: 'Top donor industry',
      v: `${topIndustry.industry_label} · ${fmtMoney(topIndustry.total_contributions)}`,
    })
  }
  if (extreme) {
    facts.push({
      k: extreme.pct >= 0.5 ? 'Aligned with' : 'Broke from',
      v: `${extreme.industry} (${extreme.aligned}/${extreme.total})`,
    })
  }
  if ((p.scorecard_graded_total || 0) > 0) {
    facts.push({
      k: 'Promises',
      v: `${p.scorecard_kept || 0} kept · ${p.scorecard_broken || 0} broken`,
    })
  }

  return {
    candidateName: p.name,
    seat,
    photoUrl: p.photo_url,
    statement,
    caption,
    sourceLine,
    sourceCitation:
      'Campaign Receipts, sourced from FEC bulk filings (cycle 2024) + Congress.gov roll-call records, retrieved ' +
      new Date().toISOString().slice(0, 10) +
      '.',
    facts: facts.slice(0, 3),
    citeId: `RCPT-STRIP-${p.slug.toUpperCase()}`,
    shortUrl: `campaignreceipts.com/r/${p.slug}`,
  }
}
