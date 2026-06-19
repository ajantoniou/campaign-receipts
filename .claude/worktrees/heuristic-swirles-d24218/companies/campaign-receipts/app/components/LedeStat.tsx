'use client'

// One-line shareable data point under the hero. The design lead's #1 fix:
// give a Twitter visitor something concrete they can quote-tweet in 3
// seconds. The number is the real median kept-rate across our graded
// scorecards (>=8 promises per politician threshold so the denominator
// is meaningful).

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export default function LedeStat({
  medianKeptPct,
  gradedCount,
}: {
  medianKeptPct: number
  gradedCount: number
}) {
  const [copied, setCopied] = useState(false)
  const shareText = `Across ${gradedCount} graded political terms tracked at CampaignReceipts.com, the median kept-promise rate is ${medianKeptPct}%. Every verdict has primary-source receipts.`
  const shareUrl = 'https://campaignreceipts.com'

  async function onShare() {
    const navAny = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }) : null
    if (navAny?.share) {
      try {
        await navAny.share({ text: shareText, url: shareUrl })
        return
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <section className="section-shell pt-10">
      <div className="rounded-2xl ring-1 ring-amber-500/20 bg-gradient-to-br from-amber-500/[0.05] to-ink-900/40 px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/90 mb-2">
            Today on CampaignReceipts
          </div>
          <p className="text-lg sm:text-xl text-ink-100 leading-snug">
            Across <strong className="text-ink-50 tabular-nums">{gradedCount}</strong> graded political terms, the median kept-promise rate is{' '}
            <strong className="text-emerald-300 tabular-nums">{medianKeptPct}%</strong>. Every verdict has primary-source receipts.
          </p>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="shrink-0 inline-flex items-center gap-2 rounded-md ring-1 ring-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200 hover:text-amber-50 px-3.5 py-2 text-sm font-medium transition-colors"
          aria-label={copied ? 'Copied' : 'Share this stat'}
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied</span>
            </>
          ) : (
            <>
              <Share2 className="size-3.5" />
              <span>Share this</span>
            </>
          )}
        </button>
      </div>
    </section>
  )
}
