import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL) throw new Error('Missing SUPABASE_URL')

// Server-side client with service role (use sparingly; bypasses RLS)
export const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// ── Tenant-scoping guard ──────────────────────────────────────────
// Every row in these tables belongs to exactly one user. RLS is enabled +
// forced on them with zero policies, so the anon/authenticated keys can read
// nothing — the ONLY access path is the service-role client above, which
// bypasses RLS. That makes the per-user `.eq(...)` filter the entire tenant
// boundary. `fromUser` makes that filter structurally impossible to forget:
// it REQUIRES a userId and pre-applies it. This map is the single declared
// source of truth for which column carries ownership.
const PER_USER_TABLES = {
  cr_subscribers: 'user_id',
  cr_search_credits: 'user_id',
  cr_search_sessions: 'user_id',
  cr_sessions: 'user_id',
} as const
type PerUserTable = keyof typeof PER_USER_TABLES

/**
 * The sanctioned way to read/update/delete a per-user table. The userId arg is
 * mandatory; each operation pre-applies the ownership `.eq` filter, so no call
 * site can forget it (and an accidental undefined session id throws instead of
 * selecting across all tenants). Chain the rest of the query as normal:
 *
 *   const { data } = await fromUser('cr_subscribers', user.id)
 *     .select('product, status').eq('product', 'software').maybeSingle()
 *   await fromUser('cr_subscribers', user.id)
 *     .update({ status: 'canceled' }).eq('product', product)
 *
 * Note `.eq` lives on the filter builder returned AFTER select/update/delete,
 * which is why this wraps the operation rather than pre-filtering .from().
 * Inserts stay on supabaseService directly (set user_id in the row) — a
 * missing filter only leaks on reads/updates/deletes.
 */
export function fromUser(table: PerUserTable, userId: string) {
  if (!userId) throw new Error(`fromUser(${table}): userId is required`)
  const col = PER_USER_TABLES[table]
  const qb = supabaseService.from(table)
  return {
    // Generic <Q extends string> preserves the caller's column-string literal,
    // so supabase-js infers the row shape (passing a widened `string` makes it
    // fall back to GenericStringError).
    select: <Q extends string>(columns: Q) => qb.select(columns).eq(col, userId),
    update: (values: Record<string, unknown>) => qb.update(values).eq(col, userId),
    delete: () => qb.delete().eq(col, userId),
  }
}

// Read-only client (uses anon key, respects RLS where set)
export const supabaseRead = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

// Table names (cr_ prefix in public schema)
export const TABLES = {
  politicians: 'cr_politicians',
  promises: 'cr_promises',
  receipts: 'cr_receipts',
  waitlist: 'cr_waitlist',
  disputes: 'cr_disputes',
  review_logs: 'cr_review_logs',
} as const

export type Politician = {
  id: string
  slug: string
  name: string
  party: 'Republican' | 'Democratic' | 'Independent' | 'Other'
  branch: 'Senate' | 'House' | 'Governor' | 'President' | 'Other'
  state: string
  district: string | null
  gender: string | null
  religion: string | null
  minority_status: string | null
  dob: string | null
  age: number | null
  in_office_since: string | null
  in_office_to: string | null
  current_status: string | null
  official_url: string | null
  photo_url: string | null
  ideology_label: string | null
  professional_background: string | null
  profile_narrative: string | null
  scorecard_kept: number
  scorecard_partial: number
  scorecard_broken: number
  scorecard_you_decide: number
  scorecard_total: number
  scorecard_pending: number
  scorecard_graded_total: number
  scorecard_percentage_kept: number | null
  scorecard_limited_corpus?: boolean
  current_term_start: string | null
  current_term_end: string | null
  review_tier?: 'full' | 'standard' | 'book-sourced' | 'pending'
  review_completed_at?: string | null
  last_refreshed_at?: string | null
  page_views_30d?: number
  is_homepage_featured?: boolean
  homepage_featured_order?: number | null
  predecessor_slug?: string | null
  donor_profile?: 'grassroots' | 'mixed' | 'corporate' | 'self-funded' | 'unknown' | null
  fec_candidate_id?: string | null
  bioguide?: string | null
  tenure_summary_md?: string | null
  tenure_summary_built_at?: string | null
}

export type Promise = {
  id: string
  politician_id: string
  promise_number: number
  promise_text: string
  promise_type: 'EXPLICIT' | 'INFERRED' | null
  promise_date: string | null
  promise_source_url: string | null
  category: string | null
  verdict: 'KEPT' | 'PARTIAL' | 'BROKEN' | 'YOU_DECIDE' | 'BLOCKED'
  verdict_reasoning: string | null
  case_study_narrative: string | null
  is_featured: boolean
  featured_quadrant: string | null
  cycle_year: number | null
  term_start: string | null
  term_end: string | null
  verdict_status: 'graded' | 'pending' | 'not_yet_rated'
}

export type Receipt = {
  id: string
  promise_id: string
  quote: string | null
  source_url: string | null
  source_publication: string | null
  source_date: string | null
  paper_trail_notes: string | null
}
