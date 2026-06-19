// Tag — mono micro-pill for party affiliation, category, status.
// Per claude-design benchmark.
//
// Party variants are the ONLY place red/blue-coded tints appear
// (and only as muted background on a tiny chip — never as page-
// level accent). Keeps the site nonpartisan-coded by default while
// still letting a journalist scan party at a glance.

type Props = {
  children: React.ReactNode
  variant?: 'default' | 'party-r' | 'party-d' | 'party-i'
  className?: string
}

export default function Tag({ children, variant = 'default', className = '' }: Props) {
  const variantCls = variant === 'default' ? '' : variant
  return <span className={`tag ${variantCls} ${className}`}>{children}</span>
}

// Helper: map a politician's party string -> Tag variant key
export function partyVariant(party: string | null | undefined): 'party-r' | 'party-d' | 'party-i' | 'default' {
  if (party === 'Republican') return 'party-r'
  if (party === 'Democratic') return 'party-d'
  if (party === 'Independent') return 'party-i'
  return 'default'
}
