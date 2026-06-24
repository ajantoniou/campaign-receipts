// GET /api/checkout?product=newsletter
//
// Resolves a Lemon Squeezy checkout URL prefilled with the signed-in user's
// email + user_id (so the webhook can match the subscription back to a cr_users
// row). Requires sign-in — if absent we bounce through magic-link sign-in.
//
// Model (founder 2026-06-20): the only paid product is the weekly newsletter
// ($9/mo). No annual / founding tiers.
//
// ?format=json → return { ok, url | redirect } instead of a 302, so the client
// CheckoutButton can open the URL in the LemonSqueezy overlay (modal). Default
// (no format) keeps the server-redirect behavior for plain links + SEO.

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { buildCheckoutUrl, type CrProduct, isCheckoutConfigured } from '@/lib/lemonsqueezy'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

function resolveProduct(url: URL): CrProduct {
  // Only the newsletter is sold; anything else (legacy 'software') falls back to it.
  return url.searchParams.get('product') === 'software' ? 'software' : 'newsletter'
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const product = resolveProduct(url)
  const asJson = url.searchParams.get('format') === 'json'
  const signinNext = `/api/checkout?product=${product}`

  if (!isCheckoutConfigured(product)) {
    const to = new URL('/pricing?error=checkout_not_configured', SITE)
    return asJson
      ? NextResponse.json({ ok: false, reason: 'not_configured', redirect: to.toString() })
      : NextResponse.redirect(to, 302)
  }

  // Two paths:
  //  (a) ANONYMOUS email-first (founder 2026-06-23): visitor types email in the CTA →
  //      we open the prefilled payment modal directly, NO sign-in wall. The webhook
  //      reconciles by customer email (LS returns it on subscription_created).
  //  (b) Signed-in: use the session user's id+email (best — gives a clean user_id match).
  const emailParam = (url.searchParams.get('email') || '').trim().toLowerCase()
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)
  const user = await getSessionUser()

  if (!user && !validEmail) {
    // No session and no email supplied → ask for an email (client shows the field),
    // or fall back to sign-in for plain links.
    const to = new URL(`/auth/signin?next=${encodeURIComponent(signinNext)}`, SITE)
    return asJson
      ? NextResponse.json({ ok: false, reason: 'email_required', redirect: to.toString() })
      : NextResponse.redirect(to, 302)
  }

  const checkoutUrl = buildCheckoutUrl({
    product,
    userId: user?.id || 'anon',
    email: user?.email || emailParam,
  })
  return asJson
    ? NextResponse.json({ ok: true, url: checkoutUrl })
    : NextResponse.redirect(checkoutUrl, 302)
}
