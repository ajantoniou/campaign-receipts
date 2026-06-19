// Single source of truth for how we render a politician's scorecard
// number across the directory + filtered rows + ranking cards.
//
// Replaces the bare "14 PENDING" with one of three readings, in order:
//   1. Final graded record — "%kept · N graded" (emerald)
//   2. Live tracking with prior-cycle anchor —
//        "N in play · term ends 'YY"  +  ghost "·  prior 24% kept"
//      The prior is the predecessor_slug entry (Biden's prior = Trump 2016).
//   3. Live tracking without prior — just the in-play count + term-end year.
//
// This is the design lead's Option A: low-cost signal-add. Option B
// (seat-level averages) ships next sprint.

import type { Politician } from '@/lib/supabase'

type Predecessor = Pick<
  Politician,
  'slug' | 'name' | 'scorecard_percentage_kept' | 'scorecard_graded_total'
>

export default function ScorecardAnchor({
  politician,
  predecessor,
  size = 'md',
  align = 'right',
}: {
  politician: Politician
  predecessor?: Predecessor | null
  size?: 'sm' | 'md'
  align?: 'right' | 'left'
}) {
  const graded = politician.scorecard_graded_total || 0
  const pending = politician.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  const isGraded = graded > 0 && politician.scorecard_percentage_kept != null
  const termEndYY = politician.current_term_end?.slice(2, 4) ?? null

  const cls = {
    big: size === 'sm' ? 'text-2xl' : 'text-3xl',
    small: size === 'sm' ? 'text-[10px]' : 'text-[11px]',
  }
  const wrap = align === 'left' ? 'text-left' : 'text-right'

  if (isGraded) {
    return (
      <div className={`shrink-0 ${wrap}`}>
        <div className={`${cls.big} font-bold tabular-nums text-emerald-400 tracking-tight leading-none`}>
          {Math.round(politician.scorecard_percentage_kept!)}<span className="text-base">%</span>
        </div>
        <div className={`${cls.small} text-ink-500 uppercase tracking-wider font-medium mt-1`}>
          kept · {graded} graded
        </div>
      </div>
    )
  }

  if (isLive) {
    const prior =
      predecessor &&
      predecessor.scorecard_graded_total &&
      predecessor.scorecard_graded_total > 0 &&
      predecessor.scorecard_percentage_kept != null
        ? predecessor
        : null
    return (
      <div className={`shrink-0 ${wrap}`}>
        <div className={`${cls.big} font-bold tabular-nums text-amber-400 tracking-tight leading-none`}>
          {pending}
        </div>
        <div className={`${cls.small} text-amber-500/80 uppercase tracking-wider font-medium mt-1`}>
          in play{termEndYY ? ` · ends '${termEndYY}` : ''}
        </div>
        {prior && (
          <div className={`${cls.small} text-ink-500 mt-1 normal-case tracking-normal`}>
            prior <span className="text-ink-300 tabular-nums font-medium">{Math.round(prior.scorecard_percentage_kept!)}%</span> kept
          </div>
        )}
      </div>
    )
  }

  // Neither graded nor in play — shouldn't happen in practice.
  return (
    <div className={`shrink-0 ${wrap}`}>
      <div className={`${cls.small} text-ink-500 italic`}>no verdicts yet</div>
    </div>
  )
}
