'use client'

// PoliticianFilters — rev-7 paper-warm rebuild per engagement panel.
//
// Per panel R3 (ex-FB Feed PM): "Descriptions are dead text; punchlines
// with a number + a noun is the unit of engagement." Every row now
// shows a hook: kept-rate punchline + top-industry chip + (if available)
// a "shocking finding" badge for politicians with extreme (>=80% or
// <=20%) donor-vote alignment over n>=5 votes.
//
// Punchline data is bulk-mined by app/page.tsx (single SQL pass) and
// passed in as `punchlines: Record<politicianId, Punchline>` to avoid
// N+1 queries.

import { useState, useMemo } from 'react'
import Link from 'next/link'
import ScorecardBar from './ScorecardBar'
import PoliticianAvatar from './PoliticianAvatar'
import RankingCards from './RankingCards'
import { Tag, partyVariant } from './cr'
import type { Politician } from '@/lib/supabase'
import type { Punchline } from '../page'

type SortKey = 'kept' | 'broken' | 'name' | 'state' | 'pending' | 'shocking'
type Track = 'graded' | 'live'

export default function PoliticianFilters({
  politicians,
  punchlines = {},
}: {
  politicians: Politician[]
  punchlines?: Record<string, Punchline>
}) {
  // Default 'graded' post rev-7 scorecard recompute (all 533 politicians
  // now have graded data; 'live' only matches politicians with
  // current_term_end > today).
  const [track, setTrack] = useState<Track>('graded')
  const [search, setSearch] = useState('')
  const [party, setParty] = useState<string>('all')
  const [branch, setBranch] = useState<string>('all')
  const [state, setState] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('shocking')

  // Bucket politicians by whether their current term has ended.
  // Per rev-7: scorecard_graded_total was used here but every politician
  // now has graded > 0 so the 'live' bucket would be empty. Switch to
  // term-end vs today.
  const { gradedPoliticians, livePoliticians, predBySlug } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const graded: Politician[] = []
    const live: Politician[] = []
    const map = new Map<string, Politician>()
    for (const p of politicians) map.set(p.slug, p)
    for (const p of politicians) {
      const termEnd = p.current_term_end || null
      // Live = term in progress; Graded = term ended or no term-end on file
      if (termEnd && termEnd > today) live.push(p)
      else graded.push(p)
    }
    return { gradedPoliticians: graded, livePoliticians: live, predBySlug: map }
  }, [politicians])

  const trackPool = track === 'graded' ? gradedPoliticians : livePoliticians

  // Coerce sort to a sensible default per track.
  const effectiveSort: SortKey =
    track === 'live' && sortBy === 'kept' ? 'shocking' :
    track === 'graded' && sortBy === 'pending' ? 'kept' :
    sortBy

  const states = useMemo(
    () => Array.from(new Set(politicians.map((p) => p.state))).sort(),
    [politicians]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = trackPool.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (party !== 'all' && p.party !== party) return false
      if (branch !== 'all' && p.branch !== branch) return false
      if (state !== 'all' && p.state !== state) return false
      return true
    })
    list = list.slice().sort((a, b) => {
      if (effectiveSort === 'shocking') {
        // Sort by "extremity" of shocking alignment, then by graded count.
        const aShock = punchlines[a.id]?.shockingPct
        const bShock = punchlines[b.id]?.shockingPct
        const aExt = aShock != null ? Math.abs(aShock - 50) : -1
        const bExt = bShock != null ? Math.abs(bShock - 50) : -1
        if (bExt !== aExt) return bExt - aExt
        return (b.scorecard_graded_total || 0) - (a.scorecard_graded_total || 0)
      }
      if (effectiveSort === 'kept') {
        return (b.scorecard_percentage_kept ?? 0) - (a.scorecard_percentage_kept ?? 0)
      }
      if (effectiveSort === 'broken') {
        const aGraded = a.scorecard_graded_total || 0
        const bGraded = b.scorecard_graded_total || 0
        const aB = aGraded ? a.scorecard_broken / aGraded : 0
        const bB = bGraded ? b.scorecard_broken / bGraded : 0
        return bB - aB
      }
      if (effectiveSort === 'pending') {
        return (b.scorecard_pending || 0) - (a.scorecard_pending || 0)
      }
      if (effectiveSort === 'name') return a.name.localeCompare(b.name)
      if (effectiveSort === 'state') return a.state.localeCompare(b.state)
      return 0
    })
    return list
  }, [trackPool, search, party, branch, state, effectiveSort, punchlines])

  const activeFilterCount = [party, branch, state].filter((v) => v !== 'all').length
  const hasQuery = search.trim().length > 0 || activeFilterCount > 0

  return (
    <div>
      {/* Track tabs — paper-warm, ink-fill for active */}
      <div className="mb-5 flex items-center gap-1 border-b border-line">
        <TrackTab
          active={track === 'live'}
          onClick={() => setTrack('live')}
          label="Live tracking"
          sub={`${livePoliticians.length} terms in progress`}
        />
        <TrackTab
          active={track === 'graded'}
          onClick={() => setTrack('graded')}
          label="Graded scorecards"
          sub={`${gradedPoliticians.length} final`}
        />
      </div>

      {/* Search input — paper variant */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-ink-3 pointer-events-none" aria-hidden>⌕</span>
          <input
            type="text"
            placeholder="Search a politician, state, or office..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 rounded-md pl-10 pr-4 py-3.5 sm:py-4 font-sans text-[15px] sm:text-[16px] text-ink placeholder:text-ink-3 transition"
            autoComplete="off"
          />
        </div>

        <details className="mt-3 group rounded-md border border-line bg-paper open:bg-paper-2 transition-colors">
          <summary className="cursor-pointer select-none px-4 py-2.5 flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:text-ink transition-colors">
            <span className="flex items-center gap-2">
              <span>More filters</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-ink text-paper px-2 py-0.5 text-[10px] font-mono normal-case tracking-normal">
                  {activeFilterCount} active
                </span>
              )}
            </span>
            <span className="text-ink-3 transition-transform group-open:rotate-90" aria-hidden>→</span>
          </summary>
          <div className="border-t border-line p-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            <Select label="Party" value={party} onChange={setParty} options={[['all','All'],['Republican','Republican'],['Democratic','Democratic'],['Independent','Independent']]} />
            <Select label="Branch" value={branch} onChange={setBranch} options={[['all','All'],['Senate','Senate'],['House','House'],['Governor','Governor'],['President','President']]} />
            <Select label="State" value={state} onChange={setState} options={[['all','All'], ...states.map((s): [string,string] => [s, s])]} />
          </div>
        </details>
      </div>

      {/* Ranking cards above the result list — only when no query/filter */}
      {!hasQuery && (
        <div className="mb-10">
          <RankingCards politicians={trackPool} allPoliticians={politicians} track={track} />
        </div>
      )}

      {/* Result count + sort */}
      <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          <span className="text-ink font-medium">{filtered.length}</span> politicians
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.12em]">
          <span className="text-ink-3 mr-2 hidden sm:inline">Sort</span>
          {(track === 'graded'
            ? ([
                ['kept', '% Kept'],
                ['broken', '% Broken'],
                ['shocking', 'Shocking findings'],
                ['name', 'Name'],
              ] as [SortKey, string][])
            : ([
                ['shocking', 'Shocking findings'],
                ['pending', 'Most active'],
                ['name', 'Name'],
                ['state', 'State'],
              ] as [SortKey, string][])
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={
                'px-2.5 py-1 rounded-md transition-colors ' +
                (effectiveSort === key
                  ? 'bg-ink text-paper'
                  : 'text-ink-2 hover:text-ink hover:bg-paper')
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {hasQuery ? (
        <>
          <ol className="grid gap-2.5 list-none p-0 m-0">
            {filtered.slice(0, 12).map((p, idx) => (
              <PoliticianRow
                key={p.id}
                rank={idx + 1}
                p={p}
                punchline={punchlines[p.id]}
              />
            ))}
            {filtered.length === 0 && (
              <li className="rounded-md border border-line bg-paper-2 p-12 text-center font-sans text-[14px] text-ink-2">
                No politicians match these filters.
              </li>
            )}
          </ol>
          {filtered.length > 12 && (
            <div className="mt-5 flex items-center justify-center">
              <Link
                href={`/directory?track=${track}&q=${encodeURIComponent(search)}`}
                className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                See all {filtered.length} matching politicians →
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="mt-2 flex items-center justify-center">
          <Link
            href={`/directory?track=${track}`}
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink"
          >
            Browse all {trackPool.length} {track === 'graded' ? 'graded scorecards' : 'live-tracked politicians'} →
          </Link>
        </div>
      )}
    </div>
  )
}

function PoliticianRow({
  rank,
  p,
  punchline,
}: {
  rank: number
  p: Politician
  punchline?: Punchline
}) {
  const display = p.name.replace(/\s*\([^)]*\)\s*$/, '').replace(/^Senator |^Governor |^Representative /, '').trim()
  const graded = p.scorecard_graded_total || 0
  const keptPct = graded > 0 ? Math.round(p.scorecard_percentage_kept ?? 0) : null
  const pending = p.scorecard_pending || 0

  // Build the punchline. Priority order:
  //   1. Shocking alignment ("Defense: 0/7") — most engagement
  //   2. Kept-rate stat ("34% kept · 22 broken")
  //   3. Pending tracker line ("28 promises in flight")
  //   4. Fallback to branch/state
  const hasShocking =
    punchline?.shockingIndustry &&
    punchline.shockingAligned != null &&
    punchline.shockingTotal != null &&
    punchline.shockingPct != null

  return (
    <li>
      <Link
        href={`/politician/${p.slug}`}
        className="group flex items-center gap-3 sm:gap-4 rounded-md border border-line bg-paper hover:bg-paper-2 hover:border-ink-3 transition-all duration-200 p-3 sm:p-4 no-underline"
      >
        {/* Rank number */}
        <div className="font-mono text-[15px] sm:text-[16px] text-ink-3 w-8 text-center tabular-nums shrink-0">
          {String(rank).padStart(2, '0')}
        </div>

        {/* Avatar */}
        <PoliticianAvatar
          name={p.name}
          party={p.party}
          photoUrl={p.photo_url}
          size="sm"
        />

        {/* Identity + punchline */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-[17px] sm:text-[19px] leading-[1.2] text-ink truncate m-0">
              {display}
            </h3>
            <Tag variant={partyVariant(p.party)}>
              {p.party[0]} · {p.state} · {p.branch}
            </Tag>
          </div>

          {/* Punchline line — the hook per panel R3 */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap font-mono text-[11px] uppercase tracking-[0.12em]">
            {hasShocking && (
              <ShockingBadge
                industry={punchline!.shockingIndustry!}
                aligned={punchline!.shockingAligned!}
                total={punchline!.shockingTotal!}
                pct={punchline!.shockingPct!}
              />
            )}
            {keptPct != null && (
              <span className="text-ink-2">
                <strong className={
                  keptPct >= 60 ? 'text-kept font-medium'
                  : keptPct >= 40 ? 'text-partial font-medium'
                  : 'text-broken font-medium'
                }>{keptPct}%</strong> kept · {p.scorecard_broken} broken
              </span>
            )}
            {keptPct == null && pending > 0 && (
              <span className="text-ink-2">
                <strong className="text-pending font-medium">{pending}</strong> promises in flight
              </span>
            )}
            {punchline?.topIndustry && (
              <>
                <span className="text-ink-3" aria-hidden>·</span>
                <span className="text-ink-2 normal-case tracking-normal font-sans">
                  Top donor: <span className="text-ink">{punchline.topIndustry}</span>
                </span>
              </>
            )}
          </div>

          {/* Scorecard bar — only for graded politicians */}
          {graded > 0 && (
            <div className="mt-2.5">
              <ScorecardBar
                kept={p.scorecard_kept}
                partial={p.scorecard_partial}
                broken={p.scorecard_broken}
                youDecide={p.scorecard_you_decide}
                total={graded}
                size="sm"
              />
            </div>
          )}
        </div>

        {/* Arrow */}
        <span
          className="hidden sm:inline font-mono text-[14px] text-ink-3 group-hover:text-ink transition-colors shrink-0"
          aria-hidden
        >
          →
        </span>
      </Link>
    </li>
  )
}

function ShockingBadge({
  industry,
  aligned,
  total,
  pct,
}: {
  industry: string
  aligned: number
  total: number
  pct: number
}) {
  // ≤20% = strong opposition (sage); ≥80% = strong alignment (coral —
  // because alignment with donor industry is the suspicious story).
  const tone = pct >= 80 ? 'broken' : 'kept'
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 border font-mono text-[10px] uppercase tracking-[0.14em] ' +
        (tone === 'broken'
          ? 'bg-broken-bg text-broken border-broken/30'
          : 'bg-kept-bg text-kept border-kept/30')
      }
      title={`${industry} alignment: ${aligned} of ${total} votes (${Math.round(pct)}%) — sourced from cr_donor_vote_alignment`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {industry}: {aligned}/{total}
    </span>
  )
}

function TrackTab({
  active,
  onClick,
  label,
  sub,
}: {
  active: boolean
  onClick: () => void
  label: string
  sub: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group px-3 sm:px-4 py-2.5 -mb-px border-b-2 transition-colors flex flex-col items-start ' +
        (active
          ? 'border-ink text-ink'
          : 'border-transparent text-ink-2 hover:text-ink')
      }
      aria-selected={active}
    >
      <span className="font-display text-[16px] sm:text-[17px] leading-[1.2]">{label}</span>
      <span className={
        'mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ' +
        (active ? 'text-ink-2' : 'text-ink-3')
      }>
        {sub}
      </span>
    </button>
  )
}

function Select({
  label, value, onChange, options, disabled, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
  disabled?: boolean
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 flex items-center gap-1.5">
        {label}
        {hint && <span className="text-ink-3 font-mono normal-case text-[9px] tracking-normal">· {hint}</span>}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={
          'bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 rounded-md px-2.5 py-2 font-sans text-[14px] text-ink transition disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer'
        }
        style={{ paddingRight: '1.75rem' }}
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  )
}
