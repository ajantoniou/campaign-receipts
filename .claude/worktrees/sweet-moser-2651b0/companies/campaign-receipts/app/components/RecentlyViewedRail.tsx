'use client'

// RecentlyViewedRail — personalization-light per founder rev-7
// (2026-05-19). No auth, no server. Reads /writes a localStorage key
// 'cr.recently-viewed' on the politician/race/bill pages, displays
// the last 6 here on the homepage as a "Continue tracking" rail.
//
// First-time visitors (empty localStorage) see nothing. The component
// hides until there's at least one tracked item — no "your tracked
// dossiers will appear here" empty state, because that would shout
// "you haven't engaged yet."

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cr.recently-viewed'
const MAX_ITEMS = 6

export type RecentlyViewedItem = {
  kind: 'politician' | 'race' | 'bill' | 'receipt'
  id: string         // slug, race-slug, or bill-id
  name: string       // display label
  href: string
  viewedAt: number   // ms epoch
}

/**
 * Push an item to the recently-viewed list. Call this from politician
 * pages, race detail pages, bill detail pages on mount.
 *
 * Idempotent — re-adding an existing id moves it to the front, doesn't
 * duplicate.
 */
export function trackRecentlyViewed(item: Omit<RecentlyViewedItem, 'viewedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const list: RecentlyViewedItem[] = raw ? JSON.parse(raw) : []
    const filtered = list.filter((x) => !(x.kind === item.kind && x.id === item.id))
    const updated = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage disabled (Safari private, etc.) — fail silent.
  }
}

export default function RecentlyViewedRail() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as RecentlyViewedItem[]
        // Validate shape — guard against corrupted entries.
        const valid = parsed.filter(
          (x) =>
            x &&
            typeof x.kind === 'string' &&
            typeof x.id === 'string' &&
            typeof x.name === 'string' &&
            typeof x.href === 'string',
        )
        setItems(valid.slice(0, MAX_ITEMS))
      }
    } catch {
      // ignore
    }
  }, [])

  // Don't render anything until hydration completes — avoid SSR flash.
  if (!hydrated || items.length === 0) return null

  return (
    <section className="bg-paper-2 border-b border-line">
      <div className="section-shell py-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-2 inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-ink-3" aria-hidden />
            Continue tracking
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                window.localStorage.removeItem(STORAGE_KEY)
                setItems([])
              } catch {
                // ignore
              }
            }}
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 hover:text-ink underline underline-offset-4 decoration-line hover:decoration-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-1 focus-visible:ring-offset-paper-2 rounded-sm px-1"
          >
            Clear history
          </button>
        </div>
        {/* scroll-snap-x mandatory locks each card to a viewport stop
            on mobile swipe — design-pass 2026-05-19. Helps the user
            discover that the rail scrolls. */}
        <ol className="m-0 p-0 list-none flex items-stretch gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
          {items.map((it) => (
            <li key={`${it.kind}:${it.id}`} className="shrink-0 snap-start">
              <Link
                href={it.href}
                className="block rounded-md border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 transition-all px-3 py-2 no-underline min-w-[180px] max-w-[260px] focus:outline-none focus-visible:ring-2 focus-visible:ring-broken/50 focus-visible:ring-offset-1 focus-visible:ring-offset-paper-2"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 mb-0.5">
                  {it.kind}
                </div>
                <div className="font-sans text-[13px] text-ink truncate">{it.name}</div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
