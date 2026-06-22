// Dynamic OG card per article — so Friday Receipts links shared from the
// newsletter / X / Reddit render a real receipt-style preview instead of a blank
// card. Brand: parchment paper, navy ink, civic-red accent, serif + mono. Matches
// app/for-journalists/opengraph-image.tsx.

import { ImageResponse } from 'next/og'
import { supabaseService } from '@/lib/supabase'

export const runtime = 'nodejs'
export const alt = 'Campaign Receipts — follow the money'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PAPER = '#F4EFE6'
const PAPER_2 = '#EBE3D0'
const NAVY = '#16263D'
const NAVY_3 = '#6E7891'
const RED = '#B23A3A'

const KIND_LABEL: Record<string, string> = {
  weekly_story: 'Friday Receipts',
  weekly_receipt: 'Friday Receipts',
  race_funding: "Who's funding the race",
  video_companion: 'Video companion',
  editorial: 'Editorial',
}

export default async function Image({ params }: { params: { slug: string } }) {
  let title = 'Follow the money behind every vote'
  let dek: string | null = null
  let kind = 'weekly_story'
  try {
    const { data } = await supabaseService
      .from('cr_articles').select('title, dek, kind').eq('slug', params.slug).maybeSingle()
    if (data) { title = data.title || title; dek = data.dek; kind = data.kind || kind }
  } catch { /* fall back to defaults */ }

  // Clamp very long titles so the card stays legible.
  const t = title.length > 110 ? title.slice(0, 107).trimEnd() + '…' : title
  const titleSize = t.length > 70 ? 50 : t.length > 45 ? 60 : 72

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PAPER, padding: '52px 60px', fontFamily: 'serif', color: NAVY }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: NAVY_3, fontFamily: 'monospace' }}>
          <div style={{ display: 'flex' }}>CampaignReceipts</div>
          <div style={{ display: 'flex' }}>{KIND_LABEL[kind] || 'Money trail'}</div>
        </div>
        <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 700, marginTop: 30, lineHeight: 1.02, flex: 1 }}>{t}</div>
        {dek && (
          <div style={{ display: 'flex', fontSize: 24, color: NAVY_3, lineHeight: 1.3, marginBottom: 18 }}>
            {dek.length > 150 ? dek.slice(0, 147).trimEnd() + '…' : dek}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 15, color: NAVY, borderTop: `2px solid ${PAPER_2}`, paddingTop: 18 }}>
          <div style={{ display: 'flex', color: RED, fontWeight: 700 }}>Sourced to public FEC filings</div>
          <div style={{ display: 'flex', fontWeight: 700 }}>campaignreceipts.com</div>
        </div>
      </div>
    ),
    size,
  )
}
