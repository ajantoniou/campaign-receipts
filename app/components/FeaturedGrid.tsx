import Link from 'next/link'
import type { Politician } from '@/lib/supabase'
import PoliticianAvatar from './PoliticianAvatar'
import ScorecardBar from './ScorecardBar'
import RelativeTime from './RelativeTime'
import { ArrowRight } from 'lucide-react'

// The default homepage view. 8-12 hand-picked politicians showcasing the
// methodology range — book-sourced, full-review live trackers, standard
// review, and at least one completed/graded term. Replaces the 500-item
// long scroll.

function partyTone(party: string) {
  if (party === 'Republican') return 'text-rose-300 bg-rose-500/10 ring-rose-500/30'
  if (party === 'Democratic') return 'text-sky-300 bg-sky-500/10 ring-sky-500/30'
  if (party === 'Independent') return 'text-amber-300 bg-amber-500/10 ring-amber-500/30'
  return 'text-ink-300 bg-ink-800 ring-ink-700'
}

export default function FeaturedGrid({
  politicians,
  totalCount,
}: {
  politicians: Politician[]
  totalCount: number
}) {
  if (politicians.length === 0) return null
  return (
    <section className="section-shell section-y">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="eyebrow mb-2">Start here</div>
          <h2 className="text-display-md text-ink-50 text-balance">
            A cross-section of the methodology.
          </h2>
          <p className="mt-3 text-ink-400 text-[15px] max-w-2xl">
            Twelve politicians chosen to span the full range — completed-term graded scorecards, in-progress live tracking, leadership figures, partisan flanks, and the SEALED book&rsquo;s case-study record.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/retired" className="btn-ghost text-xs">
            Retired Presidents & Governors
            <ArrowRight className="size-3.5" />
          </Link>
          <Link href="#ranking" className="btn-ghost text-xs">
            See all <span className="tabular-nums">{totalCount}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <ol className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {politicians.map((p) => (
          <li key={p.id}>
            <FeaturedCard p={p} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function FeaturedCard({ p }: { p: Politician }) {
  const graded = p.scorecard_graded_total || 0
  const pending = p.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  const term = p.current_term_start && p.current_term_end
    ? `${p.current_term_start.slice(0, 4)}–${p.current_term_end.slice(0, 4)}`
    : null

  return (
    <Link
      href={`/politician/${p.slug}`}
      className="group block h-full rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 hover:bg-ink-900/70 hover:ring-ink-700 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 overflow-hidden"
    >
      <div className="p-4 sm:p-5 flex flex-col h-full gap-4">
        {/* Top: photo + identity */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 transition-transform group-hover:scale-[1.03]">
            <PoliticianAvatar
              name={p.name}
              party={p.party}
              photoUrl={p.photo_url}
              size="sm"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink-50 tracking-tight leading-tight truncate">
              {p.name}
            </h3>
            <div className="mt-1 flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-mono uppercase tracking-wider rounded-full px-1.5 py-0.5 ring-1 ${partyTone(p.party)}`}>
                {p.party[0]} · {p.state}
              </span>
              <span className="text-[10px] text-ink-500">{p.branch}</span>
            </div>
            {term && (
              <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-ink-600">
                {term} term
              </div>
            )}
          </div>
        </div>

        {/* Middle: verdict number */}
        <div className="flex items-baseline gap-2">
          {isLive ? (
            <>
              <span className="text-4xl font-bold tabular-nums text-amber-400 leading-none tracking-tight">
                {pending}
              </span>
              <span className="text-[11px] text-ink-500">pending · live</span>
            </>
          ) : graded > 0 && p.scorecard_percentage_kept != null ? (
            <>
              <span className="text-4xl font-bold tabular-nums text-emerald-400 leading-none tracking-tight">
                {Math.round(p.scorecard_percentage_kept)}
                <span className="text-2xl">%</span>
              </span>
              <span className="text-[11px] text-ink-500">kept · {graded} graded</span>
            </>
          ) : (
            <span className="text-sm text-ink-500">No verdicts yet</span>
          )}
        </div>

        {/* Bottom: scorecard bar + tracking timestamp */}
        <div className="mt-auto">
          {isLive ? (
            <div className="h-1.5 rounded-md bg-amber-500/20 ring-1 ring-amber-500/30 overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-amber-500/40 via-amber-400/60 to-amber-500/40" />
            </div>
          ) : (
            <ScorecardBar
              kept={p.scorecard_kept}
              partial={p.scorecard_partial}
              broken={p.scorecard_broken}
              youDecide={p.scorecard_you_decide}
              total={graded || p.scorecard_total}
              size="sm"
            />
          )}
          {p.last_refreshed_at && (
            <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-ink-600 flex items-center justify-between">
              <span>{isLive ? 'Tracking' : 'Verified'} <RelativeTime iso={p.last_refreshed_at} /></span>
              <ArrowRight className="size-3 text-ink-700 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
