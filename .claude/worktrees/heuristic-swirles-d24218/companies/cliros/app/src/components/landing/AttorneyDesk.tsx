import DocumentPreview from "./DocumentPreview";

const sources = [
  { tag: "GSCCCA", name: "Deeds & liens" },
  { tag: "Federal", name: "Bankruptcy & tax" },
  { tag: "UCC", name: "Fixture filings" },
  { tag: "PT-61", name: "Transfer tax" },
  { tag: "Permits", name: "Atlanta mechanics" },
  { tag: "Panel", name: "6-expert QA" },
];

export default function AttorneyDesk() {
  return (
    <section id="platform" className="py-28 bg-[#EDE9E1] border-t border-[var(--landing-border)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--landing-muted)]">
          The complete package — on your desk in under 5 minutes
        </p>
        <h2 className="font-display text-4xl md:text-[3.25rem] text-[var(--landing-ink)] mt-4 max-w-2xl leading-[1.08] tracking-[-0.02em]">
          Title search. Client report. AOL. Raw records.
        </h2>
        <p className="mt-5 text-lg text-[var(--landing-muted)] max-w-xl leading-relaxed">
          Everything a closing attorney needs to review, approve, and send — produced together so you can 10× throughput
          and cut unit costs by up to 80%. Minutes to sign off, not hours to assemble.
        </p>

        {/* Desk surface */}
        <div className="landing-desk-surface mt-16 relative rounded-[2rem] p-8 md:p-12 min-h-[420px]">
          <div className="absolute top-6 right-8 hidden md:block text-[11px] text-[var(--landing-muted)]/70 font-mono">
            Harrington &amp; Associates · Closing file
          </div>

          <div className="relative grid md:grid-cols-3 gap-6 md:gap-8 items-end">
            <DocumentPreview variant="title" tilt={-2} className="md:translate-y-4 z-10" />
            <DocumentPreview variant="aol" tilt={0} className="md:-translate-y-2 z-20 scale-[1.03] shadow-2xl" />
            <DocumentPreview variant="vault" tilt={2} className="md:translate-y-6 z-10" />
          </div>

          {/* Desk accessories */}
          <div className="absolute bottom-6 left-10 w-16 h-1 rounded-full bg-[#8B6914]/30" aria-hidden />
          <div className="absolute bottom-8 right-12 text-[10px] text-[var(--landing-muted)]/50 uppercase tracking-[0.2em]">
            Fulton County · GA
          </div>
        </div>

        <div className="mt-14">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--landing-muted)] mb-6">
            Records searched in parallel
          </p>
          <div className="flex flex-wrap gap-3">
            {sources.map((s) => (
              <span
                key={s.tag}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--landing-border)] text-[13px]"
              >
                <span className="font-semibold text-[var(--landing-accent)]">{s.tag}</span>
                <span className="text-[var(--landing-muted)]">{s.name}</span>
              </span>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-[var(--landing-muted)] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Full package under 5 minutes · 159 Georgia counties
          </p>
        </div>
      </div>
    </section>
  );
}
