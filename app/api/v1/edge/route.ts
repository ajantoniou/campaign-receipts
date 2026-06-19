import { NextResponse } from 'next/server'
import { matchMarketToDb } from '@/lib/betting-edge'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const question = searchParams.get('question')

  if (!slug || !question) {
    return NextResponse.json({ error: 'Missing required parameters: slug, question' }, { status: 400 })
  }

  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing or invalid Bearer token' }, { status: 401 })
  }

  const token = authHeader.split(' ')[1]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
  }

  // Check entitlement for API Access (bundled into Software tier for now)
  const { data: subs, error: subError } = await supabase
    .from('cr_subscribers')
    .select('product, status, current_period_end, trial_ends_at')
    .eq('user_id', user.id)
    .eq('product', 'software')

  if (subError || !subs || subs.length === 0) {
    return NextResponse.json({ error: 'Forbidden: API Access requires Institutional Terminal subscription ($500/mo)' }, { status: 403 })
  }

  const software = subs[0]
  const now = Date.now()
  const trialEnd = software.trial_ends_at ? new Date(software.trial_ends_at).getTime() : null
  const periodEnd = software.current_period_end ? new Date(software.current_period_end).getTime() : null
  const isActive = (
    (software.status === 'trialing' && trialEnd != null && trialEnd > now) ||
    (software.status === 'active' && (periodEnd == null || periodEnd > now)) ||
    (software.status === 'canceled' && periodEnd != null && periodEnd > now)
  )

  if (!isActive) {
    return NextResponse.json({ error: 'Forbidden: Subscription inactive or expired' }, { status: 403 })
  }

  try {
    const edge = await matchMarketToDb(question, slug)
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      market: { slug, question },
      edge: edge || null
    })
  } catch (err: any) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal Server Error calculating edge' }, { status: 500 })
  }
}
