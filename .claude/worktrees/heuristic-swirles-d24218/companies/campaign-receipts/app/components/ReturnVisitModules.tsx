// ReturnVisitModules — 4-card row that gives the homepage a "site
// evolves daily" feel. Per founder rev-7 (2026-05-19): goal is
// returning visitors should immediately see what changed since their
// last visit.
//
// Four modules:
//   1. Changed in last 24h         (cr_homepage_pulse — most recent items)
//   2. Most contested verdicts     (cr_homepage_pulse where kind='verdict_under_review')
//   3. Biggest filing this week    (cr_homepage_pulse where kind='fec_filing', ordered by amount)
//   4. Active races · spend leaders (cr_races where is_active, ordered by total_spend_usd)
//
// All four read from existing tables — no new schema needed.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'

type ModuleItem = {
  title: string
  subtitle?: string | null
  href: string
  meta?: string | null
}

async function getChangedLast24h(): Promise<ModuleItem[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data } = await supabaseService
    .from('cr_homepage_pulse')
    .select('kind, title, subtitle, href, real_as_of_at')
    .gte('real_as_of_at', since)
    .eq('hidden', false)
    .order('real_as_of_at', { ascending: false })
    .limit(5)
  return ((data as any[]) || []).map((r) => ({
    title: r.title,
    subtitle: r.subtitle,
    href: r.href,
    meta: r.kind?.replace(/_/g, ' '),
  }))
}

async function getUnderReview(): Promise<ModuleItem[]> {
  const { data } = await supabaseService
    .from('cr_homepage_pulse')
    .select('title, subtitle, href, real_as_of_at')
    .eq('kind', 'verdict_under_review')
    .eq('hidden', false)
    .order('real_as_of_at', { ascending: false })
    .limit(5)
  return ((data as any[]) || []).map((r) => ({
    title: r.title,
    subtitle: r.subtitle,
    href: r.href,
  }))
}

async function getBiggestFilings(): Promise<ModuleItem[]> {
  const { data } = await supabaseService
    .from('cr_foreign_donor_records')
    .select('recipient_name, amount_usd, category, source_url, source_date')
    .not('amount_usd', 'is', null)
    .order('amount_usd', { ascending: false })
    .limit(5)
  return ((data as any[]) || []).map((r) => {
    const amount = Number(r.amount_usd)
    const fmt = amount >= 1_000_000 ? `$${(amount / 1_000_000).toFixed(1)}M` : `$${Math.round(amount / 1_000)}K`
    return {
      title: `${fmt} · ${r.category?.replace(/_/g, ' ')}`,
      subtitle: r.recipient_name?.slice(0, 80) || null,
      href: r.source_url || '/foreign-donors',
      meta: r.source_date?.slice(0, 10),
    }
  })
}

async function getActiveRaceLeaders(): Promise<ModuleItem[]> {
  const { data } = await supabaseService
    .from('cr_races')
    .select('slug, district, state, headline, total_spend_usd, primary_date')
    .eq('is_active', true)
    .order('total_spend_usd', { ascending: false, nullsFirst: false })
    .limit(5)
  return ((data as any[]) || []).map((r) => {
    const spend = r.total_spend_usd ? `$${(Number(r.total_spend_usd) / 1_000_000).toFixed(1)}M` : '—'
    return {
      title: `${r.district || r.state} · ${spend}`,
      subtitle: r.headline?.slice(0, 80) || null,
      href: `/race/${r.slug}`,
      meta: r.primary_date?.slice(0, 10),
    }
  })
}

export default async function ReturnVisitModules() {
  const [changed, underReview, filings, races] = await Promise.all([
    getChangedLast24h(),
    getUnderReview(),
    getBiggestFilings(),
    getActiveRaceLeaders(),
  ])

  return (
    <section className="bg-paper border-b border-line">
      <div className="section-shell py-10 sm:py-12">
        <div className="mb-5 max-w-[760px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-3 mb-2 inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-amber-stat animate-pulse" aria-hidden />
            Daily check
          </div>
          <h2 className="font-display text-[26px] sm:text-[32px] leading-[1.05] tracking-[-0.005em] text-ink text-balance m-0">
            What changed since you last looked.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ModuleCard
            eyebrow="Changed · last 24h"
            href="/articles"
            items={changed}
            emptyText="Quiet day — no new activity in 24h."
          />
          <ModuleCard
            eyebrow="Most contested verdicts"
            href="/corrections"
            items={underReview}
            emptyText="No verdicts under active review."
          />
          <ModuleCard
            eyebrow="Biggest PAC spend"
            href="/foreign-donors"
            items={filings}
            emptyText="Awaiting next filing cycle."
          />
          <ModuleCard
            eyebrow="Active race spending"
            href="/race"
            items={races}
            emptyText="No active races on file."
          />
        </div>
      </div>
    </section>
  )
}

function ModuleCard({
  eyebrow,
  href,
  items,
  emptyText,
}: {
  eyebrow: string
  href: string
  items: ModuleItem[]
  emptyText: string
}) {
  return (
    <Link
      href={href}
      // Design-pass 2026-05-19: bumped body text from 12px to 13px so
      // it passes the body-text floor; added focus-visible ring;
      // strengthened the resting border (was vanishing against page bg).
      className="block rounded-lg border border-line bg-bone hover:bg-paper-3 hover:border-ink-3 transition-all p-4 no-underline group flex flex-col h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-broken/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-broken mb-3">
        {eyebrow}
      </div>
      {items.length === 0 ? (
        <p className="font-sans text-[13px] text-ink-3 leading-[1.5] m-0 flex-1 italic">
          {emptyText}
        </p>
      ) : (
        <ol className="m-0 p-0 list-none space-y-2 flex-1">
          {items.slice(0, 3).map((it, i) => (
            <li key={i} className="font-sans text-[13px] text-ink leading-[1.4]">
              <div className="truncate font-medium">{it.title}</div>
              {it.subtitle && (
                <div className="truncate font-mono text-[10px] text-ink-3 mt-0.5">
                  {it.subtitle}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2 group-hover:text-broken transition-colors">
        Open all →
      </div>
    </Link>
  )
}
