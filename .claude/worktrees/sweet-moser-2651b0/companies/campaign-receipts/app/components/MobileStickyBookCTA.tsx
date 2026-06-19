'use client'

// MobileStickyBookCTA — paper-warm sticky exit-ramp to sealed2016.com
// shown on mobile after the visitor scrolls past the hero. SEALED is
// the only thing we can sell today; CR's job is to drive traffic to
// it, so on mobile (where most CR traffic lands) there's a persistent
// soft CTA at the bottom of the viewport.
//
// Rebuilt 2026-05-18 from the legacy dark-theme version. Paper-warm
// now, dismissable, scroll-gated at 600px.

import { useEffect, useState } from 'react'
import { BOOK } from '@/lib/book'

export default function MobileStickyBookCTA() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (dismissed || !visible) return null

  const sealedHref = `${BOOK.url}?utm_source=campaignreceipts&utm_medium=referral&utm_content=mobile-sticky`

  return (
    <div className="lg:hidden fixed bottom-3 inset-x-3 z-30 transition-all">
      <div className="rounded-lg border-2 border-broken/40 bg-paper shadow-lg shadow-ink/10 p-3 flex items-center gap-3">
        <div className="size-9 rounded-md bg-paper-3 border border-line flex items-center justify-center shrink-0">
          <span className="font-display italic text-[14px] text-broken leading-none">CR</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display italic text-[14px] text-ink leading-tight truncate">
            SEALED — The 2016 Promises
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 mt-0.5">
            {BOOK.totalPromises} receipts · {BOOK.pdfPrice} PDF
          </div>
        </div>
        <a
          href={sealedHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-ink text-paper hover:bg-ink-2 font-mono text-[10px] uppercase tracking-[0.14em] font-medium px-3 py-2 transition-colors border border-ink shrink-0"
        >
          Read →
        </a>
        <button
          aria-label="Dismiss SEALED book CTA"
          onClick={() => setDismissed(true)}
          className="rounded-md size-7 flex items-center justify-center text-ink-3 hover:text-ink hover:bg-paper-2 transition-colors shrink-0 font-mono text-[14px]"
        >
          ×
        </button>
      </div>
    </div>
  )
}
