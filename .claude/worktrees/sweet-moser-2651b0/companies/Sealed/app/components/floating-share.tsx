'use client'

import { useEffect, useState } from 'react'

type Props = { url: string }

/**
 * Demoted bottom-right share affordance.
 *
 * Civic-trust pass: a quiet small navy text-pill instead of an amber spotlight.
 * Opens a parchment card with X / LinkedIn / copy-link options pre-filled
 * with the claim hook.
 */
export function FloatingShare({ url }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  const claimHook =
    "Memory loses. Receipts don't. 145 verbatim 2016 campaign promises — graded 46 kept · 51 partial · 40 broken · 8 reader-decides against the public record."
  const encodedText = encodeURIComponent(claimHook)
  const encodedUrl = encodeURIComponent(url)

  const xHref = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
  const liHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(`${claimHook} ${url}`)
      setCopied(true)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      {open ? (
        <div
          className="mb-3 w-72 rounded-md border border-ink-900/15 bg-parchment-50 p-4 shadow-civic-lift"
          role="dialog"
          aria-label="Share the archive"
        >
          <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
            Share the archive
          </p>
          <p className="mt-2 text-xs leading-relaxed text-ink-600">
            Pre-filled with the claim hook, not the page title. Edit before posting if you like.
          </p>
          <div className="mt-4 space-y-2">
            <a
              href={xHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md border border-ink-900/15 px-3 py-2 text-center text-xs font-semibold tracking-wide text-ink-800 transition hover:border-civic-blue/60 hover:text-civic-blue"
            >
              Post on X
            </a>
            <a
              href={liHref}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md border border-ink-900/15 px-3 py-2 text-center text-xs font-semibold tracking-wide text-ink-800 transition hover:border-civic-blue/60 hover:text-civic-blue"
            >
              Share on LinkedIn
            </a>
            <button
              type="button"
              onClick={onCopy}
              className="block w-full rounded-md border border-ink-900/15 px-3 py-2 text-center text-xs font-semibold tracking-wide text-ink-800 transition hover:border-civic-blue/60 hover:text-civic-blue"
            >
              {copied ? 'Copied' : 'Copy link + hook'}
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close share menu' : 'Open share menu'}
        className="group inline-flex items-center gap-2 rounded-full border border-ink-900/20 bg-parchment-50/95 px-4 py-2 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink-700 shadow-civic-card backdrop-blur transition hover:border-civic-blue/60 hover:text-civic-blue"
      >
        <span aria-hidden className="text-civic-blue transition group-hover:translate-x-0.5">
          ↗
        </span>
        {open ? 'Close' : 'Share'}
      </button>
    </div>
  )
}
