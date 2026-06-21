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

  const user = await getSessionUser()
  if (!user) {
    const to = new URL(`/auth/signin?next=${encodeURIComponent(signinNext)}`, SITE)
    return asJson
      ? NextResponse.json({ ok: false, reason: 'signin_required', redirect: to.toString() })
      : NextResponse.redirect(to, 302)
  }

  const checkoutUrl = buildCheckoutUrl({
    product,
    userId: user.id,
    email: user.email,
  })
  return asJson
    ? NextResponse.json({ ok: true, url: checkoutUrl })
    : NextResponse.redirect(checkoutUrl, 302)
}
