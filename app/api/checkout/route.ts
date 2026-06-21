// GET /api/checkout?plan=newsletter|newsletter-annual|newsletter-founding
//
// Redirects the user to a Lemon Squeezy checkout URL prefilled with their
// email + user_id (so the webhook can match the subscription back to a
// cr_users row). Requires the user to be signed in — if they're not we bounce
// through magic-link sign-in and come back.
//
// Model (founder 2026-06-20): the only paid product is the weekly newsletter,
// in three plans (monthly $12 / annual $96 / founding $79). All grant the
// 'newsletter' entitlement. Back-compat: ?product=newsletter still works and
// maps to the monthly plan.

import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { buildCheckoutUrl, type CrPlan, isCheckoutConfigured } from '@/lib/lemonsqueezy'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

const VALID_PLANS: CrPlan[] = ['newsletter', 'newsletter-annual', 'newsletter-founding']

function resolvePlan(url: URL): CrPlan {
  const planParam = url.searchParams.get('plan')
  if (planParam && VALID_PLANS.includes(planParam as CrPlan)) return planParam as CrPlan
  // Back-compat: legacy ?product=newsletter (or anything else) → monthly newsletter.
  return 'newsletter'
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const plan = resolvePlan(url)
  // ?format=json → return the resolved URL/sign-in target instead of redirecting,
  // so the client CheckoutButton can open it in the LemonSqueezy overlay (modal).
  // Default (no format) keeps the server-redirect behavior for plain links + SEO.
  const asJson = url.searchParams.get('format') === 'json'

  const signinNext = `/api/checkout?plan=${plan}`

  if (!isCheckoutConfigured(plan)) {
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
    plan,
    userId: user.id,
    email: user.email,
  })
  return asJson
    ? NextResponse.json({ ok: true, url: checkoutUrl })
    : NextResponse.redirect(checkoutUrl, 302)
}
