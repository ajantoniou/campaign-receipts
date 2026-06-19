// /corrections — public corrections log.
//
// Two data sources unioned on this surface:
//
//   1. cr_corrections (NEW, 2026-05-21) — editorial corrections logged
//      by the editor for any sitewide change: methodology fix, donor
//      attribution error, mis-quoted source, etc. SQL-only insertion
//      for v1.
//
//   2. cr_audit_findings (existing) — resolved three-reviewer audit
//      verdict-change findings. Already public; kept here so the
//      "corrections" surface is the one URL newsrooms bookmark.
//
// Per ChatGPT audit + 4-expert panel newsroom-buyer persona: "A
// corrections log with RSS — that's the single artifact that converts
// a $200/mo subscription to legal-approved sourcing." Both sources
// feed /corrections/rss.xml.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import RelativeTime from '@/app/components/RelativeTime'
import VerdictBadge from '@/app/components/VerdictBadge'
import { History } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Corrections — CampaignReceipts',
  description:
    'Every editorial correction and resolved verdict-change finding. Subscribe via RSS at /corrections/rss.xml.',
  alternates: {
    types: {
      'application/rss+xml': '/corrections/rss.xml',
    },
  },
}

type EditorialCorrection = {
  id: string
  occurred_at: string
  headline: string
  what_was_wrong: string
  what_now_says: string
  affects_urls: string[] | null
  editor_note: string | null
}

type AuditFinding = {
  id: string
  run_started_at: string
  resolved_at: string | null
  resolution: string | null
  original_verdict: 'KEPT' | 'PARTIAL' | 'BROKEN' | 'YOU_DECIDE'
  audit_recommendation: string | null
  audit_notes: string | null
  politician_slug_snapshot: string | null
  promise_number_snapshot: number | null
  promise_text_snapshot: string | null
}

async function getEditorialCorrections(): Promise<EditorialCorrection[]> {
  const { data } = await supabaseService
    .from('cr_corrections')
    .select('id, occurred_at, headline, what_was_wrong, what_now_says, affects_urls, editor_note')
    .order('occurred_at', { ascending: false })
    .limit(100)
  return (data as EditorialCorrection[]) || []
}

async function getAuditFindings(): Promise<AuditFinding[]> {
  const { data } = await supabaseService
    .from('cr_audit_findings')
    .select(
      'id, run_started_at, resolved_at, resolution, original_verdict, audit_recommendation, audit_notes, politician_slug_snapshot, promise_number_snapshot, promise_text_snapshot',
    )
    .not('resolved_at', 'is', null)
    .order('resolved_at', { ascending: false })
    .limit(100)
  return (data || []) as AuditFinding[]
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function CorrectionsPage() {
  const [editorial, audit] = await Promise.all([
    getEditorialCorrections(),
    getAuditFindings(),
  ])

  return (
    <>
      {/* ───── MASTHEAD ─────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell pt-12 pb-10 sm:pt-16 sm:pb-12">
          <div className="max-w-[760px] mx-auto">
            <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-broken mb-3 inline-flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-broken" aria-hidden />
              Corrections · audit trail
            </div>
            <h1 className="font-display text-[40px] sm:text-[52px] leading-[1.02] tracking-[-0.012em] text-ink text-balance m-0">
              Every correction we have made.
            </h1>
            <p className="mt-4 font-sans text-[15px] sm:text-[16px] text-ink-2 leading-[1.55] max-w-[640px]">
              We get things wrong sometimes. When we do, we log it here with the
              old text, the new text, the affected pages, and the date. Nothing
              quietly edited away. Newsrooms can{' '}
              <Link
                href="/corrections/rss.xml"
                className="text-ink underline underline-offset-4 decoration-line hover:decoration-ink"
              >
                subscribe via RSS
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ───── EDITORIAL CORRECTIONS (NEW, top-of-page) ── */}
      <section className="section-shell pt-10 sm:pt-14 pb-8">
        <div className="max-w-[760px] mx-auto">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-5">
            Editorial corrections · sitewide
          </div>

          {editorial.length === 0 ? (
            <div className="rounded-lg border border-line bg-paper p-8 text-center">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-3 mb-3">
                No editorial corrections logged yet
              </div>
              <p className="font-sans text-[14px] text-ink-2 leading-relaxed m-0 max-w-md mx-auto">
                When we issue our first editorial correction (methodology fix,
                donor-attribution error, mis-quoted source), it lands here and
                in the RSS feed simultaneously.
              </p>
            </div>
          ) : (
            <ol className="m-0 p-0 list-none space-y-5">
              {editorial.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-line bg-paper p-5 sm:p-6"
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-broken">
                      Corrected · {fmtDate(c.occurred_at)}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
                      RCPT-CORR-{c.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="font-display text-[22px] sm:text-[26px] leading-[1.15] tracking-[-0.005em] text-ink m-0 mb-4">
                    {c.headline}
                  </h2>

                  <dl className="m-0 p-0 space-y-3">
                    <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1 items-baseline">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
                        Was
                      </dt>
                      <dd className="font-sans text-[14px] text-ink-2 leading-[1.5] m-0 line-through decoration-broken/40 decoration-1">
                        {c.what_was_wrong}
                      </dd>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1 items-baseline">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-kept-sage">
                        Now
                      </dt>
                      <dd className="font-sans text-[14px] text-ink leading-[1.5] m-0">
                        {c.what_now_says}
                      </dd>
                    </div>
                  </dl>

                  {c.affects_urls && c.affects_urls.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-dotted border-line">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3 mr-2">
                        Affects:
                      </span>
                      <div className="inline-flex flex-wrap gap-x-3 gap-y-1">
                        {c.affects_urls.map((url, i) => {
                          const isInternal =
                            url.startsWith('/') || url.startsWith('campaignreceipts.com')
                          const href = url.startsWith('/')
                            ? url
                            : url.startsWith('http')
                              ? url
                              : `https://${url}`
                          return (
                            <a
                              key={i}
                              href={href}
                              {...(!isInternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                              className="font-mono text-[11px] text-ink hover:text-amber-text underline underline-offset-4 decoration-line hover:decoration-amber-text break-all"
                            >
                              {url}
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {c.editor_note && (
                    <p className="mt-4 pt-3 border-t border-dotted border-line font-sans italic text-[13px] text-ink-3 leading-[1.5] m-0">
                      Editor note: {c.editor_note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ───── AUDIT-FINDING RESOLUTIONS (existing) ─────── */}
      {audit.length > 0 && (
        <section className="bg-paper-2 border-t border-line">
          <div className="section-shell pt-10 sm:pt-14 pb-16">
            <div className="max-w-[760px] mx-auto">
              <div className="flex items-baseline justify-between gap-3 flex-wrap mb-5">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">
                  Verdict-change findings · three-reviewer audit
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 inline-flex items-center gap-1">
                  <History className="size-3" />
                  Resolved-only
                </span>
              </div>

              <ol className="m-0 p-0 list-none space-y-4">
                {audit.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-line bg-paper p-4 sm:p-5"
                  >
                    <div className="flex items-baseline justify-between gap-3 flex-wrap mb-2">
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
                        Resolved{' '}
                        {a.resolved_at && <RelativeTime iso={a.resolved_at} />}
                      </span>
                      {a.original_verdict && (
                        <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-ink-3">
                          From <VerdictBadge verdict={a.original_verdict} />
                        </span>
                      )}
                    </div>
                    {a.politician_slug_snapshot && a.promise_number_snapshot != null && (
                      <Link
                        href={`/politician/${a.politician_slug_snapshot}`}
                        className="font-display text-[18px] sm:text-[20px] leading-[1.2] text-ink no-underline hover:underline underline-offset-4 decoration-line hover:decoration-ink m-0 block"
                      >
                        {a.politician_slug_snapshot} · promise #
                        {a.promise_number_snapshot}
                      </Link>
                    )}
                    {a.promise_text_snapshot && (
                      <p className="mt-1 font-sans text-[13px] text-ink-2 leading-[1.5] m-0 italic">
                        "{a.promise_text_snapshot}"
                      </p>
                    )}
                    {a.resolution && (
                      <p className="mt-2 font-sans text-[13px] text-ink leading-[1.5] m-0">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-kept-sage mr-2">
                          Resolution:
                        </span>
                        {a.resolution}
                      </p>
                    )}
                    {a.audit_notes && (
                      <p className="mt-1 font-sans text-[12px] text-ink-3 leading-[1.5] m-0">
                        {a.audit_notes}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
