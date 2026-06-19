// Receipt — THE hero component. Per claude-design benchmark.
//
// Used on:
//   - Landing hero (one signature politician's broken promise)
//   - Politician profile pages (THE share asset / OG-image twin)
//   - Share tiles
//   - About page worksheet examples
//
// Anatomy (top to bottom):
//   1. Perforated top edge   (::before in .receipt CSS)
//   2. Head — mono ID + Instrument Serif title, right-side meta (tags)
//   3. Body — series of RRows with dashed dividers between groups
//   4. Verdict band — tilted Stamp + sans body copy explaining verdict
//   5. Foot — manifesto line left + canonical URL right (mono caps)
//   6. Perforated bottom edge (::after in .receipt CSS)
//
// `compact` drops verdict band's second-block and uses smaller padding
// for share-tile use.

import RRow from './RRow'
import Stamp from './Stamp'
import CopyChip from '../CopyChip'

type Verdict = 'kept' | 'partial' | 'broken' | 'pending' | 'decide'

export type ReceiptRow = {
  k: React.ReactNode
  v: React.ReactNode
  sans?: boolean
}

type Props = {
  /** Document ID, e.g. "RCPT-DJT-2016-008" — rendered top-left in mono */
  id: string
  /** Receipt title — Instrument Serif 26px */
  title: string
  /** Optional right-side header content (party tag, category chip) */
  headerRight?: React.ReactNode
  /** K/V rows in the body. Use {} to insert a dashed divider between groups. */
  rows: ReceiptRow[]
  /** Verdict for the colored stamp + band */
  verdict: Verdict
  /** Sans-body copy explaining the verdict (lives in the verdict band) */
  verdictCopy?: React.ReactNode
  /** Override the stamp label (default uses Stamp's per-kind label) */
  stampLabel?: string
  /** Footer left (manifesto / promise) */
  footLeft?: React.ReactNode
  /** Footer right (canonical URL) */
  footRight?: React.ReactNode
  /** Compact = smaller paddings, drops the verdict-band sans-copy */
  compact?: boolean
  /** AP-style citation. When provided, renders a small "Cite as AP"
   *  CopyChip in the footer (between footLeft and footRight). Built by
   *  lib/ap-citation.ts at the call site. */
  citation?: string
  className?: string
}

export default function Receipt({
  id,
  title,
  headerRight,
  rows,
  verdict,
  verdictCopy,
  stampLabel,
  footLeft = '★ Receipts, not rhetoric',
  footRight = 'campaignreceipts.com',
  compact,
  citation,
  className = '',
}: Props) {
  return (
    <article
      className={`receipt ${className}`}
      aria-label={`Receipt ${id}: ${title}`}
    >
      <header className="receipt-head">
        <div className="min-w-0">
          <div className="receipt-id">{id}</div>
          <h3 className="receipt-title">{title}</h3>
        </div>
        {headerRight && <div className="text-right shrink-0 ml-4">{headerRight}</div>}
      </header>

      <div className="receipt-body">
        {rows.map((r, i) => <RRow key={i} k={r.k} v={r.v} sans={r.sans} />)}
      </div>

      <div className="receipt-verdict">
        <Stamp kind={verdict} tilted={!compact} label={stampLabel} />
        {!compact && verdictCopy && (
          <p className="v-copy">{verdictCopy}</p>
        )}
      </div>

      <footer className="receipt-foot">
        <span>{footLeft}</span>
        {citation && (
          <CopyChip
            value={citation}
            label="Cite as AP"
            copiedLabel="Citation copied"
            variant="inline"
          />
        )}
        <span>{footRight}</span>
      </footer>
    </article>
  )
}
