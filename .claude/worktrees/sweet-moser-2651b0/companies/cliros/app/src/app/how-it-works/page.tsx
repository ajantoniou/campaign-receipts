"use client";

import Image from "next/image";
import ProductWalkthrough from "@/components/landing/ProductWalkthrough";

/* /how-it-works — the full, scroll-driven product walkthrough.
   Brand: paper + ink + gold rule + one Georgia-orange pop. */

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--paper)]/95 backdrop-blur-sm border-b border-[var(--gold)]/40">
        <nav className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-[76px]">
          <a href="/" aria-label="Cliros" className="inline-flex items-center">
            <Image src="/logo.svg" alt="Cliros" width={140} height={31} priority style={{ width: 140, height: "auto" }} />
          </a>
          <div className="flex items-center gap-3">
            <a href="/login" className="hidden sm:inline-flex items-center px-4 py-2 text-[13px] font-semibold tracking-[0.04em] uppercase text-[var(--ink)] border border-[var(--gold)] rounded-sm hover:bg-[var(--gold)]/10 transition">
              Sign in
            </a>
            <a href="/signup" className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold tracking-[0.04em] uppercase text-[#FFFDF7] bg-[var(--orange-ga)] rounded-sm hover:bg-[var(--orange-ga-ink)] transition">
              Get started
            </a>
          </div>
        </nav>
      </header>

      <main className="pt-[76px] bg-[var(--paper)]">
        {/* hero */}
        <section className="py-20 md:py-28 text-center">
          <div className="max-w-[760px] mx-auto px-6">
            <p className="eyebrow">How it works</p>
            <h1
              className="mt-3 font-display text-[var(--ink)]"
              style={{ fontSize: "clamp(34px, 5vw, 64px)", lineHeight: 1.04 }}
            >
              End-to-end closing prep,{" "}
              <span style={{ color: "var(--orange-ga)", fontStyle: "italic", fontWeight: 500 }}>in under five minutes.</span>
            </h1>
            <p className="mt-5 text-[var(--ink-muted)]" style={{ fontSize: 17, lineHeight: 1.6 }}>
              From a single address to a complete closing file — the title search, the B7-2-06 opinion
              draft, the curative plan, the client summary, and every raw document. Then edit any of it
              by just asking.
            </p>
          </div>
        </section>

        <div className="gold-rule mb-4" style={{ maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }} />

        {/* the scroll-driven walkthrough */}
        <section className="py-12 md:py-16">
          <div className="max-w-[1100px] mx-auto px-6">
            <ProductWalkthrough mode="scroll" />
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 bg-[var(--paper-deep)] border-t border-[var(--paper-edge)] text-center">
          <div className="max-w-[640px] mx-auto px-6">
            <h2 className="font-display text-[var(--ink)]" style={{ fontSize: "clamp(28px, 4vw, 46px)", lineHeight: 1.08 }}>
              Run your first search
            </h2>
            <p className="mt-4 text-[var(--ink-muted)]" style={{ fontSize: 16, lineHeight: 1.6 }}>
              Type a Georgia address and see the whole file build itself.
            </p>
            <a
              href="/signup"
              className="mt-7 inline-flex items-center gap-2 px-6 py-3 text-[13px] font-semibold tracking-[0.04em] uppercase text-[#FFFDF7] bg-[var(--orange-ga)] rounded-sm hover:bg-[var(--orange-ga-ink)] transition"
            >
              Get started <ArrowIcon className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>
    </>
  );
}
