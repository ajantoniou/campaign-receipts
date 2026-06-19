/**
 * "Three ways in" — landing section (post 2026-05-17 page-height v2 pass).
 *
 * Anatomy:
 *   1. Embedded 30-sec hook film (free, press object).
 *   2. Three cream cards on parchment:
 *        Card A — The film (FREE)        — READER-violet stamp "FREE"
 *        Card B — The book ($15)         — KEPT-green stamp "PDF+EPUB"
 *        Card C — The dashboard (FREE)   — civic-blue stamp "FREE"
 *                  Routes to campaignreceipts.com/trump (no paywall;
 *                  CR-as-funnel for SEALED readers who want the data
 *                  view instead of the long-form book).
 *   3. Footnote: AI-illustrations disclosure.
 *   4. Paperback card — $25 drop-shipped from Lulu, includes the digital
 *      bundle (PDF + ePub). The paperback IS the bundle now; the prior
 *      separate "bundle" callout was removed once film+dashboard both
 *      became free SKUs.
 *
 * Per-card guardrails enforced:
 *   - Film card: never says "documentary". Says "the hook" / "the film" /
 *     "narrated companion film".
 *   - Dashboard card: includes the 82% / 18% sourcing disclosure microcopy.
 *
 * Stamps rotate at distinct angles so the per-card-tilt fix reads as ink,
 * not a CSS utility applied uniformly.
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

export function ThreeWaysIn({ buyHref }: ThreeWaysInProps) {
  // dashboardHref / bundleHref / siteUrl props accepted for backward compat
  // (page still passes them) but unused — dashboard is now a free outbound
  // link to campaignreceipts.com, the standalone bundle was removed, and
  // the duplicate share-the-hook card was killed in the 2026-05-17 page-
  // height v2 pass (FloatingShare widget handles share intents now).

  return (
    <section
      id="three-ways-in"
      className="border-b border-ink-900/10 bg-parchment-100"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <p className="text-center sealed-eyebrow">Three ways in</p>
        <h2 className="mx-auto mt-5 max-w-3xl text-center sealed-headline text-3xl sm:text-4xl lg:text-5xl">
          Watch it free. Read the book. Search the dashboard.
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

        {/* Two cards — book / dashboard. The film card was killed in the
            2026-05-17 page-height v2 pass: the video itself is embedded
            directly above, and FloatingShare handles share intents. */}
        <div className="mt-12 grid gap-7 lg:grid-cols-2">
          {/* ─── CARD B — The book ($15) ─── */}
          <article className="relative overflow-hidden rounded-md border border-ink-900/15 bg-parchment-50 p-7 shadow-civic-card">
            <div
              className="absolute right-4 top-4 rotate-[4deg] rounded-sm border-2 border-verdict-kept/70 px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-verdict-kept"
              aria-hidden
            >
              PDF + EPUB
            </div>
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
              The book
            </p>
            <h3 className="mt-3 font-serif text-2xl font-bold leading-tight text-ink-900">
              Read the full book
            </h3>
            <p className="mt-3 font-serif text-base italic leading-relaxed text-ink-700">
              145 promises · verbatim quotes · receipts · individually licensed PDF + ePub.
            </p>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-ink-700">
              <li>· 145 promises tracked</li>
              <li>· 46 / 51 / 40 / 8 graded against the record</li>
              <li>· PDF + ePub bundled</li>
              <li>· Individually watermarked</li>
              <li>· 116 pages, illustrated</li>
            </ul>

            <div className="mt-7 flex items-end justify-between gap-3 border-t border-ink-900/10 pt-5">
              <div>
                <p className="font-sans text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
                  Price
                </p>
                <p className="font-serif text-3xl font-bold leading-none text-civic-red">$15</p>
              </div>
              <a
                href={buyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="sealed-btn-primary px-5 py-3 text-sm"
              >
                Buy the book
              </a>
            </div>
          </article>

          {/* ─── CARD C — The dashboard (FREE on CampaignReceipts.com) ─── */}
          <article className="relative overflow-hidden rounded-md border border-ink-900/15 bg-parchment-50 p-7 shadow-civic-card">
            <div
              className="absolute right-4 top-4 rotate-[-3.5deg] rounded-sm border-2 border-civic-blue/70 px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-civic-blue"
              aria-hidden
            >
              Free
            </div>
            <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
              Prefer the dashboard?
            </p>
            <h3 className="mt-3 font-serif text-2xl font-bold leading-tight text-ink-900">
              Read it free on CampaignReceipts
            </h3>
            <p className="mt-3 font-serif text-base italic leading-relaxed text-ink-700">
              Don&rsquo;t want the book? Browse every promise &mdash; verbatim quote, verdict,
              primary source &mdash; free at <strong>campaignreceipts.com/trump</strong>.
            </p>
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-ink-700">
              <li>· 46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES</li>
              <li>· Per-promise pages with primary sources</li>
              <li>· &ldquo;Cite this promise&rdquo; one-click share</li>
              <li>· Print-scorecard PDF</li>
            </ul>

            <p className="mt-5 font-mono text-[0.6rem] leading-relaxed text-civic-blue">
              82% of 2016 promises link to a primary source; the remaining 18% link to two
              independent contemporaneous reports.
            </p>

            <div className="mt-7 flex items-end justify-between gap-3 border-t border-ink-900/10 pt-5">
              <div>
                <p className="font-sans text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-ink-500">
                  Price
                </p>
                <p className="font-serif text-3xl font-bold leading-none text-civic-red">
                  Free
                </p>
              </div>
              <a
                href="https://campaignreceipts.com/trump"
                target="_blank"
                rel="noopener noreferrer"
                className="sealed-btn-primary px-5 py-3 text-sm"
              >
                Open dashboard
              </a>
            </div>
          </article>
        </div>

        {/* Footnote — pre-empts the AI-slop attack flagged by the journalist persona. */}
        <p className="mx-auto mt-10 max-w-3xl text-center font-mono text-[0.6rem] uppercase tracking-[0.22em] text-ink-500">
          Illustrations are AI-rendered. Every quote, date, verdict, and source URL is human-verified
          against the SEALED citation chain.
        </p>

        {/* Bundle callout removed 2026-05-16 — with the film + dashboard both
            free, the only paid SKUs are PDF ($15) and paperback ($25, which
            already includes the digital bundle). A "$20 bundle save $5"
            against a $15 PDF was incoherent. The paperback card below IS
            the bundle: physical + digital. */}

        {/* ─── Paperback card — live Buy button, drop-shipped via Lulu ─── */}
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="rounded-md border border-ink-900/15 bg-parchment-200/60 p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-md">
                <p className="sealed-eyebrow-quiet">Ships from Lulu · 1–2 weeks (faster shipping options at checkout)</p>
                <h3 className="mt-2 font-serif text-xl font-semibold text-ink-900">
                  The paperback &mdash; $25
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-700">
                  6&times;9 trade paperback, 112 pages. 14 original illustrations. Drop-shipped
                  from Lulu &mdash; Mail (10&ndash;14 days, ~$5.69 shipping) up to Express (6&ndash;8 days, ~$35.74). Includes the watermarked PDF +
                  ePub the day you order, so you don&rsquo;t wait to start reading.
                </p>
                <p className="mt-3 font-serif text-sm italic text-ink-700">
                  No spin. No party. Just the record.
                </p>
              </div>
              <a
                href={paperbackCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sealed-btn-primary px-6 py-3 text-base"
                data-source="three-ways-in"
                data-product="paperback"
              >
                Buy paperback &mdash; $25
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
