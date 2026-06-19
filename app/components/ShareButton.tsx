'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { cn } from '@/lib/cn'

// Share affordance with Web Share API + clipboard fallback.
// On mobile (where most political-content sharing happens) Web Share opens the
// native sheet. On desktop we copy a pre-formatted "text + URL" to clipboard
// and flash a "Copied" state so the user knows the action worked.

export default function ShareButton({
  text,
  url,
  label = 'Share',
  className,
  size = 'sm',
}: {
  text: string
  url: string
  label?: string
  className?: string
  size?: 'sm' | 'md'
}) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    const shareUrl = absoluteUrl(url)
    const shareText = text
    const navAny = typeof navigator !== 'undefined' ? (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }) : null
    if (navAny?.share) {
      try {
        await navAny.share({ text: shareText, url: shareUrl })
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Last resort: nothing more we can do without a target window.
    }
  }

  const sizeClasses = size === 'md'
    ? 'px-3 py-2 text-sm gap-2'
    : 'px-2.5 py-1.5 text-xs gap-1.5'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-md ring-1 ring-ink-800 bg-ink-900/60 hover:bg-ink-900 hover:ring-ink-700 text-ink-300 hover:text-ink-50 transition-colors font-medium',
        sizeClasses,
        className,
      )}
      aria-label={copied ? 'Copied to clipboard' : label}
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-400" />
          <span className="text-emerald-400">Copied</span>
        </>
      ) : (
        <>
          <Share2 className="size-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

function absoluteUrl(url: string): string {
  if (typeof window === 'undefined') return url
  if (url.startsWith('http')) return url
  return new URL(url, window.location.origin).toString()
}
