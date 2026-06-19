import { ImageResponse } from 'next/og'
import { supabaseService, type Politician } from '@/lib/supabase'

export const runtime = 'nodejs'
export const alt = 'CampaignReceipts politician scorecard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK_950 = '#0a0a0a'
const INK_800 = '#262626'
const INK_400 = '#a3a3a3'
const INK_300 = '#d4d4d4'
const INK_50 = '#fafafa'
const EMERALD = '#34d399'
const AMBER = '#fbbf24'
const ROSE = '#fb7185'
const VIOLET = '#a78bfa'

function partyAccent(party?: string | null) {
  if (party === 'Republican') return '#ef4444'
  if (party === 'Democratic') return '#3b82f6'
  if (party === 'Independent') return '#fbbf24'
  return '#737373'
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return ((parts[0]?.[0] || '') + (parts[parts.length - 1]?.[0] || '')).toUpperCase()
}

function fmtTerm(start?: string | null, end?: string | null) {
  if (!start) return 'Term unknown'
  const ys = start.slice(0, 4)
  const ye = end ? end.slice(0, 4) : 'present'
  return `${ys}–${ye} term`
}

export default async function Image({ params }: { params: { slug: string } }) {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('slug', params.slug)
    .single()

  const p = data as Politician | null
  if (!p) {
    return new ImageResponse(<div style={{ background: INK_950, width: '100%', height: '100%' }} />, size)
  }

  const graded = p.scorecard_graded_total || 0
  const pending = p.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  const heroNumber = isLive ? String(pending) : Math.round(p.scorecard_percentage_kept ?? 0).toString()
  const heroColor = isLive ? AMBER : EMERALD
  const heroSuffix = isLive ? '' : '%'
  const heroLabel = isLive ? `${pending} promises pending · live tracking` : `kept · ${graded} promise${graded === 1 ? '' : 's'} graded`
  const term = fmtTerm(p.current_term_start, p.current_term_end)
  const partyDot = partyAccent(p.party)

  // ScorecardBar segments (in graded terms).
  const total = isLive ? Math.max(pending, 1) : Math.max(graded, 1)
  const segments = isLive
    ? [{ pct: 100, color: AMBER }]
    : [
        { pct: (p.scorecard_kept / total) * 100, color: EMERALD },
        { pct: (p.scorecard_partial / total) * 100, color: AMBER },
        { pct: (p.scorecard_broken / total) * 100, color: ROSE },
        { pct: (p.scorecard_you_decide / total) * 100, color: VIOLET },
      ]

  const updatedLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: INK_950,
          fontFamily: 'sans-serif',
          color: INK_50,
        }}
      >
        {/* Left: photo or initials block (480px) */}
        <div
          style={{
            width: 480,
            height: '100%',
            background: `linear-gradient(180deg, ${partyDot}22 0%, ${INK_950} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${INK_800}`,
          }}
        >
          {p.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photo_url}
              alt={p.name}
              width={400}
              height={500}
              style={{ width: 400, height: 500, objectFit: 'cover', borderRadius: 16, border: `1px solid ${INK_800}` }}
            />
          ) : (
            <div
              style={{
                width: 400,
                height: 500,
                borderRadius: 16,
                background: `linear-gradient(180deg, ${partyDot}44 0%, ${INK_800} 100%)`,
                border: `1px solid ${partyDot}66`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 200,
                fontWeight: 700,
                color: partyDot,
                letterSpacing: -4,
              }}
            >
              {initialsFor(p.name)}
            </div>
          )}
        </div>

        {/* Right: content (720px) */}
        <div style={{ flex: 1, padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {/* Top: eyebrow + name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 14,
                letterSpacing: 4,
                color: INK_400,
                textTransform: 'uppercase',
                fontFamily: 'monospace',
                marginBottom: 18,
                display: 'flex',
              }}
            >
              CAMPAIGN RECEIPTS · {term.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 64,
                fontWeight: 600,
                color: INK_50,
                lineHeight: 1.05,
                letterSpacing: -1.5,
                marginBottom: 10,
                display: 'flex',
              }}
            >
              {p.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 8, background: partyDot }} />
              <div style={{ fontSize: 18, color: INK_300, display: 'flex' }}>
                {p.party} · {p.state || ''} · {p.branch}
              </div>
            </div>
          </div>

          {/* Middle: hero number */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              <div
                style={{
                  fontSize: 200,
                  fontWeight: 700,
                  color: heroColor,
                  lineHeight: 1,
                  letterSpacing: -6,
                  fontVariantNumeric: 'tabular-nums',
                  display: 'flex',
                }}
              >
                {heroNumber}
                {heroSuffix && <span style={{ fontSize: 96 }}>{heroSuffix}</span>}
              </div>
            </div>
            <div style={{ fontSize: 22, color: INK_300, marginTop: 12, display: 'flex' }}>
              {heroLabel}
            </div>
          </div>

          {/* ScorecardBar */}
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24 }}>
            <div
              style={{
                display: 'flex',
                width: '100%',
                height: 16,
                borderRadius: 4,
                overflow: 'hidden',
                border: `1px solid ${INK_800}`,
              }}
            >
              {segments.map((s, i) => (
                <div key={i} style={{ width: `${s.pct}%`, background: s.color, height: '100%' }} />
              ))}
            </div>
            {!isLive && (
              <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 14, color: INK_400, fontFamily: 'monospace' }}>
                <span style={{ color: EMERALD }}>{p.scorecard_kept} KEPT</span>
                <span style={{ color: AMBER }}>{p.scorecard_partial} PARTIAL</span>
                <span style={{ color: ROSE }}>{p.scorecard_broken} BROKEN</span>
                <span style={{ color: VIOLET }}>{p.scorecard_you_decide} YOU DECIDE</span>
              </div>
            )}
          </div>

          {/* Bottom: URL + verified stamp */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: `1px solid ${INK_800}`,
              paddingTop: 16,
              marginTop: 16,
              fontFamily: 'monospace',
              fontSize: 14,
              color: INK_400,
            }}
          >
            <div style={{ display: 'flex' }}>campaignreceipts.com/politician/{p.slug}</div>
            <div style={{ display: 'flex' }}>Verified {updatedLabel}</div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
