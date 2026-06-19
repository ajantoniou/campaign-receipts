// RSS feed for /weekly. Lets influencers/creators subscribe and pull
// the headline into their content pipeline automatically.

import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 3600
export const runtime = 'nodejs'

const SITE = 'https://campaignreceipts.com'

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const { data: rows } = await supabaseService
    .from('cr_weekly')
    .select('iso_year, iso_week, picked_at, headline, blurb, politician_id')
    .order('iso_year', { ascending: false })
    .order('iso_week', { ascending: false })
    .limit(50)

  const items = (rows || []).map((r: any) => {
    const link = `${SITE}/weekly#${r.iso_year}-W${r.iso_week}`
    return `<item>
  <title>${escape(r.headline)}</title>
  <link>${link}</link>
  <guid isPermaLink="false">cr-weekly-${r.iso_year}-${r.iso_week}</guid>
  <pubDate>${new Date(r.picked_at).toUTCString()}</pubDate>
  <description>${escape(r.blurb || '')}</description>
</item>`
  })

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Worst Broken Promise of the Week — CampaignReceipts</title>
  <link>${SITE}/weekly</link>
  <description>Every Monday: the highest-impact broken campaign promise with primary-source citations.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items.join('\n  ')}
</channel>
</rss>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
