import { cn } from '@/lib/cn'

type Verdict = 'KEPT' | 'PARTIAL' | 'BROKEN' | 'YOU_DECIDE' | 'BLOCKED'

const STYLES: Record<Verdict, string> = {
  KEPT: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30',
  PARTIAL: 'bg-amber-500/10 text-amber-300 ring-amber-500/30',
  BROKEN: 'bg-rose-500/10 text-rose-300 ring-rose-500/30',
  BLOCKED: 'bg-sky-500/10 text-sky-300 ring-sky-500/30',
  YOU_DECIDE: 'bg-violet-500/10 text-violet-300 ring-violet-500/30',
}

const LABELS: Record<Verdict, string> = {
  KEPT: 'Kept',
  PARTIAL: 'Partial',
  BROKEN: 'Broken',
  BLOCKED: 'Blocked',
  YOU_DECIDE: 'You Decide',
}

export default function VerdictBadge({
  verdict,
  size = 'sm',
  className,
}: {
  verdict: Verdict
  size?: 'xs' | 'sm' | 'md'
  className?: string
}) {
  const sizeClass =
    size === 'xs' ? 'text-[10px] px-1.5 py-0.5' :
    size === 'md' ? 'text-xs px-2.5 py-1' :
    'text-[11px] px-2 py-0.5'
  return (
    <span className={cn(
      'inline-flex items-center font-semibold uppercase tracking-wider rounded-full ring-1',
      sizeClass,
      STYLES[verdict],
      className,
    )}>
      {LABELS[verdict]}
    </span>
  )
}
