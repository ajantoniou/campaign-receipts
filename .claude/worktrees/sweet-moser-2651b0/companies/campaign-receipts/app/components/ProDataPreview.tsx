// "Here's what Pro unlocks on this politician" — preview block on
// every politician page. Three rows:
//   1. Full FEC donor breakdown (free shows top-3, Pro shows full list)
//   2. Donor-to-vote alignment (free shows hero stat, Pro shows full filterable table)
//   3. Bill sponsor money trails (cross-link to bills this politician sponsored)
//
// Per design lead's "free is screenshot-worthy, paid is the workflow":
// chart-shaped surfaces (hero stat, top-3) are always free. CSV /
// filters / alerts are Pro. This component shows what the user is
// missing, not what we're hiding from them.
//
// Hidden for politicians without bioguide (no roll-call data possible).

import Link from 'next/link'
import { Lock, ArrowRight, TrendingUp, FileText, Bell } from 'lucide-react'
import type { Politician } from '@/lib/supabase'
import { supabaseService } from '@/lib/supabase'

type Props = {
  politician: Politician
  /** If 'pro', renders the unlocked variant — same rows but with
   *  active CSV/filter affordances instead of the lock CTA. */
  tier: 'free' | 'pro'
}

async function getCounts(politician: Politician) {
  // Pull alignment rows so we can compute the hero stat ("Turner: 7/7
  // with Defense") rather than the boring count ("9 alignment rows").
  // Per design lead: journalist landing on /politician/mike-turner from
  // a "7/7 Defense" pitch MUST see 7/7 in the first viewport.
  const [alignmentResp, { count: industryCount }, { count: sponsorBillCount }] = await Promise.all([
    supabaseService
      .from('cr_donor_vote_alignment')
      .select('industry_label, alignment_score')
      .eq('politician_id', politician.id),
    supabaseService
      .from('cr_industry_breakdown')
      .select('*', { count: 'exact', head: true })
      .eq('politician_id', politician.id),
    politician.bioguide
      ? supabaseService
          .from('cr_bills')
          .select('*', { count: 'exact', head: true })
          .eq('sponsor_bioguide', politician.bioguide)
      : Promise.resolve({ count: 0 }),
  ])

  const alignmentRows = (alignmentResp.data as { industry_label: string; alignment_score: number }[] | null) || []

  // Group by industry, find the industry with the largest sample size.
  // Ties broken by most-extreme % (closer to 0 or 100 wins).
  const byInd = new Map<string, { aligned: number; total: number }>()
  for (const r of alignmentRows) {
    if (!byInd.has(r.industry_label)) byInd.set(r.industry_label, { aligned: 0, total: 0 })
    const v = byInd.get(r.industry_label)!
    v.total++
    if (r.alignment_score === 1) v.aligned++
  }
  let hero: { industry: string; aligned: number; total: number; pct: number } | null = null
  for (const [industry, v] of byInd) {
    if (v.total < 2) continue // need ≥2 votes to call it a finding
    const pct = (v.aligned / v.total) * 100
    if (!hero || v.total > hero.total || (v.total === hero.total && Math.abs(pct - 50) > Math.abs(hero.pct - 50))) {
      hero = { industry, aligned: v.aligned, total: v.total, pct }
    }
  }

  return {
    alignmentRows: alignmentRows.length,
    hero, // ← the journalist-facing finding
    industryRows: industryCount || 0,
    sponsoredBills: sponsorBillCount || 0,
  }
}

export default async function ProDataPreview({ politician, tier }: Props) {
  // Don't show on politicians without any Pro-tier data potential.
  if (!politician.bioguide && (politician.donor_profile === 'unknown' || politician.donor_profile == null)) {
    return null
  }

  const counts = await getCounts(politician)
  const hasAnyData = counts.alignmentRows > 0 || counts.industryRows > 0 || counts.sponsoredBills > 0
  if (!hasAnyData) return null

  const isPro = tier === 'pro'
  // Strip trailing parenthetical cycle label before splitting on space
  // so the last-name fallback doesn't render "(2016-cycle)".
  const cleanName = politician.name.replace(/\s*\([^)]*\)\s*$/, '').trim()
  const last = cleanName.split(/\s+/).slice(-1)[0]

  return (
    <section className="section-shell py-12 border-t border-line bg-paper-2">
      <div className="max-w-[760px] mx-auto flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2 inline-flex items-center gap-2">
            The deeper view
          </div>
          <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
            More on {last}
          </h2>
          <p className="mt-3 font-sans text-[14px] text-ink-2 leading-relaxed max-w-2xl">
            Everything here is free. Tap a card to see the donors, the
            votes, and the alerts we track for {last}.
          </p>
        </div>
      </div>

      <div className="max-w-[760px] mx-auto grid gap-3 md:grid-cols-3">
        <Row
          Icon={TrendingUp}
          eyebrow={
            counts.hero
              ? `${last}: ${counts.hero.aligned}/${counts.hero.total} with ${counts.hero.industry}`
              : `${counts.alignmentRows} alignment rows`
          }
          title="Donor → Vote alignment"
          body={
            counts.hero
              ? `Across ${counts.hero.total} ${counts.hero.industry}-tagged roll-call votes, ${last} aligned with the industry's position ${counts.hero.aligned} time${counts.hero.aligned === 1 ? '' : 's'} (${Math.round(counts.hero.pct)}%).`
              : counts.alignmentRows > 0
                ? `${last}'s votes scored against their top donor industries. ${counts.alignmentRows} (industry × bill) alignment scores so far.`
                : `Coming as bill industry tags accumulate.`
          }
          freeLabel="Top-3 hero stats"
          proLabel="Full filterable table · CSV"
          href={`/politician/${politician.slug}/correlations`}
          isPro={isPro}
          accent={counts.hero ? (counts.hero.pct >= 70 ? 'kept' : counts.hero.pct <= 30 ? 'broken' : 'partial') : null}
        />
        <Row
          Icon={FileText}
          eyebrow={`${counts.industryRows} donor industries${counts.sponsoredBills > 0 ? ` · ${counts.sponsoredBills} sponsored bills` : ''}`}
          title="FEC donor data, daily-refreshed"
          body={
            counts.industryRows > 0
              ? `${counts.industryRows} industry rollups + the full top-20 donor list, refreshed weekly.`
              : `Donor data pending FEC sync.`
          }
          freeLabel="Top-5 donor list"
          proLabel="Full top-20 + industry rollup · CSV"
          href={`/politician/${politician.slug}/donors`}
          isPro={isPro}
        />
        <Row
          Icon={Bell}
          eyebrow="Status-change alerts"
          title="Alerts on votes + verdicts"
          body={`Email when ${last} votes against their top donor industry, when a new verdict lands on their scorecard, or when their donor profile shifts.`}
          freeLabel="—"
          proLabel="All alerts active"
          href="/pricing"
          isPro={isPro}
        />
      </div>
    </section>
  )
}

function Row({
  Icon,
  eyebrow,
  title,
  body,
  freeLabel,
  proLabel,
  href,
  isPro,
  accent,
}: {
  Icon: typeof TrendingUp
  eyebrow: string
  title: string
  body: string
  freeLabel: string
  proLabel: string
  href: string
  isPro: boolean
  accent?: 'kept' | 'broken' | 'partial' | null
}) {
  // Eyebrow color reflects the FINDING — sage if politician aligns
  // 70%+ with their donor industry, coral if they break ≥70% of the
  // time, amber for the murky middle. Verdict-palette tints, paper
  // surface.
  const eyebrowColor =
    accent === 'kept' ? 'text-kept'
    : accent === 'broken' ? 'text-broken'
    : accent === 'partial' ? 'text-partial'
    : 'text-ink-3'
  return (
    <Link
      href={href}
      className={`group rounded-lg border ${
        isPro ? 'border-ink' : 'border-line'
      } bg-paper hover:bg-paper-2 hover:border-ink-3 transition-all duration-200 p-5 flex flex-col gap-3 no-underline`}
    >
      <Icon
        className={`size-5 ${isPro ? 'text-ink' : 'text-ink-2 group-hover:text-ink transition-colors'}`}
        aria-hidden
      />
      <div className={`font-mono text-[11px] uppercase tracking-[0.16em] font-medium ${eyebrowColor}`}>
        {eyebrow}
      </div>
      <h3 className="font-display text-[18px] leading-[1.2] text-ink">{title}</h3>
      <p className="font-sans text-[13px] text-ink-2 leading-relaxed flex-1">{body}</p>
      <div className="mt-2 pt-3 border-t border-dashed border-line grid grid-cols-2 gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
        <div className="text-ink-3">
          Free
          <div className="text-ink mt-0.5 normal-case font-sans text-[12px]">{freeLabel}</div>
        </div>
        <div className="text-ink">
          Deeper
          <div className="text-ink mt-0.5 normal-case font-sans text-[12px] font-medium">
            {proLabel}
          </div>
        </div>
      </div>
    </Link>
  )
}
