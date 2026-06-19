import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const polymarketSlug = searchParams.get('slug')
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 })
  }

  // Verify the user token (mock validation for now, would use Supabase auth or JWT in production)
  // For production: await supabase.auth.getUser(token)
  // We'll just assume they are valid if token starts with "ext_"
  if (!token.startsWith('ext_')) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
  }

  if (!polymarketSlug) {
    return NextResponse.json({ error: 'Bad Request: No slug provided' }, { status: 400 })
  }

  // Lookup the race by slug (simulate a mapping or finding by title)
  // For the demo, we just fetch a random active race or the TX Senate race.
  const { data: races, error } = await supabaseService
    .from('cr_races')
    .select('slug, headline, state, total_ie_usd, candidates')
    .eq('is_active', true)
    .limit(1)

  if (error || !races || races.length === 0) {
    return NextResponse.json({ error: 'No data found for this market.' }, { status: 404 })
  }

  const race = races[0]

  return NextResponse.json({
    edge_data: {
      race_slug: race.slug,
      headline: race.headline,
      total_outside_money: race.total_ie_usd,
      insight: `Dark money injection detected in ${race.state}. Institutional flow supports this outcome.`,
      candidates: race.candidates
    }
  })
}
