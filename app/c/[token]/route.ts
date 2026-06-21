// GET /c/[token]?u=<user_id>
//
// Click-tracking redirect for Friday Receipts newsletter links. The newsletter
// build writes one cr_newsletter_links row per article link (short token →
// target_url). This handler logs a cr_newsletter_clicks row (fire-and-forget) and
// 302s to the real article. The Saturday viral digest rolls these up to pick the
// most-clicked title = the YouTube candidate.
//
// /r/ is taken (share-card page), so clicks live under /c/.

import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'
const IP_SALT = process.env.CLICK_IP_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'cr'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const token = params.token
  const userId = req.nextUrl.searchParams.get('u') || null

  // Resolve the link. If unknown, bounce to the leaderboard rather than error.
  let target = `${SITE}/leaderboard`
  try {
    const { data: link } = await supabaseService
      .from('cr_newsletter_links')
      .select('issue_id, week_of, article_slug, destination')
      .eq('token', token)
      .maybeSingle()

    if (link?.destination) {
      target = link.destination
      // Fire-and-forget click insert (don't block the redirect). Matches the
      // existing cr_newsletter_clicks schema: token, issue_id, week_of,
      // article_slug, user_id, ua_hash.
      const ua = req.headers.get('user-agent') || ''
      const uaHash = ua ? createHash('sha256').update(ua + IP_SALT).digest('hex').slice(0, 32) : null
      void supabaseService.from('cr_newsletter_clicks').insert({
        token,
        issue_id: link.issue_id,
        week_of: link.week_of,
        article_slug: link.article_slug,
        user_id: userId,
        ua_hash: uaHash,
      })
    }
  } catch {
    // never block the redirect on a tracking failure
  }

  return NextResponse.redirect(target, 302)
}
