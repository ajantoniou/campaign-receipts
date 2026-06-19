// GET /api/recent — FREE "recently updated" feed (brief §3).
// Entity name + one teaser stat per row. The CONNECTIONS (dossier) are gated.
import { NextResponse } from 'next/server'
import { getRecentActivity } from '@/lib/recent-activity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '24', 10) || 24, 1), 60)
  try {
    const rows = await getRecentActivity(limit)
    return NextResponse.json({ rows })
  } catch (err) {
    console.error('recent feed error:', err)
    return NextResponse.json({ error: 'Feed unavailable' }, { status: 502 })
  }
}
