// Lightweight admin review surface for verdict-routing spot-audit findings.
// Per /methodology, the cr_audit_findings table holds 5%-sample re-routing
// recommendations from the monthly cron. This page surfaces unresolved
// findings so the editor can accept, reject, or annotate each one.
//
// AUTH: this is a public route for now (everything in the DB is meant to
// be transparent per the methodology page). If/when private operations
// need it, gate behind an env-var or Supabase Auth check.

import { supabaseService } from '@/lib/supabase'
import Link from 'next/link'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import RelativeTime from '@/app/components/RelativeTime'
import VerdictBadge from '@/app/components/VerdictBadge'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Finding = {
  id: string
  run_id: string
  run_started_at: string
  politician_id: string | null
  promise_id: string | null
  original_verdict: 'KEPT' | 'PARTIAL' | 'BROKEN' | 'YOU_DECIDE'
  audit_recommendation: string | null
  audit_notes: string | null
  resolved_at: string | null
  resolution: string | null
  created_at: string
  politician_slug_snapshot: string | null
  promise_number_snapshot: number | null
  promise_text_snapshot: string | null
  politician_slug?: string
  politician_name?: string
  promise_text?: string
  promise_number?: number
}

async function getFindings(): Promise<Finding[]> {
  const { data: raw } = await supabaseService
    .from('cr_audit_findings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  const findings = (raw || []) as Finding[]
  if (findings.length === 0) return findings

  // Hydrate politician + promise fields. Filter out null FKs (where the
  // referenced promise has since been re-seeded with a new UUID).
  const politicianIds = Array.from(new Set(findings.map((f) => f.politician_id).filter(Boolean) as string[]))
  const promiseIds = Array.from(new Set(findings.map((f) => f.promise_id).filter(Boolean) as string[]))
  const [{ data: politicians }, { data: promises }] = await Promise.all([
    politicianIds.length
      ? supabaseService.from('cr_politicians').select('id, slug, name').in('id', politicianIds)
      : Promise.resolve({ data: [] }),
    promiseIds.length
      ? supabaseService.from('cr_promises').select('id, promise_text, promise_number').in('id', promiseIds)
      : Promise.resolve({ data: [] }),
  ])
  const polMap = new Map((politicians || []).map((p: any) => [p.id, p]))
  const promMap = new Map((promises || []).map((p: any) => [p.id, p]))
  for (const f of findings) {
    const pol = f.politician_id ? polMap.get(f.politician_id) : null
    const prom = f.promise_id ? promMap.get(f.promise_id) : null
    if (pol) {
      f.politician_slug = pol.slug
      f.politician_name = pol.name
    } else if (f.politician_slug_snapshot) {
      f.politician_slug = f.politician_slug_snapshot
      f.politician_name = f.politician_slug_snapshot.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    if (prom) {
      f.promise_text = prom.promise_text
      f.promise_number = prom.promise_number
    } else {
      f.promise_text = f.promise_text_snapshot || undefined
      f.promise_number = f.promise_number_snapshot || undefined
    }
  }
  return findings
}

export default async function AuditPage() {
  const findings = await getFindings()
  const unresolved = findings.filter((f) => !f.resolved_at)
  const resolved = findings.filter((f) => f.resolved_at)

  const runs = Array.from(new Set(findings.map((f) => f.run_id))).slice(0, 5)

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-12 pb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
          <div className="eyebrow mb-2">Spot Audit · Verdict Routing</div>
          <h1 className="text-display-md text-ink-50">
            Monthly verdict-routing audit
          </h1>
          <p className="mt-4 text-ink-400 max-w-2xl text-[15px]">
            The audit script samples 5% of graded promises each month and applies the verdict-routing standard on the <Link href="/methodology#verdict-routing" className="text-amber-400 hover:text-amber-300">methodology page</Link>. Flagged promises are shown here for human review. The script never modifies <code className="text-amber-300 bg-ink-900 px-1 rounded">cr_promises</code> directly — every change is editor-approved.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-[11px] font-mono uppercase tracking-wider text-ink-500">
            <span><span className="text-ink-200">{unresolved.length}</span> unresolved</span>
            <span><span className="text-ink-200">{resolved.length}</span> resolved</span>
            <span><span className="text-ink-200">{runs.length}</span> recent runs</span>
          </div>
        </div>
      </section>

      <article className="section-shell py-10 space-y-12 max-w-4xl">
        {unresolved.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="size-4 text-amber-400" />
              <h2 className="text-xl font-semibold text-ink-50 tracking-tight">Unresolved findings</h2>
            </div>
            <ul className="space-y-3">
              {unresolved.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </ul>
          </section>
        )}

        {resolved.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <h2 className="text-xl font-semibold text-ink-50 tracking-tight">Resolved findings</h2>
            </div>
            <ul className="space-y-3">
              {resolved.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </ul>
          </section>
        )}

        {findings.length === 0 && (
          <div className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-12 text-center text-sm text-ink-500">
            No audit findings yet. The first scheduled run is the 1st of next month, 09:00 UTC.
          </div>
        )}
      </article>
    </>
  )
}

function FindingCard({ finding: f }: { finding: Finding }) {
  return (
    <li className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-500">
          Audit run · <RelativeTime iso={f.run_started_at} />
        </div>
        {f.resolved_at && (
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
            Resolved · <RelativeTime iso={f.resolved_at} />
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <VerdictBadge verdict={f.original_verdict} size="xs" />
        <span className="text-ink-500 text-xs">→</span>
        {f.audit_recommendation && (
          <VerdictBadge verdict={f.audit_recommendation as any} size="xs" />
        )}
        {f.politician_slug && f.politician_name && (
          <Link href={`/politician/${f.politician_slug}#promise-${f.promise_number}`} className="text-xs text-ink-400 hover:text-ink-200 ml-2 truncate">
            {f.politician_name}{f.promise_number ? ` · #${f.promise_number}` : ''}
          </Link>
        )}
      </div>
      {f.promise_text && (
        <p className="text-sm text-ink-200 leading-snug mb-2">{f.promise_text}</p>
      )}
      {f.audit_notes && (
        <p className="text-xs text-amber-300/80 leading-relaxed">{f.audit_notes}</p>
      )}
      {f.resolution && (
        <p className="mt-2 text-xs text-emerald-300/80 leading-relaxed">
          <strong>Resolution:</strong> {f.resolution}
        </p>
      )}
    </li>
  )
}
