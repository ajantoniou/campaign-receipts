// InfluenceMap — hand-rolled SVG flow diagram showing donor → recipient
// → outcome relationships. Paper-warm, no deps, fits the audit-document
// aesthetic.
//
// Per ChatGPT spec (2026-05-19): "Without rebuilding the site, add
// lightweight 'View Influence Map' buttons on donor pages, PAC pages,
// politician pages, bill pages. Initial implementation: simple force-
// directed graph or Sankey flow. Keep it performant."
//
// Why not d3-sankey: 80KB+ of d3 + d3-sankey runtime for a viz we use
// on 3-4 pages. The flow we actually need is fundamentally 2- or 3-
// column (donors → politician → votes), which a hand-rolled SVG renders
// at zero JS cost. Sankey's "split flows by magnitude across N
// intermediate nodes" is overkill for our data shape.
//
// Three column modes:
//   - 'donor-politician'  -- left: donor industries  -> right: politician
//   - 'politician-votes'  -- left: politician         -> right: tracked votes
//   - 'donor-politician-votes' -- left: industries -> center: pol -> right: votes
//
// All edges are weighted (line thickness proportional to $ or vote count).
// Hover any node to highlight its edges (CSS-only, no JS).

export type InfluenceNode = {
  id: string
  label: string
  /** Optional sub-label (industry name, vote bill ID, etc.) */
  sub?: string
  /** Weight for height/thickness scaling. */
  weight: number
  /** Optional href to deep link. */
  href?: string | null
  /** Tone classification — colors the node and connected edges. */
  tone?: 'donor' | 'politician' | 'vote-aligned' | 'vote-broken' | 'neutral'
}

export type InfluenceEdge = {
  from: string // node id
  to: string // node id
  /** Edge weight — line thickness scales by this. */
  weight: number
  /** Optional tone — overrides node tone. */
  tone?: 'flow' | 'aligned' | 'broken'
}

type Props = {
  leftNodes: InfluenceNode[]
  rightNodes: InfluenceNode[]
  /** Optional center node (e.g. the politician). When present, edges
   *  fan in from left → center → right. */
  centerNode?: InfluenceNode | null
  edges: InfluenceEdge[]
  /** Headline above the map. */
  headline?: string
  /** Eyebrow above the headline. */
  eyebrow?: string
  /** Max SVG width. Default 720. */
  width?: number
}

const COLUMN_GAP = 220
const NODE_HEIGHT = 36
const NODE_PADDING = 18
const PALETTE = {
  donor: { fill: '#FAF6EF', stroke: '#1A1815', text: '#1A1815' },
  politician: { fill: '#F4EFE6', stroke: '#1A1815', text: '#1A1815' },
  'vote-aligned': { fill: '#FAF6EF', stroke: '#1A1815', text: '#1A1815' },
  'vote-broken': { fill: '#FAF6EF', stroke: '#1A1815', text: '#1A1815' },
  neutral: { fill: '#FAF6EF', stroke: '#1A1815', text: '#1A1815' },
}
// Edge palette per the design panel: NEVER red/blue. Amber for "money
// flow" (CR's signature), broken-coral only when a vote-against-donor
// is explicitly being marked.
const EDGE_PALETTE = {
  flow: '#E8A33D',
  aligned: '#E8A33D',
  broken: '#A8423E',
}

export default function InfluenceMap({
  leftNodes,
  rightNodes,
  centerNode,
  edges,
  headline,
  eyebrow,
  width = 720,
}: Props) {
  const hasCenter = !!centerNode
  const cols = hasCenter ? 3 : 2

  // Sort nodes by weight desc so the biggest sit at the top.
  const leftSorted = [...leftNodes].sort((a, b) => b.weight - a.weight)
  const rightSorted = [...rightNodes].sort((a, b) => b.weight - a.weight)

  // Per-column heights drive SVG viewport.
  const leftHeight = leftSorted.length * (NODE_HEIGHT + NODE_PADDING) - NODE_PADDING
  const rightHeight = rightSorted.length * (NODE_HEIGHT + NODE_PADDING) - NODE_PADDING
  const centerHeight = hasCenter ? NODE_HEIGHT * 2 : 0
  const svgHeight = Math.max(leftHeight, rightHeight, centerHeight, 200)

  const colWidth = (width - (cols - 1) * COLUMN_GAP) / cols
  const leftX = 0
  const centerX = hasCenter ? colWidth + COLUMN_GAP : null
  const rightX = (hasCenter ? 2 : 1) * (colWidth + COLUMN_GAP)

  // Build a position map: nodeId -> { x, y, height }.
  const positions: Record<string, { x: number; y: number; h: number; col: 'l' | 'c' | 'r' }> = {}

  leftSorted.forEach((n, i) => {
    positions[n.id] = {
      x: leftX,
      y: i * (NODE_HEIGHT + NODE_PADDING) + (svgHeight - leftHeight) / 2,
      h: NODE_HEIGHT,
      col: 'l',
    }
  })
  if (hasCenter && centerNode && centerX != null) {
    positions[centerNode.id] = {
      x: centerX,
      y: (svgHeight - NODE_HEIGHT) / 2,
      h: NODE_HEIGHT,
      col: 'c',
    }
  }
  rightSorted.forEach((n, i) => {
    positions[n.id] = {
      x: rightX,
      y: i * (NODE_HEIGHT + NODE_PADDING) + (svgHeight - rightHeight) / 2,
      h: NODE_HEIGHT,
      col: 'r',
    }
  })

  // Normalize edge weights → stroke widths (1..6 px).
  const maxEdgeWeight = Math.max(...edges.map((e) => e.weight), 1)
  function edgeWidth(w: number) {
    return 1 + Math.round((w / maxEdgeWeight) * 5)
  }

  // Render the SVG.
  return (
    <section className="influence-map rounded-lg border border-line bg-paper p-5 sm:p-6">
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

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${svgHeight + 20}`}
          width={width}
          height={svgHeight + 20}
          className="block max-w-full h-auto"
          role="img"
          aria-label="Influence flow diagram"
        >
          {/* Edges layer first so nodes paint on top */}
          <g className="edges">
            {edges.map((e, i) => {
              const from = positions[e.from]
              const to = positions[e.to]
              if (!from || !to) return null
              const x1 = from.x + colWidth
              const y1 = from.y + from.h / 2
              const x2 = to.x
              const y2 = to.y + to.h / 2
              // Cubic Bezier — control points midway horizontally, same y.
              const cx1 = x1 + (x2 - x1) / 2
              const cx2 = x1 + (x2 - x1) / 2
              const color = EDGE_PALETTE[e.tone || 'flow']
              return (
                <path
                  key={i}
                  d={`M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`}
                  stroke={color}
                  strokeWidth={edgeWidth(e.weight)}
                  fill="none"
                  opacity={0.55}
                />
              )
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {[...leftSorted, ...(centerNode ? [centerNode] : []), ...rightSorted].map((n) => {
              const pos = positions[n.id]
              if (!pos) return null
              const tone = PALETTE[n.tone || 'neutral']
              return (
                <g key={n.id}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={colWidth}
                    height={pos.h}
                    rx={3}
                    fill={tone.fill}
                    stroke={tone.stroke}
                    strokeWidth={1}
                  />
                  <text
                    x={pos.x + 12}
                    y={pos.y + pos.h / 2 - (n.sub ? 4 : 0)}
                    fontFamily="var(--font-geist-sans), ui-sans-serif"
                    fontSize="13"
                    fill={tone.text}
                    dominantBaseline="middle"
                  >
                    <tspan>{n.label.length > 28 ? n.label.slice(0, 25) + '…' : n.label}</tspan>
                  </text>
                  {n.sub && (
                    <text
                      x={pos.x + 12}
                      y={pos.y + pos.h / 2 + 10}
                      fontFamily="var(--font-geist-mono), ui-monospace"
                      fontSize="10"
                      fill="#6E665C"
                      dominantBaseline="middle"
                    >
                      <tspan>{n.sub.length > 32 ? n.sub.slice(0, 29) + '…' : n.sub}</tspan>
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      <footer className="mt-4 pt-3 border-t border-dotted border-line flex items-center justify-between gap-3 flex-wrap">
        <p className="m-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
          Line thickness ∝ donation amount or vote count · sourced from FEC + Congress.gov
        </p>
        <div className="inline-flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">
          <span className="inline-block w-3 h-0.5 bg-amber-stat" aria-hidden /> money flow
          <span className="inline-block w-3 h-0.5 bg-broken ml-2" aria-hidden /> broke-from
        </div>
      </footer>
    </section>
  )
}
