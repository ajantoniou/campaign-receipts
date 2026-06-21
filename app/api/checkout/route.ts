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

  if (!isCheckoutConfigured(plan)) {
    return NextResponse.redirect(
      new URL('/pricing?error=checkout_not_configured', SITE),
      302,
    )
  }

  const user = await getSessionUser()
  if (!user) {
    const next = `/api/checkout?plan=${plan}`
    return NextResponse.redirect(
      new URL(`/auth/signin?next=${encodeURIComponent(next)}`, SITE),
      302,
    )
  }

  const checkoutUrl = buildCheckoutUrl({
    plan,
    userId: user.id,
    email: user.email,
  })
  return NextResponse.redirect(checkoutUrl, 302)
}
