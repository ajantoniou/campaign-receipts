// lib/search-credits.ts — the 100/mo credit meter for the $45 software product.
//
// PROFITABILITY LOCK: $45/mo = 100 credits. 1 credit = 1 SEARCH SESSION (an
// initial sourced summary + free follow-up turns until the context fills). The
// 100/mo hard cap + Haiku + prompt-caching are what keep the company under the
// $500 cap and the product at ~75% margin.
//
// Credits reset monthly on the sub's billing period. We derive the current
// period from cr_subscribers.current_period_end: the active period is
// [period_end - 1 month, period_end). If there's no period_end (e.g. trial),
// we fall back to a calendar-month rolling window anchored on first use.

import { supabaseService, fromUser } from './supabase'

export const MONTHLY_ALLOTMENT = 100
// Free tier (account-gated, no card): a small monthly taste of the engine,
// web-search OFF. 5/mo × DB-only Haiku dossier caps COGS to a few cents/user.
export const FREE_ALLOTMENT = 5

export type CreditState = {
  periodStart: string
  periodEnd: string
  allotment: number
  used: number
  remaining: number
}

function subtractOneMonth(d: Date): Date {
  const out = new Date(d)
  out.setMonth(out.getMonth() - 1)
  return out
}

// Resolve the current billing window for a user from their software sub.
async function resolvePeriod(userId: string): Promise<{ start: Date; end: Date }> {
  const { data: sub } = await fromUser('cr_subscribers', userId)
    .select('current_period_end')
    .eq('product', 'software')
    .maybeSingle()

  const now = new Date()
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null

  if (periodEnd && periodEnd.getTime() > now.getTime()) {
    return { start: subtractOneMonth(periodEnd), end: periodEnd }
  }
  // Fallback: rolling calendar month from now (trial / missing renews_at).
  const end = new Date(now)
  end.setMonth(end.getMonth() + 1)
  return { start: now, end }
}

// Get-or-create the credit row for the user's current period.
// `allotment` sets the cap for a NEWLY created period row (free=5, paid=100).
// Existing rows keep whatever allotment they were created with until the next
// period resets — so a user who upgrades mid-period gets the new cap next cycle.
export async function getCreditState(
  userId: string,
  allotment: number = MONTHLY_ALLOTMENT,
): Promise<CreditState> {
  const { start, end } = await resolvePeriod(userId)
  const periodStart = start.toISOString()
  const periodEnd = end.toISOString()

  const { data: existing } = await fromUser('cr_search_credits', userId)
    .select('credits_allotment, credits_used')
    .eq('period_start', periodStart)
    .maybeSingle()

  if (existing) {
    const remaining = Math.max(0, existing.credits_allotment - existing.credits_used)
    return {
      periodStart,
      periodEnd,
      allotment: existing.credits_allotment,
      used: existing.credits_used,
      remaining,
    }
  }

  // New period → fresh allotment. (Monthly reset is implicit: a new period_start
  // means a new row with credits_used=0.)
  const { data: created } = await supabaseService
    .from('cr_search_credits')
    .upsert(
      {
        user_id: userId,
        period_start: periodStart,
        period_end: periodEnd,
        credits_allotment: allotment,
        credits_used: 0,
      },
      { onConflict: 'user_id,period_start' },
    )
    .select('credits_allotment, credits_used')
    .single()

  return {
    periodStart,
    periodEnd,
    allotment: created?.credits_allotment ?? allotment,
    used: created?.credits_used ?? 0,
    remaining: (created?.credits_allotment ?? allotment) - (created?.credits_used ?? 0),
  }
}

// Atomically consume 1 credit for a NEW session. Returns the new state, or
// null if the user is already at the cap (HARD block at 100/mo).
// Uses a guarded UPDATE (credits_used < allotment) so concurrent session starts
// can't push past the cap.
export async function useOneCredit(userId: string): Promise<CreditState | null> {
  const state = await getCreditState(userId) // ensures the row exists
  if (state.remaining <= 0) return null

  const { data, error } = await supabaseService
    .rpc('cr_use_search_credit', {
      p_user_id: userId,
      p_period_start: state.periodStart,
    })

  if (error) {
    // The RPC raises 'at cap' when the guarded UPDATE matched no row (already at
    // the limit or lost a concurrent race). Re-read and refuse if no headroom.
    const fresh = await getCreditState(userId)
    if (fresh.remaining <= 0) return null
    // Headroom exists but the atomic path failed for another reason — refuse
    // rather than risk over-billing the cap.
    console.error('useOneCredit: RPC failed with headroom remaining:', error.message)
    return null
  }

  // RPC returns the new credits_used.
  const newUsed = typeof data === 'number' ? data : state.used + 1
  if (newUsed > state.allotment) return null
  return { ...state, used: newUsed, remaining: state.allotment - newUsed }
}
