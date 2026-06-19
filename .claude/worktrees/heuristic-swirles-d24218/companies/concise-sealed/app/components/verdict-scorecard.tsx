/**
 * Verdict scorecard — civic-trust palette.
 *
 * Canonical retail-PDF math: 145 promises, graded 46 KEPT / 51 PARTIAL /
 * 40 BROKEN / 8 READER-DECIDES. Numbers MUST match
 * `.claude/CLAUDE.md` verdict-math invariant.
 *
 * Visually: a four-up museum label set on parchment, each cell a soft-tinted
 * card with a navy number, a hairline gold rule, and a small-caps label.
 */
export function VerdictScorecard() {
  const cells = [
    {
      n: 46,
      label: 'KEPT',
      wrap: 'border-verdict-kept/30 bg-verdict-kept-soft/60',
      num: 'text-verdict-kept',
      tag: 'text-verdict-kept',
      rule: 'bg-verdict-kept/60',
    },
    {
      n: 51,
      label: 'PARTIAL',
      wrap: 'border-verdict-partial/30 bg-verdict-partial-soft/60',
      num: 'text-verdict-partial',
      tag: 'text-verdict-partial',
      rule: 'bg-verdict-partial/60',
    },
    {
      n: 40,
      label: 'BROKEN',
      wrap: 'border-verdict-broken/35 bg-verdict-broken-soft/60',
      num: 'text-verdict-broken',
      tag: 'text-verdict-broken',
      rule: 'bg-verdict-broken/60',
    },
    {
      n: 8,
      label: 'READER DECIDES',
      wrap: 'border-verdict-reader/30 bg-verdict-reader-soft/60',
      num: 'text-verdict-reader',
      tag: 'text-verdict-reader',
      rule: 'bg-verdict-reader/60',
    },
  ] as const

  return (
    <figure
      aria-label="Verdict scorecard: 145 promises graded 46 kept, 51 partial, 40 broken, 8 reader-decides"
      className="mx-auto max-w-5xl"
    >
      <div className="flex items-baseline justify-between border-b border-ink-900/15 pb-3">
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
          The verdict ledger
        </p>
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink-500">
          145 promises · graded
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {cells.map((c) => (
          <div
            key={c.label}
            className={`flex flex-col items-start justify-between rounded-md border ${c.wrap} bg-parchment-50/80 px-5 py-5 shadow-civic-card sm:px-6 sm:py-6`}
          >
            <p
              className={`font-serif text-5xl font-bold leading-none tracking-tight sm:text-6xl ${c.num}`}
            >
              {c.n}
            </p>
            <div className={`mt-3 h-px w-8 ${c.rule}`} aria-hidden />
            <p
              className={`mt-2 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.2em] ${c.tag}`}
            >
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <figcaption className="mt-4 flex flex-col gap-1 text-center text-xs text-ink-500 sm:flex-row sm:justify-between">
        <span className="font-sans uppercase tracking-[0.18em]">Every grade has its receipt in the book</span>
        <span className="font-sans uppercase tracking-[0.18em]">Override any call — the blank column is yours</span>
      </figcaption>
    </figure>
  )
}
