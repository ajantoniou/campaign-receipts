import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { siteUrl } from '@/lib/site-url'
import { SiteFooter } from '@/components/SiteFooter'
import { ReviewRequestForm } from './review-request-form'

/**
 * /press — One-stop press kit.
 *
 * Single URL we can hand any editor in the press pipeline (Tangle, Pirate
 * Wires, Breaking Points, Useful Idiots, Greenwald, etc.). Everything they
 * need to write or record is on this page: 30-second elevator, three
 * paragraphs of liftable copy, three downloadable share cards, a media
 * contact, downloads list, review-copy request form, and a clean APA
 * citation. Static prerender — server component with a small client form.
 */

const pressEmail = process.env.NEXT_PUBLIC_PRESS_EMAIL?.trim() || 'press@sealed2016.com'
const lastUpdated = 'May 17, 2026'

export const metadata: Metadata = {
  title: 'Press kit — SEALED: 145 Trump promises, graded. 52 preserved.',
  description:
    'Press kit for SEALED — the 144-page book by Peter Oliver grading 145 Trump 2016 promises and preserving 52 commitments from the deleted 2024 platform. Liftable copy, downloadable share cards, primary-source citations.',
  alternates: { canonical: `${siteUrl}/press` },
  openGraph: {
    title: 'SEALED — press kit',
    description:
      '145 Trump promises, graded. 52 preserved from a deleted platform. Liftable copy, share cards, citations.',
    url: `${siteUrl}/press`,
  },
}

type SampleCard = {
  filename: string
  caption: string
  verdict: 'KEPT' | 'PARTIAL' | 'BROKEN' | 'IN PROGRESS'
  receipt: string
}

const sampleCards: SampleCard[] = [
  {
    filename: 'share-01-aipac-iran-deal.png',
    caption: 'AIPAC speech (Mar 2016): kill the Iran deal.',
    verdict: 'BROKEN',
    receipt: '$4B donor receipt traced in Chapter 7.',
  },
  {
    filename: 'share-07-mexico-pays-for-wall.png',
    caption: '“Mexico will pay for the wall.”',
    verdict: 'BROKEN',
    receipt: 'Mexico did not pay. US appropriations only.',
  },
  {
    filename: 'share-11-platform-deportation.png',
    caption: '2024 platform: largest deportation operation in US history.',
    verdict: 'IN PROGRESS',
    receipt: 'Executive Order 14159, cited in Chapter 10.',
  },
]

function verdictBadgeClass(v: SampleCard['verdict']) {
  switch (v) {
    case 'KEPT':
      return 'bg-verdict-kept-soft text-verdict-kept ring-1 ring-verdict-kept/30'
    case 'PARTIAL':
      return 'bg-verdict-partial-soft text-verdict-partial ring-1 ring-verdict-partial/30'
    case 'BROKEN':
      return 'bg-verdict-broken-soft text-verdict-broken ring-1 ring-verdict-broken/40'
    case 'IN PROGRESS':
      return 'bg-verdict-reader-soft text-verdict-reader ring-1 ring-verdict-reader/30'
  }
}

const waybackProofUrls = [
  'web.archive.org/web/2024*/donaldjtrump.com/issues/trade',
  'web.archive.org/web/2024*/donaldjtrump.com/issues/immigration',
  'web.archive.org/web/2024*/donaldjtrump.com/platform',
]

export default function PressPage() {
  return (
    <main className="bg-parchment-100 min-h-screen text-ink-900">
      {/* Top bar */}
      <div className="border-b border-ink-900/10 bg-parchment-200">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-xs font-semibold uppercase tracking-[0.28em] text-civic-blue"
          >
            ← SEALED2016.COM
          </Link>
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-ink-500">
            Press kit · v1 · {lastUpdated}
          </span>
        </div>
      </div>

      {/* 1. Hero — what the book IS */}
      <section className="border-b border-ink-900/10">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20 grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="sealed-eyebrow text-civic-red">Press kit · for journalists &amp; hosts</p>
            <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-ink-900">
              SEALED: 145 Trump promises, graded. 52 preserved from a deleted platform.
            </h1>
            <p className="mt-6 font-serif text-lg sm:text-xl leading-relaxed text-ink-700">
              A 144-page book by Peter Oliver. Every verdict cites a primary source. Every
              preserved 2024 commitment links to its original donaldjtrump.com URL via the Internet
              Archive.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-ink-900/10 bg-white px-5 py-4 shadow-civic-card">
                <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
                  Verdict tally · 145 promises
                </p>
                <p className="mt-2 font-mono text-sm font-semibold tracking-[0.08em] text-ink-900">
                  46 KEPT · 51 PARTIAL · 40 BROKEN · 8 READER-DECIDES
                </p>
              </div>
              <div className="rounded-md border border-ink-900/10 bg-white px-5 py-4 shadow-civic-card">
                <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
                  Primary-source coverage
                </p>
                <p className="mt-2 font-mono text-sm font-semibold tracking-[0.08em] text-ink-900">
                  81 of 145 promises link to a primary source
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#review-copy"
                className="inline-block bg-civic-blue text-parchment-50 font-semibold px-5 py-2.5 rounded-md hover:bg-civic-blue-dark transition"
              >
                Request review copy
              </a>
              <a
                href={`mailto:${pressEmail}`}
                className="inline-block border border-ink-900/20 bg-parchment-50 text-ink-900 font-semibold px-5 py-2.5 rounded-md hover:bg-parchment-200 transition"
              >
                {pressEmail}
              </a>
            </div>
          </div>
          <div className="justify-self-center lg:justify-self-end">
            <Image
              src="/sealed-cover-hero.png"
              alt="SEALED book cover"
              width={480}
              height={720}
              priority
              className="rounded-md border border-ink-900/10 shadow-civic-card w-full max-w-[360px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* 2. The story */}
      <section className="border-b border-ink-900/10 bg-parchment-50">
        <div className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
          <p className="sealed-eyebrow text-civic-blue">The story · liftable copy</p>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Three paragraphs you can lift verbatim or paraphrase.
          </h2>
          <p className="mt-3 text-sm text-ink-600">
            Civic-publication register. Each paragraph is ~80–120 words. Use freely; attribution
            appreciated but not required.
          </p>

          <article className="mt-10 space-y-10">
            <div>
              <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-red">
                Paragraph 1 · what happened to the 2024 platform
              </p>
              <p className="mt-3 font-serif text-lg leading-relaxed text-ink-800">
                In January 2025, donaldjtrump.com removed its policy platform. The 17 issue pages,
                the Agenda47 program, and the full RNC 2024 platform vanished — the URLs now
                redirect to a donate-only shell. Before they went dark, the Internet Archive
                captured them. SEALED preserved every word: 52 specific commitments with their
                original Wayback URLs, dated capture timestamps, and the issue category.
              </p>
            </div>

            <div>
              <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-red">
                Paragraph 2 · what&rsquo;s in the SEALED book
              </p>
              <p className="mt-3 font-serif text-lg leading-relaxed text-ink-800">
                Beyond preservation, the book grades all 145 of Donald Trump&rsquo;s 2016 campaign
                promises against the 2017–2021 first term. Each verdict — KEPT, PARTIAL, BROKEN, or
                READER-DECIDES — sits next to the verbatim promise, the date it was made, and a
                paper trail in primary sources. 81 of 145 promises link directly to a primary-source
                URL (executive orders, agency reports, federal-register filings); the remaining 64
                cite two contemporaneous independent reports. The AIPAC chapter alone documents
                three commitments graded BROKEN against three donor-traceable receipts.
              </p>
            </div>

            <div>
              <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-red">
                Paragraph 3 · what the verdicts show
              </p>
              <p className="mt-3 font-serif text-lg leading-relaxed text-ink-800">
                Of 145 promises: 46 KEPT, 51 PARTIAL, 40 BROKEN, 8 READER-DECIDES. The 8
                READER-DECIDES verdicts are the load-bearing innovation: when the evidence
                genuinely splits, the book publishes the receipts and lets the reader decide. Of
                the 52 preserved 2024 commitments, 7 are already KEPT (Day-1 EOs: J6 pardons, WHO
                withdrawal, Paris exit, DEI rollback), 20 are IN PROGRESS with verified
                executive-order citations, and 25 are PENDING. The book asks readers to grade the
                second term in real time at CampaignReceipts.com/trump.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* 3. The receipts — 3 sample cards */}
      <section className="border-b border-ink-900/10">
        <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20">
          <p className="sealed-eyebrow text-civic-red">The receipts · sample cards</p>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Three verdicts. Download and publish.
          </h2>
          <p className="mt-3 max-w-2xl font-serif text-base text-ink-700">
            1080×1920 vertical PNGs. CC0 — no permission, no attribution required. The full
            12-card creator pack lives at{' '}
            <Link href="/share" className="text-civic-blue underline underline-offset-2">/share</Link>.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {sampleCards.map((c) => {
              const href = `/share-cards/v1/${c.filename}`
              return (
                <figure
                  key={c.filename}
                  className="overflow-hidden rounded-md border border-ink-900/10 bg-white shadow-civic-card flex flex-col"
                >
                  <a href={href} download className="block">
                    <Image
                      src={href}
                      alt={`SEALED verdict card: ${c.caption}`}
                      width={1080}
                      height={1920}
                      className="block h-auto w-full"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </a>
                  <figcaption className="p-4 border-t border-ink-900/10 flex flex-col gap-2 flex-1">
                    <span
                      className={`self-start px-2 py-0.5 rounded font-mono text-[0.55rem] font-semibold uppercase tracking-[0.14em] ${verdictBadgeClass(c.verdict)}`}
                    >
                      {c.verdict}
                    </span>
                    <p className="font-serif text-sm leading-snug text-ink-800">{c.caption}</p>
                    <p className="font-mono text-[0.65rem] leading-snug text-ink-500">{c.receipt}</p>
                    <a
                      href={href}
                      download
                      className="mt-auto inline-block bg-civic-blue text-parchment-50 text-center font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] px-3 py-2 rounded hover:bg-civic-blue-dark transition"
                    >
                      Download 1080×1920 PNG ↓
                    </a>
                  </figcaption>
                </figure>
              )
            })}
          </div>

          <p className="mt-8 font-serif text-sm text-ink-600">
            Nine more cards (AIPAC embassy, campus shield, drain the swamp, China tariffs, repeal
            Obamacare, Syria, NATO, Chicago guns, WHO withdrawal) at{' '}
            <Link href="/share" className="text-civic-blue underline underline-offset-2">
              /share
            </Link>
            .
          </p>
        </div>
      </section>

      {/* 4. Media contact */}
      <section className="border-b border-ink-900/10 bg-parchment-50">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <p className="sealed-eyebrow text-civic-blue">Media contact</p>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            One inbox. A human reads it.
          </h2>

          <dl className="mt-8 space-y-6">
            <div>
              <dt className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-red">
                Press inquiries
              </dt>
              <dd className="mt-2 font-serif text-lg text-ink-800">
                <a
                  href={`mailto:${pressEmail}`}
                  className="text-civic-blue font-medium underline underline-offset-4 hover:no-underline"
                >
                  {pressEmail}
                </a>
              </dd>
              <dd className="mt-1 text-sm text-ink-600">
                Include outlet and intended angle. Review PDF + methodology answers within 24 hours.
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-red">
                Author
              </dt>
              <dd className="mt-2 font-serif text-lg text-ink-800">Peter Oliver</dd>
              <dd className="mt-1 text-sm text-ink-600">
                Peter Oliver is a pseudonym used by the author of SEALED. The book&rsquo;s methodology
                page lists every primary source URL and grading rule; the citation archive at
                CampaignReceipts.com is independently browsable.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 5. Downloads */}
      <section className="border-b border-ink-900/10">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <p className="sealed-eyebrow text-civic-blue">Quick-look downloads</p>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            The press essentials.
          </h2>

          <ul className="mt-8 divide-y divide-ink-900/10 border-y border-ink-900/10">
            <li className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-base text-ink-900">Press release PDF</p>
                <p className="text-sm text-ink-500">
                  Generated on request — email{' '}
                  <a href={`mailto:${pressEmail}`} className="text-civic-blue underline">
                    {pressEmail}
                  </a>{' '}
                  or use the form below.
                </p>
              </div>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-400">
                on request
              </span>
            </li>
            <li className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-base text-ink-900">Full 12-card creator pack</p>
                <p className="text-sm text-ink-500">CC0 — 1080×1920 PNGs.</p>
              </div>
              <Link href="/share" className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-civic-red hover:underline">
                /share →
              </Link>
            </li>
            <li className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-base text-ink-900">Book cover (high-res)</p>
                <p className="text-sm text-ink-500">For print and editorial use.</p>
              </div>
              <a
                href="/sealed-cover-hero.png"
                download
                className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-civic-red hover:underline"
              >
                Download ↓
              </a>
            </li>
            <li className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-base text-ink-900">Author headshot</p>
                <p className="text-sm text-ink-500">
                  Available on request — Peter Oliver writes under a pseudonym.
                </p>
              </div>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-400">
                on request
              </span>
            </li>
            <li className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-base text-ink-900">Free archive landing</p>
                <p className="text-sm text-ink-500">Preserved 2024 platform pages.</p>
              </div>
              <a
                href="https://campaignreceipts.com/2024-trump-campaign-promises"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-civic-red hover:underline"
              >
                Open ↗
              </a>
            </li>
            <li className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-base text-ink-900">Citation archive</p>
                <p className="text-sm text-ink-500">Per-promise dashboard, independently browsable.</p>
              </div>
              <a
                href="https://campaignreceipts.com/trump"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-civic-red hover:underline"
              >
                Open ↗
              </a>
            </li>
            <li className="py-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="font-serif text-base text-ink-900">Methodology</p>
                <p className="text-sm text-ink-500">Grading rules and source standards.</p>
              </div>
              <a
                href="https://campaignreceipts.com/methodology"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-civic-red hover:underline"
              >
                Open ↗
              </a>
            </li>
          </ul>
        </div>
      </section>

      {/* 6. Review-copy request */}
      <section id="review-copy" className="border-b border-ink-900/10 bg-parchment-200">
        <div className="mx-auto max-w-2xl px-6 py-14 lg:py-20">
          <p className="sealed-eyebrow text-civic-red">The pitch · review copy</p>
          <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-bold text-ink-900">
            Request a review PDF.
          </h2>
          <p className="mt-3 font-serif text-base text-ink-700">
            Two fields. Submit and a human follows up within 24 hours with the full PDF and any
            methodology answers you need.
          </p>

          <div className="mt-8">
            <ReviewRequestForm />
          </div>
        </div>
      </section>

      {/* 7. Citation-friendly footer */}
      <section className="bg-parchment-100">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <p className="sealed-eyebrow text-civic-blue">Cite this work</p>
          <div className="mt-4 rounded-md border border-ink-900/15 bg-white px-5 py-4 shadow-civic-card">
            <p className="font-mono text-xs leading-relaxed text-ink-800">
              Oliver, P. (2026). <em>SEALED: The 2016 Promises — Before the Deals.</em> SEALED Press.{' '}
              <a
                href="https://sealed2016.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-civic-blue underline underline-offset-2"
              >
                https://sealed2016.com
              </a>
            </p>
          </div>

          <div className="mt-10">
            <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
              As preserved at
            </p>
            <ul className="mt-2 space-y-1 font-mono text-[0.7rem] leading-relaxed text-ink-600">
              {waybackProofUrls.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-500">
            <a
              href="https://sealed2016.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-civic-blue hover:underline"
            >
              SEALED2016.COM
            </a>
            <span aria-hidden className="text-[0.5rem] text-civic-gold">◆</span>
            <a
              href="https://campaignreceipts.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-civic-blue hover:underline"
            >
              CAMPAIGNRECEIPTS.COM
            </a>
            <span aria-hidden className="text-[0.5rem] text-civic-gold">◆</span>
            <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.24em]">
              Last updated {lastUpdated}
            </span>
          </div>

          <p className="mt-8 text-sm text-ink-500">
            <Link href="/" className="underline underline-offset-2 hover:text-civic-blue">Home</Link>
            {' · '}
            <Link href="/share" className="underline underline-offset-2 hover:text-civic-blue">/share</Link>
            {' · '}
            <Link href="/contact" className="underline underline-offset-2 hover:text-civic-blue">/contact</Link>
          </p>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
