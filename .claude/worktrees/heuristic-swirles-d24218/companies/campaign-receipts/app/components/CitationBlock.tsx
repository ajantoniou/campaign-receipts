'use client'

// CitationBlock — one-click copy-pasteable citation for a politician
// or specific receipt. Per engagement panel R2: "Journalists will not
// retype. This is the difference between getting cited and not."
//
// Renders a small paper-warm card with:
//   1. The formatted citation (Chicago-ish style)
//   2. A "Copy citation" button that copies the text to clipboard
//   3. A second button to copy the canonical URL alone
//
// Used on /politician/[slug] near the canonical Scorecard Receipt.

import { useState, useEffect } from 'react'

type Props = {
  receiptId: string       // e.g. "RCPT-DJT-2016-SCORECARD" or "RCPT-DJT-2016-004"
  title: string           // e.g. "Donald John Trump — 2017-2021 scorecard"
  url: string             // absolute or path
  publication?: string    // default "CampaignReceipts"
}

export default function CitationBlock({
  receiptId,
  title,
  url,
  publication = 'CampaignReceipts',
}: Props) {
  const [copied, setCopied] = useState<null | 'citation' | 'url'>(null)
  // Defer "today" to client-mount to avoid SSR/CSR hydration mismatch
  // (date differs depending on server timezone vs client). Renders
  // "[access date]" until hydration, then flips to the real date.
  // Per rev-7 engineer review: React errors #425/#418/#423 on every
  // politician page were caused by this date computed during render.
  const [today, setToday] = useState<string>('[access date]')
  useEffect(() => {
    setToday(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
  }, [])
  const fullUrl = url.startsWith('http') ? url : `https://campaignreceipts.com${url}`
  const citation = `${publication}. ${receiptId}: ${title}. Retrieved ${today} from ${fullUrl}`

  async function copy(text: string, kind: 'citation' | 'url') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback: select via a hidden textarea (legacy Safari, locked-down browsers)
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy'); setCopied(kind); setTimeout(() => setCopied(null), 2000) } catch {}
      document.body.removeChild(ta)
    }
  }

  return (
    <aside className="rounded-md border border-line bg-paper-2 p-4 sm:p-5 not-prose">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2 mb-2">
        For reporters · copy-pasteable citation
      </div>
      <div className="font-mono text-[12px] sm:text-[13px] leading-[1.55] text-ink bg-paper border border-line rounded-md p-3 sm:p-4 break-words">
        {citation}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy(citation, 'citation')}
          className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[13px] font-medium px-4 py-1.5 transition-colors border border-ink"
        >
          {copied === 'citation' ? '✓ Copied' : 'Copy citation'}
        </button>
        <button
          type="button"
          onClick={() => copy(fullUrl, 'url')}
          className="inline-flex items-center gap-1.5 rounded-full bg-paper text-ink hover:bg-paper-3 font-sans text-[13px] font-medium px-4 py-1.5 transition-colors border border-line hover:border-ink-3"
        >
          {copied === 'url' ? '✓ Copied' : 'Copy URL only'}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 ml-1">
          {receiptId}
        </span>
      </div>
    </aside>
  )
}
