// Verdict Stamp — the signature primitive.
// Per claude-design benchmark.
//
// Five kinds map to nonpartisan verdict palette:
//   - kept     (sage #4F7A4B)
//   - partial  (amber #A37222)
//   - broken   (coral #A8423E)
//   - pending  (slate #4F6480)
//   - decide   (olive #5C5246)
//
// Variants:
//   - default: 11px mono, 8x12 padding, single 1.5px border
//   - lg: 14px, 10x16 padding, tracking 0.18em
//   - tilted: THE signature variant — rotate(-3deg), double 3px
//     border, paper outer ring, padding 12x18. Use on hero
//     Receipt verdict bands and OG share tiles.

type Kind = 'kept' | 'partial' | 'broken' | 'pending' | 'decide'

type Props = {
  kind: Kind
  children?: React.ReactNode
  /** Default label per kind if no children passed */
  label?: string
  lg?: boolean
  tilted?: boolean
  className?: string
}

const DEFAULT_LABEL: Record<Kind, string> = {
  kept: 'Kept',
  partial: 'Partial',
  broken: 'Broken',
  pending: 'Pending',
  decide: 'You Decide',
}

export default function Stamp({ kind, children, label, lg, tilted, className = '' }: Props) {
  const cls = ['stamp', kind, lg && 'stamp-lg', tilted && 'stamp-tilted', className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={cls} role="status" aria-label={`Verdict: ${children || label || DEFAULT_LABEL[kind]}`}>
      {children || label || DEFAULT_LABEL[kind]}
    </span>
  )
}
