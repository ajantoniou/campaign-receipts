// ActiveRacesStrip — homepage "live operating system" feature.
//
// Per Phase 2 of the original plan (queued since 2026-05-17, finally
// shipping). Surfaces 3-5 active U.S. races with money totals + days-
// to-primary countdowns. Slots between the hero CharacterCard and
// the 5-value-prop showcase.
//
// Data: cr_races where is_active = true AND primary_date >= today.
// Self-pruning via the daily cron + the SQL filter — once a race
// passes, it auto-disappears here. The /race index keeps the long-
// view; this strip is the daily-check homepage anchor.
//
// Per panel rule: real-as-of timestamps only. The "X days out"
// countdown is computed from primary_date, not faked.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'

type RaceRow = {
  slug: string
  district: string | null
  state: string | null
  headline: string
  primary_date: string | null
  total_ie_usd: number | null
  total_spend_usd: number | null
  candidates: Array<{ name: string; party: string; incumbent?: boolean }>
}

async function getActiveRaces(): Promise<RaceRow[]> {
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabaseService
    .from('cr_races')
    .select('slug, district, state, headline, primary_date, total_ie_usd, total_spend_usd, candidates')
    .eq('is_active', true)
    .gte('primary_date', today)
    .order('primary_date', { ascending: true, nullsFirst: false })
    .limit(5)
  return (data as RaceRow[]) || []
}

function fmtMoney(n: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${n}`
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const target = new Date(iso + 'T12:00:00Z').getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function ActiveRacesStrip() {
  const races = await getActiveRaces()
  if (races.length === 0) return null

  // Compute total spend across active races for the section eyebrow.
  const totalIE = races.reduce((sum, r) => sum + (Number(r.total_ie_usd) || 0), 0)

  return (
    <section className="bg-paper-2 border-y border-line">
      <div className="section-shell py-10 sm:py-12">
        <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
          <div className="max-w-[640px]">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-broken mb-2 inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
              Active campaign races · live money tracker
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.005em] text-ink text-balance m-0">
              {totalIE > 0 ? (
                <>
                  <span className="text-broken font-medium">
                    {fmtMoney(totalIE)}
                  </span>
                  {' '}of super-PAC IE in {races.length} races we're tracking right now.
                </>
              ) : (
                <>{races.length} primaries we're tracking right now.</>
              )}
            </h2>
          </div>
          <Link
            href="/race"
            className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink"
          >
            All races →
          </Link>
        </div>

        {/* Horizontal scroll row on mobile, grid on desktop */}
        <ol className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {races.slice(0, 3).map((r) => {
            const days = daysUntil(r.primary_date)
            const imminent = days != null && days <= 7 && days >= 0
            return (
              <li key={r.slug}>
                <Link
                  href={`/race/${r.slug}`}
                  className={`group block h-full rounded-lg border ${
                    imminent ? 'border-broken/40 hover:border-broken' : 'border-line hover:border-ink-3'
                  } bg-paper hover:bg-bone transition-all p-4 sm:p-5 no-underline`}
                >
                  <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                      {r.district || r.state || '—'} · {fmtDate(r.primary_date)}
                    </span>
                    {days != null && days >= 0 && (
                      <span
                        className={`font-mono text-[10px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border ${
                          imminent
                            ? 'bg-broken/[0.08] text-broken border-broken/30'
                            : 'bg-paper-3 text-ink-2 border-line'
                        }`}
                      >
                        {days === 0 ? 'Today' : `In ${days}d`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-[18px] sm:text-[20px] leading-[1.15] tracking-[-0.005em] text-ink m-0 mb-3">
                    {r.headline.length > 90 ? r.headline.slice(0, 87) + '…' : r.headline}
                  </h3>

                  {/* Candidates */}
                  {r.candidates && r.candidates.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {r.candidates.slice(0, 2).map((c, i) => (
                        <div
                          key={i}
                          className="flex items-baseline gap-2 font-sans text-[13px]"
                        >
                          <span
                            className={`font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded border shrink-0 ${
                              c.party === 'Republican'
                                ? 'bg-broken/[0.08] text-broken border-broken/30'
                                : c.party === 'Democratic'
                                  ? 'bg-pending/[0.08] text-pending border-pending/30'
                                  : 'bg-paper-3 text-ink-2 border-line'
                            }`}
                          >
                            {c.party[0]}
                            {c.incumbent ? '·inc' : ''}
                          </span>
                          <span className="text-ink truncate">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Money line */}
                  {(r.total_ie_usd != null || r.total_spend_usd != null) && (
                    <div className="pt-3 border-t border-dotted border-line flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                      <span className="text-ink-3">
                        Super-PAC IE
                      </span>
                      <span className="text-broken tabular-nums">
                        {fmtMoney(r.total_ie_usd)}
                      </span>
                    </div>
                  )}

                  <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 group-hover:text-broken transition-colors">
                    Open race →
                  </div>
                </Link>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
