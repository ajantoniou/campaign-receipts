'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Quote } from 'lucide-react'
import { BOOK } from '@/lib/book'

export default function BookPromo() {
  return (
    <section className="relative overflow-hidden border-t border-ink-800/60 bg-gradient-to-b from-ink-950 via-ink-900/40 to-ink-950">
      {/* Decorative grid overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none bg-hero-grid" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-amber-900/10 via-transparent to-rose-900/10" />

      <div className="relative section-shell section-y">
        <div className="grid lg:grid-cols-[1fr_360px] gap-12 lg:gap-16 items-center">
          {/* Left: editorial copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="eyebrow text-amber-400/80 mb-4">The Definitive Historical Archive</div>
            <h2 className="text-display-lg text-ink-50 text-balance">
              SEALED — The 2016 Promises
            </h2>
            <p className="mt-2 text-base text-ink-500 italic">Before the Deals</p>
            <p className="mt-5 text-lg text-ink-300 max-w-2xl text-balance leading-relaxed">
              All {BOOK.totalPromises} of Donald Trump's 2016 campaign promises, fact-checked with case studies and paper-trail receipts. Color-coded verdicts. No spin.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-xl">
              <ArchiveStat label="Promises" value={String(BOOK.totalPromises)} />
              <ArchiveStat label="Pages" value={String(BOOK.pages)} />
              <ArchiveStat label="Color-coded verdicts" value="5" />
            </div>

            {/* Pull quote */}
            <figure className="mt-10 max-w-xl border-l-2 border-amber-500/60 pl-5">
              <Quote className="size-5 text-amber-500/70 mb-2" />
              <blockquote className="text-[15px] text-ink-200 leading-relaxed italic">
                Not a prosecution. Not a defense. An organized record with color-coded verdicts you can agree with, disagree with, or replace with your own judgment.
              </blockquote>
              <figcaption className="mt-3 text-xs text-ink-500 font-mono tracking-wider uppercase">— From the Foreword</figcaption>
            </figure>

            <div className="mt-9 flex flex-col sm:flex-row gap-3">
              <a
                href={BOOK.buyPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent group"
              >
                Read the original case study — {BOOK.pdfPrice} PDF
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href={BOOK.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                Read a free chapter
              </a>
            </div>
          </motion.div>

          {/* Right: real book cover */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotateY: -8 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex justify-center"
            style={{ perspective: '1200px' }}
          >
            <BookCover />
          </motion.div>

          {/* Mobile: smaller cover */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:hidden flex justify-center mt-2"
          >
            <BookCover small />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function ArchiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg ring-1 ring-ink-800/80 bg-ink-900/50 px-4 py-3">
      <div className="text-2xl font-bold text-ink-50 tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-semibold text-ink-500 mt-0.5">{label}</div>
    </div>
  )
}

function BookCover({ small = false }: { small?: boolean }) {
  const w = small ? 220 : 320
  const h = small ? 308 : 448

  return (
    <a
      href={BOOK.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block drop-shadow-[0_30px_60px_rgba(0,0,0,0.7)] transition-transform hover:scale-[1.02]"
      style={{
        width: w,
        height: h,
        transform: small ? 'none' : 'rotateY(-12deg) rotateX(2deg)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Spine shadow */}
      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black via-zinc-900 to-zinc-700 rounded-l-sm" style={{ transform: 'translateZ(-2px)' }} />
      {/* Cover image */}
      <div className="absolute inset-0 left-2.5 right-0 rounded-r-sm rounded-l-sm overflow-hidden ring-1 ring-ink-800 bg-zinc-100">
        <Image
          src={BOOK.covers.cover2016}
          alt="SEALED — The 2016 Promises (book cover)"
          fill
          sizes={`${w}px`}
          className="object-cover"
          unoptimized
          priority={!small}
        />
        {/* Subtle inner glow on hover */}
        <div className="absolute inset-0 ring-inset ring-2 ring-amber-400/0 group-hover:ring-amber-400/30 transition-all duration-500" />
      </div>
      {/* Page edge highlight */}
      <div className="absolute inset-y-1 right-0 w-px bg-gradient-to-b from-transparent via-zinc-400/40 to-transparent" />
    </a>
  )
}
