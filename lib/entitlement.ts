// Entitlement resolution for the paywall. Called by every server component
// or route that needs to decide free vs paid.
//
// Founder pricing lock 2026-05-30: TWO independent paid entitlements —
//   - hasSoftware : the $45/mo /investigate donor-intelligence dossiers
//                   (and every other "Pro data" surface: full bill sponsors,
//                   leaderboard evidence, correlations, politician pro data).
//   - hasNewsletter : the $9/mo weekly money-trail email.
// A user may hold one, the other, or both.
//
// A product entitlement is live if the user has a cr_subscribers row for that
// product with status in ('trialing','active') AND any time bound is still in
// the future.
//
// Backward-compat: getEntitlement() still returns a `tier` of 'free'|'pro',
// where 'pro' === hasSoftware. Every existing `ent.tier === 'pro'` caller gates
// the data product, which is exactly the software entitlement — so no caller
// behavior changes. New code should prefer hasSoftware / hasNewsletter.

import { fromUser } from './supabase'
import { getSessionUser, type SessionUser } from './auth'

export type Tier = 'free' | 'pro'
export type CrProduct = 'newsletter' | 'software'

type ProductStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired'

export type Entitlement = {
  // Backward-compat: 'pro' iff the software (data product) entitlement is live.
  tier: Tier
  user: SessionUser | null
  status: 'anonymous' | 'free' | 'trialing' | 'active' | 'expired' | 'canceled'
  source: 'lemonsqueezy' | 'trial_code' | 'magic_link_trial' | null
  commercialLicense: boolean
  expiresAt: string | null
  // Independent per-product flags (the canonical model).
  hasSoftware: boolean
  hasNewsletter: boolean
  // The raw cr_subscribers rows for this user (already fetched here — callers
  // like /dashboard render off these instead of re-querying the table).
  rows: SubRow[]
}

// Canonical subscriber-row shape. Exported so the dashboard and the cancel
// route share ONE type + ONE liveness rule (no drift between copies).
export type SubRow = {
  product: CrProduct
  status: ProductStatus
  source: string | null
  trial_ends_at: string | null
  current_period_end: string | null
  commercial_license: boolean
  stripe_subscription_id: string | null
}

// A row is a manual/comp grant (not a real Lemon Squeezy subscription) when it
// has no billing-provider subscription id — EXCEPT a 'trialing' row, which has
// its own trial_ends_at to show and must render as a trial, not a permanent
// comp. (A trial code redeemed via lib/redeem.ts produces exactly this shape:
// status='trialing', no stripe_subscription_id.) Comps are revoked internally,
// never self-canceled — the dashboard must not show them a Cancel button or a
// "renews on <far-future date>" line.
export function isCompRow(sub: Pick<SubRow, 'stripe_subscription_id' | 'status'>): boolean {
  return !sub.stripe_subscription_id && sub.status !== 'trialing'
}

export function isRowActive(sub: SubRow): boolean {
  const now = Date.now()
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : null
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end).getTime() : null
  return (
    (sub.status === 'trialing' && trialEnd != null && trialEnd > now) ||
    (sub.status === 'active' && (periodEnd == null || periodEnd > now)) ||
    // Self-serve cancel marks the row 'canceled' but Lemon Squeezy cancels at
    // PERIOD END — the customer keeps access for the month they already paid.
    (sub.status === 'canceled' && periodEnd != null && periodEnd > now)
  )
}

// MODEL CHANGE (founder 2026-06-20): all donor-influence DATA is now FREE. The
// only paid product is the newsletter. Every data paywall in the app gates on
// `ent.tier === 'pro'` / `hasSoftware`, so we make those universally true here —
// one chokepoint instead of editing 30+ call sites. `hasNewsletter` is still
// computed from real subscriptions (the newsletter remains paid), and the raw
// `rows` are still returned so /dashboard can manage real subscriptions.
const FREE_DATA_FOR_ALL = true

export async function getEntitlement(): Promise<Entitlement> {
  const user = await getSessionUser()
  if (!user) {
    return {
      tier: FREE_DATA_FOR_ALL ? 'pro' : 'free',
      user: null,
      status: 'anonymous',
      source: null,
      commercialLicense: false,
      expiresAt: null,
      hasSoftware: FREE_DATA_FOR_ALL,
      hasNewsletter: false,
      rows: [],
    }
  }

  const { data: subs, error } = await fromUser('cr_subscribers', user.id).select(
    'product, status, source, trial_ends_at, current_period_end, commercial_license, stripe_subscription_id',
  )

  // A transient cr_subscribers error must NOT crash the page. This gate is read
  // by public, read-only server components (politician / bill / leaderboard) that
  // have no error boundary — throwing here would 500 those pages for a signed-in
  // visitor on a momentary DB blip. Fail SOFT: log it and degrade to free for
  // this one request. The gate re-runs every request, so it self-heals the
  // instant the DB recovers; a one-request free view is far less harmful than a
  // hard 500 on the SEO pages we want crawled. (Paid surfaces re-gate on the
  // next load — no durable downgrade.)
  if (error) {
    console.error('getEntitlement: cr_subscribers query failed, degrading to free:', error.message)
    return {
      tier: FREE_DATA_FOR_ALL ? 'pro' : 'free',
      user,
      status: 'free',
      source: null,
      commercialLicense: false,
      expiresAt: null,
      hasSoftware: FREE_DATA_FOR_ALL,
      hasNewsletter: false,
      rows: [],
    }
  }

  const rows = (subs ?? []) as SubRow[]
  const software = rows.find((r) => r.product === 'software') ?? null
  const newsletter = rows.find((r) => r.product === 'newsletter') ?? null

  // Donor data is free for all → hasSoftware is always true. Newsletter stays paid.
  const hasSoftware = FREE_DATA_FOR_ALL ? true : (software ? isRowActive(software) : false)
  const hasNewsletter = newsletter ? isRowActive(newsletter) : false

  if (rows.length === 0) {
    return {
      tier: FREE_DATA_FOR_ALL ? 'pro' : 'free',
      user,
      status: 'free',
      source: null,
      commercialLicense: false,
      expiresAt: null,
      hasSoftware: FREE_DATA_FOR_ALL,
      hasNewsletter: false,
      rows,
    }
  }

  // The legacy `tier`/`status`/`source`/`expiresAt`/`commercialLicense` fields
  // describe the data product (software) — that's what every existing
  // `ent.tier === 'pro'` gate is checking.
  const primary = software
  const primaryActive = hasSoftware
  const expiresAt = primary
    ? primary.status === 'trialing'
      ? primary.trial_ends_at
      : primary.current_period_end
    : null

  return {
    tier: hasSoftware ? 'pro' : 'free',
    user,
    status: primary
      ? primaryActive
        ? (primary.status as 'trialing' | 'active')
        : 'expired'
      : 'free',
    source: (primary?.source as Entitlement['source']) ?? null,
    commercialLicense: primaryActive && !!primary?.commercial_license,
    expiresAt,
    hasSoftware,
    hasNewsletter,
    rows,
  }
}

export async function requirePro(): Promise<Entitlement> {
  const ent = await getEntitlement()
  return ent
}
