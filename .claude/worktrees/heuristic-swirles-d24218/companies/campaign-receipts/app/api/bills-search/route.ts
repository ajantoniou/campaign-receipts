// GET /api/bills-search?q= — search PAST/PRESENT bills by title or number,
// straight from Postgres. Powers the "find an older bill" search bar under the
// Newsletter (/bills) page. FREE to search; returns enough to build a link to
// /bill/[congress]/[bill_type][bill_number].
//
// Matches on title, short_title, and the bill number (e.g. "3633" or "hr 3633").
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type BillHit = {
  congress: number
  bill_type: string
  bill_number: number
  title: string
  status: string | null
  href: string
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json({ bills: [] })

  const like = `%${q}%`
  // A bare number in the query (e.g. "3633") should match bill_number too.
  const numeric = q.replace(/[^0-9]/g, '')

  let orFilter = `title.ilike.${like},short_title.ilike.${like}`
  if (numeric.length >= 1) orFilter += `,bill_number.eq.${numeric}`

  try {
    const { data, error } = await supabaseService
      .from('cr_bills')
      .select('congress, bill_type, bill_number, title, short_title, status, latest_action_at')
      .or(orFilter)
      .order('latest_action_at', { ascending: false, nullsFirst: false })
      .limit(12)

    if (error) {
      console.error('bills-search error:', error)
      return NextResponse.json({ error: 'Search unavailable' }, { status: 502 })
    }

    const bills: BillHit[] = (data || []).map((b: any) => ({
      congress: b.congress,
      bill_type: b.bill_type,
      bill_number: b.bill_number,
      title: b.short_title || b.title,
      status: b.status,
      href: `/bill/${b.congress}/${(b.bill_type || '').toLowerCase()}${b.bill_number}`,
    }))

    return NextResponse.json({ bills })
  } catch (err) {
    console.error('bills-search error:', err)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 502 })
  }
}
