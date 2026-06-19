// Retired from service — past presidents + governors only.
// Per founder spec: skip retired senators and House members.
// Lists every entry with in_office_to IS NOT NULL AND branch IN
// ('President', 'Governor').

import Link from 'next/link'
import { supabaseService, type Politician } from '@/lib/supabase'
import PoliticianAvatar from '@/app/components/PoliticianAvatar'
import ScorecardBar from '@/app/components/ScorecardBar'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Retired from service — CampaignReceipts',
  description: 'Final promise scorecards for past Presidents and Governors. Term complete, verdicts final.',
}

async function getRetired(): Promise<Politician[]> {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .not('in_office_to', 'is', null)
    .in('branch', ['President', 'Governor'])
    .order('in_office_to', { ascending: false })
  return (data as Politician[]) || []
}

export default async function RetiredPage() {
  const retired = await getRetired()
  const presidents = retired.filter((p) => p.branch === 'President')
  const governors = retired.filter((p) => p.branch === 'Governor')

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-12 pb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
          <div className="eyebrow mb-2">Final scorecards</div>
          <h1 className="text-display-lg text-ink-50 text-balance">Retired from service</h1>
          <p className="mt-5 text-lg text-ink-300 max-w-2xl leading-relaxed">
            Past Presidents and Governors whose terms have ended. Verdicts are final. We track senators and House members during their service but retire their pages from the rankings once they leave office &mdash; those still exist via search.
          </p>
        </div>
      </section>

      <article className="section-shell py-10 space-y-12">
        {presidents.length > 0 && (
          <Section title="Past Presidents" count={presidents.length}>
            <Grid politicians={presidents} />
          </Section>
        )}
        {governors.length > 0 && (
          <Section title="Past Governors" count={governors.length}>
            <Grid politicians={governors} />
          </Section>
        )}
        {retired.length === 0 && (
          <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center text-sm text-ink-500">
            No retired entries yet.
          </div>
        )}
      </article>
    </>
  )
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-baseline gap-3">
        <h2 className="text-2xl font-semibold text-ink-50 tracking-tight">{title}</h2>
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">{count} on file</span>
      </div>
      {children}
    </section>
  )
}

function Grid({ politicians }: { politicians: Politician[] }) {
  return (
    <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {politicians.map((p) => {
        const graded = p.scorecard_graded_total || 0
        const yEnd = p.in_office_to ? p.in_office_to.slice(0, 4) : ''
        const yStart = p.in_office_since ? p.in_office_since.slice(0, 4) : ''
        return (
          <li key={p.id}>
            <Link
              href={`/politician/${p.slug}`}
              className="group block h-full rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 hover:bg-ink-900/70 hover:ring-ink-700 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/40 transition-all duration-300 overflow-hidden"
            >
              <div className="p-4 flex flex-col h-full gap-4">
                <div className="flex items-start gap-3">
                  <PoliticianAvatar name={p.name} party={p.party} photoUrl={p.photo_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-ink-50 truncate">{p.name}</h3>
                    <div className="mt-1 text-[10px] font-mono uppercase tracking-wider text-ink-500">
                      {yStart}{yStart && yEnd ? '–' : ''}{yEnd} · {p.branch}
                    </div>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  {graded > 0 && p.scorecard_percentage_kept != null ? (
                    <>
                      <span className="text-3xl font-bold tabular-nums text-emerald-400 leading-none tracking-tight">
                        {Math.round(p.scorecard_percentage_kept)}<span className="text-xl">%</span>
                      </span>
                      <span className="text-[11px] text-ink-500">kept · {graded} graded</span>
                    </>
                  ) : (
                    <span className="text-sm text-ink-500">No graded verdicts</span>
                  )}
                </div>

                <div className="mt-auto">
                  <ScorecardBar
                    kept={p.scorecard_kept}
                    partial={p.scorecard_partial}
                    broken={p.scorecard_broken}
                    youDecide={p.scorecard_you_decide}
                    total={graded || p.scorecard_total}
                    size="sm"
                  />
                  <div className="mt-2 text-[10px] font-mono uppercase tracking-wider text-ink-600 flex items-center justify-between">
                    <span>Final scorecard</span>
                    <ArrowRight className="size-3 text-ink-700 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
