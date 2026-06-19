// /investigate — the dossier search surface + the free "recently updated" feed.
//
// FREE: the recent-activity feed preview (name + one teaser stat only).
// PRO ($45/mo): the search itself + the sourced connection dossier.
// Non-subscribers see the teaser card → /api/checkout?product=software.
// Nothing about the software search is free (founder lock 2026-05-30).
import Link from 'next/link'
import { getEntitlement } from '@/lib/entitlement'
import { getRecentActivity } from '@/lib/recent-activity'
import { getCreditState } from '@/lib/search-credits'
import InvestigateClient from './InvestigateClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Follow the money — Campaign Receipts',
  description:
    'Search any politician, donor, bill, or vote. See who funds whom — sourced from FEC and Congress data.',
}

const TYPE_LABEL: Record<string, string> = {
  politician: 'Politician',
  donor: 'Big donor',
  bill: 'Bill',
  vote: 'Vote',
}

export default async function InvestigatePage() {
  const ent = await getEntitlement()
  const isPro = ent.tier === 'pro'
  const recent = await getRecentActivity(16)
  const creditState = ent.hasSoftware && ent.user ? await getCreditState(ent.user.id) : null
  const initialCredits = creditState
    ? {
        used: creditState.used,
        allotment: creditState.allotment,
        remaining: creditState.remaining,
        resets_at: creditState.periodEnd,
      }
    : null

  return (
    <section className="bg-paper">
      <div className="section-shell py-14 sm:py-20">
        <div className="max-w-[760px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
            Follow the money
          </div>
          <h1 className="font-display text-[40px] sm:text-[52px] leading-[1.02] tracking-[-0.012em] text-ink text-balance m-0">
            Who paid for this?
          </h1>
          <p className="mt-4 font-sans text-[17px] text-ink-2 leading-[1.55]">
            Search a politician, a donor, a bill, or a vote. We show you who gave the money — and
            who else those same donors pay.
          </p>
          {!isPro && (
            <p className="mt-2 font-sans text-[14px] text-ink-3 leading-[1.5]">
              The search and the sourced dossiers are part of Donor Intelligence — $45/mo.
            </p>
          )}
        </div>

        <div className="mt-8">
          <InvestigateClient hasSoftware={ent.hasSoftware} initialCredits={initialCredits} />
        </div>

        {/* FREE recently-updated feed */}
        <div className="mt-16 max-w-[760px]">
          <h2 className="font-display text-[24px] leading-[1.1] text-ink m-0">Recently updated</h2>
          <p className="mt-2 font-sans text-[14px] text-ink-2">
            {isPro
              ? 'The freshest records we pulled. Click any to open its dossier.'
              : 'The freshest records we pulled. The full sourced dossier is part of Donor Intelligence — $45/mo.'}
          </p>
          <ul className="mt-5 space-y-2 list-none p-0">
            {recent.map((r) => (
              <li key={`${r.entity_type}-${r.entity_id}`}>
                <Link
                  href={
                    isPro
                      ? `/investigate?focus=${r.entity_type}:${encodeURIComponent(r.entity_id)}`
                      : '/pricing'
                  }
                  className="block rounded-lg border border-line bg-paper hover:bg-paper-2 px-4 py-3 no-underline transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-[16px] text-ink leading-tight">{r.label}</span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 border border-line rounded px-1.5 py-0.5">
                      {isPro ? TYPE_LABEL[r.entity_type] : `${TYPE_LABEL[r.entity_type]} · subscriber`}
                    </span>
                  </div>
                  {r.teaser && <div className="mt-1 font-sans text-[13px] text-ink-2">{r.teaser}</div>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
