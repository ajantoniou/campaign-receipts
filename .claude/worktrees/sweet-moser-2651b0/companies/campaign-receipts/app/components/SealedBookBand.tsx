// SealedBookBand — paper-warm exit-ramp to sealed2016.com.
//
// Per founder rev-7 (2026-05-18): "we're just pulling traffic. only
// thing we can sell is the sealed 2016 book... no traffic is to
// campaignreceipts and they'll find sealed from there."
//
// Funnel: cold email + SEO + social  ->  CR  ->  SEALED book purchase.
// CR's job is credibility + traffic; SEALED is monetization. Every
// high-traffic CR page needs a clean, visible exit ramp to
// sealed2016.com. This component is that ramp.
//
// Three variants:
//   - 'band'   : full-width paper-2 section with cover thumbnail + 3
//                stats + CTA. Use as a dedicated section near the end
//                of a page.
//   - 'inline' : single-row card. Use mid-page, between other sections.
//   - 'card'   : compact card for sidebars / grid cells.
//
// All three open sealed2016.com in a new tab (rel=noopener) and tag
// the click with utm_source=campaignreceipts&utm_content=<placement>
// so we can attribute SEALED conversions back to the CR page that
// drove them.

import Image from 'next/image'
import { BOOK } from '@/lib/book'

type Variant = 'band' | 'inline' | 'card'

type Props = {
  /** Visual variant. Default 'band'. */
  variant?: Variant
  /** Placement tag for UTM attribution (e.g. 'race-detail', 'article-footer'). */
  placement?: string
  /** Override the headline. Defaults to a paper-warm pitch. */
  headline?: string
  /** Override the body line. Defaults to scorecard tally. */
  body?: string
}

function sealedUrl(placement?: string): string {
  const base = BOOK.url
  if (!placement) return base
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}utm_source=campaignreceipts&utm_medium=referral&utm_content=${encodeURIComponent(placement)}`
}

export default function SealedBookBand({
  variant = 'band',
  placement,
  headline,
  body,
}: Props) {
  const url = sealedUrl(placement)
  // Per panel synthesis 2026-05-19: SEALED is reframed as "the promises
  // Trump made before $250M flowed in." Trump's own words on the White
  // House stage (Dec 16, 2025 Hanukkah reception) are the libel-safe
  // anchor — we're quoting him, not characterizing the donor.
  const defaultHeadline = 'The 145 promises he made before the $250M.'
  const defaultBody = `"Miriam gave my campaign indirectly and directly $250 million." — Donald J. Trump, White House Hanukkah reception, Dec 16, 2025. SEALED is the audit of every campaign promise Trump made BEFORE that money flowed. ${BOOK.totalPromises} promises, graded against primary-source receipts. ${BOOK.pages}pp PDF.`

  if (variant === 'card') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg border border-line bg-paper hover:bg-paper-2 hover:border-ink-3 transition-all p-4 no-underline group"
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-broken mb-2">
          The book · {BOOK.pdfPrice}
        </div>
        <div className="font-display italic text-[18px] leading-[1.15] text-ink m-0 mb-1">
          SEALED — The 2016 Promises
        </div>
        <div className="font-sans text-[12px] text-ink-2 leading-[1.4]">
          {BOOK.totalPromises} receipts · {BOOK.pages}pp PDF · {BOOK.cycle2016.percentageKept}% kept
        </div>
        <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink group-hover:text-broken transition-colors">
          Read the case study →
        </div>
      </a>
    )
  }

  if (variant === 'inline') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg border-2 border-broken/30 bg-paper hover:bg-paper-2 hover:border-broken/60 transition-all p-5 no-underline group"
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="shrink-0 w-[60px] h-[80px] relative rounded border border-line overflow-hidden bg-paper-3">
            <Image
              src={BOOK.covers.cover2016}
              alt="SEALED — The 2016 Promises cover"
              fill
              sizes="60px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-broken mb-1">
              The promises before the $250M · {BOOK.pdfPrice} PDF
            </div>
            <div className="font-display italic text-[20px] leading-[1.15] text-ink m-0 mb-1">
              SEALED — The 2016 Promises
            </div>
            <div className="font-sans text-[13px] text-ink-2 leading-[1.45]">
              All {BOOK.totalPromises} of Trump's 2016 campaign promises,
              graded with paper-trail receipts — written before any
              of the $250M Adelson money flowed.
            </div>
          </div>
          <div className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-ink group-hover:text-broken transition-colors">
            Read → {BOOK.pdfPrice}
          </div>
        </div>
      </a>
    )
  }

  // Default: full 'band' section variant.
  return (
    <section className="bg-paper-2 border-t border-b border-line">
      <div className="section-shell py-12 sm:py-16">
        <div className="max-w-[860px] mx-auto">
          <div className="grid sm:grid-cols-[120px_1fr] gap-6 sm:gap-8 items-start">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-[120px] aspect-[3/4] relative rounded-md border border-line overflow-hidden bg-paper-3 hover:border-ink-3 transition-colors"
            >
              <Image
                src={BOOK.covers.cover2016}
                alt="SEALED — The 2016 Promises cover"
                fill
                sizes="120px"
                className="object-cover"
                unoptimized
              />
            </a>
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">
                The audit before the $250M · CR's editorial founding document
              </div>
              <h2 className="font-display text-[28px] sm:text-[36px] leading-[1.05] tracking-[-0.005em] text-ink m-0 mb-3">
                <em className="font-display italic">{headline || defaultHeadline}</em>
              </h2>
              <p className="font-sans text-[15px] text-ink-2 leading-[1.55] m-0 mb-5 max-w-prose">
                {body || defaultBody}
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-5 py-3 transition-colors border border-ink"
                >
                  Read the case study — {BOOK.pdfPrice} PDF
                  <span aria-hidden>→</span>
                </a>
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  {BOOK.pages}pp · sealed2016.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
