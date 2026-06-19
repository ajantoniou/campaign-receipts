// Donor → bill-sponsor money trail per bill.
//
// Per design lead's wireframe:
//   - Hero stat ("$4.2M from pharma + insurance to the 12 senators")
//   - Industry breakdown bars (chart, fully visible)
//   - Top-3 sponsors by money (free)
//   - Faded row #4 + ProGate
// Pro view: full co-sponsor table, alerts, CSV.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { supabaseService, type Politician } from '@/lib/supabase'
import { getEntitlement } from '@/lib/entitlement'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import ProGate from '@/app/components/ProGate'
import GraphWatermark from '@/app/components/GraphWatermark'
import CausalTimeline, { type TimelineNode } from '@/app/components/CausalTimeline'
import NewsletterCapture from '@/app/components/NewsletterCapture'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type BillRow = {
  id: string
  congress: number
  bill_type: string
  bill_number: number
  title: string
  short_title: string | null
  summary: string | null
  sponsor_bioguide: string | null
  co_sponsor_bioguides: string[]
  status: string | null
  introduced_at: string | null
  latest_action_at: string | null
  congress_gov_url: string | null
  next_event_date: string | null
  next_event_label: string | null
}

// Editorial-seeded chronology. NULL for ~all bills; populated only on
// the 3-5 hand-picked rollout targets (see scripts/seed-causal-timeline.mjs).
type TimelineNodeRow = {
  sort_index: number
  kind: 'donation' | 'bill' | 'vote' | 'outcome' | 'event'
  title: string
  amount_usd: number | null
  event_date: string | null
  href: string | null
  meta: string | null
}

async function getTimelineNodes(billId: string): Promise<TimelineNodeRow[]> {
  const { data } = await supabaseService
    .from('cr_bill_timeline_nodes')
    .select('sort_index, kind, title, amount_usd, event_date, href, meta')
    .eq('bill_id', billId)
    .order('sort_index')
  return (data || []) as TimelineNodeRow[]
}

type MoneyTrailRow = {
  industry_label: string
  total_from_industry: number
  n_sponsors_funded: number
  lead_sponsor_total: number
  coalition_total: number
  n_coalition: number
  coalition_kind: string
  rank: number
}

const COALITION_NOUN: Record<string, string> = {
  yes_voters: 'who voted to pass it',
  cosponsors: 'co-sponsors',
  sponsor: 'sponsor',
}

async function getBill(congress: number, billType: string, billNumber: number): Promise<BillRow | null> {
  const { data } = await supabaseService
    .from('cr_bills')
    .select('*')
    .eq('congress', congress)
    .eq('bill_type', billType)
    .eq('bill_number', billNumber)
    .maybeSingle()
  return (data as BillRow) || null
}

async function getMoneyTrail(billId: string): Promise<MoneyTrailRow[]> {
  const { data } = await supabaseService
    .from('cr_bill_money_trail')
    .select('industry_label, total_from_industry, n_sponsors_funded, lead_sponsor_total, coalition_total, n_coalition, coalition_kind, rank')
    .eq('bill_id', billId)
    .order('rank')
  return (data || []) as MoneyTrailRow[]
}

async function getSponsorPoliticians(bioguides: string[]): Promise<Politician[]> {
  if (bioguides.length === 0) return []
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .in('bioguide', bioguides)
  return (data as Politician[]) || []
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

function parseSlugParts(slug: string): { type: string; number: number } | null {
  const m = slug.match(/^([a-z]+)-?(\d+)$/i)
  if (!m) return null
  return { type: m[1].toLowerCase(), number: Number(m[2]) }
}

export async function generateMetadata({ params }: { params: { congress: string; number: string } }) {
  const congress = Number(params.congress)
  const parts = parseSlugParts(params.number)
  if (!parts || !congress) return { title: 'Bill — CampaignReceipts' }
  const b = await getBill(congress, parts.type, parts.number)
  if (!b) return { title: 'Bill — CampaignReceipts' }
  return {
    title: `${b.bill_type.toUpperCase()} ${b.bill_number} · ${b.title.slice(0, 80)} | CampaignReceipts`,
    description: `Money behind the sponsors of ${b.bill_type.toUpperCase()} ${b.bill_number}, ${congress}th Congress. Industry totals + sponsor table.`,
    alternates: { canonical: `/bill/${congress}/${b.bill_type}${b.bill_number}` },
  }
}

export default async function BillPage({ params }: { params: { congress: string; number: string } }) {
  const congress = Number(params.congress)
  const parts = parseSlugParts(params.number)
  if (!parts || !congress) notFound()

  const bill = await getBill(congress, parts.type, parts.number)
  if (!bill) notFound()

  const ent = await getEntitlement()
  const isPro = ent.tier === 'pro'

  const [trail, sponsors, timelineRows] = await Promise.all([
    getMoneyTrail(bill.id),
    getSponsorPoliticians([bill.sponsor_bioguide, ...(bill.co_sponsor_bioguides || [])].filter(Boolean) as string[]),
    getTimelineNodes(bill.id),
  ])

  // Editorial-only surface. Bills without seeded nodes get no timeline
  // section — per Phase B panel: "ship to 3-5 hand-picked bills first,
  // not as sitewide auto-component."
  const timelineNodes: TimelineNode[] = timelineRows.map((r) => ({
    kind: r.kind,
    title: r.title,
    amount: r.amount_usd != null ? Number(r.amount_usd) : undefined,
    date: r.event_date,
    href: r.href,
    meta: r.meta,
  }))

  const allBio = [bill.sponsor_bioguide, ...(bill.co_sponsor_bioguides || [])].filter(Boolean) as string[]
  const polByBio = new Map(sponsors.map((s) => [s.bioguide || '', s]))
  const primarySponsor = bill.sponsor_bioguide ? polByBio.get(bill.sponsor_bioguide) : null

  const top2 = trail.slice(0, 2)
  const heroIndustryLabel = top2.map((t) => t.industry_label).join(' + ')
  const heroTotal = top2.reduce((s, t) => s + Number(t.total_from_industry || 0), 0)
  const totalMoney = trail.reduce((s, t) => s + Number(t.total_from_industry || 0), 0)
  const maxIndTotal = Math.max(...trail.map((t) => Number(t.total_from_industry || 0)), 1)

  // Coalition concentration: lead sponsor's $ vs the full coalition's $.
  // Founder's lens — the sponsor is the face; the money is in the coalition.
  const lead0 = trail[0]
  const coalitionKind = lead0?.coalition_kind || 'sponsor'
  const coalitionNoun = COALITION_NOUN[coalitionKind] || 'backing this bill'
  const coalitionSize = Number(lead0?.n_coalition || allBio.length)
  const leadSponsorTop = Number(lead0?.lead_sponsor_total || 0)
  const coalitionTop = Number(lead0?.coalition_total || 0)
  const showConcentration = coalitionKind !== 'sponsor' && coalitionTop > 0

  const visibleSponsors = isPro ? sponsors : sponsors.slice(0, 3)
  const hiddenCount = Math.max(0, sponsors.length - 3)

  // schema.org/Legislation JSON-LD — CR's wedge into "[bill] donors / who
  // funded [bill]" entity queries. Honest, source-backed fields only.
  const billJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Legislation',
    name: bill.title,
    legislationIdentifier: `${bill.bill_type.toUpperCase()} ${bill.bill_number}`,
    legislationType: bill.bill_type.toUpperCase(),
    url: `https://campaignreceipts.com/bill/${congress}/${bill.bill_type}${bill.bill_number}`,
    ...(bill.introduced_at ? { legislationDate: bill.introduced_at } : {}),
    ...(bill.summary ? { description: bill.summary } : {}),
    ...(bill.congress_gov_url ? { sameAs: [bill.congress_gov_url] } : {}),
    ...(primarySponsor
      ? {
          legislationSponsor: {
            '@type': 'Person',
            name: primarySponsor.name,
            url: `https://campaignreceipts.com/politician/${primarySponsor.slug}`,
          },
        }
      : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(billJsonLd) }}
      />
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-10 pb-6">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Back to directory
          </Link>
          <div className="eyebrow mb-2">
            {bill.bill_type.toUpperCase()} {bill.bill_number} · {congress}th Congress
          </div>
          <h1 className="text-display-md text-ink-50 text-balance leading-tight">
            {bill.short_title || bill.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono text-ink-500">
            {bill.status && <span className="text-ink-400">{bill.status.slice(0, 100)}</span>}
            {bill.introduced_at && <span>Introduced {bill.introduced_at}</span>}
            <span>{allBio.length} sponsor{allBio.length === 1 ? '' : 's'}</span>
            {bill.next_event_date && bill.next_event_label && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-broken/30 bg-broken/[0.08] text-broken">
                Next: {bill.next_event_label} · {bill.next_event_date}
              </span>
            )}
            {bill.congress_gov_url && (
              <a
                href={bill.congress_gov_url}
                target="_blank"
                rel="noreferrer"
                className="text-authority-400 hover:text-authority-300 inline-flex items-center gap-1"
              >
                Congress.gov <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </section>

      <article className="section-shell py-8 grid gap-8 max-w-5xl">
        {timelineNodes.length > 0 && (
          <CausalTimeline
            nodes={timelineNodes}
            eyebrow="Causal chronology · primary-source cited"
            headline="Donation → bill → vote → outcome"
          />
        )}

        {trail.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center">
            <div className="text-sm text-ink-300 font-semibold mb-2">
              No money-trail data computed yet for this bill.
            </div>
            <p className="text-xs text-ink-500 max-w-md mx-auto">
              We need at least one sponsor with FEC-classified donor data to surface
              industry totals. Some bills are sponsored entirely by reps outside our
              FEC-tracked corpus.
            </p>
          </div>
        ) : (
          <>
            <div className="relative rounded-2xl ring-1 ring-ink-700 bg-ink-900/60 p-8">
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-3">
                Headline
              </div>
              <div className="flex items-baseline gap-4 flex-wrap">
                <div className="text-5xl font-mono tabular-nums text-authority-400 tracking-tight">
                  {formatMoney(heroTotal)}
                </div>
                <div className="text-lg text-ink-200 leading-tight">
                  from <strong className="text-ink-50">{heroIndustryLabel || 'top donor industries'}</strong>
                  <div className="text-sm text-ink-400 mt-1">
                    to the {coalitionSize} {coalitionSize === 1 ? 'member' : 'members'} {coalitionNoun} (last cycle)
                  </div>
                </div>
              </div>
              {showConcentration && (
                <div className="mt-4 rounded-xl ring-1 ring-ink-800/80 bg-ink-950/40 px-4 py-3 text-sm text-ink-300">
                  The lead sponsor took{' '}
                  <strong className="text-ink-50 font-mono tabular-nums">{formatMoney(leadSponsorTop)}</strong>{' '}
                  from {top2[0]?.industry_label || 'this industry'}. The {coalitionSize} {coalitionNoun} took{' '}
                  <strong className="text-authority-300 font-mono tabular-nums">{formatMoney(coalitionTop)}</strong>.
                </div>
              )}
              <GraphWatermark />
            </div>

            <div className="relative rounded-2xl ring-1 ring-ink-800/80 bg-ink-900/40 p-6">
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-1">
                Money behind the sponsors
              </div>
              <div className="text-xs text-ink-600 mb-5">
                Total: <strong className="text-ink-300">{formatMoney(totalMoney)}</strong> across {trail.length} industries
              </div>
              <div className="space-y-2.5">
                {trail.map((t) => {
                  const widthPct = (Number(t.total_from_industry) / maxIndTotal) * 100
                  return (
                    <div key={t.industry_label} className="flex items-center gap-3">
                      <div className="w-32 text-xs text-ink-300 truncate shrink-0">{t.industry_label}</div>
                      <div className="flex-1 relative h-6 bg-ink-950/60 rounded">
                        <div
                          className="absolute inset-y-0 left-0 bg-authority-500 rounded"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <div className="w-24 text-right text-sm font-mono tabular-nums text-authority-300 shrink-0">
                        {formatMoney(Number(t.total_from_industry))}
                      </div>
                      <div className="w-12 text-right text-[10px] text-ink-600 font-mono shrink-0">
                        {t.n_coalition ?? t.n_sponsors_funded}
                      </div>
                    </div>
                  )
                })}
              </div>
              <GraphWatermark />
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-3">
                {isPro ? 'All sponsors' : 'Top 3 sponsors'}
              </div>
              <ul className="grid gap-2">
                {visibleSponsors.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/politician/${s.slug}`}
                      className="flex items-center gap-3 rounded-lg ring-1 ring-ink-800/80 bg-ink-900/40 hover:bg-ink-900/70 p-3"
                    >
                      <PoliticianAvatar name={s.name} party={s.party} photoUrl={s.photo_url} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-ink-50 truncate">{s.name}</div>
                        <div className="text-[10px] font-mono text-ink-500">
                          {s.party[0]} · {s.state} · {s.branch} · donor profile: {s.donor_profile || '—'}
                          {primarySponsor?.id === s.id && (
                            <span className="ml-2 text-authority-400">PRIMARY SPONSOR</span>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="size-3.5 text-ink-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {!isPro && hiddenCount > 0 && (
              <div className="grid gap-3">
                {sponsors[3] && (
                  <div
                    className="rounded-lg ring-1 ring-ink-800/80 bg-ink-900/40 p-3 opacity-30 blur-[1.5px] pointer-events-none select-none"
                    aria-hidden
                  >
                    <div className="text-sm text-ink-200">
                      {sponsors[3].name} ({sponsors[3].party[0]}-{sponsors[3].state})
                    </div>
                  </div>
                )}
                <ProGate
                  headline={`See all ${sponsors.length} sponsors · industry × sponsor matrix · CSV · alert me on status change`}
                  ctaLabel="Join the bundle waitlist →"
                />
              </div>
            )}

            {isPro && (
              <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="text-xs text-ink-400">
                  You're on the Bundle. Get status-change alerts on this bill.
                </div>
                <a
                  href={`/api/bills/csv?congress=${congress}&type=${bill.bill_type}&number=${bill.bill_number}`}
                  className="text-xs ring-1 ring-authority-500/40 text-authority-300 hover:text-authority-200 rounded-md px-3 py-1.5"
                >
                  Download sponsor CSV
                </a>
              </div>
            )}

            <NewsletterCapture
              variant="inline-receipt"
              surface="bill"
              sourceSlug={`${congress}-${bill.bill_type}-${bill.bill_number}`}
              heading="Who's paying for the next bill?"
              body="We email you when new donor money lines up behind a new bill."
              buttonLabel="Track new bills"
            />
          </>
        )}

        {bill.summary && (
          <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-3">Summary</div>
            <p className="text-sm text-ink-300 leading-relaxed">
              {bill.summary.slice(0, 1500)}{bill.summary.length > 1500 ? '…' : ''}
            </p>
          </div>
        )}
      </article>
    </>
  )
}
