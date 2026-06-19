// RRow — Receipt Row primitive. Key / dotted leader / value.
// Per claude-design benchmark.
//
// Used inside Receipt card body and reusable for any specification
// list (about page methodology, source ledger, etc).

type Props = {
  /** Key — rendered in Geist Mono 10px uppercase tracking 0.1em */
  k: React.ReactNode
  /** Value — rendered right-aligned, Geist Mono 12px medium by default */
  v: React.ReactNode
  /** If true, value uses Geist sans instead of mono (longer human text) */
  sans?: boolean
  className?: string
}

export default function RRow({ k, v, sans, className = '' }: Props) {
  return (
    <div className={`receipt-row ${className}`}>
      <span className="k">{k}</span>
      <span className="leader" aria-hidden />
      <span className={`v ${sans ? 'sans' : ''}`}>{v}</span>
    </div>
  )
}
