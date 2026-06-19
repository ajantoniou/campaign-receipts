// Compare two politicians side-by-side. Designed to be screenshotted —
// two VerdictCards stacked horizontally on desktop, vertically on mobile,
// with a thin meta strip between them.

import Link from 'next/link'
import { supabaseService, type Politician } from '@/lib/supabase'
import VerdictCard from '@/app/components/VerdictCard'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ searchParams }: { searchParams: { a?: string; b?: string } }) {
  if (!searchParams.a || !searchParams.b) {
    return {
      title: 'Compare politicians — CampaignReceipts',
      alternates: { canonical: '/compare' },
    }
  }
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('name')
    .in('slug', [searchParams.a, searchParams.b])
  const names = (data || []).map((r: any) => r.name).join(' vs. ')
  // Order-normalized canonical: ?a=x&b=y and ?a=y&b=x are the same comparison,
  // so both point at one URL (slugs sorted) to consolidate crawl equity.
  const [c1, c2] = [searchParams.a, searchParams.b].sort()
  return {
    title: `${names} — promise tracker compare | CampaignReceipts`,
    description: `Side-by-side promise scorecards: ${names}. Term-scoped, both-sides reviewed.`,
    alternates: { canonical: `/compare?a=${c1}&b=${c2}` },
  }
}

async function getOne(slug: string): Promise<Politician | null> {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('slug', slug)
    .single()
  return (data as Politician | null) || null
}

async function getAllForPicker(): Promise<Pick<Politician, 'slug' | 'name' | 'party' | 'state' | 'branch'>[]> {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('slug, name, party, state, branch')
    .order('name')
  return (data as any[]) || []
}

export default async function ComparePage({ searchParams }: { searchParams: { a?: string; b?: string } }) {
  const a = searchParams.a ? await getOne(searchParams.a) : null
  const b = searchParams.b ? await getOne(searchParams.b) : null

  // If either side is missing, render the picker rather than an error page.
  if (!a || !b) {
    const all = await getAllForPicker()
    return <ComparePicker all={all} a={a} b={b} />
  }

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-12 pb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-200 transition-colors mb-6">
            <ArrowLeft className="size-3.5" />
            All politicians
          </Link>
          <div className="eyebrow mb-2">Side-by-side</div>
          <h1 className="text-display-md text-ink-50 text-balance">
            {a.name} <span className="text-ink-500">vs.</span> {b.name}
          </h1>
          <p className="mt-4 text-ink-400 max-w-2xl text-[15px]">
            Term-scoped promise scorecards on the same page. The kept-rate compares only graded terms; live trackers show pending counts.
          </p>
        </div>
      </section>

      <section className="section-shell py-10 grid lg:grid-cols-2 gap-6">
        <div>
          <Link href={`/politician/${a.slug}`} className="block group">
            <VerdictCard politician={a} />
          </Link>
        </div>
        <div>
          <Link href={`/politician/${b.slug}`} className="block group">
            <VerdictCard politician={b} />
          </Link>
        </div>
      </section>

      <section className="section-shell pb-16">
        <div className="text-xs text-ink-500 flex items-center justify-center gap-2 flex-wrap">
          <Link href={`/compare?a=${a.slug}&b=`} className="hover:text-ink-200">Replace {a.name.split(' ').slice(-1)[0]}</Link>
          <span className="text-ink-700">·</span>
          <Link href={`/compare?a=${b.slug}&b=`} className="hover:text-ink-200">Replace {b.name.split(' ').slice(-1)[0]}</Link>
          <span className="text-ink-700">·</span>
          <Link href="/compare" className="hover:text-ink-200">Start over</Link>
        </div>
      </section>
    </>
  )
}

function ComparePicker({
  all,
  a,
  b,
}: {
  all: Pick<Politician, 'slug' | 'name' | 'party' | 'state' | 'branch'>[]
  a: Politician | null
  b: Politician | null
}) {
  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-16 pb-10">
          <div className="eyebrow mb-3">Side-by-side</div>
          <h1 className="text-display-lg text-ink-50 text-balance">Compare two politicians</h1>
          <p className="mt-5 text-lg text-ink-300 max-w-2xl leading-relaxed">
            Pick any two politicians and see their promise scorecards on one page. Term-scoped, both-sides reviewed.
          </p>
        </div>
      </section>

      <form className="section-shell py-10 grid sm:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end" method="get">
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Politician A</span>
          <select name="a" defaultValue={a?.slug || ''} className="bg-ink-950 ring-1 ring-ink-800 focus:ring-amber-500/50 focus:outline-none rounded-md px-3 py-2.5 text-sm text-ink-100">
            <option value="">— pick —</option>
            {all.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name} · {p.party[0]} · {p.state} · {p.branch}</option>
            ))}
          </select>
        </label>
        <div className="hidden sm:flex items-end pb-3 text-ink-500 text-xs">vs.</div>
        <label className="flex flex-col gap-1">
          <span className="eyebrow">Politician B</span>
          <select name="b" defaultValue={b?.slug || ''} className="bg-ink-950 ring-1 ring-ink-800 focus:ring-amber-500/50 focus:outline-none rounded-md px-3 py-2.5 text-sm text-ink-100">
            <option value="">— pick —</option>
            {all.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name} · {p.party[0]} · {p.state} · {p.branch}</option>
            ))}
          </select>
        </label>
        <button className="btn-accent" type="submit">Compare</button>
      </form>
    </>
  )
}
