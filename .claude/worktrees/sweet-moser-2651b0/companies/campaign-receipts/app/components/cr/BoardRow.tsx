// BoardRow — leaderboard row. Per claude-design benchmark.
//
// Grid: 40px rank · 1fr name · 100px count · 100px count · 100px count · 110px bar
//
// Cells:
//   - Rank: Geist Mono 13px, ink-3, weight 500. "#01", "#02" zero-padded.
//   - Name: Instrument Serif 20px, ink. Avatar 32x32 circle.
//     Sub-text below: Geist 11px uppercase tracking 0.1em ink-3 +
//     inline party Tag.
//   - Counts (kept/partial/broken): Geist Mono 14px, EACH COLORED
//     to its verdict.
//   - Distribution bar: 6px stacked horizontal, segments colored to
//     each verdict, total label mono 10px ink-3 below ("64 promises").

import Tag, { partyVariant } from './Tag'

type Props = {
  rank: number
  name: string
  initials?: string
  /** Sub-text below the name: state + branch + party tag */
  party: string
  state: string
  branch: string
  /** Verdict counts */
  kept: number
  partial: number
  broken: number
  /** Optional fourth segment for stamped pending */
  pending?: number
  total: number
  /** Wrapping link href */
  href?: string
  className?: string
}

export default function BoardRow({
  rank,
  name,
  initials,
  party,
  state,
  branch,
  kept,
  partial,
  broken,
  pending = 0,
  total,
  href,
  className = '',
}: Props) {
  const initialsActual = initials || name.split(/\s+/).map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  const safeTotal = total || 1
  const segs = [
    { cls: 'kept', pct: (kept / safeTotal) * 100 },
    { cls: 'partial', pct: (partial / safeTotal) * 100 },
    { cls: 'broken', pct: (broken / safeTotal) * 100 },
    { cls: 'pending', pct: (pending / safeTotal) * 100 },
  ]
  const Wrapper = href
    ? ({ children }: { children: React.ReactNode }) => (
        <a href={href} className={`board-row ${className}`}>{children}</a>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <div className={`board-row ${className}`}>{children}</div>
      )

  return (
    <Wrapper>
      <span className="rank">#{String(rank).padStart(2, '0')}</span>
      <span className="name">
        <span className="ava" aria-hidden>{initialsActual}</span>
        <span className="min-w-0">
          <span className="block truncate">{name}</span>
          <span className="sub">
            {branch} · {state} · <Tag variant={partyVariant(party)} className="ml-1">{party[0]}</Tag>
          </span>
        </span>
      </span>
      <span className="count kept tnum">{kept}</span>
      <span className="count partial tnum">{partial}</span>
      <span className="count broken tnum">{broken}</span>
      <span className="flex flex-col items-end gap-1">
        <span className="bar">
          {segs.map((s, i) => (
            <span key={i} className={`seg ${s.cls}`} style={{ width: `${s.pct}%` }} />
          ))}
        </span>
        <span className="font-mono text-[10px] text-ink-3 tnum">{total} promises</span>
      </span>
    </Wrapper>
  )
}
