// lib/pro-data.ts — server-side helpers for Pro-tier data primitives.
//
// Three tables added in migration `cr_pro_data_primitives` (rev-7 batch C #7):
//   - cr_pro_watchlists  → saved politician/bill/industry/state watchlists
//   - cr_pro_exports     → audit trail + rate limiting for CSV/JSON exports
//   - cr_pro_alerts      → per-event email/webhook/RSS subscriptions
//
// All three are user-scoped via cr_users(id) and require an active
// cr_subscribers row to read/write. The entitlement check lives in
// lib/entitlement.ts (`getEntitlement`); these helpers assume the
// caller has already gated on tier === 'pro'.
//
// All functions return plain objects — no Supabase-specific types
// leak above this module.

import { supabaseService } from './supabase'

// ── Types ────────────────────────────────────────────────────

export type WatchlistTargetType = 'politician' | 'bill' | 'industry' | 'state'

export type WatchlistEntry = {
  id: string
  user_id: string
  target_type: WatchlistTargetType
  target_key: string
  label: string | null
  enabled: boolean
  created_at: string
  updated_at: string
}

export type ExportDataset =
  | 'politicians'
  | 'promises'
  | 'donor_vote_alignment'
  | 'industry_breakdown'
  | 'foreign_donors'
  | 'bills'
  | 'leaderboard'
  | 'correlations'

export type ExportFormat = 'csv' | 'json' | 'tsv'

export type ExportLogEntry = {
  id: string
  user_id: string
  dataset: ExportDataset
  format: ExportFormat
  params: Record<string, unknown>
  rows_returned: number
  bytes_returned: number
  commercial_license_at_time: boolean
  status: 'completed' | 'rate_limited' | 'failed'
  user_agent: string | null
  created_at: string
}

export type AlertEventType =
  | 'verdict_change'
  | 'new_verdict'
  | 'new_vote'
  | 'new_bill'
  | 'scorecard_recompute'
  | 'weekly_digest'

export type AlertChannel = 'email' | 'webhook' | 'rss'

export type AlertSubscription = {
  id: string
  user_id: string
  watchlist_id: string | null
  event_type: AlertEventType
  channel: AlertChannel
  webhook_url: string | null
  enabled: boolean
  last_fired_at: string | null
  fire_count: number
  created_at: string
  updated_at: string
}

// ── Watchlist helpers ───────────────────────────────────────

export async function listWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const { data } = await supabaseService
    .from('cr_pro_watchlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data as WatchlistEntry[]) || []
}

export async function addToWatchlist(
  userId: string,
  targetType: WatchlistTargetType,
  targetKey: string,
  label?: string,
): Promise<WatchlistEntry | null> {
  // Idempotent: unique (user_id, target_type, target_key) on the table.
  const { data, error } = await supabaseService
    .from('cr_pro_watchlists')
    .upsert(
      {
        user_id: userId,
        target_type: targetType,
        target_key: targetKey,
        label: label ?? null,
        enabled: true,
      },
      { onConflict: 'user_id,target_type,target_key' },
    )
    .select()
    .maybeSingle()
  if (error) {
    console.error('addToWatchlist failed:', error)
    return null
  }
  return (data as WatchlistEntry) || null
}

export async function removeFromWatchlist(userId: string, watchlistId: string): Promise<boolean> {
  const { error } = await supabaseService
    .from('cr_pro_watchlists')
    .delete()
    .eq('user_id', userId)
    .eq('id', watchlistId)
  return !error
}

export async function setWatchlistEnabled(
  userId: string,
  watchlistId: string,
  enabled: boolean,
): Promise<boolean> {
  const { error } = await supabaseService
    .from('cr_pro_watchlists')
    .update({ enabled })
    .eq('user_id', userId)
    .eq('id', watchlistId)
  return !error
}

// ── Export-log helpers ──────────────────────────────────────

/** Log a completed (or attempted) export. Returns the inserted row id. */
export async function logExport(args: {
  userId: string
  dataset: ExportDataset
  format: ExportFormat
  params?: Record<string, unknown>
  rowsReturned: number
  bytesReturned: number
  commercialLicense: boolean
  status?: 'completed' | 'rate_limited' | 'failed'
  userAgent?: string
}): Promise<string | null> {
  const { data } = await supabaseService
    .from('cr_pro_exports')
    .insert({
      user_id: args.userId,
      dataset: args.dataset,
      format: args.format,
      params: args.params ?? {},
      rows_returned: args.rowsReturned,
      bytes_returned: args.bytesReturned,
      commercial_license_at_time: args.commercialLicense,
      status: args.status ?? 'completed',
      user_agent: args.userAgent ?? null,
    })
    .select('id')
    .maybeSingle()
  return (data as { id: string } | null)?.id ?? null
}

/** How many rows / bytes has this user pulled in the current calendar month?
 *  Used by the rate-limit check before serving a Pro export. */
export async function getMonthlyExportUsage(userId: string): Promise<{
  rows: number
  bytes: number
  count: number
}> {
  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  const { data } = await supabaseService
    .from('cr_pro_exports')
    .select('rows_returned, bytes_returned')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('created_at', monthStart.toISOString())

  const rows = (data as { rows_returned: number; bytes_returned: number }[] | null) || []
  return {
    rows: rows.reduce((s, r) => s + (r.rows_returned || 0), 0),
    bytes: rows.reduce((s, r) => s + (r.bytes_returned || 0), 0),
    count: rows.length,
  }
}

// ── Alert helpers ───────────────────────────────────────────

export async function listAlerts(userId: string): Promise<AlertSubscription[]> {
  const { data } = await supabaseService
    .from('cr_pro_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data as AlertSubscription[]) || []
}

export async function createAlert(args: {
  userId: string
  watchlistId?: string
  eventType: AlertEventType
  channel?: AlertChannel
  webhookUrl?: string
}): Promise<AlertSubscription | null> {
  const { data, error } = await supabaseService
    .from('cr_pro_alerts')
    .insert({
      user_id: args.userId,
      watchlist_id: args.watchlistId ?? null,
      event_type: args.eventType,
      channel: args.channel ?? 'email',
      webhook_url: args.webhookUrl ?? null,
      enabled: true,
    })
    .select()
    .maybeSingle()
  if (error) {
    console.error('createAlert failed:', error)
    return null
  }
  return (data as AlertSubscription) || null
}

export async function setAlertEnabled(
  userId: string,
  alertId: string,
  enabled: boolean,
): Promise<boolean> {
  const { error } = await supabaseService
    .from('cr_pro_alerts')
    .update({ enabled })
    .eq('user_id', userId)
    .eq('id', alertId)
  return !error
}

export async function recordAlertFire(alertId: string): Promise<void> {
  // Two-step write because postgres-rest doesn't support raw expression
  // bumps cleanly from the JS client. Read-then-write is fine here —
  // the alert-firing cron is single-writer and not contention-prone.
  const { data } = await supabaseService
    .from('cr_pro_alerts')
    .select('fire_count')
    .eq('id', alertId)
    .maybeSingle()
  const current = (data as { fire_count: number } | null)?.fire_count ?? 0
  await supabaseService
    .from('cr_pro_alerts')
    .update({ fire_count: current + 1, last_fired_at: new Date().toISOString() })
    .eq('id', alertId)
}

/** Find all enabled alerts of a given event_type — used by the cron
 *  that walks recent verdict changes / new votes / new bills. */
export async function getAlertsByEventType(
  eventType: AlertEventType,
): Promise<AlertSubscription[]> {
  const { data } = await supabaseService
    .from('cr_pro_alerts')
    .select('*')
    .eq('event_type', eventType)
    .eq('enabled', true)
  return (data as AlertSubscription[]) || []
}
