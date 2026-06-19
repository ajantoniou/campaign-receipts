// /auth/verify/[token] — magic-link landing.
//
// GET shows a "Finish signing in" button; POST consumes the token, drops
// a session cookie, and redirects to ?next (default /dashboard).
//
// GET must never consume: corporate mail gateways (Proofpoint, Microsoft
// Safe Links, Mimecast) fetch every URL in inbound mail to scan for
// phishing. When this route consumed on GET, the scanner became the user —
// it ate the one-time token and minted phantom accounts (all 8 "signups"
// of June 9-10, 2026, sessions dead within seconds). Scanners don't submit
// forms, so consumption happens on the button POST only. Do not add
// JS auto-submit here — sandboxed scanners execute JS and it would
// reintroduce the same hole.

import { NextResponse } from 'next/server'
import { consumeMagicLink, mintSession, setSessionCookie, peekMagicLink } from '@/lib/auth'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

function safeNext(raw: string | null): string {
  // Same-site paths only — an absolute URL here would be an open redirect.
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'
}

function confirmPage(action: string): string {
  return `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Finish signing in — CampaignReceipts</title>
</head>
<body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#faf7f2;color:#1c1917">
<div style="max-width:480px;margin:80px auto;padding:0 24px">
<div style="background:#fff;border:1px solid #e7e2d8;border-radius:12px;padding:32px">
<div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#78716c;margin-bottom:12px">CampaignReceipts</div>
<h1 style="font-size:22px;font-weight:600;margin:0 0 8px">One more click.</h1>
<p style="margin:0 0 24px;color:#57534e;font-size:14px;line-height:1.6">Press the button to finish signing in.</p>
<form method="post" action="${action}">
<button type="submit" style="display:inline-block;background:#f59e0b;color:#0a0a0a;border:0;cursor:pointer;font-weight:600;font-size:14px;padding:12px 20px;border-radius:8px">Finish signing in</button>
</form>
</div>
</div>
</body></html>`
}

export async function GET(
  req: Request,
  { params }: { params: { token: string } },
) {
  const url = new URL(req.url)
  const next = safeNext(url.searchParams.get('next'))

  const usable = await peekMagicLink(params.token).catch(() => false)
  if (!usable) {
    return NextResponse.redirect(new URL('/auth/signin?error=link_invalid', SITE), 302)
  }

  // Token reaches the page only after the DB lookup above, so this is a
  // known base64url value, but encode anyway before embedding in HTML.
  const action = `/auth/verify/${encodeURIComponent(params.token)}?next=${encodeURIComponent(next)}`
  return new NextResponse(confirmPage(action), {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  const url = new URL(req.url)
  const next = safeNext(url.searchParams.get('next'))

  const result = await consumeMagicLink(params.token).catch(() => null)
  if (!result) {
    return NextResponse.redirect(new URL('/auth/signin?error=link_invalid', SITE), 302)
  }

  const sessionToken = await mintSession(result.userId)
  setSessionCookie(sessionToken)

  return NextResponse.redirect(new URL(next, SITE), 302)
}
