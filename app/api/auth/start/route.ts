// POST /api/auth/start { email, next, ft, website } → mint magic link + email it.
// Always answers "sent" to avoid leaking which addresses exist.
//
// Abuse hardening (June 2026 — a crawler fed harvested emails through this
// endpoint in same-second batches every ~20 minutes, ~60 Resend sends/day):
//   - `ft` form-origin token proves the signin page was loaded (lib/form-token).
//   - `website` is a honeypot field humans never see; form-filling bots do.
//   - Per-email and per-IP hourly caps on minted links, counted from
//     cr_magic_links. Rate-limited and honeypot requests get the same
//     "sent" redirect so the caller learns nothing.

import { NextResponse } from 'next/server'
import { mintMagicLink, countRecentMagicLinks } from '@/lib/auth'
import { clientIp } from '@/lib/form-guard'
import { verifyFormToken } from '@/lib/form-token'
import { verifyTurnstile } from '@/lib/turnstile'
import { sendMail, magicLinkEmail } from '@/lib/mail'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'
const MAX_LINKS_PER_EMAIL_PER_HOUR = 3
const MAX_LINKS_PER_IP_PER_HOUR = 10

function safeNext(raw: string | null): string {
  // Same-site paths only — an absolute URL here would be an open redirect.
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null)
  const email = (form?.get('email') as string | null)?.trim().toLowerCase() || ''
  const next = safeNext(form?.get('next') as string | null)
  const ft = form?.get('ft') as string | null
  const honeypot = (form?.get('website') as string | null) || ''

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(new URL(`/auth/signin?error=invalid_email`, SITE), 302)
  }

  // No fresh form token → back to the form, which mints a new one. A real
  // user who left the tab open just clicks the button again.
  if (!verifyFormToken(ft)) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=form_expired&next=${encodeURIComponent(next)}`, SITE),
      302,
    )
  }

  const sent = NextResponse.redirect(new URL(`/auth/signin?sent=1`, SITE), 302)
  if (honeypot) return sent

  const ip = clientIp(req)
  const userAgent = req.headers.get('user-agent')

  // Invisible Turnstile challenge. Fails open on a MISSING token (JS off /
  // script blocked / unconfigured) so real users are never locked out;
  // fails closed only on a present-but-invalid token (a bot that faked it).
  // Same silent "sent" redirect on failure so a bot learns nothing.
  const turnstileToken = form?.get('cf-turnstile-response') as string | null
  if (!(await verifyTurnstile(turnstileToken, ip))) return sent

  try {
    const [byEmail, byIp] = await Promise.all([
      countRecentMagicLinks({ email }, 60),
      ip ? countRecentMagicLinks({ ip }, 60) : Promise.resolve(0),
    ])
    if (byEmail >= MAX_LINKS_PER_EMAIL_PER_HOUR || byIp >= MAX_LINKS_PER_IP_PER_HOUR) {
      return sent
    }

    const token = await mintMagicLink(email, { ip, userAgent })
    const verifyUrl = `${SITE}/auth/verify/${token}?next=${encodeURIComponent(next)}`
    const tmpl = magicLinkEmail(verifyUrl)
    await sendMail({ to: email, ...tmpl, from: 'auth' })
  } catch (err) {
    console.error('auth/start', err)
  }

  return sent
}
