// GET /api/checkout?product=newsletter|software
//
// Redirects the user to a Lemon Squeezy checkout URL prefilled with their
// email + user_id (so the webhook can match the subscription back to a
// cr_users row). Requires the user to be signed in — if they're not we bounce
// through magic-link sign-in and come back.
//
// Two independently-purchasable products (founder lock 2026-05-30):
//   newsletter — $9/mo weekly money-trail email
//   software   — $45/mo /investigate donor-intelligence dossiers

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { buildCheckoutUrl, type CrProduct, isCheckoutConfigured } from '@/lib/lemonsqueezy'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const product: CrProduct =
    url.searchParams.get('product') === 'newsletter' ? 'newsletter' : 'software'

  if (!isCheckoutConfigured(product)) {
    return NextResponse.redirect(
      new URL('/pricing?error=checkout_not_configured', SITE),
      302,
    )
  }

  const user = await getSessionUser()
  if (!user) {
    const next = `/api/checkout?product=${product}`
    return NextResponse.redirect(
      new URL(`/auth/signin?next=${encodeURIComponent(next)}`, SITE),
      302,
    )
  }

  const checkoutUrl = buildCheckoutUrl({
    product,
    userId: user.id,
    email: user.email,
  })
  return NextResponse.redirect(checkoutUrl, 302)
}
