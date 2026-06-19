// Server component — renders a relative-time string from an ISO timestamp.
// Single source of truth across the site so every "last updated · 3d ago"
// uses the same units and rounding.

const UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.345, 'week'],
  [12, 'month'],
  [Number.POSITIVE_INFINITY, 'year'],
]

function relativeFromNow(iso: string, nowMs = Date.now()): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  let diff = (then - nowMs) / 1000
  for (const [factor, unit] of UNITS) {
    if (Math.abs(diff) < factor) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      return rtf.format(Math.round(diff), unit)
    }
    diff /= factor
  }
  return ''
}

export default function RelativeTime({
  iso,
  prefix = '',
  className = '',
}: {
  iso: string | null | undefined
  prefix?: string
  className?: string
}) {
  if (!iso) return null
  const rel = relativeFromNow(iso)
  if (!rel) return null
  const abs = new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <time dateTime={iso} title={abs} className={className}>
      {prefix}
      {rel}
    </time>
  )
}
