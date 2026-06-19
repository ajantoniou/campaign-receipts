// Side-by-side comparison to the immediate predecessor. Renders on
// President + Governor profiles where predecessor_slug is set. Pulls the
// predecessor's scorecard from the DB and shows kept-% / pending count
// alongside the current politician's.

import Link from 'next/link'
import type { Politician } from '@/lib/supabase'
import PoliticianAvatar from './PoliticianAvatar'
import ScorecardBar from './ScorecardBar'
import { ArrowRight } from 'lucide-react'

export default function PredecessorBar({
  current,
  predecessor,
}: {
  current: Politician
  predecessor: Politician
}) {
  return (
    <section className="border-y border-ink-800/60 bg-ink-900/30">
      <div className="section-shell py-5">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-500 mb-3">
          Compared to the immediate predecessor
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <ScorecardMini p={current} label="This profile" highlight />
          <ScorecardMini p={predecessor} label="Predecessor" linkOut />
        </div>
      </div>
    </section>
  )
}

function ScorecardMini({
  p,
  label,
  highlight = false,
  linkOut = false,
}: {
  p: Politician
  label: string
  highlight?: boolean
  linkOut?: boolean
}) {
  const graded = p.scorecard_graded_total || 0
  const pending = p.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  const yStart = p.in_office_since?.slice(0, 4) ?? ''
  const yEnd = p.in_office_to?.slice(0, 4) ?? 'present'

  const Wrap = ({ children }: { children: React.ReactNode }) =>
    linkOut ? (
      <Link href={`/politician/${p.slug}`} className="group block">
        {children}
      </Link>
    ) : (
      <div>{children}</div>
    )

  return (
    <Wrap>
      <div
        className={`rounded-lg ring-1 ${
          highlight
            ? 'ring-amber-500/30 bg-amber-500/[0.04]'
            : 'ring-ink-800/80 bg-ink-900/40 group-hover:bg-ink-900/70 group-hover:ring-ink-700'
        } transition-colors p-4`}
      >
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-500 mb-2">{label}</div>
        <div className="flex items-start gap-3">
          <PoliticianAvatar name={p.name} party={p.party} photoUrl={p.photo_url} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-ink-50 truncate">{p.name.replace(/\s*\([^)]*\)\s*$/, '').trim()}</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-500 mt-0.5">
              {yStart}{yStart && yEnd ? '–' : ''}{yEnd} · {p.party[0]} · {p.branch}
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              {isLive ? (
                <>
                  <span className="text-2xl font-bold tabular-nums text-amber-400 leading-none tracking-tight">
                    {pending}
                  </span>
                  <span className="text-[11px] text-ink-500">pending · live</span>
                </>
              ) : graded > 0 && p.scorecard_percentage_kept != null ? (
                <>
                  <span className="text-2xl font-bold tabular-nums text-emerald-400 leading-none tracking-tight">
                    {Math.round(p.scorecard_percentage_kept)}<span className="text-base">%</span>
                  </span>
                  <span className="text-[11px] text-ink-500">kept · {graded} graded</span>
                </>
              ) : (
                <span className="text-xs text-ink-500">No verdicts yet</span>
              )}
              {linkOut && (
                <ArrowRight className="ml-auto size-3 text-ink-700 group-hover:text-amber-400 transition-colors" />
              )}
            </div>
            <div className="mt-2">
              <ScorecardBar
                kept={p.scorecard_kept}
                partial={p.scorecard_partial}
                broken={p.scorecard_broken}
                youDecide={p.scorecard_you_decide}
                total={graded || p.scorecard_total}
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </Wrap>
  )
}
