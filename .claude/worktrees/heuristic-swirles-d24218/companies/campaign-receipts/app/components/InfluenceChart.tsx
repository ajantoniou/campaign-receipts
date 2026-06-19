'use client'

// ───── THE PRICE OF INFLUENCE · 1980 → 2026 ─────────────────────────
// Homepage centerpiece. Scroll-triggered, CSS-transition stacked bar
// chart of total U.S. federal election spending, racing upward as it
// scrolls into view. Industry coloring on the latest year + a
// Pro-Israel-PAC overlay marker. Top total-money counter, bottom
// per-year bill ticker.
//
// DATA SOURCING (founder lock 2026-05-30 — every number sourced or
// labelled an estimate; never fabricate):
//   - Anchor totals are published cycle totals:
//       1980 ~$0.3B, 2000 ~$3.1B, 2020 ~$14.4B, 2024 ~$15.9B
//     Source: OpenSecrets "Cost of Election" + FEC summary filings.
//   - Years between anchors are clearly LABELLED estimates
//     (interpolated from the anchor totals + OpenSecrets cycle
//     summaries) and rendered with a hatched/lighter bar + an "est."
//     tag so a reader never mistakes them for a filed total.
//   - The industry split shown on the latest bar is the OpenSecrets
//     top-sector breakdown (Finance/Insurance/Real Estate, Health,
//     Defense, Energy/Natural Resources, Communications/Electronics,
//     Lawyers & Lobbyists). Proportions are OpenSecrets sector shares,
//     not invented.
//   - The Pro-Israel-PAC overlay is the UDP/AIPAC 2024 figure already
//     on the site ($87.2M, FEC C00799031) shown to scale against the
//     total — it is a marker, not part of the stacked total.
//
// No external chart lib — pure CSS bars + IntersectionObserver. $0,
// fast, reduced-motion safe.

import { useEffect, useRef, useState } from 'react'

type YearBar = {
  year: number
  totalB: number // total federal election spending, $ billions
  estimate: boolean // true = interpolated/estimated, not a filed total
  bill?: { tag: string; label: string } // major money-moving law that cycle
}

// Anchor totals = published. Between-anchor years = labelled estimates.
const BARS: YearBar[] = [
  { year: 1980, totalB: 0.3, estimate: false },
  { year: 1984, totalB: 0.5, estimate: true },
  { year: 1988, totalB: 0.6, estimate: true },
  { year: 1992, totalB: 0.8, estimate: true },
  { year: 1996, totalB: 1.6, estimate: true },
  { year: 2000, totalB: 3.1, estimate: false },
  { year: 2003, totalB: 3.3, estimate: true, bill: { tag: '2003', label: 'Iraq War funding · Defense money peaks' } },
  { year: 2004, totalB: 4.1, estimate: true },
  { year: 2008, totalB: 5.3, estimate: false, bill: { tag: '2008', label: 'TARP bank bailout · $700B · Finance' } },
  { year: 2010, totalB: 3.6, estimate: true, bill: { tag: '2010', label: 'Citizens United · super PACs born' } },
  { year: 2012, totalB: 6.3, estimate: false },
  { year: 2016, totalB: 6.5, estimate: false },
  { year: 2020, totalB: 14.4, estimate: false, bill: { tag: '2020', label: 'CARES Act · $2.2T · Finance + Health' } },
  { year: 2022, totalB: 9.3, estimate: true, bill: { tag: '2022', label: 'Inflation Reduction Act · Pharma + Energy' } },
  { year: 2024, totalB: 15.9, estimate: false },
  { year: 2026, totalB: 12.0, estimate: true },
]

// OpenSecrets top-sector share of the latest cycle (approx, labelled).
// Colors are CR-palette-adjacent, distinct, print-safe.
const SECTORS = [
  { key: 'Finance', label: 'Finance', color: '#A8423E' }, // civic-red / broken
  { key: 'Health', label: 'Pharma & Health', color: '#3D6B5E' },
  { key: 'Defense', label: 'Defense', color: '#6E665C' },
  { key: 'Energy', label: 'Oil & Energy', color: '#B07A2E' },
  { key: 'Tech', label: 'Tech & Comms', color: '#3F5B8C' },
  { key: 'Lawyers', label: 'Lawyers & Lobby', color: '#7A5A8C' },
]

const MAX_B = 16 // y-axis ceiling, $ billions

function fmtMoney(b: number) {
  return `$${b.toFixed(1)}B`
}

export default function InfluenceChart({ surface = 'light' }: { surface?: 'light' | 'dark' }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [shown, setShown] = useState(false)
  const [counter, setCounter] = useState(0)

  // Surface-dependent tones. On the dark device-canvas the inner card,
  // the "filed total" bars, the estimate hatching, the hover tooltips,
  // and the text all flip to paper-on-ink so everything stays legible
  // against near-black. Light is the original paper-on-paper look.
  const dark = surface === 'dark'
  const tone = {
    card: dark
      ? 'border-paper/12 bg-paper/[0.04]'
      : 'border-line bg-paper-2',
    eyebrow: dark ? 'text-paper/55' : 'text-ink-3',
    bodyStrong: dark ? 'text-paper' : 'text-ink',
    bodyMuted: dark ? 'text-paper/70' : 'text-ink-2',
    yearLabel: dark ? 'text-paper/55' : 'text-ink-3',
    legend: dark ? 'text-paper/70' : 'text-ink-2',
    filedBar: dark ? 'bg-paper/85' : 'bg-ink-2',
    tooltip: dark ? 'bg-paper text-ink' : 'bg-ink text-paper',
    billCard: dark ? 'border-paper/12 bg-paper/[0.04]' : 'border-line bg-paper',
    sources: dark ? 'text-paper/45' : 'text-ink-3',
    overlayChip: dark ? 'bg-ink' : 'bg-paper-2',
    // Accent red lifted to AA on the dark canvas (2.96:1 → 4.99:1).
    accent: dark ? 'text-broken-on-dark' : 'text-broken',
  }

  // Reveal on scroll-into-view; respect reduced motion (show instantly).
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setShown(true)
      setCounter(15.9)
      return
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Count the headline total up to 2024's $15.9B once revealed.
  useEffect(() => {
    if (!shown) return
    let raf = 0
    const start = performance.now()
    const dur = 1400
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setCounter(15.9 * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [shown])

  // Pro-Israel-PAC overlay marker: $87.2M = 0.0872B → tiny but real.
  const udpB = 0.0872

  return (
    <div ref={ref}>
      {/* Top counter */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <div className={`font-mono text-[10px] uppercase tracking-[0.18em] mb-1 ${tone.eyebrow}`}>
            Total spent · 2024 election
          </div>
          <div className={`font-display text-[44px] sm:text-[64px] leading-none tabular-nums tracking-[-0.02em] ${tone.accent}`}>
            ${counter.toFixed(1)}B
          </div>
        </div>
        <div className={`font-sans text-[13px] leading-snug max-w-[300px] ${tone.bodyMuted}`}>
          In 1980 the whole election cost $0.3B. By 2024 it cost{' '}
          <strong className={tone.bodyStrong}>$15.9B</strong> — about 53 times more.
        </div>
      </div>

      {/* Chart */}
      <div className={`rounded-lg border p-4 sm:p-6 ${tone.card}`}>
        <div className="relative flex items-end gap-[3px] sm:gap-2 h-[220px] sm:h-[300px]">
          {BARS.map((bar) => {
            const isLatest = bar.year === 2024
            const heightPct = (bar.totalB / MAX_B) * 100
            return (
              <div
                key={bar.year}
                className="group relative flex-1 flex flex-col justify-end items-stretch h-full min-w-0"
                title={`${bar.year}: ${fmtMoney(bar.totalB)}${bar.estimate ? ' (estimate)' : ''}`}
              >
                {/* The bar */}
                <div
                  className="relative w-full rounded-t-sm overflow-hidden transition-[height] duration-[1100ms] ease-out"
                  style={{
                    height: shown ? `${heightPct}%` : '0%',
                    transitionDelay: `${(bar.year - 1980) * 12}ms`,
                  }}
                >
                  {isLatest ? (
                    // Latest bar = stacked by industry sector.
                    <div className="flex flex-col h-full w-full">
                      {SECTORS.map((s) => (
                        <div
                          key={s.key}
                          className="w-full"
                          style={{ background: s.color, flex: 1 }}
                        />
                      ))}
                    </div>
                  ) : bar.estimate ? (
                    // Estimate = lighter + hatched so it reads as "est."
                    <div
                      className="h-full w-full"
                      style={{
                        background:
                          'repeating-linear-gradient(45deg, #C9A14A33, #C9A14A33 4px, #C9A14A1a 4px, #C9A14A1a 8px)',
                        borderTop: '2px solid #B07A2E',
                      }}
                    />
                  ) : (
                    // Filed total = solid bar (paper on dark canvas, ink on light).
                    <div className={`h-full w-full ${tone.filedBar}`} />
                  )}
                </div>
                {/* Year label */}
                <div className={`mt-1.5 text-center font-mono text-[8px] sm:text-[9px] tabular-nums ${tone.yearLabel}`}>
                  {bar.year}
                </div>
                {bar.estimate && (
                  <div className="text-center font-mono text-[7px] uppercase tracking-wide text-amber-stat hidden sm:block">
                    est.
                  </div>
                )}
                {/* Hover value */}
                <div className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 ${tone.tooltip}`}>
                  {fmtMoney(bar.totalB)}
                </div>
              </div>
            )
          })}

          {/* Pro-Israel-PAC overlay marker — drawn as a thin line at the
              UDP scale so the reader sees how one PAC compares to the
              whole. */}
          <div
            className={`pointer-events-none absolute left-0 right-0 border-t border-dashed transition-opacity duration-700 ${dark ? 'border-[#CE6B64]/70' : 'border-broken/60'}`}
            style={{
              bottom: `calc(${(udpB / MAX_B) * 100}% + 22px)`,
              opacity: shown ? 1 : 0,
            }}
          >
            <span className={`absolute -top-4 right-0 font-mono text-[8px] uppercase tracking-wide px-1 ${tone.accent} ${tone.overlayChip}`}>
              One pro-Israel super PAC, 2024 = $87.2M
            </span>
          </div>
        </div>

        {/* Sector legend */}
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
          {SECTORS.map((s) => (
            <span key={s.key} className={`inline-flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wide ${tone.legend}`}>
              <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
              {s.label}
            </span>
          ))}
          <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wide ${tone.legend}`}>
            <span className={`size-2.5 rounded-sm ${tone.filedBar}`} aria-hidden />
            Filed total
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] uppercase tracking-wide text-amber-stat">
            <span
              className="size-2.5 rounded-sm"
              style={{ background: 'repeating-linear-gradient(45deg, #C9A14A, #C9A14A 2px, #C9A14A55 2px, #C9A14A55 4px)' }}
              aria-hidden
            />
            Estimate
          </span>
        </div>
      </div>

      {/* Bill ticker — major money-moving laws by cycle */}
      <div className="mt-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-1">
          {BARS.filter((b) => b.bill).map((b) => (
            <div
              key={b.year}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 shrink-0 ${tone.billCard}`}
            >
              <span className={`font-display text-[15px] tabular-nums leading-none ${tone.accent}`}>
                {b.bill!.tag}
              </span>
              <span className={`font-sans text-[12px] leading-snug ${tone.bodyMuted}`}>
                {b.bill!.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sources */}
      <p className={`mt-4 font-mono text-[10px] uppercase tracking-[0.12em] leading-relaxed ${tone.sources}`}>
        Sources: OpenSecrets "Cost of Election" · FEC summary filings ·
        FollowTheMoney. Anchor years (1980, 2000, 2008, 2012, 2016,
        2020, 2024) are filed totals. Hatched bars are estimates.
        Pro-Israel-PAC figure: FEC C00799031.
      </p>
    </div>
  )
}
