'use client'

// "Cite this promise" — load-bearing v1 button.
// Single click:
//   1. Copies a 280-char share string + permalink to clipboard
//   2. Also copies a 1080×1350 verdict-stamp PNG via ClipboardItem
//   3. Shows an aria-live confirmation toast
//   4. Falls back to text-only + new-tab image if ClipboardItem missing

import { useCallback, useState } from 'react'
import { Copy } from 'lucide-react'

type Props = {
  shareText: string
  permalink: string
  imageUrl: string // /api/trump/cite-image/[slug]
}

export default function CitePromiseButton({ shareText, permalink, imageUrl }: Props) {
  const [status, setStatus] = useState<'idle' | 'copying' | 'copied' | 'partial' | 'error'>('idle')

  const onClick = useCallback(async () => {
    setStatus('copying')
    const fullText = `${shareText}\n${permalink}`

    // Best path: copy text + PNG image as a single ClipboardItem
    try {
      const supportsClipboardItem =
        typeof window !== 'undefined' &&
        'ClipboardItem' in window &&
        typeof navigator.clipboard?.write === 'function'

      if (supportsClipboardItem) {
        const imgRes = await fetch(imageUrl)
        if (!imgRes.ok) throw new Error('image fetch failed')
        const imgBlob = await imgRes.blob()
        const textBlob = new Blob([fullText], { type: 'text/plain' })
        const item = new ClipboardItem({
          'image/png': imgBlob,
          'text/plain': textBlob,
        })
        await navigator.clipboard.write([item])
        setStatus('copied')
        setTimeout(() => setStatus('idle'), 2500)
        return
      }
    } catch (err) {
      // Fall through to text-only path
      // eslint-disable-next-line no-console
      console.warn('CitePromiseButton: ClipboardItem path failed, falling back', err)
    }

    // Fallback: text only + open image in a new tab
    try {
      await navigator.clipboard.writeText(fullText)
      window.open(imageUrl, '_blank', 'noopener')
      setStatus('partial')
      setTimeout(() => setStatus('idle'), 3500)
    } catch (err) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }, [shareText, permalink, imageUrl])

  const label =
    status === 'copying' ? 'Copying…' :
    status === 'copied'  ? 'Copied — go paste it.' :
    status === 'partial' ? 'Text copied. Image opened in new tab.' :
    status === 'error'   ? 'Copy failed. Select the text manually.' :
                           'Cite this promise'

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={status === 'copying'}
        className="inline-flex items-center gap-2 rounded-md bg-ink-950 text-parchment-50 px-4 py-2.5 text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-60"
      >
        <Copy className="size-4" strokeWidth={2.25} />
        {label}
      </button>
      <span
        aria-live="polite"
        className="sr-only"
      >
        {status === 'copied' && 'Citation copied to clipboard with image.'}
        {status === 'partial' && 'Text copied. Image opened in new tab.'}
        {status === 'error' && 'Copy failed.'}
      </span>
    </div>
  )
}
