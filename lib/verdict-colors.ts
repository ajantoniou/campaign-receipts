// Verdict color tokens — mirrors the SEALED book's color system
// Used by VerdictBadge component and scorecard displays

export type Verdict = 'KEPT' | 'PARTIAL' | 'BROKEN' | 'YOU_DECIDE' | 'BLOCKED'

export const verdictBadgeClass = (v: Verdict): string => {
  switch (v) {
    case 'KEPT':
      return 'bg-emerald-950/60 text-emerald-300 ring-1 ring-emerald-600/50'
    case 'PARTIAL':
      return 'bg-amber-950/60 text-amber-300 ring-1 ring-amber-600/50'
    case 'BROKEN':
      return 'bg-rose-950/60 text-rose-300 ring-1 ring-rose-600/50'
    case 'BLOCKED':
      return 'bg-sky-950/60 text-sky-300 ring-1 ring-sky-600/50'
    case 'YOU_DECIDE':
    default:
      return 'bg-violet-950/60 text-violet-300 ring-1 ring-violet-600/50'
  }
}

export const verdictLabel = (v: Verdict): string => {
  if (v === 'YOU_DECIDE') return 'YOU DECIDE'
  return v
}

export const verdictBarColor = (v: Verdict): string => {
  switch (v) {
    case 'KEPT': return 'bg-emerald-500'
    case 'PARTIAL': return 'bg-amber-500'
    case 'BROKEN': return 'bg-rose-500'
    case 'BLOCKED': return 'bg-sky-500'
    case 'YOU_DECIDE': default: return 'bg-violet-500'
  }
}

export const partyColorClass = (party: string): string => {
  if (party === 'Republican') return 'text-rose-400 bg-rose-950/40 ring-1 ring-rose-600/40'
  if (party === 'Democratic') return 'text-sky-400 bg-sky-950/40 ring-1 ring-sky-600/40'
  if (party === 'Independent') return 'text-amber-400 bg-amber-950/40 ring-1 ring-amber-600/40'
  return 'text-slate-400 bg-slate-800/50 ring-1 ring-slate-600/40'
}
