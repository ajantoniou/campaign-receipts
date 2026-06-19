"use client";

import { useState } from "react";
import DocumentPreview from "./DocumentPreview";

const steps = [
  {
    num: "01",
    title: "Enter the Georgia address",
    description:
      "Parcel anchor confirms the property before anything is queued. No railway-company false positives.",
    visual: "search" as const,
  },
  {
    num: "02",
    title: "Every index searched in parallel",
    description:
      "GSCCCA deeds, liens, cancellations, UCC, PT-61, federal courts, and Atlanta permits — full package in under 5 minutes.",
    visual: "records" as const,
  },
  {
    num: "03",
    title: "Review, approve, send to clients",
    description:
      "Title search, client report, attorney AOL (B7-2-06), and raw vault — panel-reviewed. Minutes to approve what used to take hours.",
    visual: "aol" as const,
  },
];

function SearchMock() {
  return (
    <div className="rounded-xl border border-[var(--landing-border)] bg-white p-5 shadow-lg">
      <p className="text-[10px] uppercase tracking-wider text-[var(--landing-muted)] mb-3">New search</p>
      <div className="flex gap-2">
        <div className="flex-1 rounded-lg bg-[#F6F5F2] px-4 py-3 text-[13px] text-[var(--landing-ink)]">
          1394 Peachtree Battle Ave NW, Atlanta, GA
        </div>
        <div className="shrink-0 px-4 py-3 rounded-lg bg-[var(--landing-ink)] text-white text-[13px] font-medium">
          Search
        </div>
      </div>
      <p className="mt-3 text-[11px] text-emerald-700 font-medium">Parcel 17 019500030386 · Fulton</p>
    </div>
  );
}

function RecordsMock() {
  const rows = ["Warranty deed · 2011", "Security deed · 2003", "Cancellation · 2011", "Federal tax lien · flagged"];
  return (
    <div className="rounded-xl border border-[var(--landing-border)] bg-white p-5 shadow-lg">
      <p className="text-[10px] uppercase tracking-wider text-[var(--landing-muted)] mb-3">Live index sweep</p>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r}
            className="flex items-center justify-between text-[12px] py-2 px-3 rounded-lg bg-[#F6F5F2] animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <span className="text-[var(--landing-ink)]">{r}</span>
            <span className="text-[var(--landing-muted)]">GSCCCA</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HowItWorksSteps() {
  const [active, setActive] = useState(2);
  const [aolVideoOk, setAolVideoOk] = useState(true);

  return (
    <section id="how-it-works" className="py-28 landing-grid-bg border-t border-[var(--landing-border)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[var(--landing-muted)]">
          How it works
        </p>
        <h2 className="font-display text-4xl md:text-[3.25rem] text-[var(--landing-ink)] mt-4 tracking-[-0.02em] max-w-xl">
          Address to full closing file in three steps
        </h2>
        <p className="mt-4 text-lg text-[var(--landing-muted)] max-w-lg">
          10× your volume. Cut costs up to 80%. The engine produces; you review and approve in minutes.
        </p>

        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className="space-y-4">
            {steps.map((s, i) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setActive(i)}
                className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                  active === i
                    ? "bg-white border-[var(--landing-ink)]/20 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]"
                    : "bg-transparent border-transparent hover:bg-white/60"
                }`}
              >
                <span className="text-[12px] font-mono text-[var(--landing-muted)]">{s.num}</span>
                <h3 className="mt-2 text-xl font-semibold text-[var(--landing-ink)]">{s.title}</h3>
                <p className="mt-2 text-[15px] text-[var(--landing-muted)] leading-relaxed">{s.description}</p>
              </button>
            ))}
          </div>

          <div className="relative min-h-[320px]">
            {active === 0 && <SearchMock />}
            {active === 1 && <RecordsMock />}
            {active === 2 && (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-[var(--landing-border)] shadow-xl aspect-video relative landing-aol-fallback flex items-center justify-center p-6">
                  {aolVideoOk ? (
                    <video
                      src="/landing/aol-step.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => setAolVideoOk(false)}
                    />
                  ) : (
                    <DocumentPreview variant="aol" className="max-w-sm w-full shadow-2xl relative z-10" />
                  )}
                </div>
                <p className="text-[12px] text-center text-[var(--landing-muted)]">
                  B7-2-06 AOL draft · Title report · Raw vault
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-5">
          <DocumentPreview variant="title" tilt={-1} />
          <DocumentPreview variant="aol" tilt={0} />
          <DocumentPreview variant="vault" tilt={1} />
        </div>
      </div>
    </section>
  );
}
