// Replaces the endless 500-politician scroll on the homepage. Renders a
// grid of small "Top 10" leaderboard cards so the user can drill into the
// slice that matters to them without scrolling past 500 rows to reach
// the footer.
//
// Each card pulls its own top-10 subset (e.g., top 10 Democratic Senate
// by % kept; top 10 most pending). The Full Directory link below the
// grid goes to /directory for users who want the dense paginated list.

import Link from 'next/link'
import type { Politician } from '@/lib/supabase'
import PoliticianAvatar from './PoliticianAvatar'
import { ArrowRight, Flame, Award, AlertTriangle, Clock, Activity, MapPin, Users, Calendar, Sparkles } from 'lucide-react'

// Editor's pick — 5 verdicts worth arguing about. Curated by slug so the
// list is stable across batches. Each gets a one-line editorial gloss.
const EDITORS_PICK: { slug: string; note: string }[] = [
  { slug: 'donald-trump-2016', note: 'The case study that started the site' },
  { slug: 'alexandria-ocasio-cortez', note: 'The progressive flank' },
  { slug: 'susan-collins', note: 'The senate moderate' },
  { slug: 'joe-manchin', note: 'The only graded current-cycle senator' },
  { slug: 'marjorie-taylor-greene', note: 'The MAGA flank' },
]

type Track = 'graded' | 'live'

export default function RankingCards({
  politicians,
  allPoliticians,
  track,
}: {
  politicians: Politician[]
  allPoliticians?: Politician[]
  track: Track
}) {
  // Editor's pick uses full pool so it surfaces across both tracks.
  const editorsPool = allPoliticians ?? politicians
  // Pre-bucket once.
  const dems = politicians.filter((p) => p.party === 'Democratic')
  const reps = politicians.filter((p) => p.party === 'Republican')
  const inds = politicians.filter((p) => p.party === 'Independent')

  if (track === 'graded') {
    const graded = politicians.filter((p) => (p.scorecard_graded_total || 0) > 0 && p.scorecard_percentage_kept != null)
    const byKept = [...graded].sort((a, b) => (b.scorecard_percentage_kept ?? 0) - (a.scorecard_percentage_kept ?? 0))
    const byBroken = [...graded].sort((a, b) => {
      const aB = a.scorecard_graded_total ? a.scorecard_broken / a.scorecard_graded_total : 0
      const bB = b.scorecard_graded_total ? b.scorecard_broken / b.scorecard_graded_total : 0
      return bB - aB
    })
    const dGraded = graded.filter((p) => p.party === 'Democratic').sort((a, b) => (b.scorecard_percentage_kept ?? 0) - (a.scorecard_percentage_kept ?? 0))
    const rGraded = graded.filter((p) => p.party === 'Republican').sort((a, b) => (b.scorecard_percentage_kept ?? 0) - (a.scorecard_percentage_kept ?? 0))
    const recentlyGraded = [...graded].sort((a, b) => {
      const aE = a.current_term_end || ''
      const bE = b.current_term_end || ''
      return bE.localeCompare(aE)
    })

    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <EditorsPickCard politicians={editorsPool} />
        <Card title="Highest kept-rate" subtitle="% Kept · graded terms" icon={Award} accent="emerald" items={byKept.slice(0, 10).map((p) => ({ p, value: `${Math.round(p.scorecard_percentage_kept ?? 0)}%` }))} />
        <Card title="Most-broken records" subtitle="% Broken · graded terms" icon={AlertTriangle} accent="rose" items={byBroken.slice(0, 10).map((p) => {
          const pct = p.scorecard_graded_total ? Math.round((p.scorecard_broken / p.scorecard_graded_total) * 100) : 0
          return { p, value: `${pct}%` }
        })} />
        <Card title="Top graded Democrats" subtitle="% Kept · D" icon={Users} accent="sky" items={dGraded.slice(0, 10).map((p) => ({ p, value: `${Math.round(p.scorecard_percentage_kept ?? 0)}%` }))} />
        <Card title="Top graded Republicans" subtitle="% Kept · R" icon={Users} accent="rose" items={rGraded.slice(0, 10).map((p) => ({ p, value: `${Math.round(p.scorecard_percentage_kept ?? 0)}%` }))} />
        <Card title="Browse by state" subtitle="50 state pages" icon={MapPin} accent="amber" stateLinks />
      </div>
    )
  }

  // Live track
  const byPending = [...politicians].sort((a, b) => (b.scorecard_pending || 0) - (a.scorecard_pending || 0))
  const youngest = [...politicians].filter((p) => p.age && p.age > 0).sort((a, b) => (a.age || 999) - (b.age || 999))
  const oldest = [...politicians].filter((p) => p.age && p.age > 0).sort((a, b) => (b.age || 0) - (a.age || 0))

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <EditorsPickCard politicians={politicians} />
      <Card title="Most active right now" subtitle="Promises in play · current term" icon={Flame} accent="amber" items={byPending.slice(0, 10).map((p) => ({ p, value: String(p.scorecard_pending || 0) }))} />
      <Card title="Most-tracked Democrats" subtitle="Pending · D" icon={Users} accent="sky" items={dems.sort((a, b) => (b.scorecard_pending || 0) - (a.scorecard_pending || 0)).slice(0, 10).map((p) => ({ p, value: String(p.scorecard_pending || 0) }))} />
      <Card title="Most-tracked Republicans" subtitle="Pending · R" icon={Users} accent="rose" items={reps.sort((a, b) => (b.scorecard_pending || 0) - (a.scorecard_pending || 0)).slice(0, 10).map((p) => ({ p, value: String(p.scorecard_pending || 0) }))} />
      <Card title="Independents" subtitle="Pending · I" icon={Activity} accent="amber" items={inds.sort((a, b) => (b.scorecard_pending || 0) - (a.scorecard_pending || 0)).slice(0, 10).map((p) => ({ p, value: String(p.scorecard_pending || 0) }))} />
      <Card title="Browse by state" subtitle="50 state pages" icon={MapPin} accent="amber" stateLinks />
    </div>
  )
}

function EditorsPickCard({ politicians }: { politicians: Politician[] }) {
  // Resolve slugs from the politicians pool. We also need to search the
  // FULL DB pool (politicians arg is filtered by track), so on miss we
  // just skip — that's acceptable for the editor's pick.
  const bySlug = new Map(politicians.map((p) => [p.slug, p]))
  const picks = EDITORS_PICK.map((pick) => ({ pick, p: bySlug.get(pick.slug) })).filter((x) => x.p) as { pick: typeof EDITORS_PICK[number]; p: Politician }[]

  return (
    <section className="rounded-xl ring-1 ring-amber-500/30 bg-gradient-to-br from-amber-500/[0.05] to-ink-900/40 overflow-hidden">
      <header className="p-4 border-b border-ink-800/60 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Editor&rsquo;s pick</div>
          <h3 className="text-base font-semibold text-ink-50 tracking-tight mt-0.5">Verdicts worth arguing about</h3>
        </div>
        <div className="size-8 rounded-md bg-amber-500/10 ring-1 ring-amber-500/30 flex items-center justify-center">
          <Sparkles className="size-4 text-amber-300" strokeWidth={2} />
        </div>
      </header>
      {picks.length === 0 ? (
        <div className="p-4 text-xs text-ink-500 italic">
          Editor&rsquo;s picks appear in the other track. Switch tabs to see them.
        </div>
      ) : (
        <ol className="divide-y divide-ink-800/60">
          {picks.map((x, i) => (
            <li key={x.p.id}>
              <Link href={`/politician/${x.p.slug}`} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-ink-900/60 transition-colors">
                <span className="text-[11px] font-mono text-amber-400/70 w-5 tabular-nums shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <PoliticianAvatar name={x.p.name} party={x.p.party} photoUrl={x.p.photo_url} size="sm" className="w-7 h-9 rounded" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink-200 truncate group-hover:text-ink-50">{x.p.name}</div>
                  <div className="text-[10px] text-ink-500 italic truncate">{x.pick.note}</div>
                </div>
                <ArrowRight className="size-3 text-ink-700 group-hover:text-amber-400 transition-colors shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

type Accent = 'emerald' | 'rose' | 'amber' | 'sky' | 'ink'

function accentClasses(a: Accent) {
  switch (a) {
    case 'emerald': return { ring: 'ring-emerald-500/30', text: 'text-emerald-300', bg: 'bg-emerald-500/10' }
    case 'rose': return { ring: 'ring-rose-500/30', text: 'text-rose-300', bg: 'bg-rose-500/10' }
    case 'amber': return { ring: 'ring-amber-500/30', text: 'text-amber-300', bg: 'bg-amber-500/10' }
    case 'sky': return { ring: 'ring-sky-500/30', text: 'text-sky-300', bg: 'bg-sky-500/10' }
    default: return { ring: 'ring-ink-700', text: 'text-ink-300', bg: 'bg-ink-900/40' }
  }
}

function Card({
  title,
  subtitle,
  icon: Icon,
  accent,
  items,
  stateLinks,
}: {
  title: string
  subtitle: string
  icon: any
  accent: Accent
  items?: { p: Politician; value: string }[]
  stateLinks?: boolean
}) {
  const c = accentClasses(accent)
  return (
    <section className="rounded-xl ring-1 ring-ink-800/80 bg-ink-900/40 overflow-hidden">
      <header className="p-4 border-b border-ink-800/60 flex items-center justify-between">
        <div>
          <div className={`text-[10px] font-mono uppercase tracking-wider ${c.text}`}>{subtitle}</div>
          <h3 className="text-base font-semibold text-ink-50 tracking-tight mt-0.5">{title}</h3>
        </div>
        <div className={`size-8 rounded-md ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon className={`size-4 ${c.text}`} strokeWidth={2} />
        </div>
      </header>
      {stateLinks ? (
        <div className="p-4 grid grid-cols-5 sm:grid-cols-6 gap-1.5">
          {US_STATES.map((s) => (
            <Link key={s} href={`/state/${s}`} className="text-center text-[11px] font-mono uppercase tracking-wider text-ink-400 hover:text-ink-100 hover:bg-ink-800/60 rounded px-1 py-1 transition-colors">
              {s}
            </Link>
          ))}
        </div>
      ) : (items || []).filter((it) => Number(it.value.replace(/[^0-9.]/g, '')) > 0).length === 0 ? (
        // Empty-state — every item has value=0. Per rev-7 panel: cards
        // showing all-zeros looked broken on the live homepage. Hide
        // the body and surface a one-line "data coming soon" caption
        // instead of rendering a list of zeros.
        <div className="px-4 py-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Data accumulates as terms progress
        </div>
      ) : (
        <ol className="divide-y divide-ink-800/60">
          {(items || []).filter((it) => Number(it.value.replace(/[^0-9.]/g, '')) > 0).map((item, i) => (
            <li key={item.p.id}>
              <Link href={`/politician/${item.p.slug}`} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-ink-900/60 transition-colors">
                <span className="text-[11px] font-mono text-ink-600 w-5 tabular-nums shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <PoliticianAvatar name={item.p.name} party={item.p.party} photoUrl={item.p.photo_url} size="sm" className="w-7 h-9 rounded" />
                <span className="flex-1 min-w-0 text-sm text-ink-200 truncate group-hover:text-ink-50">
                  {item.p.name}
                </span>
                <span className={`text-sm font-bold tabular-nums tracking-tight ${c.text} shrink-0`}>{item.value}</span>
                <ArrowRight className="size-3 text-ink-700 group-hover:text-ink-400 transition-colors shrink-0" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]
