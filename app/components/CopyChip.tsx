'use client'

// CopyChip — generic copy-to-clipboard button primitive.
//
// Used by Viral Pack (caption + source line) and AP-style citation chip
// in Receipt footers. Mono caps + amber hover, fits the paper-warm
// audit-document benchmark. Client-side only because clipboard API
// requires it.

import { useState } from 'react'

type Props = {
  /** The text that gets written to the clipboard. */
  value: string
  /** Default chip label (e.g. "Copy", "Copy caption", "Cite as AP"). */
  label?: string
  /** Label shown for 1.5s after successful copy. Default: "Copied". */
  copiedLabel?: string
  /** Optional className for outer wrapper. */
  className?: string
  /** Visual variant. "chip" = pill (default). "inline" = no border. */
  variant?: 'chip' | 'inline'
}

export default function CopyChip({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  className = '',
  variant = 'chip',
}: Props) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Safari/iOS fallback: select-and-copy via a hidden textarea.
      try {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        return
      }
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2 hover:text-amber-text transition-colors underline underline-offset-4 decoration-line hover:decoration-amber-text ${className}`}
        aria-label={copied ? copiedLabel : label}
      >
        {copied ? `✓ ${copiedLabel}` : label}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
        copied
          ? 'border-kept-sage/40 bg-kept-sage/[0.08] text-kept-sage'
          : 'border-line bg-paper hover:bg-paper-3 hover:border-ink-3 text-ink hover:text-amber-text'
      } ${className}`}
      aria-label={copied ? copiedLabel : label}
    >
      <span aria-hidden>{copied ? '✓' : '⧉'}</span>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  )
}
