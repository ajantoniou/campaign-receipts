import fs from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { siteUrl } from '@/lib/site-url'

/**
 * /share — Creator pack landing.
 *
 * Twelve 1080×1920 verdict cards built by scripts/build-share-cards.mjs and
 * staged under public/share-cards/v1/. CC0 — creators, journalists, and
 * anyone passing the receipts along can grab a PNG and post it directly.
 */

export const metadata: Metadata = {
  title: 'Free SEALED share cards — for creators, journalists, anyone passing the receipts along',
  description:
    '12 verdict cards, 1080×1920 vertical, ready for TikTok / IG Stories / Reels. Verbatim promise quotes paired with receipts. CC0.',
  alternates: { canonical: `${siteUrl}/share` },
  openGraph: {
    title: 'Free SEALED share cards for creators',
    description:
      '12 verdict cards. Verbatim promise + receipt + verdict stamp. CC0.',
    url: `${siteUrl}/share`,
  },
}

type CardEntry = {
  n: number
  slug: string
  chapter: string
  verdict: 'KEPT' | 'PARTIAL' | 'BROKEN' | 'READER'
  filename: string
}

async function loadManifest(): Promise<CardEntry[]> {
  const p = path.join(process.cwd(), 'public', 'share-cards', 'v1', 'manifest.json')
  try {
    const raw = await fs.readFile(p, 'utf8')
    return JSON.parse(raw) as CardEntry[]
  } catch {
    return []
  }
}

function verdictBadgeClass(v: CardEntry['verdict']) {
  switch (v) {
    case 'KEPT':
      return 'bg-verdict-kept-soft text-verdict-kept ring-1 ring-verdict-kept/30'
    case 'PARTIAL':
      return 'bg-verdict-partial-soft text-verdict-partial ring-1 ring-verdict-partial/30'
    case 'BROKEN':
      return 'bg-verdict-broken-soft text-verdict-broken ring-1 ring-verdict-broken/40'
    case 'READER':
      return 'bg-verdict-reader-soft text-verdict-reader ring-1 ring-verdict-reader/30'
  }
}

function verdictLabel(v: CardEntry['verdict']) {
  return v === 'READER' ? 'YOU DECIDE' : v
}

export default async function SharePage() {
  const cards = await loadManifest()

  return (
    <main className="bg-parchment-100 min-h-screen text-ink-900">
      {/* Top bar */}
      <div className="border-b border-ink-900/10 bg-parchment-200">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-civic-blue">
            ← SEALED2016.COM
          </Link>
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ink-500">
            Creator Pack v1 · CC0
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="border-b border-ink-900/10">
        <div className="mx-auto max-w-4xl px-6 py-14 lg:py-20 text-center">
          <p className="sealed-eyebrow text-civic-red">Free · for creators · CC0</p>
          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-ink-900">
            Free SEALED share cards — for creators, journalists, and anyone passing the receipts along.
          </h1>
          <p className="mt-6 font-serif text-lg sm:text-xl leading-relaxed text-ink-700">
            12 cards, 1080×1920 vertical, ready to post on TikTok, Instagram Reels, or Stories.
            Each card is one verdict moment — a verbatim Trump promise, the receipt, the SEALED verdict stamp, and the source URL.
          </p>
          <p className="mt-4 font-serif text-base text-ink-600">
            Use them anywhere. No attribution required. No permission needed. Just pass the receipts.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        {cards.length === 0 ? (
          <p className="text-center font-mono text-sm text-ink-500">
            Share cards not yet built. Run <code>node scripts/build-share-cards.mjs</code>.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {cards.map((c) => {
              const href = `/share-cards/v1/${c.filename}`
              return (
                <figure
                  key={c.slug}
                  className="overflow-hidden rounded-md border border-ink-900/10 bg-white shadow-civic-card"
                >
                  <a href={href} download className="block">
                    <Image
                      src={href}
                      alt={`SEALED verdict card ${c.n}: ${c.chapter}`}
                      width={1080}
                      height={1920}
                      className="block h-auto w-full"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  </a>
                  <figcaption className="p-3 sm:p-4 border-t border-ink-900/10">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
                        #{String(c.n).padStart(2, '0')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[0.55rem] font-semibold uppercase tracking-[0.14em] ${verdictBadgeClass(c.verdict)}`}
                      >
                        {verdictLabel(c.verdict)}
                      </span>
                    </div>
                    <p className="mt-1 font-serif text-sm leading-snug text-ink-800">
                      {c.chapter}
                    </p>
                    <a
                      href={href}
                      download
                      className="mt-2 inline-block font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-civic-red hover:underline"
                    >
                      Download PNG ↓
                    </a>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        )}
      </section>

      {/* License + brand bar */}
      <section className="border-t border-ink-900/10 bg-parchment-200">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <p className="sealed-eyebrow text-civic-blue">License</p>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            CC0 — public-domain dedication.
          </h2>
          <p className="mt-4 font-serif text-base sm:text-lg leading-relaxed text-ink-700">
            These cards are released to the public domain. No attribution required.
            Use them in your TikToks, on your Stories, in your newsletter, on your protest sign —
            we just want the receipts in front of more people. The promises were public.
            The verdicts are sourced. The cards are yours.
          </p>
          <p className="mt-6 font-serif text-base text-ink-600">
            Want the full book — 145 promises, every receipt?{' '}
            <Link href="/" className="font-semibold text-civic-red underline-offset-4 hover:underline">
              SEALED2016.COM →
            </Link>
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-civic-blue">
              SEALED2016.COM
            </span>
            <span aria-hidden className="text-[0.5rem] text-civic-gold">◆</span>
            <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-ink-500">
              145 promises · 46 KEPT · 51 PARTIAL · 40 BROKEN · 8 YOU-DECIDE
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}
