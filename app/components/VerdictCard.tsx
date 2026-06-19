// The on-page HTML twin of the OG card at /politician/[slug]/opengraph-image.tsx.
// This is the primary share asset — composed so that a phone screenshot crops
// cleanly to the same visual unit users see in iMessage/Twitter previews.

import ScorecardBar from './ScorecardBar'
import RelativeTime from './RelativeTime'
import PoliticianAvatar from './PoliticianAvatar'
import type { Politician } from '@/lib/supabase'

function fmtTerm(start?: string | null, end?: string | null) {
  if (!start) return 'Term unknown'
  const ys = start.slice(0, 4)
  const ye = end ? end.slice(0, 4) : 'present'
  return `${ys}–${ye} term`
}

export default function VerdictCard({ politician }: { politician: Politician }) {
  const graded = politician.scorecard_graded_total || 0
  const pending = politician.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  const termLabel = fmtTerm(politician.current_term_start, politician.current_term_end)
  const inProgress = politician.current_term_end ? new Date(politician.current_term_end) > new Date() : false

  return (
    <section
      // 16:9 hint on lg+ so desktop screenshots are share-ready; mobile flows naturally.
      className="relative overflow-hidden rounded-2xl ring-1 ring-ink-800/80 bg-gradient-to-br from-ink-900/80 via-ink-950 to-ink-950 shadow-2xl shadow-black/40"
    >
      <div className="grid lg:grid-cols-[280px_1fr] gap-0">
        {/* Left: photo column with party tint */}
        <div className="hidden lg:flex items-center justify-center bg-ink-900/40 border-r border-ink-800/60 p-6">
          <PoliticianAvatar
            name={politician.name}
            party={politician.party}
            photoUrl={politician.photo_url}
            size="lg"
            className="w-full aspect-[4/5] h-auto"
          />
        </div>

        {/* Right: content */}
        <div className="p-6 sm:p-8 flex flex-col gap-5">
          {/* Eyebrow: brand · term */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-ink-500">
              CAMPAIGN RECEIPTS · {termLabel.toUpperCase()}
            </div>
            {isLive && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                {politician.last_refreshed_at ? (
                  <>Tracking · <RelativeTime iso={politician.last_refreshed_at} /></>
                ) : (
                  'Live tracking'
                )}
              </span>
            )}
          </div>

          {/* Name */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink-50 leading-[1.05] tracking-tight">
              {politician.name}
            </h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-ink-400">
              <span className="size-2 rounded-full" style={{ background: partyColor(politician.party) }} />
              <span>{politician.party}</span>
              {politician.state && <><span className="text-ink-700">·</span><span>{politician.state}</span></>}
              <span className="text-ink-700">·</span>
              <span>{politician.branch}</span>
            </div>
          </div>

          {/* Hero number */}
          <div className="mt-1 flex items-baseline gap-4">
            {isLive ? (
              <>
                <span className="text-7xl sm:text-8xl lg:text-9xl font-bold tabular-nums text-amber-400 leading-none tracking-tight">
                  {pending}
                </span>
                <span className="text-sm sm:text-base text-ink-400 pb-2">
                  promises pending · live tracking
                </span>
              </>
            ) : (
              <>
                <span className="text-7xl sm:text-8xl lg:text-9xl font-bold tabular-nums text-emerald-400 leading-none tracking-tight">
                  {Math.round(politician.scorecard_percentage_kept ?? 0)}
                  <span className="text-4xl sm:text-5xl lg:text-6xl">%</span>
                </span>
                <span className="text-sm sm:text-base text-ink-400 pb-2">
                  kept · {graded} promise{graded === 1 ? '' : 's'} graded
                  {pending > 0 ? <> · <span className="text-amber-400">{pending} pending</span></> : null}
                </span>
              </>
            )}
          </div>

          {/* ScorecardBar */}
          <div className="mt-1">
            {isLive ? (
              <div className="h-3 rounded-md bg-amber-500/20 ring-1 ring-amber-500/30 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-amber-500/40 via-amber-400/60 to-amber-500/40 animate-pulse" />
              </div>
            ) : (
              <ScorecardBar
                kept={politician.scorecard_kept}
                partial={politician.scorecard_partial}
                broken={politician.scorecard_broken}
                youDecide={politician.scorecard_you_decide}
                total={graded}
                showLabels
                size="md"
              />
            )}
          </div>

          {/* Footer: URL + verified + limited-corpus disclosure */}
          <div className="mt-2 pt-4 border-t border-ink-800/60 flex items-center justify-between flex-wrap gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-ink-500">
            <span>campaignreceipts.com/politician/{politician.slug}</span>
            <span className="flex items-center gap-3">
              {politician.scorecard_limited_corpus && (
                <span className="rounded-full bg-amber-500/10 ring-1 ring-amber-500/30 text-amber-300 px-2 py-0.5 normal-case tracking-normal">
                  Limited corpus &mdash; treat as illustrative
                </span>
              )}
              {politician.last_refreshed_at && !isLive && (
                <span>Verified <RelativeTime iso={politician.last_refreshed_at} /></span>
              )}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function partyColor(party: string) {
  if (party === 'Republican') return '#ef4444'
  if (party === 'Democratic') return '#3b82f6'
  if (party === 'Independent') return '#fbbf24'
  return '#737373'
}
