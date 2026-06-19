// ReceiptStub — compact single-promise Receipt for in-page triptychs.
// Per design-lead panel feedback: "One Receipt above-fold + zero in the
// body ≠ 'every receipt.'" The case-study section needs 2–3 mini
// receipts so the page reads as a publication, not one artifact +
// commentary.
//
// Anatomy (smaller than Receipt):
//   - perforated edges (inherited from .receipt)
//   - mono ID + Instrument Serif title (single line, ~20px)
//   - ONE k/v row with dotted leader showing the most-relevant fact
//   - tilted verdict Stamp inline (not in a band)
//   - footer with ID + canonical URL
//
// No verdict-band, no multi-row body. The visual unit is "stamp + line."

import Stamp from './Stamp'
import RRow from './RRow'

type Verdict = 'kept' | 'partial' | 'broken' | 'pending' | 'decide'

type Props = {
  id: string
  /** The promise title — Instrument Serif ~20px */
  title: string
  /** Most-relevant k/v fact, e.g. {k:'Action', v:'Day-one EO signed'} */
  row: { k: React.ReactNode; v: React.ReactNode; sans?: boolean }
  verdict: Verdict
  stampLabel?: string
  href?: string
  className?: string
}

export default function ReceiptStub({
  id,
  title,
  row,
  verdict,
  stampLabel,
  href,
  className = '',
}: Props) {
  const inner = (
    <article
      className={`receipt ${className}`}
      aria-label={`Receipt ${id}: ${title}`}
    >
      <div className="receipt-head">
        <div className="min-w-0 flex-1">
          <div className="receipt-id">{id}</div>
          <h4
            className="font-display text-[20px] leading-[1.2] tracking-[-0.005em] text-ink mt-1"
            style={{ maxWidth: '90%' }}
          >
            {title}
          </h4>
        </div>
        <Stamp kind={verdict} label={stampLabel} />
      </div>
      <div className="receipt-body">
        <RRow k={row.k} v={row.v} sans={row.sans} />
      </div>
      <div className="receipt-foot">
        <span>{id}</span>
        <span>campaignreceipts.com</span>
      </div>
    </article>
  )
  if (href) {
    return (
      <a href={href} className="block no-underline hover:opacity-95 transition-opacity">
        {inner}
      </a>
    )
  }
  return inner
}
