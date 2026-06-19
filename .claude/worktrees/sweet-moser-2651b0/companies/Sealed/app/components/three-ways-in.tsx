/**
 * "Three ways in" — landing section (post 2026-05-25 v3 pass).
 *
 * Anatomy (2026-05-25 reshape per founder direction):
 *   1. Embedded 30-sec hook film (free, press object).
 *   2. Paperback card — $25 drop-shipped from Lulu, includes the digital
 *      bundle (PDF + ePub).
 *   3. 2024 Deleted Promises card — $5 PDF, coming soon. Stepping-stone
 *      product. Teases the three verbatim 2024 platform promises that
 *      were pulled from donaldjtrump.com on Jan 20 2025 and then
 *      contradicted by 2025 actions (Iran strikes, inflation).
 *   4. Footnote: AI-illustrations disclosure.
 *
 * REMOVED 2026-05-25:
 *   - The book ($15 PDF) card — PDF SKU removed from landing per founder
 *     direction; the book exists as bundle inside the paperback only.
 *   - The dashboard (free CR.com) card — surfaced as a header link only
 *     to keep landing tightly focused on the paid funnel.
 *
 * Per-card guardrails enforced:
 *   - 2024 Deleted card: no live LS URL until founder approves the PDF
 *     artifact + creates the LS variant. CTA shows "Notify me" until then.
 */

import { paperbackCheckoutUrl } from '@/lib/checkout-urls'

interface ThreeWaysInProps {
  buyHref: string
  // Kept optional for backward-compat with the page wiring; unused after
  // the 2026-05-16 dashboard-goes-free / bundle-killed reshape.
  dashboardHref?: string
  bundleHref?: string
  siteUrl: string
}

export function ThreeWaysIn(_props: ThreeWaysInProps) {
  // 2026-05-25: buyHref / dashboardHref / bundleHref / siteUrl props all
  // accepted for backward compat but unused. The Book ($15) and Dashboard
  // (free) cards were removed in the v3 reshape. The hook video + two
  // buy cards (paperback + 2024 Deleted Promises) are what's left.

  return (
    <section
      id="three-ways-in"
      className="border-b border-ink-900/10 bg-parchment-100"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <p className="text-center sealed-eyebrow">Watch · then buy</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-center sealed-headline text-3xl sm:text-4xl lg:text-5xl">
          The 30-second hook. Then the receipts.
        </h2>

        {/* Embedded hook film — the press object lives at the top. */}
        <figure className="mx-auto mt-12 max-w-3xl">
          <div className="overflow-hidden rounded-sm border border-ink-900/15 bg-parchment-50 p-3 shadow-civic-card">
            <div className="overflow-hidden rounded-[2px] border border-ink-900/10 bg-ink-900">
              <video
                controls
                preload="metadata"
                poster="/movie/sealed-hook-v5-poster.jpg"
                className="h-auto w-full"
                aria-label="SEALED — 30-second cinematic hook"
              >
                <source src="/movie/sealed-hook-v5.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
          <figcaption className="mt-3 text-center font-mono text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
            30-second cinematic hook · free · embeddable
          </figcaption>
        </figure>

        {/* Gold rule between hook and buy cards — Trump-symbolism accent. */}
        <div aria-hidden className="mx-auto mt-10 gold-rule h-px w-40" />

        {/* TWO buy cards stacked: Paperback ($25) + 2024 Deleted Promises ($5 PDF, coming soon). */}
        <div className="mt-10 grid gap-7 lg:grid-cols-2">
          {/* ─── CARD 1: Paperback — $25, live Buy button via Lulu ─── */}
          <article className="relative overflow-hidden rounded-md border border-ink-900/15 bg-parchment-50 p-7 shadow-civic-card">
            <div
              className="absolute right-4 top-4 rotate-[4deg] rounded-sm border-2 border-civic-red/70 px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-civic-red"
              aria-hidden
            >
              The book
            </div>
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
              Ships from Lulu · 1–2 weeks
            </p>
            <h3 className="mt-3 font-serif text-2xl font-bold leading-tight text-ink-900">
              The paperback &mdash; $25
            </h3>
            <p className="mt-3 font-serif text-base italic leading-relaxed text-ink-700">
              6&times;9 trade paperback, 112 pages. 14 original illustrations. Includes the
              watermarked PDF + ePub the day you order &mdash; you don&rsquo;t wait to start reading.
            </p>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-ink-700">
              <li>· 145 promises tracked</li>
              <li>· 46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES</li>
              <li>· Verbatim quotes · dates · primary sources</li>
              <li>· PDF + ePub bundled the day you order</li>
              <li>· Mail to Express shipping at checkout</li>
            </ul>
            <p className="mt-5 font-serif text-sm italic text-ink-700">
              No spin. No party. Just the record.
            </p>

            <div className="mt-7 flex items-end justify-between gap-3 border-t border-ink-900/10 pt-5">
              <div>
                <p className="font-sans text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
                  Price
                </p>
                <p className="font-serif text-3xl font-bold leading-none text-civic-red">$25</p>
              </div>
              <a
                href={paperbackCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sealed-btn-primary px-5 py-3 text-sm"
                data-source="three-ways-in"
                data-product="paperback"
              >
                Buy paperback
              </a>
            </div>
          </article>

          {/* ─── CARD 2: 2024 Deleted Promises — $5 PDF, COMING SOON ─── */}
          <article className="relative overflow-hidden rounded-md border-2 border-civic-gold/60 bg-parchment-50 p-7 shadow-civic-card">
            <div
              className="absolute right-4 top-4 rotate-[-4deg] rounded-sm border-2 border-civic-gold/80 bg-civic-gold/[0.08] px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-civic-gold"
              aria-hidden
            >
              Coming soon
            </div>
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
              The companion PDF
            </p>
            <h3 className="mt-3 font-serif text-2xl font-bold leading-tight text-ink-900">
              2024 Deleted Promises &mdash; $5
            </h3>
            <p className="mt-3 font-serif text-base italic leading-relaxed text-ink-700">
              The 2024 platform pages pulled from donaldjtrump.com on Jan&nbsp;20, 2025
              &mdash; preserved on the Wayback Machine, contradicted within months.
            </p>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-ink-700">
              <li className="font-semibold text-ink-900">4 verbatim promises &mdash; receipts on each:</li>
              <li>· &ldquo;Prevent world war three, restore peace in the middle east.&rdquo;</li>
              <li>· &ldquo;Keep America out of unnecessary foreign wars.&rdquo;</li>
              <li>· &ldquo;End inflation, and make America affordable again.&rdquo;</li>
              <li>· &ldquo;End the weaponization of government against the american people.&rdquo;</li>
              <li>· Plus the full 52-promise platform list + Wayback URL appendix.</li>
            </ul>
            <p className="mt-5 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-civic-blue">
              Same method as the 2016 book · readable in 30 minutes
            </p>

            <div className="mt-7 flex items-end justify-between gap-3 border-t border-civic-gold/30 pt-5">
              <div>
                <p className="font-sans text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
                  Price
                </p>
                <p className="font-serif text-3xl font-bold leading-none text-civic-gold">$5</p>
              </div>
              <a
                href="#notify"
                className="sealed-btn-notify px-5 py-3 text-sm"
                data-source="three-ways-in"
                data-product="2024-deleted"
              >
                Notify me at launch
              </a>
            </div>
          </article>
        </div>

        {/* Footnote — pre-empts the AI-slop attack flagged by the journalist persona. */}
        <p className="mx-auto mt-10 max-w-3xl text-center font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-500">
          Illustrations are AI-rendered. Every quote, date, verdict, and source URL is human-verified
          against the SEALED citation chain.
        </p>
      </div>
    </section>
  )
}
