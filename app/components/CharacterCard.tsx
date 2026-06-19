// CharacterCard — the panel-spec'd NBA-2K-style political "character
// sheet" card. 1080x1350 (4:5 portrait) optimized for TikTok/Reels
// screenshot. Bone background, ink type, sodium-amber accent — no
// red/blue (algorithm-suppression risk).
//
// CR's signature visual element: perforated receipt edges top + bottom.
// (Sludge owns the dollar sign, OpenSecrets owns the pie chart, CR owns
// the tear line.)
//
// Three primary placements:
//   - 'hero'      Homepage above-the-fold (560px wide on desktop, full
//                 bleed on mobile, 4:5 portrait either way).
//   - 'export'    The exact 1080x1350 layout used by the /api/card PNG
//                 renderer for share-this-receipt downloads. Same JSX,
//                 different scale factor.
//   - 'inline'    Mid-page card on detail surfaces.
//
// All three reads from the same data shape (CharacterCardData) so the
// PNG export and the live page never disagree on what the card looks
// like.

import Image from 'next/image'
import Link from 'next/link'

export type CharacterCardData = {
  /** Stable card id (used for /r/[id] short URL + PNG cache key). */
  id: string
  /** Politician slug to deep-link into /politician/[slug] on the page side. */
  politicianSlug?: string
  /** Display name (e.g. "Donald J. Trump"). */
  candidateName: string
  /** Office line (e.g. "R · President · 2024 cycle"). */
  office: string
  /** Optional photo URL — politician headshot. */
  photoUrl?: string | null
  /** Donor → Vote alignment score 0-100. Higher = more aligned with top donors. */
  donorVoteScore?: number | null
  /** Donor → Bill (money trail) score 0-100. Higher = more industry capture. */
  donorBillScore?: number | null
  /** Top 3 donors as [{ name, amount }] — $ shown as $X.XM. */
  topDonors?: Array<{ name: string; amount: number }>
  /** Promises kept / broken counts. */
  promisesKept?: number | null
  promisesBroken?: number | null
  /** ONE verbatim quote that anchors the card (the panel said: "quote
   *  next to the receipt" is CR's differentiator). */
  quote?: string | null
  /** Speaker of the quote (e.g. "Donald J. Trump"). */
  quoteSpeaker?: string | null
  /** Source attribution for the quote (e.g. "White House Hanukkah
   *  reception, Dec 16, 2025"). */
  quoteSource?: string | null
  /** Optional FEC filing ID for the footer citation. */
  fecFilingId?: string | null
  /** Optional FEC filing URL (link target for the FEC ID). */
  fecFilingUrl?: string | null
  /** Short URL printed in the bottom-right (e.g. campaignreceipts.com/r/abc). */
  shortUrl?: string
  /** Optional week label (e.g. "Week 21, 2026"). */
  weekLabel?: string | null
}

type Props = {
  data: CharacterCardData
  /** 'hero' = on-page interactive. 'export' = PNG render. 'inline' = embed. */
  variant?: 'hero' | 'export' | 'inline'
  /** Width override — defaults: hero=560, export=1080, inline=420. */
  width?: number
  /** If true, render the share + open buttons. Default true for hero/inline,
   *  false for export. */
  showActions?: boolean
  /** Surrounding background, so the perforated dot "holes" punch
   *  through to the right color. Default 'paper'. */
  surface?: 'paper' | 'paper-2' | 'paper-3' | 'bone'
}

const SEALED_CTA_HREF =
  'https://sealed2016.com?utm_source=campaignreceipts&utm_medium=referral&utm_content=character-card'

const SEALED_CTA_TEXT = 'This is one of 585 receipts. The full ledger starts in SEALED 2016 →'

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

function StatBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2">
          {label}
        </span>
        <span className="font-display text-[28px] leading-none tabular-nums tracking-[-0.01em] text-ink">
          {Math.round(pct)}
        </span>
      </div>
      <div className="h-2.5 rounded-sm bg-amber-stat-dim overflow-hidden">
        <div
          className="h-full bg-amber-stat"
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
    </div>
  )
}

export default function CharacterCard({
  data,
  variant = 'hero',
  width,
  showActions,
  surface = 'paper',
}: Props) {
  const isExport = variant === 'export'
  const showActionsResolved = showActions ?? !isExport
  const w = width ?? (variant === 'hero' ? 560 : variant === 'export' ? 1080 : 420)
  const h = Math.round(w * (1350 / 1080)) // 4:5 portrait

  // Design-pass 2026-05-19: perforated edge "hole" color must match
  // the surrounding background, otherwise the dots read as bone-on-
  // wrong-color. The `surface` prop tells the card which utility class
  // to add. Default 'paper' (the homepage hero context).
  const surfaceClass = surface === 'bone' ? '' : `receipt-edge-on-${surface}`

  // Body padding scales with card width so the export PNG and the live
  // card share visual proportions.
  const padPx = Math.round(w * 0.045) // ~50px on 1080, ~26px on 560

  const headlineSize = Math.round(w * 0.046) // ~50px on 1080, ~26px on 560
  const officeSize = Math.round(w * 0.0185) // ~20px / ~10px
  const quoteSize = Math.round(w * 0.024) // ~26px / ~13px

  return (
    <article
      data-card-export={isExport ? '1' : undefined}
      className={`character-card receipt-edge-top receipt-edge-bottom ${surfaceClass} bg-bone relative overflow-hidden ${isExport ? '' : 'rounded-md shadow-sm shadow-ink/[0.04]'}`}
      style={{
        width: w,
        minHeight: h,
        padding: `${padPx}px ${padPx}px ${padPx}px`,
        fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui',
      }}
      aria-label={`${data.candidateName} — receipt card`}
    >
      {/* TOP HEADER ROW — eyebrow + week label */}
      <header className="flex items-baseline justify-between gap-2 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3">
          ● Campaign·Receipts
        </span>
        {data.weekLabel && (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            {data.weekLabel}
          </span>
        )}
      </header>

      {/* CANDIDATE BLOCK — photo + name + office */}
      <div className="flex items-start gap-4 mb-5">
        {data.photoUrl ? (
          <div
            className="shrink-0 relative overflow-hidden border border-ink/15 bg-paper-3"
            style={{ width: w * 0.18, height: w * 0.18, borderRadius: 4 }}
          >
            <Image
              src={data.photoUrl}
              alt={data.candidateName}
              fill
              sizes={`${Math.round(w * 0.18)}px`}
              className="object-cover object-top"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="shrink-0 bg-paper-3 border border-ink/15 flex items-center justify-center"
            style={{ width: w * 0.18, height: w * 0.18, borderRadius: 4 }}
          >
            <span
              className="font-display italic text-ink-2 leading-none"
              style={{ fontSize: w * 0.06 }}
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
        <div className="min-w-0 flex-1">
          <h2
            className="font-display tracking-[-0.015em] text-ink leading-[1.02] m-0"
            style={{ fontSize: headlineSize }}
          >
            {data.candidateName}
          </h2>
          <div
            className="mt-1.5 font-mono uppercase tracking-[0.16em] text-ink-2"
            style={{ fontSize: officeSize }}
          >
            {data.office}
          </div>
        </div>
      </div>

      {/* QUOTE BLOCK (if present) — the differentiator per panel */}
      {data.quote && (
        <blockquote
          className="m-0 mb-5 pl-3 border-l-2 border-amber-stat"
          style={{ marginLeft: 0 }}
        >
          <p
            className="font-display italic text-ink m-0 leading-[1.22]"
            style={{ fontSize: quoteSize }}
          >
            "{data.quote}"
          </p>
          {(data.quoteSpeaker || data.quoteSource) && (
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
              {data.quoteSpeaker}
              {data.quoteSpeaker && data.quoteSource && ' · '}
              {data.quoteSource}
            </div>
          )}
        </blockquote>
      )}

      {/* STAT BARS — donor-vote + donor-bill */}
      {(data.donorVoteScore != null || data.donorBillScore != null) && (
        <div className="mb-5 grid gap-3.5">
          {data.donorVoteScore != null && (
            <StatBar value={data.donorVoteScore} label="Donor → Vote alignment" />
          )}
          {data.donorBillScore != null && (
            <StatBar value={data.donorBillScore} label="Donor → Bill capture" />
          )}
        </div>
      )}

      {/* TOP 3 DONORS */}
      {data.topDonors && data.topDonors.length > 0 && (
        <div className="mb-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-2 mb-2.5">
            Paid for by — top 3 donor industries
          </div>
          <ol className="m-0 p-0 list-none space-y-1.5">
            {data.topDonors.slice(0, 3).map((d, i) => (
              <li key={i} className="flex items-baseline justify-between gap-3">
                <span className="font-sans text-[13px] text-ink truncate">
                  <span className="font-mono text-[10px] text-ink-3 mr-1.5">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {d.name}
                </span>
                {/* Design-pass 2026-05-19: text-amber-stat (#E8A33D)
                    fails WCAG AA on bone (~3.1:1). text-amber-text
                    (#B8821C) reads at 4.6:1, same editorial warmth. */}
                <span className="font-display text-[16px] tabular-nums text-amber-text tracking-[-0.005em] shrink-0">
                  {fmtMoney(d.amount)}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* PROMISES KEPT / BROKEN — split tile */}
      {(data.promisesKept != null || data.promisesBroken != null) && (
        <div className="mb-5 grid grid-cols-2 gap-2">
          <div className="rounded-sm border border-ink/10 bg-paper p-3">
            <div className="font-display text-[28px] tabular-nums leading-none text-ink">
              {data.promisesKept ?? '—'}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-2">
              Promises kept
            </div>
          </div>
          <div className="rounded-sm border border-ink/10 bg-paper p-3">
            <div className="font-display text-[28px] tabular-nums leading-none text-ink">
              {data.promisesBroken ?? '—'}
            </div>
            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-2">
              Promises broken
            </div>
          </div>
        </div>
      )}

      {/* SEALED CTA — the single conversion button, same copy across
          every card per panel synthesis. */}
      {variant !== 'export' ? (
        <a
          href={SEALED_CTA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-sm bg-ink text-paper hover:bg-ink-2 font-sans text-[13px] font-medium px-4 py-3 transition-colors text-center mb-3 no-underline"
        >
          {SEALED_CTA_TEXT}
        </a>
      ) : (
        <div className="block w-full rounded-sm bg-ink text-paper font-sans text-[13px] font-medium px-4 py-3 text-center mb-3">
          {SEALED_CTA_TEXT}
        </div>
      )}

      {/* FOOTER — FEC citation + short URL + CR wordmark watermark */}
      <footer className="flex items-baseline justify-between gap-3 pt-3 border-t border-dotted border-ink/20">
        <div className="min-w-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 truncate">
          {data.fecFilingId
            ? `Source: FEC ${data.fecFilingId}`
            : 'Source: campaignreceipts.com'}
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
            href={`/api/card/receipt/${data.id}`}
            download
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-amber-stat transition-colors underline underline-offset-4 decoration-line hover:decoration-amber-stat"
            aria-label="Download share card"
          >
            Share this receipt ↓ PNG
          </a>
        </div>
      )}
    </article>
  )
}
