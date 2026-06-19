// Shared paper-warm wrapper for legacy trust pages (/methodology,
// /pricing, /about, /sources) that haven't been individually
// migrated yet. Per rev-7 contrast remap: ink-900 now maps to
// paper-2 (#F4EEDF), so the old `bg-parchment-50 text-ink-900` mix
// rendered paper-on-paper. This wrapper now uses canonical benchmark
// tokens (bg-paper + text-ink) so any legacy markup inside renders
// readable.

import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Whether to apply the negative top margin that pulls the surface
   *  flush with the sticky header. Default true. */
  flush?: boolean
}

export default function TrustSurface({ children, flush = true }: Props) {
  return (
    <div className={`bg-paper text-ink ${flush ? '-mt-px' : ''}`}>
      {children}
    </div>
  )
}
