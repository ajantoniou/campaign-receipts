// LiveActivityStrip — the Bloomberg-terminal ticker.
//
// Per founder rev-7 (2026-05-19): CR is repositioned as the "live
// operating system for tracking political incentives." This strip
// gives the homepage that terminal feel — auto-rotating items with
// real-as-of timestamps (NEVER inflated; primary-source time is the
// credibility anchor).
//
// Reads cr_homepage_pulse (populated by snapshot-homepage-pulse.mjs).
// Each item is clickable to its source dossier. Items expire after
// 24-72h depending on kind so the ticker stays fresh without manual
// pruning.
//
// Visual rules per the panel:
//   - paper-warm, no flashy colors
//   - subtle animation only (CSS marquee, no JS rotation jank)
//   - timestamps visible ("filed 6h ago")
//   - kind chip on the left (FEC FILING / RACE / NEW BILL / etc)
//   - mobile: horizontal scroll, no fade

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'

type PulseItem = {
  id: string
  kind: string
  title: string
  subtitle: string | null
  href: string
  real_as_of_at: string
  priority: number
}

async function getPulse(): Promise<PulseItem[]> {
  const nowIso = new Date().toISOString()
  const { data } = await supabaseService
    .from('cr_homepage_pulse')
    .select('id, kind, title, subtitle, href, real_as_of_at, priority')
    .eq('hidden', false)
    .gte('expires_at', nowIso)
    .order('priority', { ascending: false })
    .order('real_as_of_at', { ascending: false })
    .limit(20)
  return ((data as PulseItem[]) || [])
}

function fmtRelative(iso: string): string {
  const t = new Date(iso).getTime()
  const ageMs = Date.now() - t
  const mins = Math.round(ageMs / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

const KIND_LABEL: Record<string, string> = {
  fec_filing: 'FEC FILING',
  verdict_change: 'VERDICT',
  race_spend_delta: 'RACE',
  top_donor_flip: 'DONOR',
  new_bill: 'NEW BILL',
  pac_filing: 'PAC',
  verdict_under_review: 'UNDER REVIEW',
}

export default async function LiveActivityStrip() {
  const items = await getPulse()

  // Edge case: empty pulse. Hide the strip entirely rather than render
  // a "no live activity" stub — that would undercut the terminal feel.
  if (items.length === 0) return null

  // Duplicate items in the rendered stream so the CSS marquee loops
  // smoothly without a visible gap. The duplicate gets aria-hidden.
  const stream = [...items, ...items]

  return (
    <section
      className="live-activity-strip border-b border-line bg-paper relative"
      aria-label="Live activity ticker"
    >
      <div className="section-shell py-2 flex items-center gap-3">
        {/* "LIVE" badge on the left */}
        <div className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-broken">
          <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
          Live
        </div>

        {/* Ticker rail — design-pass 2026-05-19: fade edges live on the
            inner overflow box (.live-activity-rail) so items don't
            visibly slice when they hit the box edge. */}
        <div className="live-activity-rail flex-1 min-w-0 overflow-hidden">
          <div className="live-activity-marquee flex items-center gap-6 whitespace-nowrap">
            {stream.map((item, i) => {
              const isDuplicate = i >= items.length
              return (
                <Link
                  key={`${item.id}-${i}`}
                  href={item.href}
                  aria-hidden={isDuplicate ? true : undefined}
                  tabIndex={isDuplicate ? -1 : undefined}
                  className="inline-flex items-center gap-2 font-mono text-[11px] text-ink-2 hover:text-ink transition-colors no-underline shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-broken/50 focus-visible:ring-offset-1 focus-visible:ring-offset-paper rounded-sm"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-broken px-1.5 py-0.5 rounded border border-broken/30 bg-broken/[0.06]">
                    {KIND_LABEL[item.kind] || item.kind.toUpperCase()}
                  </span>
                  <span className="text-ink">{item.title}</span>
                  <span className="text-ink-3">· {fmtRelative(item.real_as_of_at)}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
