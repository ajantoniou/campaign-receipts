/**
 * Legible “interior spread” preview — real HTML/CSS copy (avoid AI image gibberish).
 * Matches archival cream/black editorial palette on the dark landing page.
 */
export function DocumentSpreadPreview({ className = '' }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-700/90 bg-[#f2efe8] text-zinc-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ${className}`}
    >
      <div className="grid grid-cols-1 gap-0 border-b border-zinc-300/90 sm:grid-cols-2">
        <div className="border-b border-zinc-300/80 p-4 sm:border-b-0 sm:border-r">
          <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.35em] text-zinc-600">Foreign policy · excerpt</p>
          <p className="mt-3 font-serif text-[13px] leading-relaxed text-zinc-800">
            “We will make our military so strong… that we do not want to fight anymore… we won&apos;t have to fight.”
          </p>
          <p className="mt-3 font-mono text-[10px] text-zinc-500">Campaign interview · 2015 — verbatim excerpt</p>
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-700">
            Then the page next to it: the budget tables, deployment numbers, and posture statements that show what
            actually happened — interpretation stays with you.
          </p>
        </div>
        <div className="p-4">
          <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.35em] text-zinc-600">Trade · excerpt</p>
          <p className="mt-3 font-serif text-[13px] leading-relaxed text-zinc-800">
            “It starts with trade — fair trade, not free trade.”
          </p>
          <p className="mt-3 font-mono text-[10px] text-zinc-500">Campaign rally · 2016 — verbatim excerpt</p>
          <p className="mt-4 text-[11px] leading-relaxed text-zinc-700">
            Then the receipts: USTR releases, USMCA text, and tariff filings — the documents that decide whether
            “fair trade” became policy.
          </p>
        </div>
      </div>
      <p className="bg-[#ebe6dc] px-4 py-2 text-center font-mono text-[9px] uppercase tracking-[0.25em] text-zinc-500">
        Readable HTML preview · PDF includes lineage, illustration plate + full manuscript positioning
      </p>
    </div>
  )
}
