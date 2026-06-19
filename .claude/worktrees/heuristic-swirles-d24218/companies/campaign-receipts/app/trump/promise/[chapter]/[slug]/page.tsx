// Per-promise deep-dive page.
// URL: /trump/promise/{chapter-slug}/{promise-slug}
// Anatomy is the design-guru spec (non-negotiable):
//   - Verdict stamp top-right
//   - Promise verbatim quote as serif blockquote, civic-red left rule
//   - Receipt paragraph capped at 240 words
//   - Source URL footer in font-mono text-ink-600
//   - Share row pinned bottom

import Link from 'next/link'
import { notFound } from 'next/navigation'
import TrustSurface from '@/app/components/TrustSurface'
import CitePromiseButton from '@/app/components/CitePromiseButton'
import {
  getAllPromises,
  getPromiseBySlug,
  getChapterBySlug,
  getRelatedPromisesInChapter,
  VERDICT_HEX,
  VERDICT_LABEL,
  VERDICT_GLYPH,
} from '@/lib/sealed-promises'
import { ArrowLeft, ExternalLink, Download } from 'lucide-react'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  return getAllPromises()
    .filter((p) => p.category === 'Individual pledge')
    .map((p) => ({ chapter: p.chapter_slug, slug: p.promise_slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { chapter: string; slug: string }
}) {
  const p = getPromiseBySlug(params.chapter, params.slug)
  if (!p) return { title: 'Promise not found' }
  return {
    title: `${p.promise_text} — Trump 2016 Promise | CampaignReceipts`,
    description: `${VERDICT_LABEL[p.verdict]} verdict. ${p.verdict_reasoning ?? ''}`,
  }
}

const SITE = 'https://campaignreceipts.com'

function buildShareText(promiseText: string, receipt: string, verdict: string): string {
  const glyph = VERDICT_GLYPH[verdict as keyof typeof VERDICT_GLYPH] ?? `[${verdict}]`
  // Truncate promise text so the full string + permalink stays under ~280
  // Allocate: 32 (glyph+pad) + ~70 promise + 80 receipt + ~50 url+via
  const promiseTrunc = promiseText.length > 70 ? promiseText.slice(0, 67) + '…' : promiseText
  const oneSentence = receipt.split(/[.!?](\s|$)/)[0].slice(0, 90)
  return `${glyph}  "${promiseTrunc}"\n— Trump, 2016 campaign\n\nWhat happened: ${oneSentence}\n(via @campaignreceipts)`
}

export default function PromisePage({
  params,
}: {
  params: { chapter: string; slug: string }
}) {
  const p = getPromiseBySlug(params.chapter, params.slug)
  if (!p) notFound()

  const chapter = getChapterBySlug(p.chapter_slug)
  const hex = VERDICT_HEX[p.verdict]
  const verdictLabel = VERDICT_LABEL[p.verdict]

  // Per spec: receipt paragraph capped at 240 words. We use
  // verdict_reasoning as the receipt body (the seed JSON has short
  // reasoning text).
  const receipt =
    p.verdict_reasoning ??
    `This promise was graded ${verdictLabel} against the public record.`

  const permalink = `${SITE}${p.permalink}`
  const shareText = buildShareText(p.promise_text, receipt, p.verdict)
  const imageUrl = `/api/trump/cite-image/${encodeURIComponent(`${p.chapter_slug}__${p.promise_slug}`)}`

  const related = getRelatedPromisesInChapter(p.chapter_slug, p.promise_slug, 3)

  // APA-style citation, auto-derived from existing seed metadata. No new
  // fact-claims; format follows APA 7th ed. for an in-book chapter entry.
  const apaCitation =
    `CampaignReceipts. (2026). ${p.promise_text} [Verdict: ${verdictLabel}]. ` +
    `Trump 2016 Promise Audit ` +
    `(Chapter ${chapter?.number ?? ''}: ${chapter?.short ?? ''}). ` +
    `${permalink}`

  return (
    <TrustSurface>
      <article className="section-shell py-12 max-w-3xl">
        <Link
          href={`/trump?chapter=${p.chapter_slug}`}
          className="inline-flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-950 transition-colors mb-8"
        >
          <ArrowLeft className="size-3.5" />
          {chapter ? `Chapter ${chapter.number}: ${chapter.short}` : 'Back to dashboard'}
        </Link>

        {/* Header: title left, verdict stamp top-right */}
        <header className="relative pr-24 sm:pr-32">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600">
            Promise #{String(p.promise_number).padStart(3, '0')} · {chapter?.short}
          </div>
          <h1 className="mt-3 font-editorial text-display-md text-ink-950 text-balance leading-tight">
            {p.promise_text}
          </h1>

          {/* Verdict stamp, top-right, 64-96px, single rotation */}
          <div
            className="absolute top-0 right-0"
            style={{ transform: 'rotate(-6deg)' }}
            aria-label={`Verdict: ${verdictLabel}`}
          >
            <div
              className="font-mono font-bold uppercase tracking-[0.14em] text-center ring-2 px-3 py-3 rounded-md bg-parchment-50"
              style={{
                color: hex,
                borderColor: hex,
                width: 96,
                height: 96,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: verdictLabel.length > 6 ? 10 : 12,
                lineHeight: 1.1,
              }}
            >
              {verdictLabel.split(' ').map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>
        </header>

        {/* Verbatim quote — serif blockquote with civic-red left rule */}
        <blockquote
          className="mt-10 pl-5 font-editorial italic text-lg sm:text-xl text-ink-900 leading-relaxed"
          style={{ borderLeft: '3px solid #9b1c1c' }}
        >
          “{p.promise_text}”
          <footer className="mt-3 not-italic text-sm text-ink-600 font-sans">
            — Donald Trump, 2016 campaign
          </footer>
        </blockquote>

        {/* Receipt paragraph */}
        <section className="mt-10">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-2">
            What happened
          </div>
          <p className="text-[15px] text-ink-800 leading-relaxed">
            {receipt}
          </p>
        </section>

        {/* Source URL footer */}
        <section className="mt-8 pt-4 border-t border-parchment-200">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-ink-500 mb-1">
            Source
          </div>
          {p.promise_source_url ? (
            <a
              href={p.promise_source_url}
              target="_blank"
              rel="noopener"
              className="font-mono text-xs text-ink-600 hover:text-authority-700 underline-offset-4 hover:underline break-all inline-flex items-center gap-1.5"
            >
              {p.promise_source_url}
              <ExternalLink className="size-3 shrink-0" />
            </a>
          ) : (
            <Link
              href="/methodology"
              className="font-mono text-xs text-ink-600 hover:text-authority-700 underline-offset-4 hover:underline inline-flex items-center gap-1.5"
            >
              See methodology
            </Link>
          )}
        </section>

        {/* Cite this promise — load-bearing */}
        <section className="mt-10 rounded-lg ring-1 ring-parchment-200 bg-white p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-2">
            Citation infrastructure
          </div>
          <h2 className="font-editorial text-xl text-ink-950 mb-3">
            Cite this promise.
          </h2>
          <p className="text-sm text-ink-700 leading-relaxed mb-5">
            One click copies a ready-to-paste citation and a 1080×1350 verdict card to your clipboard.
            Paste it into X, Threads, Bluesky, or anywhere else.
          </p>
          <CitePromiseButton
            shareText={shareText}
            permalink={permalink}
            imageUrl={imageUrl}
          />
          <details className="mt-5 text-xs text-ink-600">
            <summary className="cursor-pointer select-none">Preview the share text</summary>
            <pre className="mt-2 whitespace-pre-wrap font-mono bg-parchment-50 p-3 rounded ring-1 ring-parchment-200">{shareText}{'\n'}{permalink}</pre>
          </details>
        </section>

        {/* Share row — pinned bottom */}
        <section className="mt-8 flex flex-wrap items-center gap-3 border-t border-parchment-200 pt-6">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + '\n' + permalink)}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 rounded-md ring-1 ring-parchment-200 bg-white px-3 py-2 text-xs text-ink-800 hover:ring-ink-400 transition-colors"
          >
            Share on X
          </a>
          <a
            href={imageUrl}
            download={`trump-${p.chapter_slug}-${p.promise_slug}.png`}
            className="inline-flex items-center gap-1.5 rounded-md ring-1 ring-parchment-200 bg-white px-3 py-2 text-xs text-ink-800 hover:ring-ink-400 transition-colors"
          >
            <Download className="size-3.5" />
            Download 1080×1350
          </a>
          <span className="ml-auto text-xs text-ink-500 font-mono">
            permalink: <span className="text-ink-700">{p.permalink}</span>
          </span>
        </section>

        {/* Chapter context — framing from existing CHAPTERS map */}
        {chapter && (
          <section className="mt-10 rounded-lg ring-1 ring-parchment-200 bg-parchment-50 p-6">
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-2">
              Chapter context
            </div>
            <p className="text-[14px] text-ink-800 leading-relaxed">
              This promise lives in Chapter {chapter.number} of the 2016 audit
              {' — '}
              <Link
                href={`/trump?chapter=${chapter.slug}`}
                className="text-authority-700 underline-offset-4 hover:underline font-medium"
              >
                {chapter.title}
              </Link>
              {'. '}
              The chapter as a whole is graded{' '}
              <span
                className="font-mono font-bold uppercase tracking-[0.08em]"
                style={{ color: VERDICT_HEX[chapter.verdict] }}
              >
                {VERDICT_LABEL[chapter.verdict]}
              </span>
              {'.'}
            </p>
          </section>
        )}

        {/* Related promises in this chapter */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
              Related promises in Chapter {chapter?.number}
            </div>
            <ul className="grid sm:grid-cols-3 gap-3">
              {related.map((r) => (
                <li
                  key={r.promise_slug}
                  className="rounded-md ring-1 ring-parchment-200 bg-white p-3 hover:ring-ink-400 transition-colors"
                >
                  <Link href={r.permalink} className="block">
                    <div
                      className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] mb-1"
                      style={{ color: VERDICT_HEX[r.verdict] }}
                    >
                      {VERDICT_LABEL[r.verdict]}
                    </div>
                    <div className="text-[13px] text-ink-900 leading-snug">
                      {r.promise_text}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Cite this verdict — APA-style, derived from seed + chapter map */}
        <section className="mt-8 rounded-lg ring-1 ring-parchment-200 bg-white p-6">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-2">
            Cite this verdict
          </div>
          <p className="text-sm text-ink-700 leading-relaxed mb-3">
            APA 7th edition. Copy-paste into a paper, post, or correction request.
          </p>
          <pre className="whitespace-pre-wrap font-mono text-[12px] bg-parchment-50 p-3 rounded ring-1 ring-parchment-200 text-ink-900 leading-relaxed">{apaCitation}</pre>
        </section>

        {/* Audit cross-link footer band — quiet civic-publication register */}
        <aside className="mt-12 border-t border-parchment-200 pt-8">
          <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-2">
            The 2016 audit
          </div>
          <p className="text-[14px] text-ink-700 leading-relaxed max-w-2xl">
            This is one of 145 promises in the free 2016 Trump audit. Each pairs the verbatim quote
            with the receipt — and 81 of them link to a primary source URL. The full scorecard: 46
            KEPT · 51 PARTIAL · 40 BROKEN · 8 READER-DECIDES.
          </p>
          <div className="mt-4">
            <Link
              href={`/trump?chapter=${p.chapter_slug}`}
              className="inline-flex items-center gap-1.5 text-xs text-ink-600 hover:text-ink-950 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to scorecard
            </Link>
          </div>
        </aside>
      </article>
    </TrustSurface>
  )
}
