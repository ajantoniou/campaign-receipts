import Image from 'next/image'
import Link from 'next/link'
import { siteUrl } from '@/lib/site-url'
import {
  readerPromise,
  heroSubhead,
  heroTitle,
  heroVerdictStamp,
  heroPortraits,
  sampleReceipt,
  shareItContent,
  chapterTeaserPrimary,
  chapterTeaserRemaining,
} from '@/lib/landing-content'
import { getStoreCtaMode } from '@/lib/store-status'
import {
  paperbackCheckoutUrl,
  deletedPromises2024CheckoutUrl,
} from '@/lib/checkout-urls'
import { getWaitlistCount } from '@/lib/waitlist-count'
import { EmailForm } from './email-form'
import { FreeIllustrationsSection } from './components/free-illustrations'
import { VerdictScorecard } from './components/verdict-scorecard'
import { TrustStrip } from './components/trust-strip'
import { FloatingShare } from './components/floating-share'
import { ThreeWaysIn } from './components/three-ways-in'
import { SiteFooter } from '@/components/SiteFooter'

/** Waitlist totals must refresh per-request (avoid baking count at build). */
export const dynamic = 'force-dynamic'

/** Small verdict pill — civic palette, muted soft fill + ink-coloured label. */
function VerdictBadge({
  kind,
}: {
  kind:
    | 'KEPT'
    | 'PARTIAL'
    | 'BROKEN'
    | 'BLOCKED'
    | 'YOU DECIDE'
    | 'DELIVERED'
    | 'OUTCOMES PENDING'
}) {
  const styles: Record<string, string> = {
    KEPT: 'bg-verdict-kept-soft text-verdict-kept ring-1 ring-verdict-kept/30',
    DELIVERED: 'bg-verdict-kept-soft text-verdict-kept ring-1 ring-verdict-kept/30',
    PARTIAL: 'bg-verdict-partial-soft text-verdict-partial ring-1 ring-verdict-partial/30',
    BROKEN: 'bg-verdict-broken-soft text-verdict-broken ring-1 ring-verdict-broken/40',
    BLOCKED: 'bg-verdict-blocked-soft text-verdict-blocked ring-1 ring-verdict-blocked/30',
    'YOU DECIDE': 'bg-verdict-reader-soft text-verdict-reader ring-1 ring-verdict-reader/30',
    'OUTCOMES PENDING': 'bg-ink-900/[0.06] text-ink-700 ring-1 ring-ink-700/30',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-sm px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] ${styles[kind]}`}
    >
      {kind}
    </span>
  )
}

export default async function SealedPage() {
  const ctaMode = getStoreCtaMode()
  const checkoutLive = ctaMode === 'buy'
  const waitlistCount = checkoutLive ? null : await getWaitlistCount()
  const shareClaimHook =
    "Memory loses. Receipts don't. 145 verbatim 2016 campaign promises — graded 46 kept · 51 partial · 40 broken · 8 reader-decides against the public record."
  const shareText = encodeURIComponent(shareClaimHook)
  const shareUrl = encodeURIComponent(siteUrl)
  // 2026-05-25 founder lock: the standalone digital-book SKU stays off the
  // landing page. Hero CTA = paperback ($25, Lemon Squeezy checkout). The
  // $5 "2024 Deleted Promises" companion PDF went live in LS 2026-06-11 and
  // is linked below the paperback CTA as a stepping-stone offer.
  const buyHref = paperbackCheckoutUrl
  const buyLabel = 'Buy paperback — $25'

  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900">
      <a href="#three-ways-in" className="skip-link">
        Skip to content
      </a>

      {/* ──────────────────────────────────────────────────────────────
         HEADER — quiet brand left, civic-red CTA right, gold hairline
         ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-ink-900/10 bg-parchment-100/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-serif text-xl font-bold tracking-[0.18em] text-ink-900">
            SEALED
          </Link>
          {checkoutLive ? (
            <a
              href={buyHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-civic-red px-5 py-2 text-sm font-semibold text-parchment-50 shadow-sm transition hover:bg-civic-red-dark"
              data-source="header"
              data-product="paperback"
            >
              Buy paperback — $25
            </a>
          ) : (
            <a
              href="#notify"
              className="rounded-md border border-civic-blue/60 px-5 py-2 text-sm font-semibold text-civic-blue transition hover:border-civic-blue hover:bg-civic-blue/[0.06]"
            >
              Get notified
            </a>
          )}
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════════════════
         HERO — book cover lockup on the left, headline + CTA stack on
         the right. The 4-portrait museum-wall composition is demoted
         to a secondary lockup below the primary CTA.
         Reshape (2026-05-17, per founder): "Book cover looks amazing.
         Use it on the landing page please." Cover image is rendered
         via scripts/build-cover-hero.mjs to public/sealed-cover-hero.png.
         ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-ink-900/10 bg-parchment-100">
        <div className="mx-auto max-w-6xl px-6 py-10 lg:py-18">
          {/* Gold hairline — Trump-symbolism accent per founder direction. */}
          <div aria-hidden className="mx-auto mb-6 gold-rule h-px w-40" />
          {/* Eyebrow — a whisper, not a banner. */}
          <p className="text-center sealed-eyebrow">
            An astonishing decade · One archive
          </p>

          {/* Top hero lockup — book cover on left (desktop), headline +
              CTA on right. Stacks on mobile (cover top, text below). */}
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:gap-14">
            {/* Book cover — single image, 3D book shadow + tilt */}
            <div className="flex justify-center lg:justify-start">
              <div className="sealed-book-cover">
                <Image
                  src="/sealed-cover-hero.png"
                  alt="SEALED — The 2016 Promises, Before the Deals. Book cover."
                  width={800}
                  height={1200}
                  className="block h-auto w-[280px] sm:w-[340px] lg:w-[460px]"
                  sizes="(max-width: 640px) 280px, (max-width: 1024px) 340px, 460px"
                  priority
                />
              </div>
            </div>

            {/* Right column — headline + scorecard chip + CTAs. The full
                scorecard panel + trust strip still live below for full
                proof; this is the above-the-fold lockup. */}
            <div>
              <h1 className="whitespace-pre-line text-center sealed-headline text-3xl sm:text-4xl lg:text-5xl lg:text-left">
                {heroTitle}
              </h1>
              <p className="mt-7 text-center font-mono text-[0.82rem] sm:text-[0.9rem] font-semibold leading-relaxed text-civic-red lg:text-left">
                {heroVerdictStamp}
              </p>
              <p className="mt-6 text-center font-serif text-lg leading-relaxed text-ink-700 sm:text-xl lg:text-left">
                {heroSubhead}
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 lg:items-start">
                {checkoutLive ? (
                  <a
                    href={buyHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sealed-btn-primary w-full max-w-sm px-8 py-4 text-base sm:w-auto sm:min-w-[260px]"
                    data-source="hero-cover"
                    data-product="paperback"
                  >
                    {buyLabel}
                  </a>
                ) : (
                  <a
                    href="#notify"
                    className="sealed-btn-notify w-full max-w-sm px-8 py-4 text-base sm:w-auto sm:min-w-[260px]"
                  >
                    Get the launch link
                  </a>
                )}
                {/* $5 "2024 Deleted Promises" stepping-stone PDF — live in
                    Lemon Squeezy since 2026-06-11. Four verbatim 2024
                    platform promises that were pulled from donaldjtrump.com
                    on Jan 20 2025 and then contradicted by 2025 actions. */}
                <p className="mt-2 max-w-md text-center text-xs leading-relaxed text-ink-600 lg:text-left">
                  Just $5 &mdash;{' '}
                  <a
                    href={deletedPromises2024CheckoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-civic-blue underline underline-offset-2 hover:no-underline"
                    data-source="hero-tease"
                    data-product="2024-deleted"
                  >
                    2024 Deleted Promises (PDF)
                  </a>
                  . Four promises he deleted from donaldjtrump.com on Jan&nbsp;20, 2025.
                  &ldquo;Prevent world war three.&rdquo;
                  &ldquo;Keep America out of unnecessary foreign wars.&rdquo;
                  &ldquo;End inflation.&rdquo;
                  &ldquo;End the weaponization of government.&rdquo;
                  Receipts on each.
                </p>
              </div>
            </div>
          </div>

          {/* Wordmark footer — between hero lockup and supporting proof. */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-civic-blue">
              SEALED2016.COM
            </span>
            <span aria-hidden className="text-[0.5rem] text-civic-gold">◆</span>
            <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-ink-500">
              Receipts at campaignreceipts.com
            </span>
          </div>

          {/* Four faces — demoted from hero lead to supporting "decade in
              four faces" rail. Smaller, captioned. */}
          <div className="mt-10">
            <p className="text-center font-sans text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
              The decade, in four faces
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {heroPortraits.map((p) => (
                <figure key={p.year} className="text-center">
                  <div className="overflow-hidden rounded-sm border border-ink-900/15 bg-parchment-50 p-1.5 shadow-civic-card">
                    <div className="overflow-hidden rounded-[2px] border border-ink-900/10">
                      <Image
                        src={p.src}
                        alt={`${p.year} — ${p.caption}`}
                        width={500}
                        height={700}
                        className="h-auto w-full"
                        sizes="(max-width: 640px) 45vw, 22vw"
                      />
                    </div>
                  </div>
                  <figcaption className="mt-3">
                    <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
                      {p.year}
                    </p>
                    <p className="mt-1 text-[0.7rem] leading-snug text-ink-600">{p.caption}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>

          {/* Reader promise — supporting line under the four faces. */}
          <p className="mx-auto mt-10 max-w-2xl text-center text-base leading-relaxed text-ink-600">
            {readerPromise}
          </p>

          {/* Verdict scorecard — credibility-by-specificity proof */}
          <div className="mt-12">
            <VerdictScorecard />
          </div>

          {/* Trust strip — seal-of-record */}
          <TrustStrip />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
         NEIGHBOR FENCE — visual-first promise.
         Promoted up the page (was section 7). Single one-line caption.
         Secondary "Buy paperback" button after. The original prose "Why
         this book exists" section was killed in this reshape.
         ══════════════════════════════════════════════════════════════ */}
      <section id="why" className="border-b border-ink-900/10 bg-parchment-200">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-18">
          <p className="text-center sealed-eyebrow">{shareItContent.eyebrow}</p>
          <h2 className="mx-auto mt-5 max-w-3xl text-center sealed-headline text-3xl sm:text-4xl lg:text-5xl">
            {shareItContent.title}
          </h2>

          <figure className="mx-auto mt-12 max-w-xl">
            <div className="overflow-hidden rounded-sm border border-ink-900/15 bg-parchment-50 p-3 shadow-civic-card">
              <div className="overflow-hidden rounded-[2px] border border-ink-900/10">
                <Image
                  src={shareItContent.imageSrc}
                  alt={shareItContent.imageAlt}
                  width={896}
                  height={1280}
                  className="h-auto w-full"
                  sizes="(max-width: 640px) 90vw, 36rem"
                />
              </div>
            </div>
          </figure>

          {/* Single one-line caption — the new tagline. */}
          <p className="mx-auto mt-10 max-w-2xl text-center font-serif text-xl leading-relaxed text-ink-800 sm:text-2xl">
            {shareItContent.tagline}
          </p>

          {/* Quieter sub-line — kept for continuity with the original
              blank-column promise, but no longer the lead tagline. */}
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-ink-600">
            {shareItContent.subTagline}
          </p>

          {/* Secondary Buy button — outlined navy, not the load-bearing red. */}
          <div className="mt-10 flex justify-center">
            {checkoutLive ? (
              <a
                href={buyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="sealed-btn-secondary px-8 py-3 text-base"
                data-source="after-neighbor"
                data-product="paperback"
              >
                {buyLabel}
              </a>
            ) : (
              <a href="#notify" className="sealed-btn-notify px-8 py-3 text-base">
                Get the launch link
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
         THREE RECEIPTS — show, don't tell.
         2026-05-25 reshape: was 1-default + 2-in-<details>, now a
         horizontal snap-scroll carousel of all 3 receipts inline.
         All 3 are AIPAC-trail receipts (Iran deal, Embassy/Gaza, EO 13899).
         Founder direction: convert the proof section to a carousel so the
         viewer SEES three named broken promises without clicking expand.
         ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-ink-900/10 bg-parchment-100">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-20">
          <p className="sealed-eyebrow">{sampleReceipt.eyebrow}</p>
          <h2 className="mt-5 whitespace-pre-line sealed-headline text-3xl sm:text-4xl">
            {sampleReceipt.title}
          </h2>
          <p className="mt-6 font-serif text-lg leading-relaxed text-ink-700">{sampleReceipt.context}</p>

          {/* Carousel: horizontal snap-scroll on mobile, full-width grid on
              desktop. Each card retains its tilt for the "ink stamp" feel. */}
          <div className="mt-12 -mx-6 lg:mx-0">
            <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-6 lg:grid lg:grid-cols-3 lg:gap-7 lg:overflow-visible lg:px-0 lg:pb-0">
              {sampleReceipt.promises.map((p, i) => (
                <div
                  key={i}
                  className="min-w-[88%] shrink-0 snap-center sm:min-w-[70%] lg:min-w-0 lg:shrink"
                >
                  <ReceiptCard
                    promise={p}
                    tilt={i === 0 ? 'rotate-[-3.5deg]' : i === 1 ? 'rotate-[2deg]' : 'rotate-[-1.5deg]'}
                  />
                </div>
              ))}
            </div>
            {/* Mobile-only scroll hint */}
            <p className="mt-2 px-6 text-center font-mono text-[0.55rem] uppercase tracking-[0.22em] text-ink-500 lg:hidden">
              swipe →
            </p>
          </div>

          <p className="mt-10 text-center font-serif text-base italic leading-relaxed text-ink-700">
            {sampleReceipt.closing}
          </p>
          {/* Gold rule — Trump-symbolism accent between receipts and chapter teaser. */}
          <div aria-hidden className="mx-auto mt-10 gold-rule h-px w-32" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
         CHAPTER TEASER — 3 strongest hooks visible, remaining 7 inside
         a <details> expander. Chapter 10 (the deleted 2024 platform) is
         the new hook the headline rewrites around, so it's surfaced
         in the default-visible cards.
         ══════════════════════════════════════════════════════════════ */}
      <section id="chapters" className="border-b border-ink-900/10 bg-parchment-200">
        <div className="mx-auto max-w-5xl px-6 py-10 lg:py-20">
          <p className="sealed-eyebrow">What&rsquo;s in the book</p>
          <h2 className="mt-5 max-w-3xl sealed-headline text-3xl sm:text-4xl">
            Ten chapters. Verbatim quotes. Receipts on every page.
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {chapterTeaserPrimary.map((c) => (
              <ChapterCard key={c.number} chapter={c} />
            ))}
          </div>

          <details className="mt-10 group">
            <summary className="cursor-pointer list-none rounded-md border border-ink-900/20 bg-parchment-50 px-6 py-4 text-center font-serif text-base font-semibold text-ink-900 transition hover:border-civic-blue hover:text-civic-blue">
              <span className="group-open:hidden">Show all 10 chapters ↓</span>
              <span className="hidden group-open:inline">Hide chapters ↑</span>
            </summary>
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {chapterTeaserRemaining.map((c) => (
                <ChapterCard key={c.number} chapter={c} />
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
         TWO WAYS IN — single pricing section (the prior "What You Get"
         tier list was deleted to remove the duplicate SKU job).
         Paperback ($25) · 2024 Deleted Promises ($5 PDF). Hook film
         removed 2026-06-11 — MP4 purged 2026-06-03, no file exists.
         ══════════════════════════════════════════════════════════════ */}
      {/* 2026-05-25: dashboardHref/bundleHref removed from page — the Dashboard
          and standalone digital-book cards inside ThreeWaysIn were deleted.
          Props kept optional on the component for backward compat. */}
      <ThreeWaysIn buyHref={buyHref} siteUrl={siteUrl} />

      {/* NOTIFY (when checkout off) */}
      {!checkoutLive ? (
        <section id="notify" className="border-b border-ink-900/10 bg-parchment-200">
          <div className="mx-auto max-w-2xl px-6 py-12 text-center lg:py-18">
            <h2 className="sealed-headline text-3xl sm:text-4xl">
              {ctaMode === 'sold_out' ? 'Notify me when checkout reopens' : 'Get the launch link'}
            </h2>
            <p className="mt-4 text-base text-ink-600">
              {ctaMode === 'sold_out'
                ? 'One email when the next window opens. No drip.'
                : 'One email when sales go live. No drip.'}
            </p>
            <div className="mt-10">
              <EmailForm />
            </div>
            {typeof waitlistCount === 'number' && waitlistCount > 0 ? (
              <p className="mt-6 text-xs text-ink-500">
                <span className="text-ink-700">{waitlistCount}</span> readers on the list
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* ══════════════════════════════════════════════════════════════
         FINAL CTA — was: FAQ + "still scrolling" close.
         2026-05-25 reshape: FAQ section deleted per founder direction.
         "Questions" framing was the wrong objection-handling vector
         for a $25 impulse-buy book; replaced with a quiet final CTA.
         ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-ink-900/10 bg-parchment-200">
        <div className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
          <div className="flex flex-col items-center gap-4">
            <div aria-hidden className="gold-rule h-px w-24" />
            <p className="text-center font-serif text-xl leading-relaxed text-ink-800 sm:text-2xl">
              Memory loses. Receipts don&rsquo;t.
            </p>
            {checkoutLive ? (
              <a
                href={buyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="sealed-btn-primary mt-4 px-10 py-4 text-base"
                data-source="end-of-page"
                data-product="paperback"
              >
                {buyLabel}
              </a>
            ) : (
              <a href="#notify" className="sealed-btn-notify mt-4 px-10 py-4 text-base">
                Get the launch link
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
         PRESS KIT — free editorial illustrations, demoted from a full
         section to a collapsed <details> panel. Default: closed.
         Journalists / share-asset hunters click to expand.
         ══════════════════════════════════════════════════════════════ */}
      <section className="border-b border-ink-900/10 bg-parchment-100">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <details className="group">
            <summary className="cursor-pointer list-none rounded-md border border-ink-900/15 bg-parchment-50 px-6 py-4 text-center font-serif text-base font-semibold text-ink-800 transition hover:border-civic-blue hover:text-civic-blue">
              <span className="group-open:hidden">Press kit · free share assets ↓</span>
              <span className="hidden group-open:inline">Hide press kit ↑</span>
            </summary>
            <div className="mt-6">
              <FreeIllustrationsSection ctaMode={ctaMode} buyHref={buyHref} siteUrl={siteUrl} />
            </div>
          </details>
        </div>
      </section>

      <SiteFooter shareText={shareText} shareUrl={shareUrl} />

      <FloatingShare url={siteUrl} />
    </main>
  )
}

/** One AIPAC receipt card — promised / delivered / paper trail + magnitude.
 *  Extracted so the storefront can render 1 by default + 2 inside a
 *  <details> expander without duplicating ~50 lines of JSX. */
function ReceiptCard({
  promise: p,
  tilt,
}: {
  promise: (typeof import('@/lib/landing-content').sampleReceipt)['promises'][number]
  tilt: string
}) {
  return (
    <div className="overflow-hidden rounded-md border border-ink-900/15 bg-parchment-50 shadow-civic-card">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
        <div className="bg-verdict-broken-soft/40 p-5 md:p-6">
          <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-red">
            Promised
          </p>
          <p className="mt-2 font-serif text-base leading-snug text-ink-900 sm:text-lg">
            {p.campaignPromise}
          </p>
        </div>
        <div className="hidden md:flex items-center justify-center border-x border-ink-900/10 bg-parchment-100 px-5">
          <div className={tilt}>
            <VerdictBadge kind={p.campaignVerdict as 'BROKEN'} />
          </div>
        </div>
        <div className="bg-civic-blue-soft/40 p-5 md:p-6">
          <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
            Delivered
          </p>
          <p className="mt-2 font-serif text-base font-semibold leading-snug text-ink-900 sm:text-lg">
            {p.aipacAsk}
          </p>
        </div>
      </div>
      <div className="flex justify-center border-t border-ink-900/10 bg-parchment-100 py-2 md:hidden">
        <div className={tilt}>
          <VerdictBadge kind={p.campaignVerdict as 'BROKEN'} />
        </div>
      </div>

      <div className="border-t border-ink-900/15 bg-parchment-50 p-5 md:p-6">
        <div className="grid gap-5 md:grid-cols-[1fr_auto]">
          <div>
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
              Paper trail
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-800 sm:text-base">{p.receipt}</p>
          </div>
          <div className="md:border-l md:border-ink-900/10 md:pl-5 md:min-w-[180px] md:text-right">
            <p className="font-sans text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
              {p.magnitudeLabel}
            </p>
            <p className="mt-2 font-serif text-2xl font-bold leading-none text-civic-red sm:text-3xl">
              {p.magnitudeValue}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Chapter teaser card — used for both the 3 default-visible chapters and
 *  the 7 inside the <details> expander. Highlight=true gets a civic-red
 *  ring + a NEW ribbon (used for chapter 10, the 2024-platform hook). */
function ChapterCard({
  chapter,
}: {
  chapter: import('@/lib/landing-content').ChapterTeaserCard
}) {
  return (
    <article
      className={`relative overflow-hidden rounded-md border bg-parchment-50 p-6 shadow-civic-card ${
        chapter.highlight ? 'border-civic-red/60 ring-1 ring-civic-red/30' : 'border-ink-900/15'
      }`}
    >
      {chapter.highlight ? (
        <div
          className="absolute right-3 top-3 rotate-[6deg] rounded-sm bg-civic-red px-2 py-0.5 font-mono text-[0.55rem] font-bold uppercase tracking-[0.18em] text-parchment-50"
          aria-hidden
        >
          New
        </div>
      ) : null}
      <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
        {chapter.number}
      </p>
      <h3 className="mt-2 font-serif text-xl font-bold leading-tight text-ink-900">
        {chapter.title}
      </h3>
      <div className="mt-3">
        <VerdictBadge kind={chapter.verdict} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-700">{chapter.hook}</p>
    </article>
  )
}
