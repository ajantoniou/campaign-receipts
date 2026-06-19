import { supabaseService, type Politician } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { marked } from 'marked'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import ScorecardBar from '@/app/components/ScorecardBar'
import RelativeTime from '@/app/components/RelativeTime'

const money = (x: number) => `$${Math.round(x || 0).toLocaleString()}`

export const dynamic = 'force-dynamic'
export const revalidate = 0

// 50 US state codes. We render a 404 for anything else so accidental
// /state/foo URLs don't show a no-results page.
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
  MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
}

export async function generateMetadata({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const name = STATE_NAMES[code]
  if (!name) return { title: 'State — CampaignReceipts' }
  return {
    title: `${name} politicians — promise tracker | CampaignReceipts`,
    description: `Campaign promises and verdicts for every ${name} federal politician. Term-scoped scorecards with primary-source receipts.`,
  }
}

async function getPoliticiansForState(code: string): Promise<Politician[]> {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('state', code)
    .order('branch')
    .order('name')
  return (data as Politician[]) || []
}

// Races in this state — the state hub previously linked only politicians,
// orphaning its races. Linking them spreads crawl equity and matches
// "[state] campaign finance / races" intent.
type StateRace = { slug: string; headline: string; district: string | null; race_type: string | null }
async function getRacesForState(code: string): Promise<StateRace[]> {
  const { data } = await supabaseService
    .from('cr_races')
    .select('slug, headline, district, race_type')
    .eq('state', code)
    .order('primary_date', { ascending: false })
  return (data as StateRace[]) || []
}

// Deterministic top-donor / party-split / recent-vote facts (+ AI baseline)
// computed once by scripts/backfill-state-baseline-summary.mjs and stored on
// cr_states. Rendered statically — no per-request AI, no live recompute.
type StateFact = {
  claim_type: string
  committee_name?: string
  industry?: string
  amount?: number
  total?: number
  republican?: number
  democratic?: number
  republican_pct?: number
  democratic_pct?: number
  bill?: string | null
  title?: string
  member_votes?: string[]
  governor?: string
  broken?: string[]
  broken_count?: number
}
type StateBaseline = { summary_md: string | null; facts: StateFact[] }

async function getStateBaseline(code: string): Promise<StateBaseline | null> {
  const { data } = await supabaseService
    .from('cr_states')
    .select('baseline_summary_md, baseline_facts')
    .eq('code', code)
    .maybeSingle()
  if (!data) return null
  return {
    summary_md: (data as any).baseline_summary_md ?? null,
    facts: ((data as any).baseline_facts as StateFact[]) || [],
  }
}

function partyTone(party: string) {
  if (party === 'Republican') return 'text-rose-300 bg-rose-500/10 ring-rose-500/30'
  if (party === 'Democratic') return 'text-sky-300 bg-sky-500/10 ring-sky-500/30'
  if (party === 'Independent') return 'text-amber-300 bg-amber-500/10 ring-amber-500/30'
  return 'text-ink-300 bg-ink-800 ring-ink-700'
}

export default async function StatePage({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const stateName = STATE_NAMES[code]
  if (!stateName) notFound()

  const politicians = await getPoliticiansForState(code)
  const baseline = await getStateBaseline(code)
  const races = await getRacesForState(code)

  const topDonors = (baseline?.facts || []).filter((f) => f.claim_type === 'top_donor').slice(0, 6)
  const split = (baseline?.facts || []).find((f) => f.claim_type === 'party_money_split')
  const recentVotes = (baseline?.facts || []).filter((f) => f.claim_type === 'recent_vote').slice(0, 5)
  const govBroken = (baseline?.facts || []).find((f) => f.claim_type === 'governor_broken_promises')

  // Per-branch grouping for the readout.
  const byBranch = politicians.reduce<Record<string, Politician[]>>((acc, p) => {
    const b = p.branch || 'Other'
    if (!acc[b]) acc[b] = []
    acc[b].push(p)
    return acc
  }, {})
  const branchOrder = ['President', 'Senate', 'House', 'Governor', 'Other']
  const orderedBranches = branchOrder.filter((b) => byBranch[b]?.length)

  const totals = politicians.reduce(
    (acc, p) => {
      acc.graded += p.scorecard_graded_total || 0
      acc.pending += p.scorecard_pending || 0
      acc.kept += p.scorecard_kept || 0
      acc.broken += p.scorecard_broken || 0
      return acc
    },
    { graded: 0, pending: 0, kept: 0, broken: 0 },
  )

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-12 pb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
            <ArrowLeft className="size-3.5" />
            All politicians
          </Link>
          <div className="eyebrow mb-2">State Profile · {code}</div>
          <h1 className="text-display-lg text-ink-50 text-balance">
            {stateName} — promise tracker
          </h1>
          <p className="mt-4 text-ink-400 max-w-2xl text-[15px]">
            Campaign promises and verdicts for every federal {stateName} politician on the site.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-[11px] font-mono uppercase tracking-wider text-ink-500">
            <Stat label="politicians" value={politicians.length} />
            <Stat label="graded" value={totals.graded} accent="emerald" />
            <Stat label="pending" value={totals.pending} accent="amber" />
            <Stat label="kept" value={totals.kept} accent="emerald" />
            <Stat label="broken" value={totals.broken} accent="rose" />
          </div>
        </div>
      </section>

      {/* ───── POLITICAL MONEY BASELINE (backfilled, sourced) ─────────
          Biggest donors of the state's federal members, the R-vs-D money
          split, recent bills + how members voted, the AI baseline summary,
          and the governor's BROKEN promises. Computed once + stored on
          cr_states; donor + bill names highlighted inline. */}
      {baseline && (baseline.summary_md || topDonors.length > 0) && (
        <section className="border-b border-ink-800/60 bg-ink-900/30">
          <div className="section-shell py-10 space-y-8">
            <div>
              <div className="eyebrow mb-2 text-ink-500">The money baseline · {code}</div>
              <h2 className="text-display-sm text-ink-50 tracking-tight">
                Where the money behind {stateName}&rsquo;s members comes from
              </h2>
            </div>

            {/* AI baseline summary — donors + bills highlighted inline. */}
            {baseline.summary_md && (
              <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/50 p-6">
                <div
                  className="state-baseline-prose text-[15px] text-ink-200 leading-[1.7]"
                  dangerouslySetInnerHTML={{ __html: marked.parse(baseline.summary_md, { async: false }) as string }}
                />
                <p className="mt-4 text-[10px] font-mono uppercase tracking-wider text-ink-600">
                  Narrated from FEC + Congress.gov receipts. Every figure traces to our data.
                </p>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Party money split */}
              {split && split.total ? (
                <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
                  <div className="eyebrow mb-3 text-ink-500">Republican vs Democrat money</div>
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-ink-800">
                    <div className="bg-rose-500/70" style={{ width: `${split.republican_pct || 0}%` }} />
                    <div className="bg-sky-500/70" style={{ width: `${split.democratic_pct || 0}%` }} />
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-ink-400">
                    <span><span className="text-rose-400 font-bold">{split.republican_pct ?? 0}%</span> Republican · {money(split.republican || 0)}</span>
                    <span><span className="text-sky-400 font-bold">{split.democratic_pct ?? 0}%</span> Democratic · {money(split.democratic || 0)}</span>
                  </div>
                  <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-ink-600">
                    {money(split.total)} tracked PAC money to federal members
                  </div>
                </div>
              ) : null}

              {/* Biggest donors */}
              {topDonors.length > 0 && (
                <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
                  <div className="eyebrow mb-3 text-ink-500">Biggest donors</div>
                  <ol className="space-y-2">
                    {topDonors.map((d, i) => (
                      <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-ink-200 truncate">{d.committee_name}</span>
                        <span className="text-emerald-400 font-mono tabular-nums shrink-0">{money(d.amount || 0)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Recent bills + how members voted */}
            {recentVotes.length > 0 && (
              <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
                <div className="eyebrow mb-3 text-ink-500">Recent bills · how {code} members voted</div>
                <ul className="space-y-4">
                  {recentVotes.map((v, i) => (
                    <li key={i} className="border-l-2 border-ink-700 pl-3">
                      <div className="text-sm text-ink-100">
                        {v.bill && <span className="font-mono text-amber-300">{v.bill}</span>}
                        {v.bill ? ' — ' : ''}{v.title}
                      </div>
                      {v.member_votes && v.member_votes.length > 0 && (
                        <div className="mt-1 text-xs text-ink-500">{v.member_votes.slice(0, 6).join(' · ')}</div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Governor's broken promises (broken only) */}
            {govBroken && govBroken.broken && govBroken.broken.length > 0 && (
              <div className="rounded-xl ring-1 ring-rose-500/30 bg-rose-500/5 p-5">
                <div className="eyebrow mb-2 text-rose-300">
                  Governor {govBroken.governor} · broken promises
                </div>
                <ul className="space-y-2 list-disc list-inside">
                  {govBroken.broken.map((b, i) => (
                    <li key={i} className="text-sm text-ink-200">{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      <article className="section-shell py-10 space-y-12">
        {politicians.length === 0 && (
          <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center text-sm text-ink-500">
            No {stateName} politicians on file yet. Check back as the directory expands.
          </div>
        )}
        {orderedBranches.map((branch) => (
          <section key={branch}>
            <div className="eyebrow mb-4">{branch} · {byBranch[branch].length}</div>
            <ol className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {byBranch[branch].map((p) => (
                <li key={p.id}>
                  <PoliticianMini p={p} />
                </li>
              ))}
            </ol>
          </section>
        ))}

        {/* Races in this state — links the state hub to its race pages
            (previously orphaned). Renders only when races exist. */}
        {races.length > 0 && (
          <section className="mt-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-3">
              Races in {stateName}
            </h2>
            <ul className="space-y-2.5 list-none p-0 m-0">
              {races.map((r) => (
                <li key={r.slug}>
                  <a
                    href={`/race/${r.slug}`}
                    className="font-sans text-sm text-ink-2 hover:text-ink transition-colors underline-offset-2 hover:underline"
                  >
                    {r.headline}
                    {r.district ? <span className="text-ink-3"> · {r.district}</span> : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'rose' | 'amber' }) {
  const color = accent === 'emerald' ? 'text-emerald-400' : accent === 'rose' ? 'text-rose-400' : accent === 'amber' ? 'text-amber-400' : 'text-ink-200'
  return (
    <span>
      <span className={`${color} text-sm font-bold tabular-nums normal-case tracking-tight`}>{value}</span>{' '}
      <span className="text-ink-500">{label}</span>
    </span>
  )
}

function PoliticianMini({ p }: { p: Politician }) {
  const graded = p.scorecard_graded_total || 0
  const pending = p.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  return (
    <Link
      href={`/politician/${p.slug}`}
      className="group block rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 hover:bg-ink-900/70 hover:ring-ink-700 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      <div className="p-4 flex items-start gap-3">
        <PoliticianAvatar name={p.name} party={p.party} photoUrl={p.photo_url} size="sm" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink-50 tracking-tight leading-tight truncate">
            {p.name}
          </h3>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`text-[10px] font-mono uppercase tracking-wider rounded-full px-1.5 py-0.5 ring-1 ${partyTone(p.party)}`}>
              {p.party[0]}
            </span>
            <span className="text-[10px] text-ink-500">{p.branch}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            {isLive ? (
              <>
                <span className="text-xl font-bold tabular-nums text-amber-400 tracking-tight">{pending}</span>
                <span className="text-[10px] text-ink-500">in play{p.current_term_end ? ` · ends '${p.current_term_end.slice(2, 4)}` : ''}</span>
              </>
            ) : graded > 0 && p.scorecard_percentage_kept != null ? (
              <>
                <span className="text-xl font-bold tabular-nums text-emerald-400 tracking-tight">
                  {Math.round(p.scorecard_percentage_kept)}<span className="text-sm">%</span>
                </span>
                <span className="text-[10px] text-ink-500">kept · {graded} graded</span>
              </>
            ) : (
              <span className="text-[11px] text-ink-500">No verdicts yet</span>
            )}
          </div>
          <div className="mt-2">
            <ScorecardBar
              kept={p.scorecard_kept}
              partial={p.scorecard_partial}
              broken={p.scorecard_broken}
              youDecide={p.scorecard_you_decide}
              total={graded || p.scorecard_total}
              size="sm"
            />
          </div>
          {p.last_refreshed_at && (
            <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-ink-600">
              {isLive ? 'Tracking' : 'Verified'} <RelativeTime iso={p.last_refreshed_at} />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
