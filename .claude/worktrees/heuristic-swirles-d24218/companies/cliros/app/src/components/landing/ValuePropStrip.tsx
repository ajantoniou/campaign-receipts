/* Core sell: full package in <5 min, 10× throughput, 80% cost cut */

export default function ValuePropStrip() {
  return (
    <section className="border-y border-[var(--landing-border)] bg-[var(--landing-ink)] text-white">
      <div className="max-w-[1200px] mx-auto px-6 py-8 md:py-10">
        <p className="text-center text-[15px] md:text-lg text-white/90 leading-relaxed max-w-4xl mx-auto">
          <span className="font-semibold text-white">
            Title search, commitment, AOL, warranty deed, settlement statement, affidavits, PT-61, 1099-S, owner&apos;s policy
          </span>
          {" "}— all ten produced in under{" "}
          <span className="text-[var(--landing-accent)] font-semibold">5 minutes</span>. What took{" "}
          <span className="line-through text-white/40">hours</span> is now{" "}
          <span className="font-semibold text-white">minutes</span> to review, approve, and send.
        </p>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 text-center">
          {[
            { v: "10×", l: "Closing throughput" },
            { v: "80%", l: "Lower unit cost" },
            { v: "<5 min", l: "Full ten-doc package" },
            { v: "10", l: "Deliverables per search" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display text-3xl md:text-4xl tracking-tight text-[var(--landing-accent)]">
                {s.v}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/45">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
