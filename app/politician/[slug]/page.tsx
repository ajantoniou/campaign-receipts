// Politician profile — benchmark audit-document rebuild (rev 5).
//
// Per claude-design/modes/agent-companies/BENCHMARK.md. Replaces the
// prior dark-theme implementation. The page IS the dossier: paper-warm
// masthead, canonical scorecard Receipt, then a printed list of promise
// receipts.
//
// Data-fetching layer (getData, generateMetadata) is unchanged from the
// previous implementation — only the render layer is rebuilt.

import { supabaseService, type Politician, type Promise as PromiseRow, type Receipt as ReceiptModel } from '@/lib/supabase'
import { Receipt, Stamp, Tag, partyVariant } from '@/app/components/cr'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import PredecessorBar from '@/app/components/PredecessorBar'
import ProDataPreview from '@/app/components/ProDataPreview'
import ForeignTiedFunding from '@/app/components/ForeignTiedFunding'
import CitationBlock from '@/app/components/CitationBlock'
import ShareButton from '@/app/components/ShareButton'
import ShareButtons from '@/app/components/ShareButtons'
import ViralPack from '@/app/components/ViralPack'
import { buildClaim } from '@/lib/build-claim-sentence'
import * as apCitation from '@/lib/ap-citation'
import CausalTimeline, { type TimelineNode } from '@/app/components/CausalTimeline'
import TerminalCTA from '@/app/components/TerminalCTA'
import NewsletterCapture from '@/app/components/NewsletterCapture'
import PoliticianNotifyForm from '@/app/components/PoliticianNotifyForm'
import TrackVisit from '@/app/components/TrackVisit'
// InfluenceMap import retained as comment for the queued ReceiptStrip
// follow-up. Don't re-import without rerunning the panel.
// import InfluenceMap, { type InfluenceNode, type InfluenceEdge } from '@/app/components/InfluenceMap'
import { getEntitlement } from '@/lib/entitlement'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked } from 'marked'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Verdict = 'kept' | 'partial' | 'broken' | 'pending' | 'decide'

const VERDICT_KEY: Record<string, Verdict> = {
  KEPT: 'kept',
  PARTIAL: 'partial',
  BROKEN: 'broken',
  PENDING: 'pending',
  'YOU DECIDE': 'decide',
  'YOU_DECIDE': 'decide',
  COMPROMISED: 'partial',
  STALLED: 'pending',
}

function vk(verdict: string | null | undefined): Verdict {
  if (!verdict) return 'pending'
  return VERDICT_KEY[verdict.toUpperCase()] ?? 'pending'
}

/** Initials block for receipt IDs, e.g. "Donald John Trump" → "DJT". */
function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4)
}

/** Politician slug → receipt ID stem (DJT-2016 for donald-trump-2016 etc). */
function receiptStem(politician: Politician): string {
  const ini = initials(politician.name)
  // Include term year if present in slug (e.g. donald-trump-2016).
  const m = politician.slug.match(/-(\d{4})$/)
  return m ? `${ini}-${m[1]}` : ini
}

/** Strip trailing parenthetical cycle label ("(2016-cycle)") from
 *  display name. Per rev-5 design-lead feedback: parenthetical is a UX
 *  wart in the H1 — it forces an awkward line break and repeats info
 *  already in the eyebrow + cross-cycle banner. */
function displayName(p: Politician): string {
  return p.name.replace(/\s*\([^)]*\)\s*$/, '').trim()
}

function termLabel(p: Politician): string {
  const s = p.current_term_start
  const e = p.current_term_end
  if (s && e) return `${s.slice(0, 4)}–${e.slice(0, 4)} term`
  if (s) return `${s.slice(0, 4)} onward`
  return 'Current term'
}

function fmtPercent(n: number | null | undefined, places = 1): string {
  if (n == null) return '—'
  return `${Number(n).toFixed(places)}%`
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('name, party, branch, state, scorecard_graded_total, scorecard_pending, scorecard_percentage_kept, current_term_start, current_term_end')
    .eq('slug', params.slug)
    .single()
  if (!data) return { title: 'Politician — CampaignReceipts' }
  const p = data as Pick<Politician, 'name' | 'party' | 'branch' | 'state' | 'scorecard_graded_total' | 'scorecard_pending' | 'scorecard_percentage_kept' | 'current_term_start' | 'current_term_end'>
  // Strip trailing parentheticals ("(2016-cycle)") from display name so
  // link unfurls on Twitter/Slack/TikTok bio links read cleanly. The
  // term range below carries the cycle context.
  const cleanForMeta = p.name.replace(/\s*\([^)]*\)\s*$/, '').trim()
  const graded = p.scorecard_graded_total || 0
  const pending = p.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  const termY = p.current_term_start ? p.current_term_start.slice(0, 4) : ''
  const termE = p.current_term_end ? p.current_term_end.slice(0, 4) : 'present'
  const headline = isLive
    ? `${pending} promises pending · live tracking`
    : `${Math.round(p.scorecard_percentage_kept ?? 0)}% kept · ${graded} promises graded`
  const termSuffix = termY ? ` (${termY}–${termE})` : ''
  return {
    title: `${cleanForMeta}${termSuffix} — ${headline} | CampaignReceipts`,
    description: `Promise scorecard for ${cleanForMeta} (${p.party} · ${p.state || ''} · ${p.branch}). ${termY}–${termE} term. ${headline}. Term-scoped, primary-source receipts, three sequential reviewers.`,
    alternates: { canonical: `/politician/${params.slug}` },
    openGraph: {
      title: `${cleanForMeta}${termSuffix} — ${headline}`,
      description: `${p.party} · ${p.state || ''} · ${p.branch} · ${termY}–${termE} term`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cleanForMeta}${termSuffix} — ${headline}`,
      description: `Promise scorecard · ${termY}–${termE} term · campaignreceipts.com`,
    },
  }
}

async function getData(slug: string) {
  const { data: politician } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('slug', slug)
    .single()
  if (!politician) return null

  const { data: promises } = await supabaseService
    .from('cr_promises')
    .select('*')
    .eq('politician_id', (politician as Politician).id)
    .order('promise_number')

  const promiseIds = (promises || []).map((p) => (p as PromiseRow).id)
  let receipts: ReceiptModel[] = []
  if (promiseIds.length > 0) {
    const { data: r } = await supabaseService
      .from('cr_receipts')
      .select('*')
      .in('promise_id', promiseIds)
    receipts = (r as ReceiptModel[]) || []
  }

  let predecessor: Politician | null = null
  const pSlug = (politician as Politician).predecessor_slug
  if (pSlug) {
    const { data: pre } = await supabaseService
      .from('cr_politicians')
      .select('*')
      .eq('slug', pSlug)
      .maybeSingle()
    if (pre) predecessor = pre as Politician
  }

  // Phase B (2026-05-19): pull top-6 donor industries + most-extreme
  // vote alignments so the InfluenceMap can render donor → politician
  // → vote flow. Both queries scoped to this politician only.
  const { data: industries } = await supabaseService
    .from('cr_industry_breakdown')
    .select('industry_label, total_contributions, rank')
    .eq('politician_id', (politician as Politician).id)
    .order('rank', { ascending: true })
    .limit(6)

  const { data: voteAlignments } = await supabaseService
    .from('cr_donor_vote_alignment')
    .select('industry_label, alignment_score')
    .eq('politician_id', (politician as Politician).id)
    .limit(40)

  // SEO internal-linking (2026-06): de-orphan the articles that mention this
  // politician, and surface a few same-state peers. Both spread crawl equity
  // from this high-authority template to deeper pages.
  const { data: relatedArticles } = await supabaseService
    .from('cr_articles')
    .select('slug, title, kind, published_at')
    .contains('politician_ids', [slug])
    .in('status', ['published', 'archived'])
    .order('published_at', { ascending: false })
    .limit(6)

  let relatedPoliticians: { slug: string; name: string; party: string | null; branch: string | null }[] = []
  const polState = (politician as Politician).state
  if (polState) {
    const { data: peers } = await supabaseService
      .from('cr_politicians')
      .select('slug, name, party, branch')
      .eq('state', polState)
      .neq('slug', slug)
      .limit(6)
    relatedPoliticians = (peers as typeof relatedPoliticians) || []
  }

  return {
    politician: politician as Politician,
    promises: (promises as PromiseRow[]) || [],
    receipts,
    predecessor,
    industries: (industries as { industry_label: string; total_contributions: number; rank: number }[]) || [],
    voteAlignments: (voteAlignments as { industry_label: string; alignment_score: number }[]) || [],
    relatedArticles: (relatedArticles as { slug: string; title: string; kind: string; published_at: string | null }[]) || [],
    relatedPoliticians,
  }
}

export default async function PoliticianPage({ params }: { params: { slug: string } }) {
  const data = await getData(params.slug)
  if (!data) notFound()
  const { politician, promises, receipts, predecessor, industries, voteAlignments, relatedArticles, relatedPoliticians } = data
  const ent = await getEntitlement()
  // Build the creator-share claim package (Viral Pack). Returns null
  // for politicians with no FEC/scorecard data — ViralPack handles that.
  const viralClaim = await buildClaim(params.slug)

  const featured = promises.filter((p) => p.is_featured)
  const nonFeatured = promises.filter((p) => !p.is_featured)
  const receiptsByPromise = receipts.reduce<Record<string, ReceiptModel[]>>((acc, r) => {
    if (!acc[r.promise_id]) acc[r.promise_id] = []
    acc[r.promise_id].push(r)
    return acc
  }, {})

  // SEALED gate. Trump's promises are the PAID product (sealed2016.com
  // book/PDF). Both Trump records — donald-trump-2016 (81 book promises)
  // and donald-trump (2024 cycle, 28 book-sourced promises) — expose the
  // graded book content. We TEASE the featured promises as proof, then
  // redact the rest behind a paywall card that pushes to SEALED. Every
  // OTHER politician stays fully free — the gate branches on slug only.
  const isSealedTrump =
    politician.slug === 'donald-trump-2016' || politician.slug === 'donald-trump'
  // The book grades 145 promises total (editorial rollup incl. inline
  // sub-pledges). On-site we hold 81 (2016) / 28 (2024) rows. The locked
  // count below counts the on-site rows we redact; the book pitch uses 145.
  const SEALED_BOOK_TOTAL = 145

  const stem = receiptStem(politician)
  const graded = politician.scorecard_graded_total || 0
  const pending = politician.scorecard_pending || 0
  const isLive = graded === 0 && pending > 0
  const dominantVerdict: Verdict = isLive
    ? 'pending'
    : (politician.scorecard_percentage_kept ?? 0) >= 60
      ? 'kept'
      : (politician.scorecard_percentage_kept ?? 0) >= 40
        ? 'partial'
        : 'broken'

  const scorecardId = `RCPT-${stem}-SCORECARD`
  const cleanName = displayName(politician)
  const lastName = cleanName.split(' ').slice(-1)[0]
  const profileShareHeadline = !isLive && politician.scorecard_percentage_kept != null
    ? `${cleanName}'s promise scorecard: ${Math.round(politician.scorecard_percentage_kept)}% kept (${graded} graded)`
    : `${cleanName}'s promise tracker: ${pending} promises tracking — live`

  // schema.org/Dataset JSON-LD for Google Dataset Search indexing.
  // Each per-politician page exposes its graded promise corpus as a
  // citable dataset. Honest counts only — no overclaim.
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${cleanName} — Campaign Promise Scorecard`,
    description: isLive
      ? `${pending} campaign promises from ${cleanName} currently tracked against the public record. Live, primary-source citations.`
      : `${graded} campaign promises from ${cleanName} graded against the public record using only primary sources (executive orders, agency reports, federal-register filings, FEC data).`,
    url: `https://campaignreceipts.com/politician/${politician.slug}`,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: { '@type': 'Organization', name: 'CampaignReceipts' },
    publisher: { '@type': 'Organization', name: 'SEALED Press' },
    isAccessibleForFree: true,
    keywords: [
      'campaign promises',
      'political accountability',
      cleanName,
      'executive orders',
      'citation archive',
      'primary sources',
    ],
  }

  // schema.org/Person JSON-LD — maps this page to the politician as a
  // knowledge-graph entity, so "[name] donors" / "who funds [name]" queries
  // can resolve to CR. jobTitle from branch; affiliation from party.
  const JOB_TITLE: Record<string, string> = {
    Senate: 'United States Senator',
    House: 'United States Representative',
    Governor: 'Governor',
    President: 'President of the United States',
  }
  const personJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: cleanName,
    url: `https://campaignreceipts.com/politician/${politician.slug}`,
    ...(JOB_TITLE[politician.branch] ? { jobTitle: JOB_TITLE[politician.branch] } : {}),
    ...(politician.photo_url ? { image: politician.photo_url } : {}),
    ...(politician.official_url ? { sameAs: [politician.official_url] } : {}),
    ...(politician.party
      ? { affiliation: { '@type': 'Organization', name: `${politician.party} Party` } }
      : {}),
    ...(politician.state
      ? { workLocation: { '@type': 'AdministrativeArea', name: politician.state } }
      : {}),
    subjectOf: {
      '@type': 'Dataset',
      name: `${cleanName} — Campaign Promise Scorecard`,
      url: `https://campaignreceipts.com/politician/${politician.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      {/* Personalization-light: record this visit so the homepage's
          "Continue tracking" rail can surface it next time. */}
      <TrackVisit
        kind="politician"
        id={politician.slug}
        name={cleanName}
        href={`/politician/${politician.slug}`}
      />

      {/* ───── MASTHEAD (paper-2 band) ──────────────────────────────
          Identity slab. Photo left, name + meta right. The H1 is the
          page identity but NOT the share asset — the share asset is
          the scorecard Receipt below. */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-10 pb-8 sm:pt-14 sm:pb-12">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 hover:text-ink transition-colors mb-8"
          >
            ← Back to directory
          </Link>

          <div className="grid sm:grid-cols-[140px_1fr] lg:grid-cols-[180px_1fr] gap-6 sm:gap-10 items-start">
            <div className="shrink-0 max-w-[140px] sm:max-w-none">
              <PoliticianAvatar
                name={politician.name}
                party={politician.party}
                photoUrl={politician.photo_url}
                size="xl"
                className="w-full aspect-[4/5] h-auto border border-line bg-paper"
              />
            </div>

            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3 flex items-center gap-2 flex-wrap">
                <span>
                  {politician.branch}{politician.state ? ` · ${politician.state}` : ''}
                  {' · '}{termLabel(politician)}
                </span>
                {politician.last_refreshed_at && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-3 px-2 py-0.5 text-ink-2 border border-line">
                    <span className="size-1.5 rounded-full bg-kept animate-pulse" aria-hidden />
                    Updated {new Date(politician.last_refreshed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
              <h1 className="font-display text-[40px] sm:text-[56px] leading-[0.96] tracking-[-0.01em] text-ink text-balance">
                {cleanName}
              </h1>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Tag variant={partyVariant(politician.party)}>
                  {politician.party}{politician.state ? ` · ${politician.state}` : ''}
                </Tag>
                {politician.age && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                    Age {politician.age}
                  </span>
                )}
                {politician.ideology_label && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
                    · {politician.ideology_label}
                  </span>
                )}
                <ReviewTierTag tier={politician.review_tier || 'standard'} />
              </div>

              {politician.profile_narrative && (
                <p className="mt-6 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl text-pretty">
                  {politician.profile_narrative}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trump cross-cycle link (only on Trump pages) */}
      {(politician.slug === 'donald-trump' || politician.slug === 'donald-trump-2016') && (
        <section className="border-b border-line bg-paper-3/50">
          <div className="section-shell py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 flex items-center justify-between flex-wrap gap-2">
            <span>
              {politician.slug === 'donald-trump'
                ? 'Viewing the 2024-cycle live tracker (2025–2029 term)'
                : 'Viewing the 2016-cycle final scorecard (2017–2021 term)'}
            </span>
            <Link
              href={politician.slug === 'donald-trump' ? '/politician/donald-trump-2016' : '/politician/donald-trump'}
              className="inline-flex items-center gap-1.5 text-ink hover:text-ink underline underline-offset-4 decoration-line hover:decoration-ink transition-colors"
            >
              {politician.slug === 'donald-trump'
                ? 'See the 2016 graded scorecard →'
                : 'See the 2024 live tracker →'}
            </Link>
          </div>
        </section>
      )}

      {/* ───── TENURE RECEIPT (backfilled AI narration) ─────────────
          A "receipt of their tenure": WHO funds them, what they voted /
          sponsored, and their BROKEN promises. Narrated by Haiku from a
          deterministic, fully-sourced bundle (scripts/backfill-politician-
          tenure-summary.mjs) — computed once, stored on the row, rendered
          statically. Donor + bill names are highlighted inline (<u>). */}
      {politician.tenure_summary_md && (
        <section className="section-shell pt-10 sm:pt-12 pb-2">
          <div className="max-w-[760px] mx-auto">
            <div className="rounded-md border border-line bg-paper-2 px-5 py-5 sm:px-6 sm:py-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3 flex items-center justify-between flex-wrap gap-2">
                <span>The receipt · {lastName}&rsquo;s tenure</span>
                <span className="text-ink-3 normal-case tracking-normal font-sans text-[11px]">
                  Who funds them · what they voted · broken promises
                </span>
              </div>
              <div
                className="dossier-prose font-sans text-[15px] text-ink-2 leading-[1.65]"
                dangerouslySetInnerHTML={{ __html: marked.parse(politician.tenure_summary_md, { async: false }) as string }}
              />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Narrated from FEC + Congress.gov receipts. Every figure traces to our data.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ───── CANONICAL SCORECARD RECEIPT (the share asset) ─────────
          This is the artifact reporters screenshot. Receipt-styled with
          perforated edges + tilted verdict stamp. */}
      <section className="section-shell pt-10 sm:pt-14 pb-2 scroll-mt-20" id="scorecard">
        <div className="max-w-[760px] mx-auto">
          <Receipt
            id={scorecardId}
            title={`${termLabel(politician)} scorecard`}
            headerRight={
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                As of {politician.last_refreshed_at ? politician.last_refreshed_at.slice(0, 10) : '—'}
              </span>
            }
            rows={
              isLive
                ? [
                    { k: 'Status', v: 'Live tracking', sans: true },
                    { k: 'Promises tracked', v: String(pending) },
                    { k: 'Promises graded', v: '0 — term in progress' },
                  ]
                : [
                    { k: 'Promises graded', v: String(graded) },
                    { k: 'Kept', v: `${politician.scorecard_kept || 0} (${fmtPercent((politician.scorecard_kept || 0) * 100 / Math.max(graded, 1))})` },
                    { k: 'Partial', v: `${politician.scorecard_partial || 0} (${fmtPercent((politician.scorecard_partial || 0) * 100 / Math.max(graded, 1))})` },
                    { k: 'Broken', v: `${politician.scorecard_broken || 0} (${fmtPercent((politician.scorecard_broken || 0) * 100 / Math.max(graded, 1))})` },
                    { k: 'You decide', v: `${politician.scorecard_you_decide || 0} (${fmtPercent((politician.scorecard_you_decide || 0) * 100 / Math.max(graded, 1))})` },
                    { k: 'Headline number', v: fmtPercent(politician.scorecard_percentage_kept), sans: true },
                  ]
            }
            verdict={dominantVerdict}
            stampLabel={
              isLive
                ? 'Tracking'
                : dominantVerdict === 'kept'
                  ? `${Math.round(politician.scorecard_percentage_kept ?? 0)}% kept`
                  : dominantVerdict === 'partial'
                    ? `${Math.round(politician.scorecard_percentage_kept ?? 0)}% kept`
                    : `${Math.round(politician.scorecard_percentage_kept ?? 0)}% kept`
            }
            verdictCopy={
              isLive ? (
                <>
                  Term in progress — verdicts publish once the term ends. We're tracking{' '}
                  <strong className="font-medium text-ink">{pending}</strong> promises and grading
                  each against primary sources as they land.
                </>
              ) : (
                <>
                  <strong className="font-medium text-ink">{lastName}</strong> kept{' '}
                  <strong className="font-medium text-ink">{Math.round(politician.scorecard_percentage_kept ?? 0)}%</strong>{' '}
                  of <strong className="font-medium text-ink">{graded}</strong> promises tracked for the{' '}
                  {termLabel(politician).toLowerCase()}. Each verdict is term-scoped, primary-sourced,
                  and reviewed by three sequential reviewers (neutral · conservative · progressive).
                </>
              )
            }
            footLeft={`Cite as: ${scorecardId}`}
            footRight="campaignreceipts.com"
            citation={apCitation.forPolitician({ name: cleanName, slug: politician.slug })}
          />

          <div className="mt-5 flex flex-wrap gap-3 items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 max-w-md">
              <ReviewTierLine tier={politician.review_tier || 'standard'} />
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Strip-PNG download. Per founder Q&A 2026-05-20:
                  the panel-spec'd ReceiptStrip is the artifact
                  influencers actually screenshot — one shocking
                  statement, photo, dotted-leader facts, quiet SEALED
                  CTA. Lives at /api/card/strip/<slug>. */}
              <a
                href={`/api/card/strip/${politician.slug}`}
                download
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-amber-text transition-colors underline underline-offset-4 decoration-line hover:decoration-amber-text"
                aria-label={`Download a 1080x1350 share-strip PNG for ${cleanName}`}
              >
                ↓ Share strip · PNG
              </a>
              <ShareButton text={profileShareHeadline} url={`/politician/${politician.slug}`} label="Share scorecard" />
            </div>
          </div>

          {/* Per-network share row (rev-7 batch C #2). The Web-Share button
              above handles mobile native sheet; this row gives desktop users
              X/FB/LinkedIn intent links + IG/TikTok copy-link affordances. */}
          <div className="mt-3">
            <ShareButtons
              title={profileShareHeadline}
              tagline="campaignreceipts.com"
              source="politician-page"
            />
          </div>

          {/* Viral Pack — creator-share package per ChatGPT audit + panel
              (2026-05-20). Caption + source line + 1080x1350 + 1080x1920
              vertical, all copy-to-clipboard. Renders nothing if claim
              data is unavailable (very-new politicians without FEC data). */}
          {viralClaim && (
            <div className="mt-5">
              <ViralPack slug={politician.slug} claim={viralClaim} />
            </div>
          )}

          {/* Citation block — copy-pasteable for journalists per
              engagement panel R2. "Journalists will not retype." */}
          <div className="mt-6">
            <CitationBlock
              receiptId={scorecardId}
              title={`${cleanName} — ${termLabel(politician)} scorecard`}
              url={`/politician/${politician.slug}#scorecard`}
            />
          </div>

          <div className="mt-6">
            <NewsletterCapture
              variant="inline-receipt"
              surface="politician"
              sourceSlug={politician.slug}
              heading="Track this politician's donors."
              body="We email you when new donors show up or a vote moves with their money."
              buttonLabel="Watch the money"
            />
          </div>

          {/* Per-politician notify-me (rev-7 batch C #6). Tagged with
              the politician slug so we can email this cohort when this
              specific scorecard changes — not the general newsletter list. */}
          <div className="mt-6">
            <PoliticianNotifyForm slug={politician.slug} name={cleanName} />
          </div>
        </div>
      </section>

      {/* Predecessor comparison */}
      {predecessor && (
        <PredecessorBar current={politician} predecessor={predecessor} />
      )}

      {/* Donor profile callout */}
      {politician.donor_profile && politician.donor_profile !== 'unknown' && (
        <section className="border-y border-line bg-paper-2 mt-8">
          <div className="section-shell py-4 flex items-center justify-between flex-wrap gap-3">
            <span className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">Donor profile</span>
              <DonorProfileTag profile={politician.donor_profile} />
            </span>
            <Link
              href={`/politician/${politician.slug}/donors`}
              className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:underline underline-offset-4 decoration-line hover:decoration-ink"
            >
              View funders →
            </Link>
          </div>
        </section>
      )}

      {/* InfluenceMap reverted 2026-05-20 per conversion/engagement
          panel. Two reasons:
            1. ~70% of politicians have "Individual / Retired" as their
               top donor industry — an FEC small-donor bucketing
               artifact, not a finding. The map's stroke-width scaling
               makes that bucket visually dominant on most dossiers,
               which reads as "CR is sloppy."
            2. Map adds visual stop-point above the SEALED CTA without
               adding return-visit pull (static snapshot, doesn't
               change week-over-week).
          Component file kept (app/components/InfluenceMap.tsx) — may
          revisit when FEC industry bucketing improves OR when an
          `is_editorially_interesting` flag derivation lands.
          Panel recommended ReceiptStrip primitive instead (queued). */}

      {/* Foreign-tied funding — renders only when records exist for this politician */}
      <ForeignTiedFunding politicianId={politician.id} politicianLastName={lastName} />

      {/* Pro paywall preview */}
      <ProDataPreview politician={politician} tier={ent.tier} />

      {/* ───── FEATURED PROMISES — full Receipt per chapter ──────── */}
      {featured.length > 0 && (
        <section className="section-shell py-12 sm:py-16">
          <div className="max-w-[760px] mx-auto mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
              The promises that define the record
            </div>
            <h2 className="font-display text-[32px] sm:text-[40px] leading-[1.05] tracking-[-0.01em] text-ink text-balance">
              {featured.length} chapter-defining promises.
            </h2>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl">
              Each promise below has its own Receipt — verdict, primary-source quotes, paper-trail
              pointers, and a case study. Linkable individually by Receipt ID for citation.
            </p>
          </div>

          <div className="space-y-12 max-w-[760px] mx-auto">
            {featured.map((p) => (
              <FeaturedPromise
                key={p.id}
                promise={p}
                receipts={receiptsByPromise[p.id] || []}
                stem={stem}
                politicianSlug={politician.slug}
                politicianName={cleanName}
              />
            ))}
          </div>
        </section>
      )}

      {/* ───── REMAINING PROMISES ──────────────────────────────────
          Non-Trump: every promise free, full brief.
          Trump (SEALED paid product): redact the rest behind a paywall
          card that pushes to the book. Featured above are the free tease. */}
      {nonFeatured.length > 0 && !isSealedTrump && (
        <section className="section-shell py-12 sm:py-16 border-t border-line">
          <div className="max-w-[760px] mx-auto mb-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
              Every other promise on file
            </div>
            <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.01em] text-ink">
              {nonFeatured.length} additional tracked promises.
            </h2>
          </div>

          <div className="max-w-[760px] mx-auto space-y-4">
            {nonFeatured.map((p) => {
              const rcptId = `RCPT-${stem}-${String(p.promise_number).padStart(3, '0')}`
              return (
                <PromiseBrief
                  key={p.id}
                  id={rcptId}
                  promise={p}
                />
              )
            })}
          </div>
        </section>
      )}

      {nonFeatured.length > 0 && isSealedTrump && (
        <SealedLockedPromises
          promises={nonFeatured}
          stem={stem}
          politicianSlug={politician.slug}
          firstName={cleanName.split(' ')[0]}
          bookTotal={SEALED_BOOK_TOTAL}
        />
      )}

      {/* ───── WAITLIST ─────────────────────────────────────────── */}
      <section className="section-shell py-12 sm:py-16 border-t border-line bg-paper-2">
        <div className="max-w-[640px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
            Get the receipts as they land
          </div>
          <h3 className="font-display text-[28px] sm:text-[32px] leading-[1.1] tracking-[-0.005em] text-ink">
            Email me when {lastName}'s record updates.
          </h3>
          <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
            One short email when a new verdict lands, when a major roll-call vote
            contradicts or fulfills a promise, or when the donor profile shifts. Free.
            Unsubscribe in one click.
          </p>
          <form
            method="post"
            action={`/api/waitlist?politician=${politician.slug}`}
            className="mt-6 flex gap-2 flex-wrap"
          >
            {/* Honeypot: invisible to people, filled by form bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-3.5 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-3 flex-1 min-w-[240px] transition"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink"
            >
              Notify me
            </button>
          </form>
        </div>
      </section>

      {/* ───── SEALED cross-link (dual CTA) ─────────────────────────
          CR → SEALED funnel. Read-more for browsers, direct-buy for
          readers already convinced by the scorecard above. */}
      <section className="section-shell pb-16">
        <aside className="max-w-[760px] mx-auto mt-12 rounded-md border border-line bg-paper-2 px-5 py-5 text-sm leading-relaxed text-ink-2">
          <p className="font-serif">
            This politician's promises are graded in <strong className="text-broken-600">SEALED</strong> — the 144-page book that pairs each verbatim quote with the receipt. 81 of 145 link to a primary source URL.
          </p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <a
              href={`https://sealed2016.com/?utm_source=campaignreceipts&utm_medium=cross-link&utm_content=politician-${politician.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-authority-700 underline-offset-4 hover:underline"
            >
              Read more →
            </a>
            <span className="text-ink-3">or</span>
            <a
              href={`https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767?utm_source=campaignreceipts&utm_medium=cross-link-buy&utm_content=politician-${politician.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-authority-700 underline-offset-4 hover:underline"
            >
              Get the book — $15 →
            </a>
          </div>
        </aside>
      </section>

      {/* ───── "Who funds <name>" (SEO: highest-volume CR-ownable query) ──
          Plain-language summary of the top donor industries, each with real
          FEC dollars (never thin — renders only when industry data exists),
          linking to the /donors deep page. Targets "who funds <name>" /
          "<name> donors". */}
      {industries.length > 0 && (
        <section className="section-shell pb-4">
          <div className="max-w-[760px] mx-auto">
            <h2 className="font-display text-[26px] sm:text-[30px] leading-tight tracking-[-0.01em] text-ink m-0">
              Who funds {cleanName}?
            </h2>
            <p className="mt-3 font-sans text-[15px] sm:text-base text-ink-2 leading-relaxed">
              {cleanName}&apos;s biggest donor industries are{' '}
              {industries.slice(0, 3).map((ind, i, arr) => (
                <span key={ind.industry_label}>
                  <strong className="text-ink">{ind.industry_label}</strong>
                  {' ('}
                  {`$${Math.round(Number(ind.total_contributions) || 0).toLocaleString('en-US')}`}
                  {')'}
                  {i < arr.length - 1 ? (i === arr.length - 2 ? ', and ' : ', ') : ''}
                </span>
              ))}
              . Every dollar is tied to an FEC filing.
            </p>
            <Link
              href={`/politician/${politician.slug}/donors`}
              className="mt-3 inline-flex items-center gap-1.5 font-sans text-sm text-authority-700 underline-offset-4 hover:underline"
            >
              See {cleanName}&apos;s full donor breakdown →
            </Link>
          </div>
        </section>
      )}

      {/* ───── Related (SEO internal linking) ───────────────────────
          De-orphans the articles that mention this politician and links
          same-state peers, spreading crawl equity from this high-authority
          template. Renders only when there's something to show. */}
      {(relatedArticles.length > 0 || relatedPoliticians.length > 0) && (
        <section className="section-shell pb-20">
          <div className="max-w-[760px] mx-auto grid gap-10 sm:grid-cols-2">
            {relatedArticles.length > 0 && (
              <div>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-3">
                  Articles mentioning {cleanName}
                </h2>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {relatedArticles.map((art) => (
                    <li key={art.slug}>
                      <Link
                        href={`/articles/${art.slug}`}
                        className="font-sans text-sm text-ink-2 hover:text-ink transition-colors underline-offset-2 hover:underline"
                      >
                        {art.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedPoliticians.length > 0 && (
              <div>
                <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-3">
                  More from {politician.state}
                </h2>
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {relatedPoliticians.map((peer) => (
                    <li key={peer.slug}>
                      <Link
                        href={`/politician/${peer.slug}`}
                        className="font-sans text-sm text-ink-2 hover:text-ink transition-colors underline-offset-2 hover:underline"
                      >
                        {peer.name}
                        {peer.party || peer.branch ? (
                          <span className="text-ink-3">
                            {' '}· {[peer.party, peer.branch].filter(Boolean).join(' · ')}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )
}

// ───── Sub-components ─────────────────────────────────────────────

function FeaturedPromise({
  promise,
  receipts,
  stem,
  politicianSlug,
  politicianName,
}: {
  promise: PromiseRow
  receipts: ReceiptModel[]
  stem: string
  politicianSlug: string
  politicianName: string
}) {
  const rcptId = `RCPT-${stem}-${String(promise.promise_number).padStart(3, '0')}`
  const anchorId = rcptId.toLowerCase()
  const verdict = vk(promise.verdict)
  const shareText = `${politicianName} — ${promise.promise_text} (${promise.verdict})`
  const shareUrl = `/politician/${politicianSlug}#${anchorId}`

  // Build receipt rows: category, verdict reasoning (sans), then receipts
  const headerRows: { k: React.ReactNode; v: React.ReactNode; sans?: boolean }[] = []
  if (promise.category) headerRows.push({ k: 'Category', v: promise.category })
  if (promise.verdict_reasoning) {
    headerRows.push({ k: 'Why this grade', v: promise.verdict_reasoning, sans: true })
  }

  return (
    <article
      id={anchorId}
      className="scroll-mt-24 target:outline target:outline-2 target:outline-offset-4 target:outline-amber-500/40"
    >
      <Receipt
        id={rcptId}
        title={promise.promise_text}
        headerRight={
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
            Promise #{promise.promise_number}
          </span>
        }
        rows={headerRows}
        verdict={verdict}
        verdictCopy={null}
        footLeft={`Cite as: ${rcptId}`}
        footRight="campaignreceipts.com"
        citation={apCitation.forPolitician({ name: politicianName, slug: politicianSlug })}
      />

      {/* Receipts list — appears below the Receipt card. Same dossier
          feel: dashed divider, mono-cap header, primary-source quotes
          with citations. */}
      {receipts.length > 0 && (
        <div className="mt-6 pt-6 border-t border-dashed border-line">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-4">
            Primary-source receipts ({receipts.length})
          </div>
          <ul className="space-y-5 list-none p-0 m-0">
            {receipts.map((r) => (
              <li key={r.id} className="pl-4 border-l-2 border-line">
                {r.quote && (
                  <blockquote className="font-display italic text-[18px] sm:text-[20px] leading-[1.45] text-ink m-0">
                    {`"${r.quote}"`}
                  </blockquote>
                )}
                <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-2">
                  {r.source_url ? (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                    >
                      {r.source_publication || 'Primary source'}
                    </a>
                  ) : (
                    <span>{r.source_publication || 'Primary source'}</span>
                  )}
                  {r.source_date && <span> · {r.source_date}</span>}
                </div>
                {r.paper_trail_notes && (
                  <p className="mt-2 font-sans text-[14px] text-ink-2 leading-relaxed">
                    {r.paper_trail_notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Case study (collapsible — preserves the dossier-not-essay
          feel; readers opt in). Per rev 5 panel feedback: receipts
          duplicated inside the details body so a reader following the
          narrative reaches primary sources without scrolling back. */}
      {promise.case_study_narrative && (
        <details className="mt-6 group">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.18em] text-ink hover:text-ink-2 select-none inline-flex items-center gap-2">
            Read the full case study
            <span className="transition-transform group-open:rotate-90">→</span>
          </summary>
          <div className="mt-5 pl-4 border-l-2 border-line font-sans text-[15px] text-ink-2 leading-relaxed whitespace-pre-line max-w-2xl">
            {promise.case_study_narrative}
          </div>
          {/* Re-render the receipts inside the details body so a reader
              who follows the narrative downward lands on the primary
              sources without scrolling back up. Each link is a real
              <a href> to a federalregister.gov / congress.gov /
              debates.org / cbsnews.com / cnn.com primary source. */}
          {receipts.length > 0 && (
            <div className="mt-6 pl-4 border-l-2 border-line max-w-2xl">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
                Sources cited in this case study
              </div>
              <ol className="space-y-3 list-decimal list-inside font-sans text-[14px] text-ink-2 leading-relaxed">
                {receipts.map((r) => (
                  <li key={`cs-${r.id}`}>
                    {r.source_url ? (
                      <a
                        href={r.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
                      >
                        {r.source_publication || 'Primary source'}
                      </a>
                    ) : (
                      <span className="text-ink font-medium">{r.source_publication || 'Primary source'}</span>
                    )}
                    {r.source_date && <span> · {r.source_date}</span>}
                    {r.quote && (
                      <> — <cite className="not-italic text-ink-2">"{r.quote.length > 140 ? r.quote.slice(0, 140) + '…' : r.quote}"</cite></>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </details>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          campaignreceipts.com/politician/{politicianSlug}#{anchorId}
        </span>
        <ShareButton text={shareText} url={shareUrl} label="Share this promise" />
      </div>
    </article>
  )
}

/** A single non-featured promise, shown free with verdict stamp + a
 *  brief case study. Brief = case_study_narrative where it exists, else
 *  verdict_reasoning (always present on graded promises). Never empty:
 *  graded promises always carry at least a reasoning line. */
function PromiseBrief({ id, promise }: { id: string; promise: PromiseRow }) {
  const verdict = vk(promise.verdict)
  // The brief case study. Prefer the long narrative; fall back to the
  // shorter verdict reasoning. Both are free.
  const fullCase = promise.case_study_narrative?.trim() || ''
  const brief = fullCase || promise.verdict_reasoning?.trim() || ''
  const hasLongCase = fullCase.length > 0
  // Show a short teaser inline; full text opens on tap.
  const teaserLimit = 220
  const needsExpand = brief.length > teaserLimit
  const teaser = needsExpand ? brief.slice(0, teaserLimit).trimEnd() + '…' : brief

  return (
    <article className="receipt">
      <div className="receipt-head">
        <div className="min-w-0 flex-1">
          <div className="receipt-id">{id}</div>
          <h4 className="font-display text-[20px] leading-[1.25] tracking-[-0.005em] text-ink mt-1">
            {promise.promise_text}
          </h4>
        </div>
        <Stamp kind={verdict} />
      </div>
      <div className="receipt-body">
        {promise.category && (
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 mb-2">
            {promise.category}
          </div>
        )}
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2 mb-1">
          {hasLongCase ? 'The receipt' : 'Why this verdict'}
        </div>
        {brief ? (
          needsExpand ? (
            <details className="group">
              <summary className="cursor-pointer list-none select-none font-sans text-[14px] text-ink-2 leading-relaxed">
                <span className="group-open:hidden whitespace-pre-line">{teaser}</span>
                <span className="hidden group-open:inline whitespace-pre-line">{brief}</span>
                <span className="mt-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-ink-2">
                  <span className="group-open:hidden">Read the full receipt →</span>
                  <span className="hidden group-open:inline">Show less ↑</span>
                </span>
              </summary>
            </details>
          ) : (
            <p className="font-sans text-[14px] text-ink-2 leading-relaxed whitespace-pre-line m-0">
              {brief}
            </p>
          )
        ) : (
          <p className="font-sans text-[14px] text-ink-3 leading-relaxed m-0">Under review.</p>
        )}
      </div>
      <div className="receipt-foot">
        <span>{id}</span>
        <span>campaignreceipts.com</span>
      </div>
    </article>
  )
}

/** SEALED paywall section for Trump pages. The featured promises above
 *  are the free tease (proof the grading is real). Here we show the rest
 *  as redacted parchment stubs — present but blurred, with verdict stamp
 *  visible so the reader sees there IS a verdict, just not the receipt —
 *  capped under a lock card that pushes to the SEALED book. */
function SealedLockedPromises({
  promises,
  stem,
  politicianSlug,
  firstName,
  bookTotal,
}: {
  promises: PromiseRow[]
  stem: string
  politicianSlug: string
  firstName: string
  bookTotal: number
}) {
  // Show a handful of redacted stubs as a wall, not the whole list — the
  // point is "there's a lot more," not to render 77 blurred cards.
  const preview = promises.slice(0, 5)
  const lockedCount = promises.length
  const buyUrl = `https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767?utm_source=campaignreceipts&utm_medium=promise-lock&utm_content=politician-${politicianSlug}`
  const readUrl = `https://sealed2016.com/?utm_source=campaignreceipts&utm_medium=promise-lock&utm_content=politician-${politicianSlug}`

  return (
    <section className="section-shell py-12 sm:py-16 border-t border-line">
      <div className="max-w-[760px] mx-auto mb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-2">
          The rest is in the book
        </div>
        <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.05] tracking-[-0.01em] text-ink">
          {lockedCount} more promises. All graded.
        </h2>
        <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed max-w-2xl">
          See who he kept his word to — and who he didn't. All 145, in the book.
        </p>
      </div>

      {/* Redacted wall: real verdict stamps, blurred receipts. */}
      <div className="max-w-[760px] mx-auto relative">
        <div className="space-y-4" aria-hidden>
          {preview.map((p) => {
            const rcptId = `RCPT-${stem}-${String(p.promise_number).padStart(3, '0')}`
            const verdict = vk(p.verdict)
            return (
              <article key={p.id} className="receipt">
                <div className="receipt-head">
                  <div className="min-w-0 flex-1">
                    <div className="receipt-id">{rcptId}</div>
                    <h4 className="font-display text-[20px] leading-[1.25] tracking-[-0.005em] text-ink mt-1 blur-[5px] select-none">
                      {p.promise_text}
                    </h4>
                  </div>
                  <Stamp kind={verdict} />
                </div>
                <div className="receipt-body">
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-2 mb-1">
                    The receipt
                  </div>
                  <p className="font-sans text-[14px] text-ink-2 leading-relaxed m-0 blur-[5px] select-none">
                    {(p.verdict_reasoning || 'Graded against the public record in the SEALED book, with the primary source for every claim.').slice(0, 200)}
                  </p>
                </div>
                <div className="receipt-foot">
                  <span>{rcptId}</span>
                  <span>SEALED</span>
                </div>
              </article>
            )
          })}
        </div>

        {/* Fade the wall into the lock card. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-paper" />
      </div>

      {/* Lock card — pushes to SEALED. */}
      <aside className="max-w-[760px] mx-auto mt-2 rounded-md border-2 border-ink bg-paper-2 px-6 py-7 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
          Locked · in the book
        </div>
        <h3 className="font-display text-[26px] sm:text-[32px] leading-[1.1] tracking-[-0.005em] text-ink">
          +{lockedCount} more graded promises.
        </h3>
        <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed max-w-md mx-auto">
          We graded all {bookTotal} of {firstName}'s promises. The receipt for
          each one is in the book. Every grade. Every source.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-6 py-3 transition-colors border border-ink"
          >
            Get the book
          </a>
          <a
            href={readUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink underline underline-offset-4 decoration-line hover:decoration-ink transition-colors"
          >
            See a sample →
          </a>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          $15 · book + PDF · sealed2016.com
        </p>
      </aside>
    </section>
  )
}

function DonorProfileTag({ profile }: { profile: string }) {
  const variant: 'kept' | 'broken' | 'partial' | 'neutral' =
    profile === 'grassroots' ? 'kept' :
    profile === 'corporate' ? 'broken' :
    profile === 'self-funded' ? 'partial' :
    'neutral'
  // Use the Tag component if it supports these; otherwise inline a chip.
  return <Tag variant={variant as any}>{profile}</Tag>
}

function ReviewTierTag({ tier }: { tier: 'full' | 'standard' | 'book-sourced' | 'pending' }) {
  const map: Record<string, { label: string; variant: 'kept' | 'partial' | 'broken' | 'neutral' }> = {
    full: { label: 'Full review · 3 reviewers', variant: 'kept' },
    'book-sourced': { label: 'Book-sourced · SEALED Press', variant: 'partial' },
    pending: { label: 'Pending full review', variant: 'neutral' },
    standard: { label: 'Standard review', variant: 'neutral' },
  }
  const m = map[tier] || map.standard
  return <Tag variant={m.variant as any}>{m.label}</Tag>
}

function ReviewTierLine({ tier }: { tier: 'full' | 'standard' | 'book-sourced' | 'pending' }) {
  if (tier === 'full') {
    return <>Full review · neutral + conservative + progressive reviewers must clear each verdict before publication.</>
  }
  if (tier === 'book-sourced') {
    return <>Sourced from the SEALED Press 2016 case study (145-promise audit, paper-trail citations on every claim).</>
  }
  if (tier === 'pending') {
    return <>Pending full review · primary sources only, single editorial pass so far.</>
  }
  return <>Standard review · primary sources, single editorial pass.</>
}
