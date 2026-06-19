// RSS feed for /corrections. Lets newsrooms subscribe to every
// editorial correction + resolved audit finding we publish.
//
// Per ChatGPT audit + 4-expert panel newsroom-buyer persona: "A
// corrections log with RSS — that's the single artifact that converts
// a $200/mo subscription to legal-approved sourcing."
//
// Cloned from app/weekly/rss.xml/route.ts (59-line self-contained
// pattern, no shared helper exists). Unions cr_corrections (editorial)
// and cr_audit_findings (resolved verdict-change findings) into one
// feed, newest-first.

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

type FeedItem = {
  title: string
  description: string
  guid: string
  pubDate: Date
  link: string
}

export async function GET() {
  const [{ data: editorial }, { data: audit }] = await Promise.all([
    supabaseService
      .from('cr_corrections')
      .select('id, occurred_at, headline, what_was_wrong, what_now_says')
      .order('occurred_at', { ascending: false })
      .limit(50),
    supabaseService
      .from('cr_audit_findings')
      .select(
        'id, resolved_at, resolution, original_verdict, politician_slug_snapshot, promise_number_snapshot, promise_text_snapshot',
      )
      .not('resolved_at', 'is', null)
      .order('resolved_at', { ascending: false })
      .limit(50),
  ])

  const items: FeedItem[] = []

  for (const c of (editorial || []) as Array<{
    id: string
    occurred_at: string
    headline: string
    what_was_wrong: string
    what_now_says: string
  }>) {
    items.push({
      title: `Correction: ${c.headline}`,
      description: `Was: ${c.what_was_wrong} — Now: ${c.what_now_says}`,
      guid: `cr-corr-${c.id}`,
      pubDate: new Date(c.occurred_at),
      link: `${SITE}/corrections#corr-${c.id}`,
    })
  }

  for (const a of (audit || []) as Array<{
    id: string
    resolved_at: string | null
    resolution: string | null
    original_verdict: string
    politician_slug_snapshot: string | null
    promise_number_snapshot: number | null
    promise_text_snapshot: string | null
  }>) {
    if (!a.resolved_at) continue
    const title = a.politician_slug_snapshot
      ? `Verdict update: ${a.politician_slug_snapshot} promise #${a.promise_number_snapshot}`
      : `Verdict update: audit ${a.id.slice(0, 8)}`
    items.push({
      title,
      description: `${a.promise_text_snapshot || ''} — From ${a.original_verdict}. ${a.resolution || ''}`.trim(),
      guid: `cr-audit-${a.id}`,
      pubDate: new Date(a.resolved_at),
      link: a.politician_slug_snapshot
        ? `${SITE}/politician/${a.politician_slug_snapshot}`
        : `${SITE}/corrections`,
    })
  }

  // Sort the unioned feed newest-first by pubDate.
  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())

  const rendered = items.map(
    (i) => `<item>
  <title>${escape(i.title)}</title>
  <link>${i.link}</link>
  <guid isPermaLink="false">${i.guid}</guid>
  <pubDate>${i.pubDate.toUTCString()}</pubDate>
  <description>${escape(i.description)}</description>
</item>`,
  )

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Corrections — CampaignReceipts</title>
  <link>${SITE}/corrections</link>
  <description>Every editorial correction and resolved verdict-change finding from campaignreceipts.com.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${rendered.join('\n  ')}
</channel>
</rss>`

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
