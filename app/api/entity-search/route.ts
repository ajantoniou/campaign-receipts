// GET /api/entity-search?q=&type= — search across the four dossier node types
// (politician | donor | bill | vote) straight from Postgres. Powers the
// /investigate search surface. Returns {type, id, label, sub} rows that link to
// the gated dossier. FREE to search; the connections behind each row are gated.
import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Hit = { type: string; id: string; label: string; sub: string }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  const only = searchParams.get('type') || '' // optional filter
  if (q.length < 2) return NextResponse.json({ hits: [] })

  const like = `%${q}%`
  const want = (t: string) => !only || only === t
  const hits: Hit[] = []

  try {
    await Promise.all([
      want('politician')
        ? supabaseService
            .from('cr_politicians')
            .select('slug, name, party, state, branch')
            .ilike('name', like)
            .limit(6)
            .then(({ data }) => {
              for (const p of data || [])
                hits.push({ type: 'politician', id: (p as any).slug, label: (p as any).name, sub: `${(p as any).party} · ${(p as any).state} · ${(p as any).branch}` })
            })
        : null,
      want('donor')
        ? supabaseService
            .from('cr_committees')
            .select('committee_id, name, committee_type_full, industry_label')
            .ilike('name', like)
            .limit(6)
            .then(({ data }) => {
              for (const c of data || [])
                hits.push({ type: 'donor', id: (c as any).committee_id, label: (c as any).name, sub: (c as any).industry_label || (c as any).committee_type_full || 'Committee' })
            })
        : null,
      want('bill')
        ? supabaseService
            .from('cr_bills')
            .select('id, bill_type, bill_number, title, short_title, status')
            .or(`title.ilike.${like},short_title.ilike.${like}`)
            .limit(6)
            .then(({ data }) => {
              for (const b of data || [])
                hits.push({ type: 'bill', id: (b as any).id, label: (b as any).short_title || (b as any).title, sub: `${((b as any).bill_type || '').toUpperCase()} ${(b as any).bill_number}${(b as any).status ? ' · ' + (b as any).status : ''}` })
            })
        : null,
      want('vote')
        ? supabaseService
            .from('cr_roll_calls')
            .select('id, chamber, congress, roll_number, question, vote, cr_politicians(name)')
            .ilike('question', like)
            .limit(6)
            .then(({ data }) => {
              for (const r of data || [])
                hits.push({ type: 'vote', id: (r as any).id, label: (r as any).question || `Roll call ${(r as any).roll_number}`, sub: `${(r as any).cr_politicians?.name || ''} voted ${(r as any).vote}` })
            })
        : null,
    ])
    return NextResponse.json({ hits })
  } catch (err) {
    console.error('entity-search error:', err)
    return NextResponse.json({ error: 'Search unavailable' }, { status: 502 })
  }
}
