'use client'

import Image from 'next/image'
import { useState } from 'react'
import { freeIllustrations } from '@/lib/landing-content'
import { deletedPromises2024CheckoutUrl } from '@/lib/checkout-urls'

type Mode = 'buy' | 'notify' | 'sold_out'

type Props = {
  ctaMode: Mode
  buyHref: string
  siteUrl: string
}

/**
 * Free-share editorial illustrations gallery — viral marketing loop.
 *
 * Civic-trust palette pass: parchment cards, navy ink, civic-red CTA strip.
 * Pre-watermarked PNGs unchanged.
 */
export function FreeIllustrationsSection({ ctaMode, buyHref, siteUrl }: Props) {
  return (
    <section id="free-shares" className="border-b border-ink-900/10 bg-parchment-200">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <p className="sealed-eyebrow">Free editorial illustrations · Share freely</p>
        <h2 className="mt-5 max-w-3xl sealed-headline text-3xl sm:text-4xl">
          Posters to share. The receipts are in the book.
        </h2>
        <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink-700">
          These editorial illustrations are free to share — post them, text them, attach them to
          arguments. Each image carries a small{' '}
          <span className="font-semibold text-civic-blue">SEALED2016.COM</span> mark so anyone who
          sees it can find the full book.
        </p>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {freeIllustrations.map((item, i) => (
            <FreeIllustrationCard key={item.slug} item={item} index={i} siteUrl={siteUrl} />
          ))}
        </div>

        {/* Conversion strip — civic-red on parchment */}
        <div className="mt-16 flex flex-col items-start gap-6 rounded-md border border-civic-red/25 bg-civic-red/[0.05] p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="font-serif text-2xl font-semibold text-ink-900 sm:text-3xl">
              If these made you stop scrolling, the full book is sharper.
            </p>
            <p className="mt-3 text-sm text-ink-600">
              Start with the{' '}
              <a
                href={deletedPromises2024CheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-civic-blue underline underline-offset-2 hover:no-underline"
                data-source="free-illustrations"
                data-product="2024-deleted"
              >
                $5 deleted-promises brief
              </a>
              , then go deeper with the $25 paperback.
            </p>
          </div>
          {ctaMode === 'buy' ? (
            <a
              href={buyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="sealed-btn-primary shrink-0 px-8 py-4 text-base"
            >
              Buy paperback — $25
            </a>
          ) : (
            <a href="#notify" className="sealed-btn-notify shrink-0 px-8 py-4 text-base">
              Get the launch link
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */

type Item = (typeof freeIllustrations)[number]

function FreeIllustrationCard({
  item,
  index,
  siteUrl,
}: {
  item: Item
  index: number
  siteUrl: string
}) {
  const [copied, setCopied] = useState(false)
  const imageUrl = `/free-shares/sealed-${item.slug}.png`
  const shareUrl = siteUrl

  const onShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { share?: unknown }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: item.title,
          text: item.shareText,
          url: shareUrl,
        })
        return
      } catch {
        /* fall through */
      }
    }
    onCopy()
  }

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* no-op */
    }
  }

  const onDownload = async () => {
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sealed-${item.slug}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      window.open(imageUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    item.shareText
  )}&url=${encodeURIComponent(shareUrl)}`

  return (
    <article className="flex flex-col overflow-hidden rounded-md border border-ink-900/15 bg-parchment-50 shadow-civic-card transition hover:border-civic-blue/40 hover:shadow-civic-lift">
      <div className="aspect-[1408/768] w-full overflow-hidden border-b border-ink-900/10 bg-parchment-100">
        <Image
          src={imageUrl}
          alt={item.title}
          width={1408}
          height={768}
          className="h-auto w-full"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between">
          <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
            Plate {String(index + 1).padStart(2, '0')} / 09
          </p>
          <p className="font-sans text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
            Free to share
          </p>
        </div>
        <h3 className="mt-3 font-serif text-lg font-semibold leading-snug text-ink-900">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">{item.caption}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={xUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-ink-900/20 px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:border-civic-blue hover:text-civic-blue"
          >
            Post on X
          </a>
          <button
            type="button"
            onClick={onShare}
            className="rounded-md border border-ink-900/20 px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:border-civic-blue hover:text-civic-blue"
          >
            Share
          </button>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md border border-ink-900/20 px-3 py-1.5 text-xs font-semibold text-ink-800 transition hover:border-civic-blue hover:text-civic-blue"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="rounded-md bg-civic-red px-3 py-1.5 text-xs font-bold text-parchment-50 transition hover:bg-civic-red-dark"
          >
            Download PNG
          </button>
        </div>
      </div>
    </article>
  )
}
