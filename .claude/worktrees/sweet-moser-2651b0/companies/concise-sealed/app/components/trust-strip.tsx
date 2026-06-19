/**
 * Trust strip — seal-of-record under the hero CTA.
 *
 * Three editorial claims, separated by gold-rule divider dots, in small-caps
 * navy on parchment. Reads as Brookings/ProPublica footer rule, not a crypto
 * product banner.
 */
export function TrustStrip() {
  const items = [
    'Individually licensed',
    'Primary sources cited',
    'Open threads disclosed',
  ] as const

  return (
    <div
      role="contentinfo"
      aria-label="Editorial trust commitments"
      className="mx-auto mt-12 max-w-3xl"
    >
      <div className="gold-rule" aria-hidden />
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-4 text-center">
        {items.map((label, i) => (
          <span key={label} className="flex items-center gap-x-6">
            <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-ink-800">
              {label}
            </span>
            {i < items.length - 1 ? (
              <span aria-hidden className="text-[0.5rem] text-civic-gold">
                ◆
              </span>
            ) : null}
          </span>
        ))}
      </div>
      <div className="gold-rule" aria-hidden />
    </div>
  )
}
