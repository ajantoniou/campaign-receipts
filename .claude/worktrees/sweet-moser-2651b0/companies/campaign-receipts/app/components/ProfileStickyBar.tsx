'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import ShareButton from './ShareButton'

// Appears on scroll past the hero. Compact bar with name + verdict + share.
// The lead's spec: '~80% of social shares come from mobile' — this is the
// share affordance that's always within thumb reach.

export default function ProfileStickyBar({
  name,
  slug,
  shareText,
  shareUrl,
  appearAfterPx = 480,
}: {
  name: string
  slug: string
  shareText: string
  shareUrl: string
  appearAfterPx?: number
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > appearAfterPx)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [appearAfterPx])

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300',
        show ? 'translate-y-0' : 'translate-y-full',
      )}
      aria-hidden={!show}
    >
      <div className="border-t border-ink-800 bg-ink-950/95 backdrop-blur-md shadow-2xl shadow-black/40">
        <div className="section-shell py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-ink-500">
              Campaign Receipts
            </div>
            <div className="text-sm font-semibold text-ink-100 truncate">{name}</div>
          </div>
          <ShareButton
            text={shareText}
            url={shareUrl}
            label="Share"
            size="md"
            className="shrink-0"
          />
        </div>
      </div>
      {/* spacer ensures page content doesn't sit under the bar when shown */}
    </div>
  )
}
