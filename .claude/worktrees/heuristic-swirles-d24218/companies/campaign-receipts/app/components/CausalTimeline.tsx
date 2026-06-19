// CausalTimeline — Donor → Bill → Vote → Outcome.
//
// Per ChatGPT engagement-spec (2026-05-19): "compact visual timelines
// of donation → bill introduced / donation → vote / PAC spend →
// election outcome. Minimalist SVG, lightweight rendering, elegant
// monochrome design."
//
// CR-specific style rules:
//   - paper-warm only — no red/blue accents (algorithm-suppression risk
//     per the viral-design panel)
//   - dotted-leader rails between nodes (audit-document benchmark)
//   - sodium-amber for the active "flow" highlight
//   - node primitives: circle (event), pill (label), $ stamp (amount)
//
// Data shape: an ordered array of TimelineNode. The component handles
// layout. Designed for ~3-6 nodes; beyond 6 it gets cramped.

import Link from 'next/link'

type NodeKind = 'donation' | 'bill' | 'vote' | 'outcome' | 'event'

export type TimelineNode = {
  kind: NodeKind
  /** Short title rendered above the rail. */
  title: string
  /** Optional dollar amount, rendered as a stamp below the title. */
  amount?: number
  /** Optional date (ISO yyyy-mm-dd). Rendered as a mono caption. */
  date?: string | null
  /** Optional href to the primary source. If set, the node becomes a link. */
  href?: string | null
  /** Optional one-line context (e.g. industry name, bill ID). */
  meta?: string | null
}

type Props = {
  nodes: TimelineNode[]
  /** Optional eyebrow above the timeline. */
  eyebrow?: string
  /** Optional headline. */
  headline?: string
  /** When true, paints the rail in sodium-amber to signal "the money
   *  flow line is what the viewer should trace." Default true. */
  flowHighlight?: boolean
  /** Optional className passthrough for outer wrapper. */
  className?: string
}

function fmtMoney(n: number): string {
  if (!n) return ''
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

function fmtDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return iso
  }
}

const KIND_GLYPH: Record<NodeKind, string> = {
  donation: '$',
  bill: '§',
  vote: '✓',
  outcome: '◆',
  event: '·',
}

const KIND_LABEL: Record<NodeKind, string> = {
  donation: 'Donation',
  bill: 'Bill',
  vote: 'Vote',
  outcome: 'Outcome',
  event: 'Event',
}

export default function CausalTimeline({
  nodes,
  eyebrow,
  headline,
  flowHighlight = true,
  className = '',
}: Props) {
  if (nodes.length === 0) return null

  return (
    <section
      className={`causal-timeline rounded-lg border border-line bg-paper p-5 sm:p-6 ${className}`}
      aria-label="Causal timeline"
    >
      {(eyebrow || headline) && (
        <header className="mb-5">
          {eyebrow && (
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-broken mb-1.5">
              {eyebrow}
            </div>
          )}
          {headline && (
            <h3 className="font-display text-[22px] sm:text-[26px] leading-[1.15] tracking-[-0.005em] text-ink m-0">
              {headline}
            </h3>
          )}
        </header>
      )}

      {/* Desktop rail: horizontal. Mobile (<sm): vertical. The two
          layouts share node rendering; only the rail axis flips. */}
      <ol
        className="m-0 p-0 list-none relative grid gap-y-7 sm:gap-y-0"
        style={{
          gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))`,
        }}
      >
        {nodes.map((node, i) => (
          <TimelineNodeRender
            key={i}
            node={node}
            index={i}
            total={nodes.length}
            flowHighlight={flowHighlight}
          />
        ))}
      </ol>

      {/* Methodology footer — keeps the audit-document feel */}
      <footer className="mt-6 pt-4 border-t border-dotted border-line">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
          Flow shown chronologically · each node links to the primary source
        </p>
      </footer>
    </section>
  )
}

function TimelineNodeRender({
  node,
  index,
  total,
  flowHighlight,
}: {
  node: TimelineNode
  index: number
  total: number
  flowHighlight: boolean
}) {
  const isFirst = index === 0
  const isLast = index === total - 1
  const glyph = KIND_GLYPH[node.kind]
  const kindLabel = KIND_LABEL[node.kind]

  // Rail line color — sodium-amber for "money flow" (the differentiator
  // per the viral panel), or line-gray when flowHighlight is false.
  const railColor = flowHighlight ? 'bg-amber-stat' : 'bg-line'

  const Content = (
    <>
      {/* Top row: kind chip */}
      <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3 mb-2">
        {kindLabel}
      </div>

      {/* Node row: rail + glyph + amount */}
      <div className="relative flex sm:flex-col sm:items-center items-start gap-3 sm:gap-2">
        {/* Horizontal rail — desktop only. Two halves so we can hide
            the left half on the first node and the right half on the
            last node, producing clean rail terminations. */}
        <div
          className={`hidden sm:block absolute top-[14px] left-0 right-1/2 h-[2px] ${railColor} opacity-${
            isFirst ? '0' : '60'
          }`}
          aria-hidden
        />
        <div
          className={`hidden sm:block absolute top-[14px] left-1/2 right-0 h-[2px] ${railColor} opacity-${
            isLast ? '0' : '60'
          }`}
          aria-hidden
        />

        {/* Vertical rail — mobile only. */}
        <div
          className={`sm:hidden absolute top-0 bottom-0 left-[14px] w-[2px] ${railColor} opacity-${
            isLast ? '0' : '60'
          }`}
          aria-hidden
        />

        {/* Glyph node — circle with the kind glyph */}
        <div
          className={`relative z-10 size-7 shrink-0 rounded-full border-2 ${
            flowHighlight ? 'border-amber-stat bg-bone' : 'border-ink-3 bg-paper'
          } flex items-center justify-center font-display text-[13px] leading-none ${
            flowHighlight ? 'text-amber-text' : 'text-ink-2'
          }`}
          aria-hidden
        >
          {glyph}
        </div>

        {/* Right of glyph (mobile) / below glyph (desktop): node body */}
        <div className="flex-1 min-w-0 sm:text-center sm:px-1">
          <div className="font-display text-[15px] sm:text-[14px] leading-[1.2] tracking-[-0.005em] text-ink truncate sm:whitespace-normal">
            {node.title}
          </div>

          {node.amount && node.amount > 0 && (
            <div className="mt-1 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-amber-text px-1.5 py-0.5 rounded border border-amber-stat/40 bg-amber-stat-dim">
              {fmtMoney(node.amount)}
            </div>
          )}

          {node.meta && (
            <div className="mt-1 font-sans text-[12px] text-ink-2 leading-[1.4] truncate sm:whitespace-normal">
              {node.meta}
            </div>
          )}

          {node.date && (
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              {fmtDate(node.date)}
            </div>
          )}
        </div>
      </div>
    </>
  )

  if (node.href) {
    return (
      <li className="relative">
        <Link
          href={node.href}
          className="block no-underline group focus:outline-none focus-visible:ring-2 focus-visible:ring-broken/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-md p-1"
        >
          {Content}
        </Link>
      </li>
    )
  }
  return <li className="relative p-1">{Content}</li>
}
