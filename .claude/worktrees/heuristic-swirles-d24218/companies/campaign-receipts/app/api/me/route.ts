// GET /api/me — minimal auth-state probe for client nav.
//
// Returns only { loggedIn: boolean } (no PII) so the header's Log in /
// Dashboard button can decide what to show WITHOUT making the whole layout
// dynamic. The root layout stays statically optimized (important for SEO +
// caching); this one tiny dynamic endpoint carries the per-request auth check.

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  return NextResponse.json(
    { loggedIn: !!user },
    // Never cache an auth-state response.
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
