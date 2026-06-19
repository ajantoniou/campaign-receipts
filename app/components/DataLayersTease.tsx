// "What data lives here" — three-card tease right under the hero.
// Tells a first-time visitor what we actually track in 5 seconds:
//   1. Campaign promises (the free public surface)
//   2. Donor influence on policy votes (Bundle tier surface)
//   3. Donor influence on bill generation (Bundle tier surface)
//
// Doubles as a discovery aid for journalists trying to figure out
// what's behind the paywall vs free.

import Link from 'next/link'
import { FileText, Vote, FileSpreadsheet, ArrowRight } from 'lucide-react'

type Layer = {
  Icon: typeof FileText
  eyebrow: string
  title: string
  body: string
  href: string
  cta: string
  accent: string
  tag?: { label: string; tone: 'free' | 'pro' }
}

const LAYERS: Layer[] = [
  {
    Icon: FileText,
    eyebrow: '585 politicians',
    title: 'Campaign promises, term-scoped',
    body:
      "Every commitment a politician made — pulled from campaign sites, debate transcripts, and voter guides — graded against the public record once their term ends. Both-sides reviewed, primary-source receipts on every verdict.",
    href: '/directory',
    cta: 'Browse the directory',
    accent: 'kept',
    tag: { label: 'Free', tone: 'free' },
  },
  {
    Icon: Vote,
    eyebrow: '64,000+ roll-call votes',
    title: 'Donor influence on policy votes',
    body:
      "For every federal politician with FEC data, we score each roll-call vote as 'aligned with their top donor industries' or 'broke from them.' Turner (R-OH): 7/7 with Defense. AOC: 0/7. The data nobody else joins.",
    href: '/politician/alexandria-ocasio-cortez/correlations',
    cta: 'See an alignment page',
    accent: 'broken',
    tag: { label: 'Free top-3 · Bundle full list', tone: 'pro' },
  },
  {
    Icon: FileSpreadsheet,
    eyebrow: '335 House bills, 221 money trails',
    title: 'Donor influence on bill generation',
    body:
      "Behind every bill: a money trail. We aggregate top donor industries across each bill's sponsor + co-sponsors. The Medicare reform bill's 12 senators took $4.2M from pharma + insurance last cycle. Now you know.",
    href: '/bill/119/hr-1',
    cta: 'See a bill page',
    accent: 'authority',
    tag: { label: 'Free top-3 · Bundle full table', tone: 'pro' },
  },
]

function accentClasses(a: string) {
  switch (a) {
    case 'kept':
      return { icon: 'text-kept-400', ring: 'ring-kept-500/20', dot: 'bg-kept-500' }
    case 'broken':
      return { icon: 'text-broken-400', ring: 'ring-broken-500/20', dot: 'bg-broken-500' }
    case 'authority':
      return { icon: 'text-authority-400', ring: 'ring-authority-500/30', dot: 'bg-authority-500' }
    default:
      return { icon: 'text-ink-300', ring: 'ring-ink-700', dot: 'bg-ink-500' }
  }
}

function tagClasses(tone: 'free' | 'pro') {
  if (tone === 'free') return 'text-ink-400 ring-ink-700'
  return 'text-authority-300 ring-authority-500/40 bg-authority-500/5'
}

export default function DataLayersTease() {
  return (
    <section className="section-shell py-10 sm:py-14">
      <div className="mb-6 sm:mb-8">
        <div className="eyebrow mb-2">What lives here</div>
        <h2 className="text-display-md text-ink-50 text-balance">
          Three data layers nobody else joins.
        </h2>
        <p className="mt-3 text-ink-400 text-[15px] max-w-2xl">
          The directory is free and citable. The correlation engines power the stories.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {LAYERS.map((l) => {
          const c = accentClasses(l.accent)
          return (
            <Link
              key={l.title}
              href={l.href}
              className={`group relative flex flex-col gap-3 rounded-2xl ring-1 ${c.ring} bg-ink-900/40 hover:bg-ink-900/70 hover:ring-ink-700 transition-all duration-300 p-5 sm:p-6`}
            >
              <div className="flex items-center justify-between">
                <l.Icon className={`size-5 ${c.icon}`} />
                {l.tag && (
                  <span className={`text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-0.5 ring-1 ${tagClasses(l.tag.tone)}`}>
                    {l.tag.label}
                  </span>
                )}
              </div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-ink-500">
                {l.eyebrow}
              </div>
              <h3 className="text-lg font-semibold text-ink-50 tracking-tight leading-snug">
                {l.title}
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed flex-1">{l.body}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-300 group-hover:text-ink-50 transition-colors">
                {l.cta}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
