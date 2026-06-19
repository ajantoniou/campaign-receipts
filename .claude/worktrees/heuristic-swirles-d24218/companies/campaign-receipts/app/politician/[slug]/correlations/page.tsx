// Donor → vote correlation engine per politician.
//
// Per design lead's wireframe:
//   - Hero stat block (the screenshot-worthy "voted with pharma donors 87% of 23 votes")
//   - Alignment-by-industry horizontal bars (chart, fully visible to free users)
//   - Top 3 aligned + top 3 broke-from votes (free)
//   - One faded row #4 + ProGate (paywall surface)
//
// Free user gets a complete, publishable headline. Pro user gets the
// full filterable/sortable table + CSV + alerts (rendered above the gate).

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { supabaseService, type Politician } from '@/lib/supabase'
import { getEntitlement } from '@/lib/entitlement'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import AlignmentBars, { type AlignmentRow } from '@/app/components/AlignmentBars'
import ProGate from '@/app/components/ProGate'
import GraphWatermark from '@/app/components/GraphWatermark'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AlignmentVoteRow = {
  bill_id: string
  industry_label: string
  alignment_score: number
  vote: string | null
  industry_position: string | null
  bills: {
    congress: number
    bill_type: string
    bill_number: number
    title: string
    short_title: string | null
    congress_gov_url: string | null
  }
}

async function getPolitician(slug: string): Promise<Politician | null> {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as Politician) || null
}

async function getAlignmentByIndustry(politicianId: string): Promise<AlignmentRow[]> {
  const { data } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select('industry_label, alignment_score')
    .eq('politician_id', politicianId)
  const rows = (data || []) as { industry_label: string; alignment_score: number }[]
  if (rows.length === 0) return []
  const byInd = new Map<string, { aligned: number; total: number }>()
  for (const r of rows) {
    const k = r.industry_label
    if (!byInd.has(k)) byInd.set(k, { aligned: 0, total: 0 })
    const v = byInd.get(k)!
    v.total++
    if (r.alignment_score === 1) v.aligned++
  }
  return Array.from(byInd.entries())
    .map(([industry, v]) => ({
      industry,
      pctAligned: v.total > 0 ? Math.round((v.aligned / v.total) * 100) : 0,
      alignedCount: v.aligned,
      totalCount: v.total,
    }))
    .filter((r) => r.totalCount >= 2) // need a minimum sample for credibility
    .sort((a, b) => b.pctAligned - a.pctAligned)
}

async function getTopVotes(
  politicianId: string,
  kind: 'aligned' | 'broke',
  limit: number,
): Promise<AlignmentVoteRow[]> {
  const { data } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select(
      'bill_id, industry_label, alignment_score, vote, industry_position, bills:cr_bills!inner(congress, bill_type, bill_number, title, short_title, congress_gov_url)',
    )
    .eq('politician_id', politicianId)
    .eq('alignment_score', kind === 'aligned' ? 1 : -1)
    .limit(limit)
  return (data || []) as unknown as AlignmentVoteRow[]
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const p = await getPolitician(params.slug)
  if (!p) return { title: 'Correlations — CampaignReceipts' }
  return {
    title: `${p.name} — donor-to-vote alignment | CampaignReceipts`,
    description: `Which industries' positions does ${p.name} vote with — and break from. Term-scoped, primary-source receipts on every roll-call.`,
  }
}

export default async function CorrelationsPage({ params }: { params: { slug: string } }) {
  const p = await getPolitician(params.slug)
  if (!p) notFound()

  const ent = await getEntitlement()
  const isPro = ent.tier === 'pro'

  const [byIndustry, alignedTop, brokeTop] = await Promise.all([
    getAlignmentByIndustry(p.id),
    getTopVotes(p.id, 'aligned', isPro ? 50 : 4),
    getTopVotes(p.id, 'broke', isPro ? 50 : 4),
  ])

  // Hero stat: must have a credible sample. Per design audit 2026-05-15:
  // 50% on 2 votes is statistical noise framed as a headline. Require
  // ≥3 votes for the hero. Among qualifiers, pick the largest sample;
  // tie-break by most-extreme alignment (closer to 0 or 100 wins).
  const heroCandidates = byIndustry.filter((r) => r.totalCount >= 3)
  const hero = heroCandidates.length > 0
    ? heroCandidates.reduce((best, r) => {
        if (r.totalCount !== best.totalCount) return r.totalCount > best.totalCount ? r : best
        const rExtreme = Math.abs(r.pctAligned - 50)
        const bestExtreme = Math.abs(best.pctAligned - 50)
        return rExtreme > bestExtreme ? r : best
      })
    : byIndustry[0] || null // fall through to anything we have if no row hits 3

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-10 pb-6">
          <Link
            href={`/politician/${p.slug}`}
            className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Back to {p.name}
          </Link>
          <div className="flex items-center gap-4">
            <PoliticianAvatar name={p.name} party={p.party} photoUrl={p.photo_url} size="md" />
            <div>
              <div className="eyebrow mb-1">Donor → Vote Alignment</div>
              <h1 className="text-display-md text-ink-50">{p.name}</h1>
              <div className="mt-1 text-[11px] font-mono uppercase text-ink-500">
                {p.party[0]} · {p.state} · {p.branch} · 119th Congress
              </div>
            </div>
          </div>
        </div>
      </section>

      <article className="section-shell py-8 grid gap-8 max-w-5xl">
        {byIndustry.length === 0 ? (
          <div className="rounded-2xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center">
            <div className="text-sm text-ink-300 font-semibold mb-2">
              Alignment data still computing.
            </div>
            <p className="text-xs text-ink-500 max-w-md mx-auto">
              We're ingesting House roll-call votes for the 119th Congress + tagging bill
              industry positions. Check back within 24 hours. Senate alignment data coming
              once Congress.gov publishes the API.
            </p>
          </div>
        ) : (
          <>
            {/* Hero stat block — the screenshot moment */}
            {hero && (
              <div className="relative rounded-2xl ring-1 ring-ink-700 bg-ink-900/60 p-8">
                <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-3">
                  Headline
                </div>
                <div className="flex items-baseline gap-4 flex-wrap">
                  <div className={`text-6xl font-mono tabular-nums ${
                    hero.pctAligned >= 70 ? 'text-kept-500' : hero.pctAligned >= 40 ? 'text-partial-500' : 'text-broken-500'
                  } tracking-tight`}>
                    {hero.pctAligned}%
                  </div>
                  <div className="text-lg text-ink-200 leading-tight">
                    voted with <strong className="text-ink-50">{hero.industry}</strong> donors
                    <div className="text-sm text-ink-400 mt-1">
                      across {hero.totalCount} roll-call votes in the 119th
                    </div>
                  </div>
                </div>
                <GraphWatermark />
              </div>
            )}

            {/* Alignment-by-industry chart */}
            <AlignmentBars
              rows={byIndustry}
              title="Alignment by industry"
              subtitle={`Across ${byIndustry.reduce((s, r) => s + r.totalCount, 0)} graded roll-call votes`}
            />

            {/* Two-column top-3 */}
            <div className="grid gap-6 md:grid-cols-2">
              <VoteList
                title="Top aligned votes"
                votes={alignedTop.slice(0, 3)}
                tone="kept"
              />
              <VoteList
                title="Top broke-from votes"
                votes={brokeTop.slice(0, 3)}
                tone="broken"
              />
            </div>

            {/* Pro view: full filterable lists. Free view: faded 4th row + ProGate */}
            {isPro ? (
              <div className="grid gap-6 md:grid-cols-2">
                <FullVoteTable
                  title="All aligned votes"
                  votes={alignedTop.slice(3)}
                  tone="kept"
                />
                <FullVoteTable
                  title="All broke-from votes"
                  votes={brokeTop.slice(3)}
                  tone="broken"
                />
              </div>
            ) : (
              <div className="grid gap-3">
                <FadeRowPreview row={alignedTop[3]} tone="kept" />
                <ProGate
                  headline={`+ ${Math.max(0, alignedTop.length + brokeTop.length - 6)} more votes · filter by industry · CSV export · daily refresh · email alerts`}
                  ctaLabel="Join the bundle waitlist →"
                />
              </div>
            )}
          </>
        )}

        {/* Pro-only affordances — placeholder/teaser */}
        {isPro && (
          <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs text-ink-400">
              You're on Pro. Filter, export CSV, set alerts —{' '}
              <Link href="/dashboard" className="text-authority-400 hover:text-authority-300 underline-offset-4 hover:underline">
                manage in dashboard
              </Link>
            </div>
            <Link
              href={`/api/correlations/csv?politician=${p.slug}`}
              className="text-xs ring-1 ring-authority-500/40 text-authority-300 hover:text-authority-200 rounded-md px-3 py-1.5"
            >
              Download CSV
            </Link>
          </div>
        )}
      </article>

    </>
  )
}

function VoteList({
  title,
  votes,
  tone,
}: {
  title: string
  votes: AlignmentVoteRow[]
  tone: 'kept' | 'broken'
}) {
  const accent = tone === 'kept' ? 'text-kept-400' : 'text-broken-400'
  const label = tone === 'kept' ? 'ALIGNED' : 'BROKE'
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-3">
        {title}
      </div>
      {votes.length === 0 ? (
        <div className="text-xs text-ink-600">No votes match yet.</div>
      ) : (
        <ul className="space-y-3">
          {votes.map((v, i) => (
            <li key={`${v.bill_id}-${v.industry_label}-${i}`} className="flex items-start gap-3">
              <span className={`text-[10px] font-mono ${accent} shrink-0 mt-0.5`}>{label}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm text-ink-200 truncate">
                  {v.bills.bill_type.toUpperCase()} {v.bills.bill_number}{' '}
                  <span className="text-ink-500">·</span> {v.bills.short_title || v.bills.title}
                </div>
                <div className="text-[10px] font-mono text-ink-600 mt-0.5">
                  {v.industry_label} · {v.industry_position} · voted {v.vote}
                </div>
              </div>
              {v.bills.congress_gov_url && (
                <a
                  href={v.bills.congress_gov_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink-600 hover:text-ink-300 shrink-0"
                  aria-label="View on Congress.gov"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FullVoteTable({
  title,
  votes,
  tone,
}: {
  title: string
  votes: AlignmentVoteRow[]
  tone: 'kept' | 'broken'
}) {
  return (
    <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-400 mb-3">
        {title} · Pro
      </div>
      {votes.length === 0 ? (
        <div className="text-xs text-ink-600">No additional votes in this slice.</div>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {votes.map((v, i) => (
            <li key={`${v.bill_id}-${v.industry_label}-${i}`} className="text-xs text-ink-400 truncate">
              {v.bills.bill_type.toUpperCase()} {v.bills.bill_number} · {v.industry_label} · {v.vote}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FadeRowPreview({ row, tone }: { row?: AlignmentVoteRow; tone: 'kept' | 'broken' }) {
  if (!row) return null
  return (
    <div
      className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-4 opacity-30 blur-[1.5px] pointer-events-none select-none"
      aria-hidden
    >
      <div className="text-sm text-ink-200 truncate">
        {row.bills.bill_type.toUpperCase()} {row.bills.bill_number} ·{' '}
        {row.bills.short_title || row.bills.title}
      </div>
      <div className="text-[10px] font-mono text-ink-600 mt-0.5">
        {row.industry_label} · voted {row.vote}
      </div>
    </div>
  )
}
