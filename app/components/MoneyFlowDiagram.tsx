// MoneyFlowDiagram — the receipts as a picture (founder 2026-07-02: every engine story
// gets a diagram connecting donations → lawmaker → act → bill). Pure SVG, server-rendered,
// built from the SAME source_refs as the prose so it can never disagree with the article.
// Brand: paper canvas, navy ink, civic-red money, gold act label. Non-causal by design —
// the arrows carry facts (amounts, actions), never verbs of motive.

type Donor = { name: string; amount?: number }

export type MoneyFlowProps = {
  donors: Donor[]            // up to 3 shown, rest summarized
  totalUsd?: number | null   // aggregate (bloc_total / matched_donor_total)
  actor: string              // "Rep. Jane Doe" or "93 lawmakers"
  action: string             // "VOTED FOR" | "SPONSORED"
  bill: string               // bill short title
}

const NAVY = '#16263D'
const RED = '#B23A3A'
const GOLD = '#B8862F'
const MUTED = '#6E7891'
const EDGE = '#EBE3D0'
const PAPER = '#FAF6EF'

const usdShort = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

export default function MoneyFlowDiagram({ donors, totalUsd, actor, action, bill }: MoneyFlowProps) {
  const shown = (donors || []).filter((d) => d?.name).slice(0, 3)
  if (!shown.length || !actor || !bill) return null
  const more = (donors || []).length - shown.length

  const W = 720
  const H = 230
  const donorH = 44
  const donorGap = 10
  const colDonorX = 10
  const colDonorW = 210
  const donorsTotalH = shown.length * donorH + (shown.length - 1) * donorGap + (more > 0 ? 22 : 0)
  const donorsTop = (H - donorsTotalH) / 2
  const midY = H / 2
  const actorX = 300
  const actorW = 180
  const billX = 550
  const billW = 160

  const billLines: string[] = []
  for (const w of clip(bill, 60).split(/\s+/)) {
    const last = billLines[billLines.length - 1]
    if (last !== undefined && (last + ' ' + w).length <= 20) billLines[billLines.length - 1] = last + ' ' + w
    else billLines.push(w)
  }
  const billShown = billLines.slice(0, 3)

  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" className="w-full h-auto block"
        aria-label={`Money flow: ${shown.map((d) => d.name).join(', ')} donated to ${actor}, who ${action.toLowerCase()} ${bill}`}>
        <rect width={W} height={H} rx="12" fill={PAPER} stroke={EDGE} />

        {/* donors */}
        {shown.map((d, i) => {
          const y = donorsTop + i * (donorH + donorGap)
          return (
            <g key={d.name}>
              <rect x={colDonorX} y={y} width={colDonorW} height={donorH} rx="8" fill="#fff" stroke={EDGE} />
              <text x={colDonorX + 12} y={y + 19} fontFamily="Helvetica, Arial, sans-serif" fontWeight="700" fontSize="13" fill={NAVY}>{clip(d.name, 24)}</text>
              {d.amount ? (
                <text x={colDonorX + 12} y={y + 35} fontFamily="Menlo, monospace" fontSize="11" fill={RED}>{usdShort(d.amount)}</text>
              ) : null}
              <line x1={colDonorX + colDonorW} y1={y + donorH / 2} x2={actorX - 8} y2={midY} stroke={MUTED} strokeWidth="1.2" />
            </g>
          )
        })}
        {more > 0 && (
          <text x={colDonorX + 12} y={donorsTop + shown.length * (donorH + donorGap) + 8} fontFamily="Menlo, monospace" fontSize="11" fill={MUTED}>
            +{more} more donors
          </text>
        )}

        {/* aggregate money on the flow */}
        {totalUsd ? (
          <text x={(colDonorX + colDonorW + actorX) / 2} y={midY - 12} textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight="900" fontSize="20" fill={RED}>
            {usdShort(totalUsd)}
          </text>
        ) : null}

        {/* actor */}
        <rect x={actorX} y={midY - 32} width={actorW} height={64} rx="10" fill={NAVY} />
        <text x={actorX + actorW / 2} y={midY + 5} textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight="800" fontSize={actor.length > 16 ? 13 : 15} fill="#fff">
          {clip(actor, 24)}
        </text>

        {/* act arrow */}
        <line x1={actorX + actorW} y1={midY} x2={billX - 14} y2={midY} stroke={MUTED} strokeWidth="1.5" />
        <polygon points={`${billX - 14},${midY - 5} ${billX - 4},${midY} ${billX - 14},${midY + 5}`} fill={MUTED} />
        <text x={(actorX + actorW + billX) / 2} y={midY - 10} textAnchor="middle" fontFamily="Menlo, monospace" fontWeight="700" fontSize="11" fill={GOLD} letterSpacing="2">
          {action.toUpperCase()}
        </text>

        {/* bill */}
        <rect x={billX} y={midY - 36 - (billShown.length - 1) * 8} width={billW} height={72 + (billShown.length - 1) * 16} rx="10" fill="#fff" stroke={NAVY} strokeWidth="1.5" />
        {billShown.map((ln, i) => (
          <text key={i} x={billX + billW / 2} y={midY - ((billShown.length - 1) * 16) / 2 + i * 16 + 5} textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fill={NAVY}>
            {ln}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 text-center">
        Contributions are legal and disclosed · timing does not prove causation · sourced to FEC filings
      </figcaption>
    </figure>
  )
}
