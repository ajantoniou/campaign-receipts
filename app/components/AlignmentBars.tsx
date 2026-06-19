// Horizontal alignment-by-industry bar chart for /correlations.
// Per design lead: this is the screenshot-worthy element — free users
// see the full chart, no blur. Watermark baked in.

import GraphWatermark from './GraphWatermark'

export type AlignmentRow = {
  industry: string
  pctAligned: number // 0-100
  alignedCount: number
  totalCount: number
}

const COLOR_BY_PCT = (pct: number) => {
  if (pct >= 70) return { bar: 'bg-kept-500', text: 'text-kept-400' }
  if (pct >= 40) return { bar: 'bg-partial-500', text: 'text-partial-400' }
  return { bar: 'bg-broken-500', text: 'text-broken-400' }
}

export default function AlignmentBars({
  rows,
  title = 'Alignment by industry',
  subtitle,
}: {
  rows: AlignmentRow[]
  title?: string
  subtitle?: string
}) {
  if (rows.length === 0) {
    return (
      <div className="relative rounded-2xl ring-1 ring-ink-800/80 bg-ink-900/40 p-6">
        <div className="text-sm text-ink-500">No alignment data yet for this politician.</div>
      </div>
    )
  }
  const max = Math.max(...rows.map((r) => r.pctAligned), 1)
  return (
    <div className="relative rounded-2xl ring-1 ring-ink-800/80 bg-ink-900/40 p-6">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500">{title}</div>
      {subtitle && <div className="mt-1 text-xs text-ink-600">{subtitle}</div>}
      <div className="mt-5 space-y-3">
        {rows.map((r) => {
          const c = COLOR_BY_PCT(r.pctAligned)
          const widthPct = (r.pctAligned / 100) * 100 // chart is 0-100 scale; we could also normalize to max
          return (
            <div key={r.industry} className="flex items-center gap-3">
              <div className="w-28 text-xs text-ink-300 truncate shrink-0">{r.industry}</div>
              <div className="flex-1 relative h-6 bg-ink-950/60 rounded">
                <div
                  className={`absolute inset-y-0 left-0 ${c.bar} rounded transition-all duration-700 ease-out`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <div className={`w-20 text-right text-sm font-mono tabular-nums ${c.text} shrink-0`}>
                {r.pctAligned}% kept
              </div>
              <div className="w-16 text-right text-[10px] text-ink-600 font-mono shrink-0">
                {r.alignedCount}/{r.totalCount}
              </div>
            </div>
          )
        })}
      </div>
      <GraphWatermark />
    </div>
  )
}
