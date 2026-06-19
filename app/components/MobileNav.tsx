'use client'

// Accessible mobile hamburger nav for CampaignReceipts. Button toggles a
// slide-down overlay menu on small screens; desktop uses the static <nav> in
// layout.tsx and never renders this. Brand parchment/navy.
//
// Accessibility:
//   - real <button> with aria-expanded + aria-controls + aria-label
//   - Escape closes; click-outside (overlay backdrop) closes
//   - body scroll locked while open
//   - focus returns to the toggle on close

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import AuthNavButton from './AuthNavButton'

type Item = { href: string; label: string; tag?: string; muted?: boolean }

const ITEMS: Item[] = [
  { href: '/race', label: 'Active Races', tag: 'live' },
  { href: '/articles', label: 'Articles' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/bills', label: 'Newsletter' },
  { href: '/for-journalists', label: 'For Journalists' },
  { href: '/dual-citizenship', label: 'Dual citizenship', muted: true },
  { href: '/foreign-donors', label: 'Foreign-tied funding', muted: true },
  { href: '/methodology', label: 'Methodology', muted: true },
  { href: '/sources', label: 'Sources', muted: true },
  { href: '/about', label: 'About', muted: true },
]

export default function MobileNav() {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const close = () => {
    setOpen(false)
    btnRef.current?.focus()
  }

  return (
    <div className="lg:hidden ml-auto">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[13px] font-medium px-4 py-2 transition-colors border border-ink select-none"
      >
        Menu
        <span aria-hidden className="relative block w-4 h-3">
          <span
            className={[
              'absolute left-0 top-0 block h-[1.5px] w-4 bg-paper transition-transform duration-200',
              open ? 'translate-y-[5.5px] rotate-45' : '',
            ].join(' ')}
          />
          <span
            className={[
              'absolute left-0 top-[5.5px] block h-[1.5px] w-4 bg-paper transition-opacity duration-200',
              open ? 'opacity-0' : 'opacity-100',
            ].join(' ')}
          />
          <span
            className={[
              'absolute left-0 bottom-0 block h-[1.5px] w-4 bg-paper transition-transform duration-200',
              open ? '-translate-y-[5.5px] -rotate-45' : '',
            ].join(' ')}
          />
        </span>
      </button>

      {open && (
        <>
          {/* backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={close}
            className="fixed inset-0 top-16 z-40 bg-ink/30 backdrop-blur-[1px] cursor-default"
          />
          {/* slide-down panel */}
          <div
            id="mobile-menu"
            className="fixed left-0 right-0 top-16 z-50 origin-top animate-[slideDown_0.18s_ease-out] border-b border-line bg-paper shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <nav aria-label="Mobile" className="section-shell py-2">
              {ITEMS.map((it) => (
                <Link
                  key={it.href}
                  href={it.href}
                  onClick={() => setOpen(false)}
                  className={[
                    'flex items-center justify-between px-1 py-3.5 font-sans text-[15px] border-b border-line last:border-b-0',
                    it.muted ? 'text-ink-2' : 'text-ink',
                  ].join(' ')}
                >
                  <span>{it.label}</span>
                  {it.tag && (
                    <span className="text-broken font-mono text-[10px] uppercase tracking-[0.12em]">
                      {it.tag}
                    </span>
                  )}
                </Link>
              ))}
              <div onClick={() => setOpen(false)}>
                <AuthNavButton variant="mobile" />
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
