// /race/[slug] — Active race receipt page (data-driven).
//
// Replaces the two hand-built post-mortem pages (MO-01 2024, NY-16 2024
// — both deleted 2026-05-17 per founder direction). This template
// renders from a single cr_races row, so adding a new race is a SQL
// insert, not a code change.
//
// Anatomy (top to bottom):
//   1. Masthead — headline + countdown pill + sourced lede
//   2. Candidate strip — one card per candidate with IE for/against,
//      campaign-raised, polling, endorsements
//   3. Super PAC stack — top PACs spending in the race
//   4. Primary sources — every URL we cited, by publication
//   5. Methodology — "what this page does and doesn't say"
//
// Per founder rev-7: candidate and donor data is free on this surface,
// always.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseService } from '@/lib/supabase'
import ShareButtons from '@/app/components/ShareButtons'
import TrackVisit from '@/app/components/TrackVisit'
import { Receipt } from '@/app/components/cr'
import * as apCitation from '@/lib/ap-citation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Candidate = {
  slug?: string
  name: string
  party: string
  incumbent?: boolean
  endorsed_by?: string[]
  ie_for_usd?: number
  ie_against_usd?: number
  campaign_raised_usd?: number
  polling_pct?: number | null
  notes?: string | null
}

type TopPac = {
  name: string
  affiliation: string
  total_usd: number
  support_oppose: string
  target_candidate?: string
}

type Source = {
  publication: string
  url: string
  retrieved_at?: string
}

type Race = {
  id: string
  slug: string
  race_type: string
  state: string | null
  district: string | null
  cycle: string
  primary_date: string | null
  election_date: string | null
  headline: string
  blurb: string | null
  candidates: Candidate[]
  total_ie_usd: number | null
  total_spend_usd: number | null
  top_pacs: TopPac[]
  is_active: boolean
  result_summary: string | null
  primary_sources: Source[]
}

async function getRace(slug: string): Promise<Race | null> {
  const { data } = await supabaseService
    .from('cr_races')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return (data as Race) || null
}

/** Extract the FEC committee_id (e.g. "C00542217") from a top_pac's
 *  affiliation string ("FEC C00542217"). Returns null if not present. */
function committeeIdFromAffiliation(affiliation: string | undefined): string | null {
  if (!affiliation) return null
  const m = affiliation.match(/C\d{8}/)
  return m ? m[0] : null
}

/** Pull the sourced "who's behind it" one-liner for every super PAC in
 *  the race. Keyed by FEC committee_id. funders_summary is computed from
 *  FEC Schedule A top donors and stored on cr_committees. Returns a map
 *  committee_id -> summary; PACs without a summary simply omit it. */
async function getFunderSummaries(
  topPacs: TopPac[],
): Promise<Record<string, string>> {
  const ids = topPacs
    .map((p) => committeeIdFromAffiliation(p.affiliation))
    .filter((id): id is string => !!id)
  if (ids.length === 0) return {}
  const { data } = await supabaseService
    .from('cr_committees')
    .select('committee_id, funders_summary')
    .in('committee_id', ids)
  const map: Record<string, string> = {}
  for (const row of (data as { committee_id: string; funders_summary: string | null }[]) || []) {
    if (row.funders_summary) map[row.committee_id] = row.funders_summary
  }
  return map
}

/** Find the most recently published article tied to this race
 *  (kind='race_funding'). Returned to render the "Latest analysis"
 *  chip on the masthead. Returns null if no analysis exists yet. */
async function getLatestArticle(
  raceId: string,
): Promise<{ slug: string; title: string; published_at: string | null } | null> {
  const { data } = await supabaseService
    .from('cr_articles')
    .select('slug, title, published_at')
    .eq('related_race_id', raceId)
    .eq('kind', 'race_funding')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  return (data as { slug: string; title: string; published_at: string | null }) || null
}

/** Per-race running tally of LIVE (still-open) campaign promises across
 *  the candidates in this race (founder 2026-05-30). Replaces the old
 *  global "Most live promises" leaderboard tab. Counts scorecard_pending
 *  for candidates who have a politician page; returns null when no race
 *  candidate has any open promise tracked, so the block omits gracefully. */
async function getLivePromiseTally(
  candidates: Candidate[],
): Promise<{ total: number; perCandidate: { name: string; slug: string; pending: number }[] } | null> {
  const slugs = candidates.map((c) => c.slug).filter((s): s is string => !!s)
  if (slugs.length === 0) return null
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('slug, name, scorecard_pending')
    .in('slug', slugs)
  const rows = ((data as any[]) || [])
    .map((r) => ({ name: r.name as string, slug: r.slug as string, pending: Number(r.scorecard_pending) || 0 }))
    .filter((r) => r.pending > 0)
    .sort((a, b) => b.pending - a.pending)
  if (rows.length === 0) return null
  const total = rows.reduce((s, r) => s + r.pending, 0)
  return { total, perCandidate: rows }
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const race = await getRace(params.slug)
  if (!race) return { title: 'Race not found · CampaignReceipts' }
  return {
    title: `${race.headline} · ${race.district || race.state} · CampaignReceipts`,
    description:
      race.blurb ||
      'Live super PAC spending and candidate donor data for this race. Free, FEC-sourced.',
    alternates: { canonical: `/race/${params.slug}` },
    openGraph: {
      title: race.headline,
      description: race.blurb || '',
      images: [{ url: `/api/card/race/${params.slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`/api/card/race/${params.slug}`],
    },
  }
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`
  return `$${n.toLocaleString()}`
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T12:00:00Z').getTime()
  const now = Date.now()
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

function partyClasses(party: string): string {
  if (party === 'Republican') return 'bg-broken/[0.08] text-broken border-broken/30'
  if (party === 'Democratic') return 'bg-pending/[0.08] text-pending border-pending/30'
  if (party === 'Independent') return 'bg-kept/[0.08] text-kept border-kept/30'
  return 'bg-paper-3 text-ink-2 border-line'
}

export default async function RaceDetailPage({ params }: { params: { slug: string } }) {
  const race = await getRace(params.slug)
  if (!race) notFound()

  // Auto-gen article that goes with this race (if any). Surfaced as a
  // chip on the masthead — "Latest analysis →" — so visitors can jump
  // from the live data into the editor-style write-up and back.
  const latestArticle = await getLatestArticle(race.id)

  // Per-race live-promise running tally (founder 2026-05-30).
  const livePromises = await getLivePromiseTally(race.candidates)

  // FEC-sourced "who's behind each super PAC" one-liners, keyed by
  // committee_id. Powers the hero dissection below the masthead.
  const funderSummaries = await getFunderSummaries(race.top_pacs)

  // The biggest super PACs in the race, sorted by IE spend, with their
  // committee_id + funder one-liner stitched on. This is the hero story:
  // disguised names, real money. Top 4 lead the dissection.
  const dissectedPacs = race.top_pacs
    .slice()
    .sort((a, b) => (b.total_usd || 0) - (a.total_usd || 0))
    .map((p) => {
      const cid = committeeIdFromAffiliation(p.affiliation)
      return { ...p, committeeId: cid, funders: cid ? funderSummaries[cid] : undefined }
    })
  const heroPacs = dissectedPacs.filter((p) => p.funders).slice(0, 4)

  const electionDate = race.primary_date || race.election_date
  const days = daysUntil(electionDate)
  const isImminent = days !== null && days <= 7 && days >= 0

  return (
    <>
      <TrackVisit
        kind="race"
        id={race.slug}
        name={race.headline.slice(0, 80) || race.district || race.state || race.slug}
        href={`/race/${race.slug}`}
      />
      {/* ───── MASTHEAD ──────────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <Link
            href="/race"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors mb-6"
          >
            ← All active races
          </Link>
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3 inline-flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
            {race.district || race.state || '—'} · {fmtDate(electionDate)}
            {days !== null && days >= 0 && (
              <>
                {' · '}
                <span className={isImminent ? 'text-broken' : 'text-ink-3'}>
                  {days === 0 ? 'Election today' : `${days} days out`}
                </span>
              </>
            )}
          </div>
          <h1 className="font-display text-[42px] sm:text-[60px] leading-[0.96] tracking-[-0.015em] text-ink text-balance m-0 max-w-4xl">
            {race.headline}
          </h1>
          {race.blurb && (
            <p className="mt-5 font-sans text-[16px] sm:text-[17px] text-ink-2 leading-[1.55] max-w-3xl">
              {race.blurb}
            </p>
          )}

          {/* Latest analysis chip — only renders when an article exists
              for this race. Per founder rev-7 batch C+: race page links
              to its auto-gen funding article so visitors can jump
              between live data and editorial copy. */}
          {latestArticle && (
            <div className="mt-6">
              <Link
                href={`/articles/${latestArticle.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper hover:bg-paper-3 hover:border-ink-3 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 hover:text-ink no-underline transition-colors"
              >
                <span className="text-broken">●</span>
                Latest analysis: {latestArticle.title.length > 60 ? latestArticle.title.slice(0, 57) + '…' : latestArticle.title} →
              </Link>
            </div>
          )}

          {/* Spend headline numbers */}
          {(race.total_ie_usd != null || race.total_spend_usd != null) && (
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-[640px]">
              {race.total_spend_usd != null && (
                <HeadlineStat
                  value={fmtMoney(race.total_spend_usd)}
                  label="Total race spend"
                  tone="ink"
                />
              )}
              {race.total_ie_usd != null && (
                <HeadlineStat
                  value={fmtMoney(race.total_ie_usd)}
                  label="Super PAC IE"
                  tone="broken"
                />
              )}
              {race.candidates.length > 0 && (
                <HeadlineStat
                  value={String(race.candidates.length)}
                  label="Candidates on file"
                  tone="ink"
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* ───── SUPER PAC DISSECTION (HERO) ───────────────────────
          Founder 2026-05-31: the disguised-name angle IS the story.
          Lead with the biggest super PACs, each with $ amount,
          for/against whom, and the FEC-sourced "who's really behind
          it." Every backer traces to a Schedule A row on
          cr_committees.funders_summary. */}
      {heroPacs.length > 0 && (
        <section className="bg-paper border-b border-line">
          <div className="section-shell py-12 sm:py-16">
            <div className="max-w-[1100px] mx-auto">
              <div className="mb-7 max-w-[820px]">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2 inline-flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
                  Follow the money · who's really behind the names
                </div>
                <h2 className="font-display text-[30px] sm:text-[38px] leading-[1.03] tracking-[-0.01em] text-ink text-balance m-0">
                  The friendly names hide the donors.
                </h2>
                <p className="mt-3 font-sans text-[15px] sm:text-[16px] text-ink-2 leading-[1.55]">
                  "Texans for a Conservative Majority." "Truth and Courage."
                  "WinSenate." The names sound grassroots. The money isn't. Here
                  is who actually funds the biggest super PACs in this race —
                  every backer traced to an FEC Schedule&nbsp;A filing.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {heroPacs.map((p, i) => (
                  <PacDissectionCard key={i} p={p} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───── CANDIDATES STRIP ──────────────────────────────── */}
      {race.candidates.length > 0 && (
        <section className="bg-paper border-b border-line">
          <div className="section-shell py-12 sm:py-16">
            <div className="max-w-[1100px] mx-auto">
              <div className="mb-6 max-w-[760px]">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                  Candidates · the receipts
                </div>
                <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.005em] text-ink text-balance m-0">
                  Who's running. Who's funding them.
                </h2>
                <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
                  Each candidate's own campaign cash, the outside-money IE
                  supporting them, and the IE attacking them — side-by-side.
                </p>
              </div>
              <div
                className={`grid gap-3 ${
                  race.candidates.length === 2
                    ? 'sm:grid-cols-2'
                    : race.candidates.length >= 3
                    ? 'sm:grid-cols-2 lg:grid-cols-3'
                    : 'sm:grid-cols-1'
                }`}
              >
                {race.candidates.map((c, i) => (
                  <CandidateCard key={i} c={c} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───── LIVE PROMISES RUNNING TALLY ───────────────────────
          Per-race count of still-open campaign promises across the
          candidates who have a page. Omits when none are tracked. */}
      {livePromises && (
        <section className="bg-paper border-b border-line">
          <div className="section-shell py-10 sm:py-12">
            <div className="max-w-[760px] mx-auto">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2 inline-flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-broken animate-pulse" aria-hidden />
                Live promises · still open
              </div>
              <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.005em] text-ink text-balance m-0">
                {livePromises.total} active campaign{' '}
                {livePromises.total === 1 ? 'promise' : 'promises'} we're tracking in this race.
              </h2>
              <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
                We grade a promise after the term ends. These are still open. We
                count them while the campaign runs.
              </p>
              <ul className="mt-5 grid gap-2 list-none p-0 m-0">
                {livePromises.perCandidate.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/politician/${c.slug}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper-2 hover:bg-paper-3 hover:border-ink-3 transition-all p-3.5 no-underline"
                    >
                      <span className="font-display text-[17px] text-ink">{c.name}</span>
                      <span className="text-right shrink-0">
                        <span className="font-display text-[20px] tabular-nums text-pending leading-none">
                          {c.pending}
                        </span>
                        <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 mt-0.5">
                          open
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* ───── SUPER PAC STACK ───────────────────────────────── */}
      {race.top_pacs.length > 0 && (
        <section className="bg-paper-2 border-b border-line">
          <div className="section-shell py-12 sm:py-16">
            <div className="max-w-[1100px] mx-auto">
              <div className="mb-6 max-w-[760px]">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                  Outside money · who's spending
                </div>
                <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.005em] text-ink text-balance m-0">
                  The super PACs in this race.
                </h2>
              </div>
              <div className="grid gap-2">
                {dissectedPacs.map((p, i) => (
                  <PacRow key={i} p={p} rank={i + 1} funders={p.funders} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ───── CANONICAL RECEIPT ─────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12">
          <div className="max-w-[760px] mx-auto">
            <Receipt
              id={`RCPT-RACE-${race.slug.toUpperCase()}`}
              title={race.district || race.state || race.slug}
              headerRight={
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                  As of {new Date().toISOString().slice(0, 10)}
                </span>
              }
              verdict={isImminent ? 'broken' : 'pending'}
              stampLabel={isImminent ? 'Imminent' : 'Pending'}
              verdictCopy={
                race.blurb ? (
                  <>{race.blurb}</>
                ) : (
                  <>Active race. Numbers update as new FEC filings land.</>
                )
              }
              rows={[
                { k: 'Race', v: race.headline },
                { k: 'District', v: race.district || race.state || '—', sans: true },
                { k: 'Primary date', v: fmtDate(electionDate), sans: true },
                {
                  k: 'Total race spend',
                  v: fmtMoney(race.total_spend_usd),
                  sans: true,
                },
                {
                  k: 'Total super PAC IE',
                  v: fmtMoney(race.total_ie_usd),
                  sans: true,
                },
                {
                  k: 'Candidates on file',
                  v: String(race.candidates.length),
                  sans: true,
                },
              ]}
              footLeft={`Cite as: RCPT-RACE-${race.slug.toUpperCase()}`}
              footRight={`campaignreceipts.com/race/${race.slug}`}
              citation={apCitation.forRace({ slug: race.slug, headline: race.headline })}
            />

            <div className="mt-5">
              <ShareButtons
                title={race.headline}
                tagline={`${race.district || race.state} · ${fmtDate(electionDate)} · live super PAC spending`}
                source={`race-${race.slug}`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───── PRIMARY SOURCES ───────────────────────────────── */}
      {race.primary_sources.length > 0 && (
        <section className="bg-paper-2 border-b border-line">
          <div className="section-shell py-12">
            <div className="max-w-[760px] mx-auto">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
                Primary sources
              </div>
              <h2 className="font-display text-[24px] sm:text-[28px] leading-[1.1] tracking-[-0.005em] text-ink m-0 mb-5">
                Every link, every publication.
              </h2>
              <ol className="m-0 p-0 list-none space-y-2">
                {race.primary_sources.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-lg border border-line bg-paper p-4 flex items-baseline justify-between gap-4 flex-wrap"
                  >
                    <div>
                      <div className="font-sans text-[14px] text-ink font-medium">
                        {s.publication}
                      </div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] text-ink-2 hover:text-ink underline underline-offset-2 decoration-line hover:decoration-ink break-all"
                      >
                        {s.url}
                      </a>
                    </div>
                    {s.retrieved_at && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 shrink-0">
                        retrieved {s.retrieved_at}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* ───── METHODOLOGY ───────────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-12">
          <div className="max-w-[760px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
              What this page does and doesn't say
            </div>
            <ul className="m-0 p-0 list-none space-y-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
              <li>
                <strong className="text-ink">It does say:</strong> these
                figures come from FEC filings, candidate FEC summaries,
                and reputable reporting by named publications listed
                above. Every link is one click away.
              </li>
              <li>
                <strong className="text-ink">It doesn't say:</strong> who
                will win. We surface money flows; we don't model
                elections. Polling, redistricting, organizing, candidate
                quality, and turnout all factor in ways the IE data
                cannot capture.
              </li>
              <li>
                <strong className="text-ink">Updates:</strong> spending
                figures refresh as new FEC filings post. Refresh this
                page to pull the latest snapshot.
              </li>
              <li>
                <strong className="text-ink">Free, always.</strong> Active
                race data stays free even after CR's Pro surfaces (Pro
                exports, alerts, deeper correlations) go live.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/race"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink"
              >
                All active races →
              </Link>
              <Link
                href="/methodology"
                className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink hover:text-ink-2 underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                Methodology →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}

// ── Sub-components ──────────────────────────────────────────

function HeadlineStat({
  value,
  label,
  tone,
}: {
  value: string
  label: string
  tone: 'ink' | 'broken' | 'kept'
}) {
  const toneCls =
    tone === 'broken' ? 'text-broken' : tone === 'kept' ? 'text-kept' : 'text-ink'
  return (
    <div>
      <div className={`font-display text-[28px] sm:text-[36px] tabular-nums tracking-[-0.01em] leading-none ${toneCls}`}>
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
        {label}
      </div>
    </div>
  )
}

function CandidateCard({ c }: { c: Candidate }) {
  const tintCls = partyClasses(c.party)
  return (
    <div className="rounded-lg border border-line bg-paper p-5 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
          Candidate · own campaign
        </div>
        {c.incumbent && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border bg-paper-3 text-ink-2 border-line">
            Incumbent
          </span>
        )}
      </div>
      <h3 className="font-display text-[22px] leading-[1.1] text-ink m-0 mb-1.5 tracking-[-0.005em]">
        {c.slug ? (
          <Link
            href={`/politician/${c.slug}`}
            className="text-ink no-underline hover:underline underline-offset-4 decoration-line hover:decoration-ink"
          >
            {c.name}
          </Link>
        ) : (
          c.name
        )}
      </h3>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border ${tintCls}`}
        >
          {c.party}
        </span>
        {c.endorsed_by && c.endorsed_by.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            endorsed: {c.endorsed_by.join(', ')}
          </span>
        )}
      </div>

      <div className="space-y-3 mt-1">
        {c.campaign_raised_usd != null && (
          <Metric
            label="Own campaign raised"
            value={fmtMoney(c.campaign_raised_usd)}
          />
        )}
        {c.ie_for_usd != null && c.ie_for_usd > 0 && (
          <Metric
            label="Outside money for"
            value={`+${fmtMoney(c.ie_for_usd)}`}
            tone="kept"
            bold
          />
        )}
        {c.ie_against_usd != null && c.ie_against_usd > 0 && (
          <Metric
            label="Outside money against"
            value={`−${fmtMoney(c.ie_against_usd)}`}
            tone="broken"
            bold
          />
        )}
        {c.polling_pct != null && (
          <Metric
            label="Latest polling"
            value={`${c.polling_pct.toFixed(1)}%`}
          />
        )}
      </div>

      {c.notes && (
        <p className="mt-4 pt-4 border-t border-dotted border-line font-sans text-[13px] text-ink-2 leading-[1.5]">
          {c.notes}
        </p>
      )}
    </div>
  )
}

function Metric({
  label,
  value,
  tone,
  bold,
}: {
  label: string
  value: string
  tone?: 'broken' | 'kept' | 'pending'
  bold?: boolean
}) {
  const toneCls =
    tone === 'broken'
      ? 'text-broken'
      : tone === 'kept'
      ? 'text-kept'
      : tone === 'pending'
      ? 'text-pending'
      : 'text-ink'
  const sizeCls = bold ? 'text-[22px] sm:text-[26px]' : 'text-[16px] sm:text-[18px]'
  return (
    <div>
      <div className={`font-display tabular-nums tracking-[-0.005em] ${sizeCls} ${toneCls}`}>
        {value}
      </div>
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 mt-1">
        {label}
      </div>
    </div>
  )
}

function PacRow({ p, rank, funders }: { p: TopPac; rank: number; funders?: string }) {
  const isFor = p.support_oppose.startsWith('for_')
  const isAgainst = p.support_oppose.startsWith('against_')
  const tone = isFor ? 'kept' : isAgainst ? 'broken' : 'ink'
  const toneCls = tone === 'kept' ? 'text-kept' : tone === 'broken' ? 'text-broken' : 'text-ink'
  const label = isFor ? 'For' : isAgainst ? 'Against' : 'General'
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="font-mono text-[11px] tabular-nums text-ink-3 w-6 text-center shrink-0">
          {String(rank).padStart(2, '0')}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-sans text-[15px] font-medium text-ink">{p.name}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 mt-0.5">
            {p.affiliation}
            {p.target_candidate && (
              <>
                {' · '}
                <span className={toneCls}>
                  {label.toLowerCase()} {p.target_candidate}
                </span>
              </>
            )}
          </div>
        </div>
        <div className={`font-display text-[20px] sm:text-[22px] tabular-nums tracking-[-0.005em] shrink-0 ${toneCls}`}>
          {fmtMoney(p.total_usd)}
        </div>
      </div>
      {funders && (
        <p className="mt-3 pt-3 border-t border-dotted border-line font-sans text-[13.5px] text-ink-2 leading-[1.5]">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3 mr-1.5">
            Who's behind it
          </span>
          {funders}
        </p>
      )}
    </div>
  )
}

function PacDissectionCard({
  p,
}: {
  p: TopPac & { committeeId: string | null; funders?: string }
}) {
  const isFor = p.support_oppose.startsWith('for_')
  const isAgainst = p.support_oppose.startsWith('against_')
  const toneCls = isFor ? 'text-kept' : isAgainst ? 'text-broken' : 'text-ink'
  const badgeCls = isFor
    ? 'bg-kept/[0.08] text-kept border-kept/30'
    : isAgainst
    ? 'bg-broken/[0.08] text-broken border-broken/30'
    : 'bg-paper-3 text-ink-2 border-line'
  const label = isFor ? 'Spending FOR' : isAgainst ? 'Spending AGAINST' : 'Spending'
  return (
    <div className="rounded-lg border border-line bg-paper-2 p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-display text-[19px] sm:text-[21px] leading-[1.1] tracking-[-0.005em] text-ink m-0">
          {p.name}
        </h3>
        <div className={`font-display text-[22px] sm:text-[26px] tabular-nums tracking-[-0.01em] leading-none shrink-0 ${toneCls}`}>
          {fmtMoney(p.total_usd)}
        </div>
      </div>
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        {p.target_candidate && (
          <span className={`font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-0.5 rounded border ${badgeCls}`}>
            {label} {p.target_candidate}
          </span>
        )}
        {p.committeeId && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            FEC {p.committeeId}
          </span>
        )}
      </div>
      {p.funders && (
        <p className="mt-1 font-sans text-[14px] text-ink-2 leading-[1.55] m-0">
          {p.funders}
        </p>
      )}
    </div>
  )
}
