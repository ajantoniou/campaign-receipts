import type { StoreCtaMode } from '@/lib/store-status'
import { sealedCheckoutUrls } from '@/lib/checkout-urls'
import {
  audiencePositioningLine,
  authorAttributionLine,
  editorialContext,
  faqItems,
  heroStatBar,
  methodologySteps,
  productPreviewCards,
  tocPreview,
  verificationPathCards,
  whyBookExists,
  whyReadersBuy,
} from '@/lib/landing-content'
import { DocumentSpreadPreview } from './document-spread-preview'
import { Section } from './Section'

/* ──────────────────────────────────────────────────────────────────────────
 * Editorial glyphs — inline SVG, sized as marks (not AI clip art).
 * Stroke-only, currentColor-driven, mono-line so they pair with
 * font-mono labels.
 * ────────────────────────────────────────────────────────────────────────── */

function MagnifierGlyph({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Magnifying glass over a line of text"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* underlying lines of text being inspected */}
      <line x1="6" y1="44" x2="38" y2="44" opacity="0.45" />
      <line x1="6" y1="50" x2="44" y2="50" opacity="0.55" />
      <line x1="6" y1="56" x2="32" y2="56" opacity="0.4" />
      {/* magnifier */}
      <circle cx="38" cy="26" r="14" />
      <circle cx="38" cy="26" r="9" opacity="0.4" />
      <line x1="48" y1="36" x2="58" y2="46" />
    </svg>
  )
}

function PaperTrailGlyph({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Stack of stamped documents — official paper trail"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* back document */}
      <rect x="14" y="6" width="32" height="40" rx="2" opacity="0.4" />
      {/* mid document */}
      <rect x="10" y="12" width="32" height="40" rx="2" opacity="0.7" />
      {/* front document */}
      <rect x="6" y="18" width="32" height="40" rx="2" />
      {/* lines on front */}
      <line x1="11" y1="26" x2="33" y2="26" opacity="0.6" />
      <line x1="11" y1="32" x2="33" y2="32" opacity="0.6" />
      <line x1="11" y1="38" x2="27" y2="38" opacity="0.6" />
      {/* official stamp / seal */}
      <circle cx="44" cy="46" r="8" />
      <circle cx="44" cy="46" r="5" opacity="0.55" />
      <line x1="40" y1="46" x2="48" y2="46" opacity="0.55" />
      <line x1="44" y1="42" x2="44" y2="50" opacity="0.55" />
    </svg>
  )
}

const editorialGlyphMap = {
  magnifier: MagnifierGlyph,
  'paper-trail': PaperTrailGlyph,
} as const

/** Credibility strip directly below hero — editorial, restrained. */
export function StatBarSection() {
  return (
    <section className="scroll-mt-24 border-y border-slate-800/90 bg-zinc-950 px-4 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {heroStatBar.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-slate-800/80 bg-black/40 px-5 py-4 shadow-sm shadow-black/40"
          >
            <p className="text-sm font-semibold tracking-tight text-white">{item.label}</p>
            <p className="mt-1 text-xs font-light uppercase tracking-[0.2em] text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function AudienceStripSection() {
  return (
    <div className="border-b border-slate-800 bg-black px-4 py-6 text-center">
      <p className="mx-auto max-w-3xl text-sm leading-relaxed text-slate-400">{audiencePositioningLine}</p>
    </div>
  )
}

/** Emotional + contextual lede — placed directly under the stat bar. */
export function WhyBookExistsSection() {
  return (
    <Section id="why-exists" eyebrow="The thesis" title={whyBookExists.title} innerClassName="max-w-3xl">
      <div className="space-y-5 text-left text-base leading-relaxed text-slate-400">
        {whyBookExists.paras.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </Section>
  )
}

export function WhyReadersBuySection() {
  return (
    <Section id="why-buy" eyebrow="Reader outcomes" title="Why readers buy this" innerClassName="max-w-4xl">
      <ul className="grid gap-4 sm:grid-cols-2">
        {whyReadersBuy.map((line) => (
          <li
            key={line}
            className="flex gap-3 rounded-lg border border-slate-800/90 bg-slate-950/50 px-5 py-4 text-left text-sm leading-relaxed text-slate-300 shadow-sm shadow-black/30"
          >
            <span className="mt-0.5 shrink-0 font-serif text-amber-600/90">▸</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/** Product preview cards — what ships in the edition / bundle. */
export function ProductPreviewSection() {
  return (
    <Section id="whats-inside" eyebrow="Deliverables" title="What you receive" innerClassName="max-w-6xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {productPreviewCards.map((card, i) => (
          <article
            key={card.title}
            className="flex flex-col rounded-xl border border-slate-800 bg-black/50 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
              {String(i + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-2 font-sealed-display text-base font-semibold text-white">{card.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-snug text-slate-400">{card.body}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}

export function MethodologySection() {
  return (
    <Section
      id="method"
      eyebrow="Process"
      title="Methodology"
      className="bg-gradient-to-b from-black to-slate-950"
      innerClassName="max-w-4xl"
    >
      <ol className="grid gap-8 md:grid-cols-3">
        {methodologySteps.map((m, i) => (
          <li key={m.title} className="flex flex-col rounded-xl border border-slate-800/90 bg-slate-950/40 p-6">
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.35em] text-amber-600/90">
              Step {i + 1}
            </span>
            <h3 className="mt-3 text-lg font-semibold text-white">{m.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{m.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

/** Editorial-context strip — what each entry adds beyond the verbatim quote. */
export function EditorialContextSection() {
  return (
    <Section
      id="editorial-context"
      eyebrow={editorialContext.eyebrow}
      title={editorialContext.title}
      className="bg-gradient-to-b from-black via-zinc-950 to-black"
      innerClassName="max-w-5xl"
    >
      <p className="mb-10 max-w-3xl text-base leading-relaxed text-slate-300">{editorialContext.intro}</p>
      <ul className="grid gap-6 md:grid-cols-2">
        {editorialContext.cards.map((card) => {
          const Glyph = editorialGlyphMap[card.glyph]
          return (
            <li
              key={card.id}
              className="flex gap-5 rounded-xl border border-slate-800/90 bg-black/40 px-6 py-6 shadow-[0_14px_45px_rgba(0,0,0,0.4)]"
            >
              <span aria-hidden className="shrink-0 text-amber-500/90">
                <Glyph className="h-12 w-12" />
              </span>
              <div className="flex flex-col">
                <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-600/85">
                  {card.label}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{card.body}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

/** Reader-promise card section — full prose lives in `artifacts/sealed-v1-content.md`. */
export function VerificationPathsSection() {
  return (
    <Section
      id="verification-paths"
      eyebrow="Compare promises to the public record"
      title="Follow the official paper trails."
      className="bg-gradient-to-b from-slate-950 to-black"
      innerClassName="max-w-5xl"
    >
      <div className="mb-10 flex items-start gap-5">
        <span aria-hidden className="hidden shrink-0 text-amber-500/85 sm:block">
          <PaperTrailGlyph className="h-14 w-14" />
        </span>
        <p className="max-w-2xl text-base leading-relaxed text-slate-300">
          Every entry pairs the verbatim 2015–2016 promise with the <strong className="font-semibold text-amber-100/95">official paper trail</strong>{' '}
          — the filings, votes, and documents that test what actually happened — and a plain-English read on what likely
          made the campaign retreat from the original line. No pundit middle layer.
        </p>
      </div>
      <ul className="grid gap-6 md:grid-cols-2">
        {verificationPathCards.map((card) => (
          <li
            key={card.id}
            className="flex flex-col rounded-xl border border-slate-800/90 bg-black/40 px-5 py-5 shadow-[0_14px_45px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-center gap-3">
              <span aria-hidden className="text-amber-500/85">
                <MagnifierGlyph className="h-7 w-7" />
              </span>
              <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-amber-600/85">
                {card.label}
              </p>
            </div>
            <p className="mt-4 text-base font-semibold leading-snug text-amber-100/95">{card.lead}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{card.support}</p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function TocPreviewSection() {
  return (
    <Section id="toc" eyebrow="Manuscript map" title="What’s in the book (preview)" innerClassName="max-w-4xl">
      <ul className="space-y-4">
        {tocPreview.map((item) => (
          <li
            key={item.title}
            className="flex flex-col gap-1 border-b border-slate-800 pb-4 last:border-0 sm:flex-row sm:gap-8"
          >
            <span className="shrink-0 font-medium text-amber-200/90 sm:w-48">{item.title}</span>
            <span className="text-sm text-slate-400">{item.blurb}</span>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-sm text-slate-500">
        Full table of contents ships with the digital edition — this is the reader-facing spine from the v1 manuscript.
      </p>
    </Section>
  )
}

/** Archival divider motif — `public/ornaments/sealed-divider.svg`. */
export function SealedOrnamentDivider() {
  return (
    <div className="flex justify-center bg-black px-4 py-10" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/ornaments/sealed-divider.svg"
        alt=""
        className="h-8 w-full max-w-md opacity-95 md:max-w-lg"
        width={480}
        height={32}
      />
    </div>
  )
}

type PricingCompareProps = { ctaMode: StoreCtaMode }

export function PricingCompareSection({ ctaMode }: PricingCompareProps) {
  const checkoutLive = ctaMode === 'buy'
  const soldOut = ctaMode === 'sold_out'

  const priorityCta = (
    <a
      href="#notify"
      className="mt-8 block rounded-lg border border-slate-600 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-slate-900/80"
    >
      Get the free preview + checkout alert
    </a>
  )

  return (
    <Section id="compare" eyebrow="The book" title="One book. One price." innerClassName="max-w-2xl">
      <div className="mx-auto rounded-xl border border-amber-800/40 bg-gradient-to-b from-amber-950/20 to-black/80 p-10 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-500/95">SEALED — digital edition</p>
        <p className="mt-4 font-sealed-display text-6xl font-bold text-white">$15</p>
        <ul className="mt-8 space-y-3 text-sm leading-relaxed text-slate-300">
          <li>Complete 116-page illustrated PDF</li>
          <li>145 promises, color-coded verdicts</li>
          <li>Every receipt: date, location, source</li>
          <li>Uniquely watermarked per buyer</li>
          <li>Delivered to your inbox in minutes</li>
        </ul>
        {soldOut ? (
          <a
            href="#notify"
            className="mt-10 block rounded-lg border border-slate-600 py-4 text-center text-sm font-semibold text-slate-300 hover:bg-slate-900/80"
          >
            Notify me when back in stock
          </a>
        ) : checkoutLive ? (
          <a
            href={sealedCheckoutUrls.standard}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 block rounded-lg bg-amber-500 py-4 text-center text-base font-bold text-zinc-950 hover:bg-amber-400"
          >
            Buy SEALED — $15
          </a>
        ) : (
          priorityCta
        )}
      </div>
    </Section>
  )
}

export function FaqSection() {
  return (
    <Section id="faq" eyebrow="FAQ" title="Questions" innerClassName="max-w-3xl">
      <div className="space-y-10">
        {faqItems.map((item) => (
          <div key={item.q}>
            <h3 className="text-lg font-semibold text-white">{item.q}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}

const previewQuotes = [
  {
    label: 'Did the swamp drain?',
    source: 'Campaign interview, 2015',
    quote:
      'I know the lobbyists better than anybody… when I become president, I am not going to let them control our country anymore.',
    comparison:
      'Open the Senate LD-2 lobbying filings and the revolving-door hires from the next four years. SEALED hands you the receipts — you decide if the swamp drained.',
  },
  {
    label: 'Did “fair trade” deliver?',
    source: 'Campaign rally, 2016',
    quote: 'It starts with trade — fair trade, not free trade.',
    comparison:
      'Line up the rally sentence against USTR releases, the USMCA text, and the tariff schedules. SEALED shows you where the slogan became policy and where it didn’t.',
  },
] as const

/** Interior preview — HTML spread (legible) + two quote lanes (skimmable). */
export function SamplePreviewSection() {
  return (
    <section id="preview" className="scroll-mt-24 border-y border-slate-800 bg-black py-16 px-4">
      <div className="mx-auto max-w-5xl">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-amber-600/90">Sample</p>
        <h2 className="mt-3 text-center font-sealed-display text-3xl font-bold text-white sm:text-4xl">
          Two questions. Two receipts. That’s the book.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-slate-500">
          Every entry: the verbatim 2015–2016 promise, plus the official trail you can use to test it yourself. Two
          examples below — the full PDF carries 145.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="rounded-xl border border-slate-800 bg-zinc-950/60 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            <DocumentSpreadPreview />
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Live typography — not an AI image
            </p>
          </div>

          <div className="space-y-4">
            {previewQuotes.map((row) => (
              <figure
                key={row.label}
                className="rounded-xl border border-slate-800/90 bg-black/60 p-5 shadow-sm shadow-black/40"
              >
                <figcaption className="text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-slate-500">
                  {row.label}
                </figcaption>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-slate-500">
                    <span className="font-semibold text-slate-600">Source · </span>
                    {row.source}
                  </p>
                  <blockquote className="border-l-2 border-amber-700/70 pl-3 font-serif text-[15px] italic leading-relaxed text-slate-200">
                    “{row.quote}”
                  </blockquote>
                  <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-600/80">
                    Receipts
                  </p>
                  <p className="text-sm leading-relaxed text-slate-300">{row.comparison}</p>
                </div>
              </figure>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#compare" className="sealed-btn-primary min-w-[260px] text-center">
            Buy SEALED — $15
          </a>
        </div>
      </div>
    </section>
  )
}

export function AuthorLineSection() {
  return (
    <section className="border-b border-slate-800 bg-black px-4 py-12">
      <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-slate-500">{authorAttributionLine}</p>
    </section>
  )
}

type ArchivePurchaseProps = { ctaMode: StoreCtaMode }

/** Strong closing purchase block — replaces weak “ready when you are” filler. */
export function ArchivePurchaseSection({ ctaMode }: ArchivePurchaseProps) {
  const checkoutLive = ctaMode === 'buy'
  const soldOut = ctaMode === 'sold_out'

  return (
    <section id="buy" className="scroll-mt-24 border-y border-slate-800 bg-gradient-to-b from-zinc-950 to-black px-4 py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-amber-600/90">
          Preserve the record
        </p>
        <h2 className="mt-4 font-sealed-display text-3xl font-bold text-white sm:text-4xl">
          Preserve the original campaign record
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-slate-400">
          Read the original 2015–2016 statements as delivered — before governing pressure changed the conversation — then
          compare using those pointers in the full edition.
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          {checkoutLive ? (
            <a
              href={sealedCheckoutUrls.standard}
              target="_blank"
              rel="noopener noreferrer"
              className="sealed-btn-primary inline-flex justify-center px-8 py-3 sm:min-w-[280px]"
            >
              Buy SEALED — $15
            </a>
          ) : (
            <a
              href="#notify"
              className="sealed-btn-primary inline-flex justify-center px-8 py-3 sm:min-w-[280px]"
            >
              Get notified when sales open
            </a>
          )}
          <a href="#compare" className="sealed-btn-secondary inline-flex justify-center px-8 py-3 sm:min-w-[200px]">
            What you get
          </a>
        </div>

        <div className="mx-auto mt-14 max-w-xl rounded-xl border border-slate-700 bg-slate-900/80 p-8 text-left">
          {checkoutLive ? (
            <a
              href={sealedCheckoutUrls.standard}
              target="_blank"
              rel="noopener noreferrer"
              className="sealed-btn-primary block w-full rounded-lg py-4 text-center text-lg"
            >
              Buy SEALED — $15
            </a>
          ) : soldOut ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-400">
                This inventory window is closed. Join the list — we&apos;ll email when checkout reopens.
              </p>
              <a href="#notify" className="sealed-btn-ghost inline-block w-full">
                Join restock list
              </a>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-sm text-slate-400">
                Checkout enables when the storefront goes live. Add your email — we&apos;ll send the link when sales open.
              </p>
              <a href="#notify" className="sealed-btn-notify-solid inline-block w-full py-3">
                Get the checkout alert
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
