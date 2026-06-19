import { NextResponse } from 'next/server'

const TS_HOST = process.env.TYPESENSE_HOST || ''
const TS_KEY = process.env.TYPESENSE_API_KEY || ''
const TS_PROTOCOL = process.env.TYPESENSE_PROTOCOL || 'https'
const TS_PORT = process.env.TYPESENSE_PORT || '443'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ politicians: [], promises: [] })
  }

  if (!TS_HOST || !TS_KEY) {
    return NextResponse.json({ error: 'Search not configured' }, { status: 503 })
  }

  const base = `${TS_PROTOCOL}://${TS_HOST}:${TS_PORT}`

  const body = {
    searches: [
      {
        collection: 'politicians',
        q,
        query_by: 'name,state,professional_background,profile_narrative',
        per_page: 8,
        highlight_full_fields: 'name',
      },
      {
        collection: 'promises',
        q,
        query_by: 'promise_text,category,case_study_narrative,verdict_reasoning',
        per_page: 8,
        highlight_full_fields: 'promise_text',
      },
    ],
  }

  try {
    const res = await fetch(`${base}/multi_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TYPESENSE-API-KEY': TS_KEY,
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Typesense error:', res.status, text)
      return NextResponse.json({ error: 'Search unavailable' }, { status: 502 })
    }

    const data = await res.json()

    const politicians = (data.results?.[0]?.hits || []).map((h: any) => ({
      slug: h.document.slug,
      name: h.document.name,
      party: h.document.party,
      branch: h.document.branch,
      state: h.document.state,
      scorecard_percentage_kept: h.document.scorecard_percentage_kept,
      photo_url: h.document.photo_url,
      highlight: h.highlights?.[0]?.snippet || '',
    }))

    const promises = (data.results?.[1]?.hits || []).map((h: any) => ({
      promise_text: h.document.promise_text,
      verdict: h.document.verdict,
      category: h.document.category,
      politician_name: h.document.politician_name,
      politician_slug: h.document.politician_slug,
      highlight: h.highlights?.[0]?.snippet || '',
    }))

    return NextResponse.json({ politicians, promises })
  } catch (err) {
    console.error('Search fetch error:', err)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 502 })
  }
}
