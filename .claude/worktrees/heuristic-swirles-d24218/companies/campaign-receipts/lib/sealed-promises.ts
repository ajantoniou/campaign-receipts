// Server-side accessor for the SEALED Trump-2016 corpus that powers
// /trump dashboard v1.
//
// Data source: scripts/seed-trump-2016-cycle.json (the same file used
// to seed cr_promises). We read the JSON directly so the dashboard is
// independent of DB seed state — the corpus is 81 rows and static.
//
// Schema joined here: chapter metadata (slug, chapter number, book-canonical
// verdict) + per-pledge fields. Pledges are bucketed into chapters by
// promise_number ranges, which mirror the book's chapter ordering.
//
// Verdict tally surfaced to the masthead is the BOOK'S canonical total
// (46/51/40/8 = 145), which is an EDITORIAL VERDICT ROLLUP — it counts
// inline sub-pledges graded within chapter prose, not just headlined
// h4 entries. The 81 seed rows correspond 1:1 to the book's 9 chapter
// overviews + 72 standalone h4 promise entries. See
// `eng/2016-promise-audit-2026-05-19.md` for the diff methodology.

import seed from '../scripts/seed-trump-2016-cycle.json'

export type Verdict = 'KEPT' | 'PARTIAL' | 'BROKEN' | 'YOU_DECIDE' | 'BLOCKED'

export type SealedPromise = {
  promise_number: number
  promise_text: string
  promise_slug: string
  chapter_slug: string
  chapter_number: number
  chapter_title: string
  chapter_short: string
  category: 'Chapter overview' | 'Individual pledge'
  verdict: Verdict
  verdict_reasoning: string | null
  promise_source_url: string | null
  permalink: string
  term_start: string | null
  term_end: string | null
}

export type Chapter = {
  number: number
  slug: string
  title: string // long form from the seed
  short: string // "Trade", "Drain the Swamp"
  verdict: Verdict
}

// Book-canonical scorecard (from the published book). Sum = 145.
export const SCORECARD_TOTALS = {
  KEPT: 46,
  PARTIAL: 51,
  BROKEN: 40,
  YOU_DECIDE: 8,
  TOTAL: 145,
} as const

// Chapter map. Pledge ranges are inclusive and match the seed file's
// promise_number ordering.
export const CHAPTERS: Array<Chapter & { pledgeRange: [number, number] }> = [
  { number: 1, slug: 'trade',       short: 'Trade',          title: 'Trade — He actually tore it up',                 verdict: 'KEPT',       pledgeRange: [19, 23] },
  { number: 2, slug: 'drain-the-swamp', short: 'Drain the Swamp', title: 'Drain the Swamp — Who really got served', verdict: 'BROKEN',     pledgeRange: [10, 18] },
  { number: 3, slug: 'jobs',        short: 'Jobs',           title: 'Jobs — Carrier, Ford, and the tax cut',          verdict: 'PARTIAL',    pledgeRange: [24, 30] },
  { number: 4, slug: 'healthcare',  short: 'Healthcare',     title: 'Healthcare — The biggest broken promise',        verdict: 'BROKEN',     pledgeRange: [31, 38] },
  { number: 5, slug: 'nato',        short: 'NATO',           title: 'NATO — Pay up or else',                          verdict: 'PARTIAL',    pledgeRange: [39, 45] },
  { number: 6, slug: 'middle-east', short: 'Middle East',    title: 'Middle East — ISIS, Russia, and the vacuum',    verdict: 'PARTIAL',    pledgeRange: [46, 53] },
  { number: 7, slug: 'china',       short: 'China',          title: 'China — The trade war that actually happened',  verdict: 'KEPT',       pledgeRange: [54, 59] },
  { number: 8, slug: 'the-wall',    short: 'The Wall',       title: "The Wall — Mexico didn't pay",                  verdict: 'PARTIAL',    pledgeRange: [60, 69] },
  { number: 9, slug: 'law-and-order', short: 'Law & Order',  title: 'Law & Order — Chicago and the data',            verdict: 'YOU_DECIDE', pledgeRange: [70, 81] },
]

// Kebab-case a string. First 60 chars of promise_text per spec.
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[—–]/g, '-') // em/en dash
    .replace(/["""'']/g, '')          // smart quotes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

function chapterForPromiseNumber(n: number): Chapter & { pledgeRange: [number, number] } {
  // Chapter overviews are #1-9
  if (n >= 1 && n <= 9) {
    return CHAPTERS[n - 1]
  }
  // Individual pledges
  for (const ch of CHAPTERS) {
    if (n >= ch.pledgeRange[0] && n <= ch.pledgeRange[1]) return ch
  }
  // Fallback: last chapter
  return CHAPTERS[CHAPTERS.length - 1]
}

// Load all 81 promises with chapter metadata + slugs joined in.
let _cache: SealedPromise[] | null = null
export function getAllPromises(): SealedPromise[] {
  if (_cache) return _cache
  const promises = ((seed as any)[0]?.promises ?? []) as Array<any>
  const result: SealedPromise[] = promises.map((p) => {
    const ch = chapterForPromiseNumber(p.promise_number)
    const promise_slug = slugify(p.promise_text)
    return {
      promise_number: p.promise_number,
      promise_text: p.promise_text,
      promise_slug,
      chapter_slug: ch.slug,
      chapter_number: ch.number,
      chapter_title: ch.title,
      chapter_short: ch.short,
      category: p.category,
      verdict: p.verdict,
      verdict_reasoning: p.verdict_reasoning ?? null,
      promise_source_url: p.promise_source_url ?? null,
      permalink: `/trump/promise/${ch.slug}/${promise_slug}`,
      term_start: p.term_start ?? null,
      term_end: p.term_end ?? null,
    }
  })
  _cache = result
  return result
}

export function getPromiseBySlug(chapterSlug: string, promiseSlug: string): SealedPromise | null {
  return getAllPromises().find(
    (p) => p.chapter_slug === chapterSlug && p.promise_slug === promiseSlug,
  ) ?? null
}

export function getChapterBySlug(slug: string): Chapter | null {
  return CHAPTERS.find((c) => c.slug === slug) ?? null
}

// Return up to N other individual-pledge promises from the same chapter,
// excluding the one passed in. Used by the per-promise page's
// "Related promises in this chapter" block.
export function getRelatedPromisesInChapter(
  chapterSlug: string,
  excludePromiseSlug: string,
  limit = 3,
): SealedPromise[] {
  return getAllPromises()
    .filter(
      (p) =>
        p.chapter_slug === chapterSlug &&
        p.category === 'Individual pledge' &&
        p.promise_slug !== excludePromiseSlug,
    )
    .slice(0, limit)
}

// Verdict color tokens — committed hex from the design-guru spec.
// Use these NOT the existing CR amber palette.
export const VERDICT_HEX: Record<Verdict, string> = {
  KEPT:       '#1f6b3a',
  PARTIAL:    '#a87325', // umber, NOT amber
  BROKEN:     '#9b1c1c',
  YOU_DECIDE: '#3a3a52', // ink-violet
  BLOCKED:    '#4a5a78',
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  KEPT: 'KEPT',
  PARTIAL: 'PARTIAL',
  BROKEN: 'BROKEN',
  YOU_DECIDE: 'YOU DECIDE',
  BLOCKED: 'BLOCKED',
}

// Verdict stamp glyph for share strings (kept emoji-free per CLAUDE rules;
// uses Unicode shapes that read cleanly on X/Threads/Bluesky).
export const VERDICT_GLYPH: Record<Verdict, string> = {
  KEPT:       '[KEPT]',
  PARTIAL:    '[PARTIAL]',
  BROKEN:     '[BROKEN]',
  YOU_DECIDE: '[YOU DECIDE]',
  BLOCKED:    '[BLOCKED]',
}
