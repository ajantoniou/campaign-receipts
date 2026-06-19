'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, BookOpen } from 'lucide-react'
import ScorecardBar from './ScorecardBar'
import AnimatedNumber from './AnimatedNumber'
import type { Politician } from '@/lib/supabase'
import { BOOK } from '@/lib/book'

export default function TrumpHero({ trump }: { trump: Politician | null }) {
  if (!trump) return null

  return (
    <section className="relative">
      <div className="section-shell pt-12 sm:pt-16 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl ring-1 ring-amber-500/20 bg-gradient-to-br from-ink-900/80 via-ink-950 to-ink-950"
        >
          {/* Decorative amber glow corner */}
          <div className="pointer-events-none absolute -top-32 -right-32 size-64 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-48 rounded-full bg-rose-500/5 blur-3xl" />

          <div className="relative grid lg:grid-cols-[300px_1fr] gap-0">
            {/* Portrait column — uses the SEALED book's signature 2016 sketch */}
            <div className="relative bg-gradient-to-b from-zinc-100 to-zinc-300 border-r border-ink-800/60">
              <div className="aspect-[4/5] lg:aspect-auto lg:h-full overflow-hidden">
                <Image
                  src={BOOK.covers.cover2016}
                  alt="Trump 2016 — sketched portrait from the SEALED book"
                  width={600}
                  height={750}
                  className="w-full h-full object-cover object-top"
                  unoptimized
                  priority
                />
              </div>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-amber-400 text-ink-950 font-bold">Featured</span>
              </div>
              <div className="absolute bottom-3 right-3 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded bg-ink-950/80 text-ink-200 backdrop-blur-sm">
                2016 — The Promise
              </div>
            </div>

            {/* Content column */}
            <div className="p-7 sm:p-10 lg:p-12 flex flex-col">
              <div className="eyebrow text-amber-400/80 mb-3">Proof of method — 145 promises, 4 years, every receipt</div>

              <div className="flex items-baseline gap-3 flex-wrap">
                <h2 className="text-display-md text-ink-50">Donald J. Trump</h2>
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ring-1 ring-rose-500/30 bg-rose-500/10 text-rose-300">R · FL</span>
              </div>
              <p className="mt-1.5 text-sm text-ink-400">45th & 47th President of the United States</p>

              <p className="mt-5 text-[15px] text-ink-300 leading-relaxed max-w-2xl text-balance">
                This is the methodology in finished form. SEALED Press fact-checked all{' '}
                <strong className="text-ink-50">145 of Trump's 2016 campaign promises</strong> against the public record. Every other profile on this site is built to the same standard.
              </p>

              <blockquote className="mt-5 pl-4 border-l-2 border-amber-500/50 text-[14px] text-ink-300 italic leading-relaxed max-w-2xl">
                &ldquo;Of 145 campaign promises we tracked, 36 were fully kept, 42 were partially kept, 48 were broken, and 19 are genuinely ambiguous &mdash; the profile of a normal politician, which is ironic given the whole pitch was &lsquo;I&rsquo;m not a politician.&rsquo;&rdquo;
                <footer className="mt-2 not-italic text-[11px] font-mono uppercase tracking-wider text-ink-500">
                  &mdash; SEALED, the book
                </footer>
              </blockquote>

              {/* Twin scorecards: 2016 (complete) + 2024 (pending) */}
              <div className="mt-7 grid sm:grid-cols-2 gap-3">
                {/* 2016 */}
                <Link
                  href="/politician/donald-trump-2016"
                  className="group rounded-xl ring-1 ring-ink-800/80 bg-ink-900/60 hover:bg-ink-900/80 hover:ring-emerald-500/40 transition-all p-5 block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="eyebrow">2016 Promises</div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Complete
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <AnimatedNumber
                      value={BOOK.cycle2016.percentageKept}
                      decimals={1}
                      className="text-5xl font-bold tracking-tight text-emerald-400 tabular-nums"
                      suffix="%"
                    />
                    <span className="text-xs text-ink-500 mb-1">kept · {BOOK.cycle2016.total} promises · 2017-2021</span>
                  </div>
                  <div className="mt-4">
                    <ScorecardBar
                      kept={BOOK.cycle2016.kept}
                      partial={BOOK.cycle2016.partial}
                      broken={BOOK.cycle2016.broken}
                      youDecide={BOOK.cycle2016.youDecide}
                      total={BOOK.cycle2016.total}
                      showLabels
                      size="md"
                    />
                  </div>
                  <div className="mt-4 text-[10px] font-mono uppercase tracking-wider text-ink-500 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                    Open 2016 scorecard
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>

                {/* 2024 — pending */}
                <Link
                  href={`/politician/${trump.slug}`}
                  className="group rounded-xl ring-1 ring-dashed ring-ink-700/60 bg-ink-900/30 hover:bg-ink-900/60 hover:ring-amber-500/40 transition-all p-5 flex flex-col block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="eyebrow">2024 Promises</div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Live tracking
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-3">
                    <span className="text-5xl font-bold tracking-tight text-amber-400 tabular-nums">
                      {trump.scorecard_pending || 0}
                    </span>
                    <span className="text-xs text-ink-500 mb-1">pending · 2025-2029 term</span>
                  </div>
                  <div className="mt-3 flex gap-3 flex-1">
                    <div className="shrink-0 w-14 rounded-md overflow-hidden ring-1 ring-ink-800 self-start">
                      <Image
                        src={BOOK.covers.cover2024}
                        alt="Trump 2024"
                        width={120}
                        height={170}
                        className="w-full h-auto object-cover"
                        unoptimized
                      />
                    </div>
                    <p className="text-sm text-ink-400 leading-relaxed">
                      Verdicts withheld until the term ends. Every promise is being tracked live against the public record.
                    </p>
                  </div>
                  <div className="mt-4 text-[10px] font-mono uppercase tracking-wider text-ink-500 group-hover:text-amber-400 transition-colors flex items-center gap-1">
                    Open 2024 live tracker
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </div>

              {/* Actions */}
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Link href={`/politician/${trump.slug}`} className="btn-accent group">
                  View Full Profile
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href={BOOK.buyPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost group"
                >
                  <BookOpen className="size-4" />
                  Read the original case study — All 145 Promises · {BOOK.pdfPrice}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
