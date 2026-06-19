// QuoteTile — pull-quote card. Per claude-design benchmark.
//
// Layered:
//   1. Decorative amber quote glyph 80px (Instrument Serif), opacity 0.4
//   2. Blockquote: Instrument Serif 26px, ink, padding-left 22px
//   3. Attribution row: dashed border-top, mono 10px ink-3,
//      author left + source right
//
// Use on landing for press validation, on share tiles as the
// tweet-graphic primitive.

type Props = {
  children: React.ReactNode
  /** Attribution — author left, source right */
  author?: string
  source?: string
  className?: string
}

export default function QuoteTile({ children, author, source, className = '' }: Props) {
  return (
    <figure className={`quote-tile ${className}`}>
      <span className="qmark" aria-hidden>"</span>
      <blockquote>{children}</blockquote>
      {(author || source) && (
        <figcaption className="qsrc">
          {author && <span>— {author}</span>}
          {author && source && <span aria-hidden>·</span>}
          {source && <span>{source}</span>}
        </figcaption>
      )}
    </figure>
  )
}
