import { NextResponse } from 'next/server'
import { getBettingSnapshot } from '@/lib/betting-markets'

// Read-only public endpoint: serves the cached political betting-market
// snapshot. Cached server-side via the fetch revalidate (10 min) in the lib.
export const revalidate = 600

export async function GET() {
  const snapshot = await getBettingSnapshot()
  return NextResponse.json(snapshot, {
    status: snapshot.ok ? 200 : 503,
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
  })
}
