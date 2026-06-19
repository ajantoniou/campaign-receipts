// ReceiptStrip — the share-screenshot primitive.
//
// Per Phase B conversion + engagement panel (2026-05-20):
//   "The missing primitive is the ReceiptStrip: a single perforated
//   1080×1350 card with one politician, one donor-industry line item,
//   one vote line item, one dollar stamp, and the dotted-leader CTA.
//   That's the screenshot. The timeline is the on-site version of
//   that primitive; the map is neither the screenshot nor the
//   substrate for one."
//
// Distinct from CharacterCard:
//   CharacterCard = the full character sheet (4 stat bars + top
//                   donors + promises + quote). "Share this candidate."
//   ReceiptStrip  = ONE shocking statement. "Share this single
//                   receipt." Must read in 12 seconds in a TikTok feed.
//
// Anatomy (vertical, top to bottom, 1080×1350):
//   1. Perforated top edge
//   2. CR wordmark + week label (mono caps)
//   3. Politician photo (centered, ~280px circular)
//   4. Politician name + seat (Instrument Serif headline + mono sub)
//   5. THE STATEMENT — single Instrument Serif italic line with one
//      bolded number. The screenshot moment. ~52pt.
//   6. Dotted-leader k/v: 2-3 rows ("Top donor — Defense · $4.2M",
//      "Tracked votes aligned — 7/7", "FEC source — C00457492")
//   7. SEALED CTA band (ink bg, paper text)
//   8. Footer: cite ID left, short URL right
//   9. Perforated bottom edge
//
// Three variants:
//   - 'card'    on-page interactive card, e.g. embedded on dossier
//   - 'export'  the 1080×1350 PNG-export layout (next/og renders this)
//   - 'inline'  compact horizontal version for mid-page placements
//
// All three read from the same ReceiptStripData shape so the PNG
// export and the live page never disagree.

import Image from 'next/image'
import Link from 'next/link'

export type ReceiptStripData = {
  /** Stable card id (used for /r/[id] short URL + PNG cache key). */
  id: string
  /** Politician slug — deep-links to /politician/[slug]. */
  politicianSlug?: string | null
  /** Display name (e.g. "Mike Turner"). */
  candidateName: string
  /** Seat line (e.g. "R-OH · House Intel Chair"). */
  seat: string
  /** Optional politician photo URL. Circular crop, centered. */
  photoUrl?: string | null
  /** THE statement — the one shocking line. Use {{N}} placeholders
   *  if you want to highlight a number inline (the component renders
   *  {{N}} bold + amber). */
  statement: string
  /** Optional source attribution under the statement (e.g.
   *  "FEC C00457492 · cycle 2024"). */
  statementSource?: string | null
  /** 2-3 k/v rows below the statement, dotted-leader styled. */
  facts?: Array<{ k: string; v: string }>
  /** Short URL printed in the footer-right (e.g.
   *  "campaignreceipts.com/r/mike-turner-defense"). */
  shortUrl?: string
  /** Cite ID for the footer-left (e.g. "RCPT-MT-DEFENSE-7-7"). */
  citeId?: string
  /** Optional week label for the top-right (e.g. "Week 21 · 2026"). */
  weekLabel?: string | null
}

type Props = {
  data: ReceiptStripData
  variant?: 'card' | 'export' | 'inline'
  /** Width override. Defaults: card=540, export=1080, inline=720. */
  width?: number
  /** Surrounding-background class so perforated holes punch through
   *  to the right color. Default 'paper'. Pass 'bone' to skip. */
  surface?: 'paper' | 'paper-2' | 'paper-3' | 'bone'
  /** If true, show the share + open buttons under the card.
   *  Default true for card/inline, false for export. */
  showActions?: boolean
}

const SEALED_CTA_HREF =
  'https://sealed2016.com?utm_source=campaignreceipts&utm_medium=referral&utm_content=receipt-strip'

const SEALED_CTA_TEXT =
  'This is one of 585 receipts. The full ledger starts in SEALED 2016 →'

/**
 * Render the statement with inline `{{N}}` placeholders turned into
 * bold amber spans. The component takes a single argument array
 * — alternating text + placeholder values — so the founder can write:
 *   statement: "Mike Turner voted with defense donors {{7/7}} times."
 *   statementValues: ['7/7']
 * Or use the raw form:
 *   statement: "$4.2M from Defense industry."
 * with no placeholders.
 */
function renderStatement(statement: string) {
  // Match {{...}} segments. Render the inside as a bold amber span.
  const parts = statement.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    const m = part.match(/^\{\{(.+)\}\}$/)
    if (m) {
      return (
        <strong
          key={i}
          className="font-display not-italic text-amber-text"
        >
          {m[1]}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default function ReceiptStrip({
  data,
  variant = 'card',
  width,
  surface = 'paper',
  showActions,
}: Props) {
  const isExport = variant === 'export'
  const showActionsResolved = showActions ?? !isExport
  const w = width ?? (variant === 'card' ? 540 : variant === 'export' ? 1080 : 720)
  const isInline = variant === 'inline'

  // Inline variant uses a horizontal layout — photo left, content right.
  // card + export use vertical (TikTok native).
  const padPx = Math.round(w * 0.05) // ~54px on 1080, ~27px on 540
  const photoSize = isInline
    ? Math.round(w * 0.16)
    : Math.round(w * (variant === 'export' ? 0.26 : 0.30))
  const statementSize = Math.round(w * (isInline ? 0.038 : 0.052))
  const nameSize = Math.round(w * (isInline ? 0.034 : 0.046))

  const surfaceClass = surface === 'bone' ? '' : `receipt-edge-on-${surface}`

  return (
    <article
      data-receipt-strip-export={isExport ? '1' : undefined}
      className={`receipt-strip receipt-edge-top receipt-edge-bottom ${surfaceClass} bg-bone relative ${
        isExport ? '' : 'rounded-md shadow-sm shadow-ink/[0.04]'
      }`}
      style={{
        width: w,
        padding: `${padPx}px`,
        fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui',
      }}
      aria-label={`${data.candidateName} — receipt strip`}
    >
      {/* HEADER ROW — wordmark + week label */}
      <header className="flex items-baseline justify-between gap-2 mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">
          ● Campaign·Receipts
        </span>
        {data.weekLabel && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            {data.weekLabel}
          </span>
        )}
      </header>

      {/* CANDIDATE BLOCK — photo + name + seat. inline = horizontal,
          card/export = stacked + centered. */}
      <div
        className={
          isInline
            ? 'flex items-start gap-4 mb-4'
            : 'flex flex-col items-center text-center mb-5'
        }
      >
        {data.photoUrl ? (
          <div
            className={`shrink-0 relative overflow-hidden border border-ink/15 bg-paper-3 ${
              isInline ? '' : 'mb-3'
            }`}
            style={{
              width: photoSize,
              height: photoSize,
              borderRadius: isInline ? 6 : photoSize / 2,
            }}
          >
            <Image
              src={data.photoUrl}
              alt={data.candidateName}
              fill
              sizes={`${photoSize}px`}
              className="object-cover object-top"
              unoptimized
            />
          </div>
        ) : (
          <div
            className={`shrink-0 bg-paper-3 border border-ink/15 flex items-center justify-center ${
              isInline ? '' : 'mb-3'
            }`}
            style={{
              width: photoSize,
              height: photoSize,
              borderRadius: isInline ? 6 : photoSize / 2,
            }}
          >
            <span
              className="font-display italic text-ink-2 leading-none"
              style={{ fontSize: photoSize * 0.34 }}
            >
              {data.candidateName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0])
                .join('')
                .toUpperCase()}
            </span>
          </div>
        )}
        <div className={isInline ? 'min-w-0 flex-1' : ''}>
          <h2
            className="font-display tracking-[-0.01em] text-ink leading-[1.04] m-0"
            style={{ fontSize: nameSize }}
          >
            {data.candidateName}
          </h2>
          <div
            className="mt-1.5 font-mono uppercase tracking-[0.16em] text-ink-2"
            style={{ fontSize: Math.round(w * 0.019) }}
          >
            {data.seat}
          </div>
        </div>
      </div>

      {/* THE STATEMENT — the screenshot moment */}
      <div
        className={`mb-5 ${isInline ? '' : 'text-center px-2'}`}
      >
        <p
          className="font-display italic text-ink leading-[1.15] m-0 tracking-[-0.005em]"
          style={{ fontSize: statementSize }}
        >
          {renderStatement(data.statement)}
        </p>
        {data.statementSource && (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 m-0">
            {data.statementSource}
          </p>
        )}
      </div>

      {/* FACTS — dotted-leader k/v rows */}
      {data.facts && data.facts.length > 0 && (
        <dl className="m-0 p-0 mb-5">
          {data.facts.map((row, i) => (
            <div
              key={i}
              className="flex items-baseline gap-2 py-1.5 border-b border-dotted border-ink/20 last:border-b-0"
            >
              <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2 shrink-0">
                {row.k}
              </dt>
              <span
                className="flex-1 border-b border-dotted border-ink/15 mb-1 mx-1"
                aria-hidden
              />
              <dd className="font-sans text-[13px] text-ink m-0 shrink-0 text-right">
                {row.v}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* SEALED CTA — same line as every other CR card */}
      {variant !== 'export' ? (
        <a
          href={SEALED_CTA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-sm bg-ink text-paper hover:bg-ink-2 font-sans text-[13px] font-medium px-4 py-3 transition-colors text-center mb-3 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-stat focus-visible:ring-offset-2 focus-visible:ring-offset-bone"
        >
          {SEALED_CTA_TEXT}
        </a>
      ) : (
        <div className="block w-full rounded-sm bg-ink text-paper font-sans text-[13px] font-medium px-4 py-3 text-center mb-3">
          {SEALED_CTA_TEXT}
        </div>
      )}

      {/* FOOTER — cite + short URL */}
      <footer className="flex items-baseline justify-between gap-3 pt-3 border-t border-dotted border-ink/20">
        <div className="min-w-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 truncate">
          {data.citeId
            ? `Cite as: ${data.citeId}`
            : 'campaignreceipts.com'}
        </div>
        <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 shrink-0">
          {data.shortUrl || `campaignreceipts.com/r/${data.id}`}
        </div>
      </footer>

      {/* OPTIONAL ACTIONS — on-page only, never on export */}
      {showActionsResolved && (
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          {data.politicianSlug && (
            <Link
              href={`/politician/${data.politicianSlug}`}
              className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
            >
              Open dossier →
            </Link>
          )}
          <a
            href={`/api/card/strip/${data.id}`}
            download
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-amber-text transition-colors underline underline-offset-4 decoration-line hover:decoration-amber-text"
            aria-label="Download share strip as PNG"
          >
            Share this strip ↓ PNG
          </a>
        </div>
      )}
    </article>
  )
}
