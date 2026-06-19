'use client'

// Reveal — lightweight scroll-in fade-up (the fable ".reveal" workhorse).
//
// Progressive enhancement, no dependencies, no scroll-hijack. The wrapped
// content renders fully VISIBLE on the server and for no-JS users; only
// once this mounts (and motion is allowed) does it "arm" the hidden
// state, then ease the content up as it scrolls into view. A single
// shared IntersectionObserver handles every Reveal on the page.
//
// Reduced motion: the `.reveal` CSS neutralizes the armed/in states under
// prefers-reduced-motion, so this component still arms but the content
// never visibly hides or animates.

import { useEffect, useRef } from 'react'

type Props = {
  children: React.ReactNode
  /** Stagger in ms — delays the transition start when the element enters. */
  delay?: number
  /** Wrapper tag (default div). Use 'section' to avoid extra nesting. */
  as?: 'div' | 'section' | 'li'
  className?: string
}

// One observer for the whole page — cheaper than one per element.
let sharedObserver: IntersectionObserver | null = null
const pending = new Set<Element>()

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return null
  if (sharedObserver) return sharedObserver
  sharedObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in')
          obs.unobserve(entry.target)
          pending.delete(entry.target)
        }
      }
    },
    // Fire a touch before the element is fully on-screen, like the fable
    // `start: 'top 85%'` trigger.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
  )
  return sharedObserver
}

export default function Reveal({ children, delay = 0, as = 'div', className = '' }: Props) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Honor reduced motion: don't even arm — leave content as-is.
    const reduce =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    const obs = getObserver()
    if (!obs) return // no IO support → leave content visible

    const reveal = () => el.classList.add('is-in')

    if (delay) el.style.transitionDelay = `${delay}ms`
    el.classList.add('is-armed')

    // Fail-safe: if nothing has revealed this element within 1.2s (IO never
    // fires, degenerate/zero-height viewport, observer edge case), reveal
    // it anyway. Content must NEVER get stuck invisible.
    const safety = window.setTimeout(reveal, 1200)

    // If it's already in view on mount (above the fold), reveal next frame
    // so the armed→in transition still plays rather than snapping. Guard
    // against a 0-height viewport (treat as "show it").
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight || 0
    const alreadyVisible = vh === 0 || (rect.top < vh && rect.bottom > 0)
    if (alreadyVisible) {
      const raf = requestAnimationFrame(reveal)
      return () => {
        cancelAnimationFrame(raf)
        clearTimeout(safety)
      }
    }

    obs.observe(el)
    pending.add(el)
    return () => {
      obs.unobserve(el)
      pending.delete(el)
      clearTimeout(safety)
    }
  }, [delay])

  const Tag = as as React.ElementType
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()}>
      {children}
    </Tag>
  )
}
