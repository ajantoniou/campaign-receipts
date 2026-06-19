'use client'

// ShareButtons — paper-warm social share row for politician dossiers,
// weekly receipt page, and any other shareable surface. Per founder
// rev-7 batch C: add X / Instagram / Facebook / TikTok / LinkedIn
// share affordance below the headline. Click writes a tracked param
// `utm_source={network}&utm_medium=share` so we attribute viral pickup.
//
// Networks that don't have a true "share-from-URL" intent (Instagram,
// TikTok) get a copy-link button instead — clicking copies the URL +
// tagline to clipboard and flashes a confirmation. This is the
// standard pattern major news sites use.

import { useState } from 'react'

type Network = 'x' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok' | 'copy'

export default function ShareButtons({
  url,
  title,
  tagline,
  source = 'share',
}: {
  /** Absolute URL of the page being shared. Without protocol it falls back to current page. */
  url?: string
  /** Headline that goes into the share text. */
  title: string
  /** Optional sub-line; appended after a dash. */
  tagline?: string
  /** UTM source segment (e.g. 'politician-page'). */
  source?: string
}) {
  const [copied, setCopied] = useState<Network | null>(null)

  function shareUrl(network: Network): string {
    const base = typeof window !== 'undefined' && !url ? window.location.href : url || ''
    // Add utm tagging so we can attribute pickups in analytics.
    const sep = base.includes('?') ? '&' : '?'
    const tracked = `${base}${sep}utm_source=${network}&utm_medium=share&utm_campaign=${source}`
    const text = tagline ? `${title} — ${tagline}` : title
    const enc = encodeURIComponent
    switch (network) {
      case 'x':
        return `https://twitter.com/intent/tweet?url=${enc(tracked)}&text=${enc(text)}`
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${enc(tracked)}`
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${enc(tracked)}`
      default:
        return tracked
    }
  }

  async function copy(network: Network) {
    const link = shareUrl(network)
    const text = tagline ? `${title} — ${tagline}\n${link}` : `${title}\n${link}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(network)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard API rejected (insecure context, denied permission).
      // Fall back to opening the link in a new tab so the user can
      // still share manually.
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  function open(network: Network) {
    window.open(shareUrl(network), '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  const baseBtn =
    'inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1.5 rounded border border-line bg-paper text-ink-2 hover:text-ink hover:bg-paper-2 hover:border-ink-3 transition-colors no-underline'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3 mr-1">
        Share
      </span>
      <button type="button" onClick={() => open('x')} className={baseBtn} aria-label="Share on X">
        <span aria-hidden>X</span>
      </button>
      <button
        type="button"
        onClick={() => open('facebook')}
        className={baseBtn}
        aria-label="Share on Facebook"
      >
        <span aria-hidden>FB</span>
      </button>
      <button
        type="button"
        onClick={() => open('linkedin')}
        className={baseBtn}
        aria-label="Share on LinkedIn"
      >
        <span aria-hidden>LI</span>
      </button>
      <button
        type="button"
        onClick={() => copy('instagram')}
        className={baseBtn}
        aria-label="Copy link for Instagram"
      >
        {copied === 'instagram' ? '✓ IG ready' : 'IG'}
      </button>
      <button
        type="button"
        onClick={() => copy('tiktok')}
        className={baseBtn}
        aria-label="Copy link for TikTok"
      >
        {copied === 'tiktok' ? '✓ TT ready' : 'TT'}
      </button>
      <button
        type="button"
        onClick={() => copy('copy')}
        className={baseBtn}
        aria-label="Copy link"
      >
        {copied === 'copy' ? '✓ copied' : 'copy link'}
      </button>
    </div>
  )
}
