import { supabaseService, type Politician } from '@/lib/supabase'
import { cn } from '@/lib/cn'

type Rank = {
  position: number
  total: number
  label: string
  /** Compare position vs the median to give a visual cue. */
  tone: 'top' | 'middle' | 'bottom'
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function toneFor(position: number, total: number): Rank['tone'] {
  if (total === 0) return 'middle'
  const pctile = (position - 1) / total // 0 = best
  if (pctile <= 0.34) return 'top'
  if (pctile >= 0.67) return 'bottom'
  return 'middle'
}

async function computeRankings(politician: Politician): Promise<Rank[]> {
  // Pull comparable politicians from the DB. We rank by scorecard_percentage_kept descending.
  // Same party + same branch
  const { data: partyBranch } = await supabaseService
    .from('cr_politicians')
    .select('slug, scorecard_percentage_kept, scorecard_total')
    .eq('party', politician.party)
    .eq('branch', politician.branch)
    .gt('scorecard_total', 0)

  // Same branch (party-agnostic)
  const { data: branchOnly } = await supabaseService
    .from('cr_politicians')
    .select('slug, scorecard_percentage_kept, scorecard_total')
    .eq('branch', politician.branch)
    .gt('scorecard_total', 0)

  const ranks: Rank[] = []

  const partyBranchRows = (partyBranch || []) as Array<{ slug: string; scorecard_percentage_kept: number }>
  if (partyBranchRows.length >= 3) {
    const sorted = partyBranchRows
      .slice()
      .sort((a, b) => b.scorecard_percentage_kept - a.scorecard_percentage_kept)
    const idx = sorted.findIndex((p) => p.slug === politician.slug)
    if (idx >= 0) {
      const position = idx + 1
      const total = sorted.length
      const partyLabel =
        politician.party === 'Republican' ? 'Republican' :
        politician.party === 'Democratic' ? 'Democratic' :
        politician.party
      const branchLabel = pluralizeBranch(politician.branch)
      ranks.push({
        position,
        total,
        label: `among ${partyLabel} ${branchLabel}`,
        tone: toneFor(position, total),
      })
    }
  }

  const branchRows = (branchOnly || []) as Array<{ slug: string; scorecard_percentage_kept: number }>
  if (branchRows.length >= 3) {
    const sorted = branchRows
      .slice()
      .sort((a, b) => b.scorecard_percentage_kept - a.scorecard_percentage_kept)
    const idx = sorted.findIndex((p) => p.slug === politician.slug)
    if (idx >= 0) {
      const position = idx + 1
      const total = sorted.length
      ranks.push({
        position,
        total,
        label: `among all ${pluralizeBranch(politician.branch)}`,
        tone: toneFor(position, total),
      })
    }
  }

  return ranks
}

function pluralizeBranch(branch: string): string {
  switch (branch) {
    case 'Senate': return 'senators'
    case 'House': return 'representatives'
    case 'Governor': return 'governors'
    case 'President': return 'presidents'
    default: return 'politicians'
  }
}

const TONE_STYLES: Record<Rank['tone'], { rank: string; bar: string }> = {
  top: { rank: 'text-emerald-300', bar: 'bg-emerald-500/30 ring-emerald-500/40' },
  middle: { rank: 'text-amber-300', bar: 'bg-amber-500/30 ring-amber-500/40' },
  bottom: { rank: 'text-rose-300', bar: 'bg-rose-500/30 ring-rose-500/40' },
}

export default async function PoliticianRankings({ politician }: { politician: Politician }) {
  const rankings = await computeRankings(politician)
  if (rankings.length === 0) return null

  return (
    <div className="mt-5 pt-5 border-t border-ink-800/60">
      <div className="eyebrow mb-3">Ranking</div>
      <ul className="space-y-2.5">
        {rankings.map((r) => {
          const tone = TONE_STYLES[r.tone]
          return (
            <li key={r.label} className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-ink-400 leading-tight">{r.label}</span>
              <span className={cn('font-mono text-sm tabular-nums whitespace-nowrap', tone.rank)}>
                {ordinal(r.position)} <span className="text-ink-500 text-[11px]">of {r.total}</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
