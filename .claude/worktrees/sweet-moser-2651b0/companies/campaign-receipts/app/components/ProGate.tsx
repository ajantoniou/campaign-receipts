// Pro gate card — appears at the bottom of paywalled tables/lists
// (NOT on top of charts; the chart is always free per design lead).
//
// Usage:
//   <ProGate
//     headline="+ 43 more votes · filter by industry · CSV export"
//     ctaLabel="Get Donor Intelligence →"
//     ctaHref="/pricing"
//   />

import Link from 'next/link'
import { Lock } from 'lucide-react'

type Props = {
  headline: string
  ctaLabel?: string
  ctaHref?: string
  className?: string
}

export default function ProGate({
  headline,
  ctaLabel = 'Get Donor Intelligence →',
  ctaHref = '/pricing',
  className = '',
}: Props) {
  return (
    <div
      className={`rounded-xl bg-paper-2 ring-1 ring-broken/30 p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Lock className="size-4 text-broken mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-2 leading-relaxed">{headline}</p>
          <Link
            href={ctaHref}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-ink hover:bg-ink-2 text-paper font-semibold text-sm px-4 py-2 transition-colors"
          >
            {ctaLabel}
          </Link>
          <p className="mt-2 text-[11px] text-ink-3">
            $45/mo · cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
