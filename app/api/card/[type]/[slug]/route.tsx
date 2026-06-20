// /api/card/[type]/[slug] — PNG share-card renderer via next/og.
//
// Per the viral-design panel (2026-05-19): 1080x1350 portrait,
// bone/ink/amber, perforated receipt edges, watermark + short URL
// baked in for influencer screenshot share.
//
// Routes:
//   GET /api/card/receipt/{politician_slug | adelson-250m}
//   GET /api/card/race/{race_slug}        (future)
//   GET /api/card/promise/{promise_id}    (future)
//
// Special hard-coded card: 'adelson-250m' — the launch-anchor card
// that pins Trump's verbatim White House quote and Adelson's confirmed
// counter-offer. Returns even when the politician scorecard hasn't
// loaded.
//
// All other receipt cards read from cr_politicians + cr_top_donors +
// scorecard fields to build the data shape, then render to PNG.

import { ImageResponse } from 'next/og'
import { supabaseService } from '@/lib/supabase'

export const runtime = 'nodejs' // next/og works in node runtime; supabase-js needs it
export const dynamic = 'force-dynamic'

const SIZE = { width: 1080, height: 1350 }

const BONE = '#F4EFE6'
const INK = '#111111'
const INK_2 = '#3D3833'
const INK_3 = '#6E665C'
const AMBER = '#E8A33D'
const AMBER_DIM = 'rgba(232, 163, 61, 0.22)'
const PAPER_3 = '#EBE3D0'

function fmtMoney(n: number): string {
  if (!n) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${Math.round(n).toLocaleString()}`
}

// ── Hard-coded launch anchor: Adelson $250M ─────────────────

const ADELSON_ANCHOR = {
  id: 'adelson-250m',
  candidateName: 'Donald J. Trump',
  office: 'R · 47th President · 2024 cycle',
  photoUrl:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg/500px-Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg',
  donorVoteScore: null,
  donorBillScore: null,
  topDonors: [
    { name: "Miriam Adelson (Preserve America PAC)", amount: 250_000_000 },
  ],
  promisesKept: 36,
  promisesBroken: 48,
  quote: 'Miriam gave my campaign indirectly and directly $250 million.',
  quoteSpeaker: 'Donald J. Trump',
  quoteSource: 'White House Hanukkah reception, Dec 16, 2025',
  fecFilingId: 'C00878801',
  shortUrl: 'campaignreceipts.com/r/adelson-250m',
}

// ── Politician card data ────────────────────────────────────

async function getPoliticianCardData(slug: string) {
  const { data: pol } = await supabaseService
    .from('cr_politicians')
    .select(
      'id, slug, name, party, state, branch, photo_url, scorecard_kept, scorecard_broken, scorecard_percentage_kept',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (!pol) return null
  const p = pol as {
    id: string
    slug: string
    name: string
    party: string | null
    state: string | null
    branch: string | null
    photo_url: string | null
    scorecard_kept: number | null
    scorecard_broken: number | null
    scorecard_percentage_kept: number | null
  }

  const { data: donors } = await supabaseService
    .from('cr_industry_breakdown')
    .select('industry_label, total_contributions, rank')
    .eq('politician_id', p.id)
    .order('rank', { ascending: true })
    .limit(3)

  const partyShort =
    p.party === 'Republican' ? 'R' : p.party === 'Democratic' ? 'D' : 'I'
  const office = `${partyShort} · ${p.state || '—'} · ${p.branch || ''}`.trim()

  return {
    id: p.slug,
    candidateName: p.name,
    office,
    photoUrl: p.photo_url,
    donorVoteScore: Math.round(Number(p.scorecard_percentage_kept || 0)),
    donorBillScore: null,
    topDonors: (donors || []).map((d) => ({
      name: (d as { industry_label: string }).industry_label,
      amount: Number((d as { total_contributions: number }).total_contributions || 0),
    })),
    promisesKept: p.scorecard_kept,
    promisesBroken: p.scorecard_broken,
    quote: null as string | null,
    quoteSpeaker: null as string | null,
    quoteSource: null as string | null,
    fecFilingId: null as string | null,
    shortUrl: `campaignreceipts.com/r/${p.slug}`,
  }
}

// ── Strip data (Phase B-prime, 2026-05-20) ─────────────────
//
// ReceiptStrip = panel-spec'd one-statement share primitive.
// Distinct from the full receipt card: ONE shocking line, ONE photo,
// 2-3 facts, SEALED CTA. The unit influencers actually screenshot in
// a TikTok feed.
//
// Data shaping skips "Individual / Retired" (the FEC small-donor
// bucketing artifact that torpedoed the InfluenceMap on 70% of
// dossiers per the previous panel verdict).

type StripData = {
  candidateName: string
  seat: string
  photoUrl: string | null
  statement: string
  statementSource: string | null
  facts: Array<{ k: string; v: string }>
  citeId: string
  shortUrl: string
}

async function getStripData(slug: string): Promise<StripData | null> {
  const { data: pol } = await supabaseService
    .from('cr_politicians')
    .select(
      'id, slug, name, party, state, branch, photo_url, scorecard_kept, scorecard_broken, scorecard_graded_total',
    )
    .eq('slug', slug)
    .maybeSingle()
  if (!pol) return null
  const p = pol as {
    id: string
    slug: string
    name: string
    party: string | null
    state: string | null
    branch: string | null
    photo_url: string | null
    scorecard_kept: number | null
    scorecard_broken: number | null
    scorecard_graded_total: number | null
  }

  const { data: industries } = await supabaseService
    .from('cr_industry_breakdown')
    .select('industry_label, total_contributions, rank')
    .eq('politician_id', p.id)
    .order('rank', { ascending: true })
    .limit(8)
  const topIndustry = ((industries || []) as { industry_label: string; total_contributions: number }[]).find(
    (i) => !/individual\s*\/\s*retired/i.test(i.industry_label),
  )

  const { data: alignments } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select('industry_label, alignment_score')
    .eq('politician_id', p.id)
  const agg = new Map<string, { aligned: number; total: number }>()
  for (const a of ((alignments || []) as { industry_label: string; alignment_score: number }[])) {
    if (!agg.has(a.industry_label)) agg.set(a.industry_label, { aligned: 0, total: 0 })
    const cur = agg.get(a.industry_label)!
    cur.total++
    if (a.alignment_score === 1) cur.aligned++
  }
  let extreme: { industry: string; aligned: number; total: number; pct: number } | null = null
  for (const [industry, v] of agg) {
    if (v.total < 5) continue
    const pct = v.aligned / v.total
    const extremity = Math.abs(pct - 0.5) * 2
    if (extremity < 0.6) continue
    if (!extreme || extremity > Math.abs(extreme.pct - 0.5) * 2) {
      extreme = { industry, aligned: v.aligned, total: v.total, pct }
    }
  }

  const partyShort =
    p.party === 'Republican' ? 'R' : p.party === 'Democratic' ? 'D' : 'I'

  let statement = ''
  let statementSource: string | null = null
  if (extreme && topIndustry) {
    const verb = extreme.pct >= 0.5 ? 'voted with' : 'broke from'
    statement = `${p.name.split(' ').slice(-1)[0]} ${verb} ${extreme.industry} donors {{${extreme.aligned}/${extreme.total}}} times.`
    statementSource = 'cr_donor_vote_alignment · cycle 2024'
  } else if (topIndustry) {
    statement = `Top donor industry: ${topIndustry.industry_label}. {{${fmtMoney(topIndustry.total_contributions)}}}`
    statementSource = 'cr_industry_breakdown · cycle 2024'
  } else if ((p.scorecard_graded_total || 0) > 0) {
    const pct = Math.round(
      ((p.scorecard_kept || 0) / Math.max(p.scorecard_graded_total || 1, 1)) * 100,
    )
    statement = `Promise scorecard: {{${pct}% kept}} of ${p.scorecard_graded_total} graded.`
    statementSource = 'cr_politicians · graded scorecard'
  } else {
    return null
  }

  const facts: Array<{ k: string; v: string }> = []
  if (topIndustry) {
    facts.push({
      k: 'Top donor industry',
      v: `${topIndustry.industry_label} · ${fmtMoney(topIndustry.total_contributions)}`,
    })
  }
  if (extreme) {
    facts.push({
      k: extreme.pct >= 0.5 ? 'Aligned with' : 'Broke from',
      v: `${extreme.industry} (${extreme.aligned}/${extreme.total})`,
    })
  }
  if ((p.scorecard_graded_total || 0) > 0) {
    facts.push({
      k: 'Promises',
      v: `${p.scorecard_kept || 0} kept · ${p.scorecard_broken || 0} broken`,
    })
  }

  return {
    candidateName: p.name,
    seat: `${partyShort}-${p.state || '—'} · ${p.branch || ''}`.trim(),
    photoUrl: p.photo_url,
    statement,
    statementSource,
    facts: facts.slice(0, 3),
    citeId: `RCPT-STRIP-${p.slug.toUpperCase()}`,
    shortUrl: `campaignreceipts.com/r/${p.slug}`,
  }
}

// ── PNG render ─────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: { type: string; slug: string } },
) {
  // Strip-type: ReceiptStrip primitive (single shocking statement
  // per panel verdict 2026-05-20).
  if (params.type === 'strip') {
    const strip = await getStripData(params.slug)
    if (!strip) return new Response('Not found', { status: 404 })
    // Honor ?format=vertical for the 1080x1920 TikTok/Reels variant.
    // Added 2026-05-21 per Viral Pack v1 rollout (panel WS-B).
    const url = new URL(req.url)
    if (url.searchParams.get('format') === 'vertical') {
      return renderVerticalStripPng(strip)
    }
    return renderStripPng(strip)
  }

  let data: typeof ADELSON_ANCHOR | Awaited<ReturnType<typeof getPoliticianCardData>>

  if (params.slug === 'adelson-250m') {
    data = ADELSON_ANCHOR
  } else if (params.type === 'receipt') {
    data = await getPoliticianCardData(params.slug)
    if (!data) {
      return new Response('Not found', { status: 404 })
    }
  } else {
    return new Response('Unsupported card type', { status: 400 })
  }

  const headlineSize = 64
  const officeSize = 22
  const quoteSize = 30

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE.width,
          height: SIZE.height,
          background: BONE,
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 56px',
          fontFamily: 'serif',
          color: INK,
          position: 'relative',
        }}
      >
        {/* Perforated edges — drawn as repeating circles via inline SVG */}
        <PerforatedEdge position="top" />
        <PerforatedEdge position="bottom" />

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: INK_3,
            marginBottom: 28,
          }}
        >
          <span>● Campaign·Receipts</span>
          <span>Receipt</span>
        </div>

        {/* Candidate block */}
        <div style={{ display: 'flex', gap: 28, marginBottom: 36 }}>
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoUrl}
              alt=""
              width={190}
              height={190}
              style={{
                width: 190,
                height: 190,
                objectFit: 'cover',
                borderRadius: 4,
                border: `1px solid rgba(17,17,17,0.15)`,
                background: PAPER_3,
              }}
            />
          ) : (
            <div
              style={{
                width: 190,
                height: 190,
                background: PAPER_3,
                border: `1px solid rgba(17,17,17,0.15)`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 64,
                fontStyle: 'italic',
                color: INK_2,
              }}
            >
              {data.candidateName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0])
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: headlineSize,
                lineHeight: 1.02,
                letterSpacing: -1.2,
                color: INK,
              }}
            >
              {data.candidateName}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: officeSize,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: INK_2,
                fontFamily: 'monospace',
              }}
            >
              {data.office}
            </div>
          </div>
        </div>

        {/* Quote block (if present) */}
        {data.quote && (
          <div
            style={{
              borderLeft: `3px solid ${AMBER}`,
              paddingLeft: 18,
              marginBottom: 32,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: quoteSize,
                lineHeight: 1.22,
                fontStyle: 'italic',
                color: INK,
              }}
            >
              {`"${data.quote}"`}
            </div>
            {(data.quoteSpeaker || data.quoteSource) && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: INK_3,
                  fontFamily: 'monospace',
                }}
              >
                {[data.quoteSpeaker, data.quoteSource].filter(Boolean).join(' · ')}
              </div>
            )}
          </div>
        )}

        {/* Donor bars */}
        {data.donorVoteScore != null && (
          <StatBar value={data.donorVoteScore} label="% Promises kept (graded)" />
        )}
        {data.donorBillScore != null && (
          <StatBar value={data.donorBillScore} label="Donor → Bill capture" />
        )}

        {/* Top donors */}
        {data.topDonors && data.topDonors.length > 0 && (
          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 13,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: INK_2,
                fontFamily: 'monospace',
                marginBottom: 16,
              }}
            >
              Paid for by — top donor industries
            </div>
            {data.topDonors.slice(0, 3).map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 10,
                  fontSize: 18,
                }}
              >
                <div style={{ color: INK, display: 'flex', gap: 12 }}>
                  <span style={{ color: INK_3, fontFamily: 'monospace', fontSize: 13 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{d.name}</span>
                </div>
                <div
                  style={{
                    color: AMBER,
                    fontSize: 22,
                    letterSpacing: -0.4,
                  }}
                >
                  {fmtMoney(d.amount)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Promises kept / broken */}
        {(data.promisesKept != null || data.promisesBroken != null) && (
          <div style={{ marginTop: 26, display: 'flex', gap: 12 }}>
            <PromiseTile label="Promises kept" value={data.promisesKept} />
            <PromiseTile label="Promises broken" value={data.promisesBroken} />
          </div>
        )}

        {/* SEALED CTA — spacer pushes to bottom */}
        <div style={{ flex: 1 }} />
        <div
          style={{
            background: INK,
            color: BONE,
            textAlign: 'center',
            padding: '16px 12px',
            fontSize: 16,
            letterSpacing: 0.2,
            borderRadius: 2,
            marginBottom: 14,
          }}
        >
          This is one of 585 receipts. The full ledger starts in SEALED 2016 →
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 14,
            borderTop: '1px dashed rgba(17,17,17,0.2)',
            fontSize: 12,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: INK_3,
            fontFamily: 'monospace',
          }}
        >
          <span>
            {data.fecFilingId ? `Source: FEC ${data.fecFilingId}` : 'Source: campaignreceipts.com'}
          </span>
          <span>{data.shortUrl}</span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Disposition': `inline; filename="cr-receipt-${params.slug}.png"`,
      },
    },
  )
}

// ── Sub-components (next/og JSX — basic HTML only) ───────────

function StatBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: INK_2,
            fontFamily: 'monospace',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 40, letterSpacing: -1.4, color: INK }}>
          {Math.round(pct)}
        </span>
      </div>
      <div
        style={{
          height: 12,
          background: AMBER_DIM,
          borderRadius: 1,
          display: 'flex',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: AMBER,
          }}
        />
      </div>
    </div>
  )
}

function PromiseTile({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div
      style={{
        flex: 1,
        background: BONE === '#F4EFE6' ? '#FAF6EF' : '#FAF6EF', // paper
        border: '1px solid rgba(17,17,17,0.10)',
        padding: 16,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <span style={{ fontSize: 40, color: INK, letterSpacing: -1.4 }}>
        {value ?? '—'}
      </span>
      <span
        style={{
          marginTop: 6,
          fontSize: 12,
          letterSpacing: 2.5,
          textTransform: 'uppercase',
          color: INK_2,
          fontFamily: 'monospace',
        }}
      >
        {label}
      </span>
    </div>
  )
}

function PerforatedEdge({ position }: { position: 'top' | 'bottom' }) {
  // 67 dots across 1080px, ~16px spacing, 5px radius.
  const dots = []
  const count = Math.floor(SIZE.width / 16)
  for (let i = 0; i < count; i++) {
    dots.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: i * 16 + 6,
          top: 0,
          width: 10,
          height: 10,
          borderRadius: 5,
          background: '#FAF6EF',
        }}
      />,
    )
  }
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 10,
        display: 'flex',
        ...(position === 'top' ? { top: -5 } : { bottom: -5 }),
      }}
    >
      {dots}
    </div>
  )
}

// ── Strip PNG render ──────────────────────────────────────
//
// ReceiptStrip 1080×1350 layout mirrored for next/og. Vertical:
// header → centered photo + name + seat → THE STATEMENT (with
// {{N}} placeholders rendered bold amber) → dotted-leader facts →
// SEALED CTA → footer.

function renderStatementOG(statement: string) {
  const parts = statement.split(/(\{\{[^}]+\}\})/g)
  return parts.map((part, i) => {
    const m = part.match(/^\{\{(.+)\}\}$/)
    if (m) {
      return (
        <strong
          key={i}
          style={{
            fontFamily: 'serif',
            fontStyle: 'normal',
            color: '#B8821C',
            fontWeight: 700,
          }}
        >
          {m[1]}
        </strong>
      )
    }
    return <span key={i}>{part}</span>
  })
}

function renderStripPng(strip: StripData) {
  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE.width,
          height: SIZE.height,
          background: BONE,
          display: 'flex',
          flexDirection: 'column',
          padding: '64px 60px',
          fontFamily: 'serif',
          color: INK,
          position: 'relative',
        }}
      >
        <PerforatedEdge position="top" />
        <PerforatedEdge position="bottom" />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: INK_3,
            marginBottom: 32,
            fontFamily: 'monospace',
          }}
        >
          <span>● Campaign·Receipts</span>
          <span>Receipt</span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          {strip.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={strip.photoUrl}
              alt=""
              width={280}
              height={280}
              style={{
                width: 280,
                height: 280,
                objectFit: 'cover',
                borderRadius: 140,
                border: '2px solid rgba(17,17,17,0.15)',
                background: PAPER_3,
              }}
            />
          ) : (
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: 140,
                background: PAPER_3,
                border: '2px solid rgba(17,17,17,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 90,
                fontStyle: 'italic',
                color: INK_2,
              }}
            >
              {strip.candidateName
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0])
                .join('')
                .toUpperCase()}
            </div>
          )}
          <div
            style={{
              fontSize: 52,
              letterSpacing: -1.4,
              lineHeight: 1.04,
              color: INK,
              marginTop: 18,
            }}
          >
            {strip.candidateName}
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 18,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: INK_2,
              fontFamily: 'monospace',
            }}
          >
            {strip.seat}
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '0 12px',
            marginBottom: 28,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontStyle: 'italic',
              lineHeight: 1.14,
              letterSpacing: -0.4,
              color: INK,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {renderStatementOG(strip.statement)}
          </div>
          {strip.statementSource && (
            <div
              style={{
                marginTop: 12,
                fontSize: 14,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: INK_3,
                fontFamily: 'monospace',
              }}
            >
              {strip.statementSource}
            </div>
          )}
        </div>

        {strip.facts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 28 }}>
            {strip.facts.map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  padding: '10px 0',
                  borderBottom:
                    i < strip.facts.length - 1
                      ? '1px dashed rgba(17,17,17,0.20)'
                      : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    color: INK_2,
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    marginRight: 14,
                  }}
                >
                  {row.k}
                </span>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 20, color: INK, fontFamily: 'sans-serif' }}>
                  {row.v}
                </span>
              </div>
            ))}
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div
            style={{
              background: INK,
              color: BONE,
              textAlign: 'center',
              padding: '20px 16px',
              fontSize: 18,
              letterSpacing: 0.2,
              borderRadius: 2,
              marginBottom: 16,
            }}
          >
            This is one of 585 receipts. The full ledger starts in SEALED 2016 →
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px dashed rgba(17,17,17,0.2)',
              fontSize: 12,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: INK_3,
              fontFamily: 'monospace',
            }}
          >
            <span>Cite as: {strip.citeId}</span>
            <span>{strip.shortUrl}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Disposition': `inline; filename="cr-strip-${strip.citeId.toLowerCase()}.png"`,
      },
    },
  )
}

// ── Vertical 1080x1920 variant (TikTok / Reels / Shorts) ───
//
// Added 2026-05-21 per Viral Pack v1 rollout (panel WS-B). The 1080x1350
// strip is portrait-square; this is full vertical, with deliberate
// caption safe-zone at top (creators overlay their own caption) and
// CTA safe-zone at bottom (SEALED CTA stays visible above the platform's
// engagement chrome).
//
// Reuses StripData + renderStatementOG + the existing color tokens so
// the visual identity stays one source of truth.

const VSIZE = { width: 1080, height: 1920 }

function renderVerticalStripPng(strip: StripData) {
  return new ImageResponse(
    (
      <div
        style={{
          width: VSIZE.width,
          height: VSIZE.height,
          background: BONE,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'serif',
          color: INK,
          position: 'relative',
        }}
      >
        {/* Caption safe-zone — top 220px. Creators overlay their own
            caption here. Faint dotted leader as a visual marker but
            otherwise empty bone paper. */}
        <div
          style={{
            height: 220,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 60px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: INK_3,
              fontFamily: 'monospace',
            }}
          >
            <span>● Campaign·Receipts</span>
            <span>Receipt · vertical</span>
          </div>
          <div
            style={{
              marginTop: 14,
              borderBottom: '2px dashed rgba(17,17,17,0.20)',
              height: 1,
            }}
          />
        </div>

        {/* Body — 1080x1280 holds photo + statement + facts. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 60px 0',
            position: 'relative',
          }}
        >
          <PerforatedEdge position="top" />

          {/* Photo + name + seat */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              marginTop: 32,
              marginBottom: 32,
            }}
          >
            {strip.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={strip.photoUrl}
                alt=""
                width={320}
                height={320}
                style={{
                  width: 320,
                  height: 320,
                  objectFit: 'cover',
                  borderRadius: 160,
                  border: '2px solid rgba(17,17,17,0.15)',
                  background: PAPER_3,
                }}
              />
            ) : (
              <div
                style={{
                  width: 320,
                  height: 320,
                  borderRadius: 160,
                  background: PAPER_3,
                  border: '2px solid rgba(17,17,17,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 100,
                  fontStyle: 'italic',
                  color: INK_2,
                }}
              >
                {strip.candidateName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s) => s[0])
                  .join('')
                  .toUpperCase()}
              </div>
            )}
            <div
              style={{
                fontSize: 58,
                letterSpacing: -1.4,
                lineHeight: 1.04,
                color: INK,
                marginTop: 22,
              }}
            >
              {strip.candidateName}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 20,
                letterSpacing: 3,
                textTransform: 'uppercase',
                color: INK_2,
                fontFamily: 'monospace',
              }}
            >
              {strip.seat}
            </div>
          </div>

          {/* Statement */}
          <div
            style={{
              textAlign: 'center',
              padding: '0 12px',
              marginBottom: 32,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontStyle: 'italic',
                lineHeight: 1.14,
                letterSpacing: -0.4,
                color: INK,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {renderStatementOG(strip.statement)}
            </div>
            {strip.statementSource && (
              <div
                style={{
                  marginTop: 14,
                  fontSize: 14,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  color: INK_3,
                  fontFamily: 'monospace',
                }}
              >
                {strip.statementSource}
              </div>
            )}
          </div>

          {/* Facts (dotted-leader rows) */}
          {strip.facts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {strip.facts.map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    padding: '12px 0',
                    borderBottom:
                      i < strip.facts.length - 1
                        ? '1px dashed rgba(17,17,17,0.20)'
                        : 'none',
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      letterSpacing: 3,
                      textTransform: 'uppercase',
                      color: INK_2,
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      marginRight: 14,
                    }}
                  >
                    {row.k}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 22, color: INK, fontFamily: 'sans-serif' }}>
                    {row.v}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA safe-zone — bottom 420px. SEALED CTA + cite footer.
            Stays above TikTok/Reels engagement chrome. */}
        <div
          style={{
            height: 420,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 60px 60px',
            position: 'relative',
          }}
        >
          <PerforatedEdge position="bottom" />
          <div
            style={{
              background: INK,
              color: BONE,
              textAlign: 'center',
              padding: '26px 16px',
              fontSize: 22,
              letterSpacing: 0.3,
              borderRadius: 2,
              marginBottom: 18,
            }}
          >
            This is one of 585 receipts. The full ledger starts in SEALED 2016 →
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 16,
              borderTop: '1px dashed rgba(17,17,17,0.2)',
              fontSize: 13,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: INK_3,
              fontFamily: 'monospace',
            }}
          >
            <span>Cite as: {strip.citeId}</span>
            <span>{strip.shortUrl}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...VSIZE,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'Content-Disposition': `inline; filename="cr-strip-vertical-${strip.citeId.toLowerCase()}.png"`,
      },
    },
  )
}
