// StatTile — viral-ready stat card. Per claude-design benchmark.
//
// Single big Instrument Serif number on paper with mono meta-row
// top and Geist sans label bottom. Optional verdict tint fills the
// card and an optional corner-mark micro-chip top-right.

type Props = {
  /** Top mono eyebrow ("FEDERAL POLITICIANS", "VOTES SCORED", etc.) */
  meta: string
  /** The big number. Pass as string so caller controls formatting. */
  num: string | number
  /** Optional small suffix (% / total) rendered next to num */
  suffix?: string
  /** Bottom label — Geist 14px ink-2 */
  label: string
  /** Verdict tint fill (paper if undefined) */
  fill?: 'kept' | 'partial' | 'broken' | 'pending'
  /** Top-right micro-chip (e.g. "↗ +312 this month", "Audited") */
  cornerMark?: string
  className?: string
}

export default function StatTile({ meta, num, suffix, label, fill, cornerMark, className = '' }: Props) {
  const fillCls = fill ? `fill-${fill}` : ''
  return (
    <div className={`stat-tile ${fillCls} ${className}`}>
      <div className="meta">{meta}</div>
      <div className="num tnum">
        {num}
        {suffix && <small>{suffix}</small>}
      </div>
      <div className="lbl">{label}</div>
      {cornerMark && <span className="corner-mark">{cornerMark}</span>}
    </div>
  )
}
