// MethodCard — methodology step card. Per claude-design benchmark.
//
// Anatomy:
//   - paper bg, 1px line border, 14px radius, 28px padding
//   - top mono numerator "— 01", "— 02" etc, ink-3, tracking 0.14em
//   - H3 Instrument Serif 28px, ink, weight 400
//   - body Geist 14px ink-2 leading-relaxed
//
// Optional: giant Roman numeral watermark top-right (Instrument
// Serif 88px, ink, opacity 0.12) for "principle" cards.

type Props = {
  /** Zero-padded step number, e.g. "01" */
  step: string
  title: string
  body: React.ReactNode
  /** Optional Roman numeral watermark, e.g. "II" */
  watermark?: string
  className?: string
}

export default function MethodCard({ step, title, body, watermark, className = '' }: Props) {
  return (
    <article className={`method-card relative overflow-hidden ${className}`}>
      {watermark && (
        <span
          aria-hidden
          className="absolute top-4 right-6 font-display text-[88px] leading-none text-ink opacity-[0.12] select-none"
        >
          {watermark}
        </span>
      )}
      <div className="num-mark">— {step}</div>
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  )
}
