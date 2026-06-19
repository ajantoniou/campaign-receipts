// GET /c/[token]  —  tracked newsletter redirect (c = click).
//
// (Path is /c not /r because /r/[id] is already the public share-receipt page.)
// The Friday newsletter's three article links are minted as /c/<token> at
// build time (scripts/weekly-content-build.mjs). The token is OPAQUE — it
// encodes nothing; the (issue, article, destination) it maps to lives only
// in cr_newsletter_links server-side. No issue_id / slug / user_id is ever
// in the URL, which keeps the privacy-first posture: a forwarded link leaks
// no identity.
//
// Behavior:
//   - look up the token (service role; these tables are server-only)
//   - log ONE click row (fire-and-forget — a logging failure must NEVER
//     block the reader's redirect)
//   - 302 to the destination, but ONLY if its host is allowlisted (so this
//     can't be abused as an open redirector)
//   - any miss / bad token / bad host → 302 to the site root (fail safe;
//     the reader never sees an error)
//
// The Saturday founder email (scripts/saturday-most-viewed.mjs) aggregates
// cr_newsletter_clicks to help rank which article won the week.

import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { supabaseService } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

// Only ever redirect to our own site — never an attacker-supplied host.
function hostAllowed(dest: string): boolean {
  try {
    const d = new URL(dest)
    const site = new URL(SITE)
    return d.protocol === 'https:' && d.hostname === site.hostname
  } catch {
    return false
  }
}

const fail = () => NextResponse.redirect(new URL('/', SITE), 302)

export async function GET(
  req: Request,
  { params }: { params: { token: string } },
) {
  const token = params?.token
  if (!token || token.length > 64) return fail()

  const { data: link } = await supabaseService
    .from('cr_newsletter_links')
    .select('token, issue_id, week_of, article_slug, user_id, destination')
    .eq('token', token)
    .maybeSingle()

  if (!link || !hostAllowed(link.destination)) return fail()

  // Fire-and-forget click log. A dedupe-only UA hash — never the raw UA, never IP.
  const ua = req.headers.get('user-agent') || ''
  const uaHash = ua ? createHash('sha256').update(ua).digest('hex').slice(0, 16) : null
  try {
    await supabaseService.from('cr_newsletter_clicks').insert({
      token: link.token,
      issue_id: link.issue_id,
      week_of: link.week_of,
      article_slug: link.article_slug,
      user_id: link.user_id,
      ua_hash: uaHash,
    })
  } catch {
    // Never block the redirect on a logging failure.
  }

  const res = NextResponse.redirect(link.destination, 302)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('Referrer-Policy', 'no-referrer')
  return res
}
