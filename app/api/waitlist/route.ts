import { NextResponse } from 'next/server'
import { supabaseService } from '@/lib/supabase'
import { allowAndLogSubmission, clientIp } from '@/lib/form-guard'

export const dynamic = 'force-dynamic'

const _rl = new Map<string, { c: number; r: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now(); const e = _rl.get(ip)
  if (!e || e.r <= now) { _rl.set(ip, { c: 1, r: now + 900_000 }); return false }
  return ++e.c > 5
}

export async function POST(req: Request) {
  const ip = clientIp(req) || 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.redirect(new URL('/?waitlist=rate-limited', req.url), 303)
  }
  const url = new URL(req.url)
  const politicianSlug = url.searchParams.get('politician')
  const form = await req.formData()
  const email = String(form.get('email') || '').trim().toLowerCase()
  const honeypot = String(form.get('website') || '')

  if (!politicianSlug || !email || !email.includes('@')) {
    return NextResponse.redirect(new URL('/?waitlist=invalid', req.url), 303)
  }

  // Honeypot + durable hourly caps; both exits look like success so the
  // caller learns nothing.
  const okRedirect = NextResponse.redirect(
    new URL(`/politician/${politicianSlug}?waitlist=ok`, req.url),
    303,
  )
  if (honeypot) return okRedirect
  const allowed = await allowAndLogSubmission({ form: 'waitlist', email, req })
  if (!allowed) return okRedirect

  const { error } = await supabaseService
    .from('cr_waitlist')
    .insert({ politician_slug: politicianSlug, email })

  if (error && !error.message.includes('duplicate')) {
    console.error('Waitlist insert error:', error)
    return NextResponse.redirect(new URL(`/politician/${politicianSlug}?waitlist=error`, req.url), 303)
  }

  return NextResponse.redirect(new URL(`/politician/${politicianSlug}?waitlist=ok`, req.url), 303)
}
