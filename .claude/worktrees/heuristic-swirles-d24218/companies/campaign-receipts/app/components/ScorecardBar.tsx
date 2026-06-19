'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { cn } from '@/lib/cn'

type Props = {
  kept: number
  partial: number
  broken: number
  youDecide: number
  total: number
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function ScorecardBar({ kept, partial, broken, youDecide, total, showLabels = false, size = 'sm', className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -20px 0px' })
  const safeTotal = total || 1
  const pct = (n: number) => (n / safeTotal) * 100

  const segments = [
    { value: kept, pct: pct(kept), color: 'bg-emerald-500', label: 'kept', textColor: 'text-emerald-400' },
    { value: partial, pct: pct(partial), color: 'bg-amber-500', label: 'partial', textColor: 'text-amber-400' },
    { value: broken, pct: pct(broken), color: 'bg-rose-500', label: 'broken', textColor: 'text-rose-400' },
    { value: youDecide, pct: pct(youDecide), color: 'bg-violet-500', label: 'you decide', textColor: 'text-violet-400' },
  ]

  const heightClass = size === 'lg' ? 'h-3' : size === 'md' ? 'h-2.5' : 'h-2'

  return (
    <div ref={ref} className={cn('w-full', className)}>
      <div className={cn('flex w-full overflow-hidden rounded-full bg-ink-900 ring-1 ring-ink-800/80', heightClass)}>
        {segments.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ width: 0 }}
            animate={inView ? { width: `${s.pct}%` } : { width: 0 }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={cn(s.color, 'h-full')}
            title={`${s.label.toUpperCase()}: ${s.value}`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {segments.map((s) => (
            <div key={s.label} className={cn('flex flex-col items-start leading-tight', s.textColor)}>
              <span className="font-bold text-sm sm:text-base tabular-nums">{s.value}</span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap truncate w-full">
                {s.label === 'you decide' ? 'You decide' : s.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
