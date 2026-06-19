"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import ValuePropStrip from "@/components/landing/ValuePropStrip";
import ProductWalkthrough from "@/components/landing/ProductWalkthrough";
import { CompanyPhoneLink } from "@/lib/company-phone";

/* ──────────────────────────────────────────────────────────────────
   Cliros Marketing Surface — Brand Refresh 2026-05-24
   Paper + ink + gold rule, one quiet pop of Georgia orange.
   ────────────────────────────────────────────────────────────────── */

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={1.4} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25M9 13.5h6m-6 3h6m-9.75-9V18a2.25 2.25 0 0 0 2.25 2.25h9A2.25 2.25 0 0 0 18.75 18V8.288a2.25 2.25 0 0 0-.659-1.591l-4.034-4.034a2.25 2.25 0 0 0-1.591-.659H6.75A2.25 2.25 0 0 0 4.5 4.25Z" />
    </svg>
  );
}

/* ── HEADER ────────────────────────────────────────────────────── */
function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--paper)]/95 backdrop-blur-sm border-b border-[var(--gold)]/40">
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-[76px]">
        <div className="flex items-center gap-10">
          <a href="/" aria-label="Cliros" className="inline-flex items-center">
            <Image src="/logo.svg" alt="Cliros" width={140} height={31} priority style={{ width: 140, height: "auto" }} />
          </a>
          <div className="hidden md:flex items-center gap-8 text-[14px] text-[var(--ink-soft)]">
            <a href="/how-it-works" className="hover:text-[var(--ink)] transition-colors">How it works</a>
            <a href="#package" className="hover:text-[var(--ink)] transition-colors">Package</a>
            <a href="#pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</a>
            <a href="#pledge" className="hover:text-[var(--ink)] transition-colors">Pledge</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 text-[13px] font-semibold tracking-[0.04em] uppercase text-[var(--ink)] border border-[var(--gold)] rounded-sm hover:bg-[var(--gold)]/10 transition"
          >
            Sign in
          </a>
          <a
            href="/signup"
            className="inline-flex items-center px-5 py-2.5 text-[13px] font-semibold tracking-[0.04em] uppercase text-[#FFFDF7] bg-[var(--orange-ga)] rounded-sm hover:bg-[var(--orange-ga-ink)] transition"
          >
            Open a File
          </a>
        </div>
      </nav>
    </header>
  );
}

/* ── HERO with motion video + still fallback ───────────────────── */
function Hero() {
  const [address, setAddress] = useState("");
  return (
    <section className="relative pt-[76px]">
      <div className="gold-rule" />
      <div className="relative w-full overflow-hidden" style={{ minHeight: "min(86vh, 880px)" }}>
        {/* Motion plate */}
        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/hero/atlanta-window.jpg"
          className="absolute inset-0 w-full h-full object-cover hero-kenburns"
          aria-hidden="true"
        >
          <source src="/hero/atlanta-window-loop.mp4" type="video/mp4" />
        </video>
        {/* Still fallback under it for slow / no-JS clients */}
        <Image
          src="/hero/atlanta-window.jpg"
          alt="A Georgia closing attorney's desk at golden hour — Montblanc pen on a signed warranty deed, brass lamp lit, peach branch outside the window."
          fill
          priority
          sizes="100vw"
          className="object-cover -z-10 hero-kenburns"
        />
        {/* Vignette */}
        <div className="absolute inset-0 hero-vignette" />
        {/* Headline column, bottom-left.
            pt clears the fixed header (76px) so the top line of the
            headline is never clipped at narrower viewports where the
            content stacks taller than the photo plate. */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-[1200px] mx-auto w-full px-6 pt-24 md:pt-32 pb-16 md:pb-24">
            <div className="max-w-[640px] animate-in">
              <p className="font-sc text-[12px] md:text-[13px] text-[var(--gold-foil)] mb-4">
                The Georgia Closing Attorney&apos;s Desk — Est. 2026
              </p>
              <h1 className="font-display text-[#FAF6EC] leading-[1.02]" style={{ fontSize: "clamp(40px, 6vw, 78px)", letterSpacing: "-0.02em" }}>
                Full end-to-end completed title work, prepared in the time it takes to{" "}
                <em className="not-italic italic" style={{ color: "var(--orange-ga)", fontStyle: "italic", fontWeight: 500 }}>pour the coffee.</em>
                <br />
                <span className="block mt-3" style={{ fontSize: "0.78em" }}>
                  Imagine what you&apos;ll do with all your{" "}
                  <em className="not-italic italic" style={{ color: "var(--orange-ga)", fontStyle: "italic", fontWeight: 500 }}>free time.</em>
                </span>
              </h1>
              <p className="mt-6 text-[17px] md:text-[18px] text-[#FAF6EC]/85 leading-[1.55] max-w-[560px]">
                Cliros runs the courthouse trip and assembles every document a Georgia residential closing requires — title search, commitment, AOL, warranty deed, settlement statement, PT-61, affidavits, 1099-S, owner&apos;s policy. <strong className="text-[#FAF6EC]">All ten. Five minutes.</strong> You sign the opinion.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="gold-rule" />

      {/* Single CTA — search bar, on paper, immediately below the plate */}
      <div className="bg-[var(--paper)]">
        <div className="max-w-[1200px] mx-auto px-6 py-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (address.trim()) {
                window.location.href = `/signup?address=${encodeURIComponent(address.trim())}`;
              }
            }}
            className="max-w-[760px] mx-auto"
          >
            <div className="flex flex-col sm:flex-row paper-input" style={{ borderLeft: "4px solid var(--gold)" }}>
              <div className="flex flex-1 items-center min-w-0 px-4 py-1">
                <SearchIcon className="w-5 h-5 text-[var(--gold-deep)] shrink-0" />
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  className="flex-1 min-w-0"
                  inputClassName="w-full px-3 py-4 text-[16px] bg-transparent outline-none text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60"
                />
              </div>
              <button
                type="submit"
                className="shrink-0 bg-[var(--orange-ga)] text-[#FFFDF7] font-semibold tracking-[0.04em] uppercase px-7 py-4 text-[14px] hover:bg-[var(--orange-ga-ink)] transition inline-flex items-center justify-center gap-2"
              >
                Open File <ArrowIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-center text-[12px] text-[var(--ink-muted)] font-sc">
              Georgia addresses · 159 counties · One file, ten documents, five minutes
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

/* ── DOCUMENT CHAIN ─────────────────────────────────────────────── */
function DocumentChain() {
  // Two rows of five so 10 cards breathe on desktop without going off-canvas.
  const row1 = [
    { name: "Title Search Report", note: null },
    { name: "Title Commitment", note: null },
    { name: "Attorney Opinion Letter", note: null },
    { name: "Draft Warranty Deed", note: null },
    { name: "Settlement Statement", note: null },
  ];
  const row2 = [
    { name: "Homeowner Summary", note: null },
    { name: "PT-61 Transfer Tax", note: null },
    { name: "Seller's Affidavit of Title", note: null },
    { name: "IRS Form 1099-S", note: null },
    { name: "Owner's Policy Affidavit", note: null },
  ];

  function renderRow(docs: typeof row1, offset = 0) {
    return (
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-2">
        {docs.map((d, i) => (
          <Fragment key={d.name}>
            <div
              className="flex-1 paper-card relative px-4 pt-6 pb-5 text-center"
              style={{ minHeight: 168, maxWidth: 200, marginLeft: "auto", marginRight: "auto" }}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] gold-foil" />
              <div className="flex justify-center mb-3">
                <DocIcon className="w-7 h-7 text-[var(--gold-deep)]" />
              </div>
              <div className="font-sc text-[10px] text-[var(--gold-deep)] mb-2">{`§${String(offset + i + 1).padStart(2, "0")}`}</div>
              <p className="font-sc text-[12px] text-[var(--ink)] leading-[1.3]">{d.name}</p>
              {d.note && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[var(--orange-ga)] text-[#FFFDF7] text-[9px] uppercase tracking-[0.08em] font-semibold whitespace-nowrap">
                  {d.note}
                </span>
              )}
            </div>
            {i < docs.length - 1 && (
              <div className="hidden md:flex items-center justify-center w-8 shrink-0" aria-hidden="true">
                <div className="chain-dot" />
                <ArrowIcon className="w-3 h-3 text-[var(--gold)] -ml-1" />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <section id="package" className="py-20 md:py-24 bg-[var(--paper)]">
      <div className="gold-rule mb-16" style={{ maxWidth: 1200, marginLeft: "auto", marginRight: "auto" }} />
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="eyebrow text-center">One Search · Ten Documents · Under Five Minutes</p>
        <h2
          className="mt-3 font-display text-center text-[var(--ink)]"
          style={{ fontSize: "clamp(32px, 4.4vw, 60px)", lineHeight: 1.05 }}
        >
          End-to-End Title Review &amp; Closing Document Generation
          <br />
          <span style={{ color: "var(--orange-ga)", fontStyle: "italic", fontWeight: 500 }}>
            in five minutes.
          </span>
        </h2>
        <p className="mt-4 text-center text-[15px] text-[var(--ink-muted)] max-w-2xl mx-auto">
          Cliros searches the county and federal records, runs a 6-AI-persona
          quality panel, then assembles every document the buyer&apos;s attorney
          drafts, signs, or files for a Georgia residential closing — all in
          under five minutes, all on your firm letterhead.
        </p>

        {/* Live demo — AOL being drafted in real time */}
        <div className="mt-10 max-w-3xl mx-auto">
          <div
            className="relative rounded-lg overflow-hidden border aspect-video"
            style={{ borderColor: "var(--paper-edge)", boxShadow: "0 12px 48px -16px rgba(11,11,12,0.25)" }}
          >
            <video
              src="/landing/aol-step.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              poster="/hero/atlanta-window.jpg"
            />
          </div>
          <p className="mt-3 text-center font-sc text-[11px] text-[var(--gold-deep)]">
            Sample: Attorney Opinion Letter (Fannie Mae B7-2-06) drafted from a live title search
          </p>
        </div>

        {/* Two-row chain — 10 cards */}
        <div className="mt-14 space-y-6">
          {renderRow(row1, 0)}
          {/* Connecting dotted arrow from row 1 end down to row 2 start (desktop) */}
          <div className="hidden md:flex justify-center text-[var(--gold)]" aria-hidden="true">
            <ArrowIcon className="w-4 h-4 rotate-90" />
          </div>
          {renderRow(row2, 5)}
        </div>

        <p className="mt-12 text-center text-[15px] text-[var(--ink-muted)] max-w-2xl mx-auto">
          You review and sign. Cliros runs the rest end-to-end — courthouse data,
          drafting, formatting, packaging. Ten closing-grade deliverables on your firm letterhead.
        </p>

        {/* Honest scope: what's IN and what's OUT — so the end-to-end claim
            holds up to a careful attorney's read. Two side-by-side columns
            on desktop, stacked on mobile. */}
        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="paper-card p-6 relative" style={{ borderTop: "2px solid var(--gold)" }}>
            <p className="eyebrow mb-3" style={{ color: "var(--gold-deep)" }}>What Cliros does</p>
            <ul className="space-y-2 text-[14px] text-[var(--ink-soft)] leading-relaxed">
              <li>✓ Pulls GSCCCA + federal-court records</li>
              <li>✓ Runs 6 AI personas to QC every report</li>
              <li>✓ Assembles all 10 closing documents on your letterhead</li>
              <li>✓ Auto-clusters lender payoffs + auto-resolves released SDs</li>
              <li>✓ Cites source records by book/page in every PDF</li>
              <li>✓ Stores the full source-document vault per file</li>
            </ul>
          </div>
          <div className="paper-card p-6 relative" style={{ borderTop: "2px solid var(--paper-edge)" }}>
            <p className="eyebrow mb-3" style={{ color: "var(--ink-muted)" }}>What you still do</p>
            <ul className="space-y-2 text-[14px] text-[var(--ink-soft)] leading-relaxed">
              <li>• Review and sign every document at closing</li>
              <li>• Move funds through your IOLTA / escrow account</li>
              <li>• Collect signatures (we generate the PDFs)</li>
              <li>• File the recordable instruments with the county</li>
              <li>• Coordinate with the lender + title insurance underwriter</li>
              <li>• Practice law — Cliros assembles, you opine</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-[12px] text-[var(--ink-muted)] max-w-2xl mx-auto italic">
          Cliros is informational research and document assembly — not a title opinion,
          title insurance, or substitute for legal judgment. Every PDF says so.
        </p>
      </div>
      <div className="gold-rule mt-20" style={{ maxWidth: 1200, marginLeft: "auto", marginRight: "auto" }} />
    </section>
  );
}

/* ── TRUSTED BY (deliverables strip) ───────────────────────────── */
function TrustedBy() {
  const badges = [
    "Title search report",
    "Title commitment (A · B-1 · B-2)",
    "Attorney AOL (B7-2-06)",
    "Draft warranty deed",
    "Settlement statement (CD/ALTA)",
    "Homeowner summary",
    "PT-61 transfer tax",
    "Seller's affidavit of title",
    "IRS Form 1099-S",
    "Owner's policy affidavit",
  ];

  return (
    <section className="bg-[var(--paper-deep)] border-t border-b border-[var(--paper-edge)]">
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <p className="eyebrow mb-6">Of Counsel to Georgia Attorneys</p>
        <div className="flex flex-wrap gap-x-10 gap-y-3 text-[14px] text-[var(--ink-soft)]">
          {badges.map((b) => (
            <span key={b} className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-[var(--gold)]" />
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── SAMPLE REPORT ─────────────────────────────────────────────── */
function SampleReport() {
  return (
    <section className="py-24 bg-[var(--paper-deep)] border-t border-b border-[var(--paper-edge)]">
      <div className="max-w-[1200px] mx-auto px-6 grid lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center">
        <div>
          <p className="eyebrow">Sample File</p>
          <h2 className="mt-3 font-display text-[var(--ink)]" style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.08 }}>
            See the dossier before you trust it with a closing.
          </h2>
          <p className="mt-5 text-[16px] text-[var(--ink-soft)] leading-relaxed">
            The founding-attorney preview starts with one real Georgia property
            you already know. We build the account, add 10 free title-closing
            dossiers, prepare the first file, and ask you to mark what saved
            time and what still needs attorney judgment.
          </p>
          <a
            href="mailto:alex@cliros.ai?subject=Cliros%20founding%20attorney%20preview&body=Account%20email%3A%0AProperty%20address%3A"
            className="mt-8 inline-flex items-center justify-center gap-2 bg-[var(--orange-ga)] text-[#FFFDF7] font-semibold tracking-[0.04em] uppercase px-6 py-3 text-[13px] hover:bg-[var(--orange-ga-ink)] transition"
          >
            Send One Property <ArrowIcon className="w-4 h-4" />
          </a>
          <p className="mt-3 text-[12px] text-[var(--ink-muted)]">
            Reply with the account email and one property address. No card, no
            code, no contract.
          </p>
        </div>
        <div className="paper-card-deep p-4 relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] gold-foil" />
          <Image
            src="/email/product-preview.png"
            alt="Cliros sample title-closing dossier preview"
            width={1024}
            height={640}
            className="w-full h-auto rounded-sm border border-[var(--paper-edge)]"
          />
          <p className="mt-3 text-center font-sc text-[11px] text-[var(--gold-deep)]">
            Sample dossier preview: chain, liens, closing documents, and source trail
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── IMPACT STATS ──────────────────────────────────────────────── */
function ImpactStats() {
  const stats = [
    { value: "10×", label: "Closing throughput" },
    { value: "80%", label: "Lower unit cost" },
    { value: "<5", label: "Minutes per file" },
    { value: "159", label: "GA counties" },
  ];

  return (
    <section className="py-24 bg-[var(--obsidian)] text-[var(--paper)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="font-sc text-[12px] text-[var(--gold-foil)] mb-4">Why firms switch</p>
        <h2 className="font-display max-w-2xl leading-[1.08]" style={{ fontSize: "clamp(32px, 4vw, 56px)", letterSpacing: "-0.015em" }}>
          Scale volume without scaling headcount.
        </h2>
        <p className="mt-5 text-[var(--paper)]/65 max-w-xl text-[16px] leading-relaxed">
          Cliros runs the search, drafts the client package and AOL, and bundles raw records. You review, approve, and send — the same quality bar, a fraction of the time.
        </p>
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-0 border-t border-[var(--gold)]/40">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`py-10 ${i > 0 ? "lg:border-l border-[var(--gold)]/40" : ""}`}
            >
              <div className="font-display text-[var(--paper)]" style={{ fontSize: "clamp(56px, 6vw, 96px)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                {s.value}
              </div>
              <div className="mt-3 h-px bg-[var(--gold)]/60 w-12" />
              <div className="mt-3 font-sc text-[11px] text-[var(--gold-foil)]">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── SECURITY ──────────────────────────────────────────────────── */
function Security() {
  const items = [
    { title: "Attorney-reviewed output", desc: "Six-persona panel on every report. Ship, fix, or kill before delivery." },
    { title: "Tenant isolation", desc: "Row-level security on report documents. Your client files stay yours." },
    { title: "No training on your data", desc: "Search results and firm profiles are not used to train third-party models." },
    { title: "Georgia-only v1", desc: "Focused scope reduces cross-state indexing errors while we perfect the engine." },
  ];

  return (
    <section className="py-28 bg-[var(--paper)]">
      <div className="max-w-[720px] mx-auto px-6 text-center">
        <p className="eyebrow">Trust &amp; Custody</p>
        <h2 className="mt-3 font-display text-[var(--ink)]" style={{ fontSize: "clamp(32px, 4vw, 52px)", lineHeight: 1.1, letterSpacing: "-0.015em" }}>
          Built for the confidentiality closing attorneys require.
        </h2>
      </div>
      <div className="max-w-[1200px] mx-auto px-6 mt-14 grid sm:grid-cols-2 gap-6">
        {items.map((item) => (
          <div key={item.title} className="p-8 paper-card relative">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-[var(--gold)]" />
            <h3 className="font-display text-[22px] text-[var(--ink)]">{item.title}</h3>
            <p className="mt-2 text-[15px] text-[var(--ink-muted)] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── PRICING — KEEP 3-PACK STRUCTURE (locked delta #3) ─────────── */
function Pricing() {
  const [closingsPerMonth, setClosingsPerMonth] = useState(8);

  const packs = [
    { size: 1, total: 250, perReport: 250, label: "Single File", note: "Try one closing on us — pay only if you ship it." },
    { size: 5, total: 1100, perReport: 220, label: "Closer Pack", note: "12% off retail. Most attorneys start here." },
    { size: 25, total: 5000, perReport: 200, label: "Firm Pack", note: "20% off retail. Recommended for active firms.", recommended: true },
  ];

  const retailPerReport = 200;
  const abstractorEstimate = 650;
  const monthlyCliros = closingsPerMonth * retailPerReport;
  const monthlyManual = closingsPerMonth * abstractorEstimate;
  const monthlySavings = monthlyManual - monthlyCliros;
  const savingsPct = Math.round((monthlySavings / monthlyManual) * 100);

  return (
    <section id="pricing" className="py-28 bg-[var(--paper)]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="eyebrow">Pricing</p>
          <h2 className="mt-3 font-display text-[var(--ink)]" style={{ fontSize: "clamp(32px, 4.4vw, 56px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}>
            Three packs. ~$200 per closing file at launch.
          </h2>
          <p className="mt-5 text-[16px] text-[var(--ink-muted)] leading-relaxed">
            Founding cohort: reply with the email you want on the account and
            one Georgia property. We prepare the first file and add 10 free
            title-closing dossiers. Public paid packs open after the preview.
          </p>
        </div>

        {/* Three receipt-style packs */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {packs.map((p) => (
            <div
              key={p.size}
              className={`relative paper-card-deep p-8 flex flex-col ${p.recommended ? "ring-1 ring-[var(--gold)]" : ""}`}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] gold-foil" />
              {p.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-sc text-[10px] bg-[var(--gold-deep)] text-[var(--paper)] px-3 py-1">
                  Recommended
                </span>
              )}
              <p className="font-sc text-[11px] text-[var(--gold-deep)]">{p.label}</p>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-[var(--ink)]" style={{ fontSize: 64, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {p.size}
                </span>
                <span className="text-[14px] text-[var(--ink-muted)]">{p.size === 1 ? "file" : "files"}</span>
              </div>
              <div className="mt-2 text-[15px] text-[var(--ink-soft)]">
                <span className="font-mono text-[var(--ink)]">${p.total.toLocaleString()}</span>
                <span className="text-[var(--ink-muted)]"> total · </span>
                <span className="font-mono text-[var(--ink)]">${p.perReport}</span>
                <span className="text-[var(--ink-muted)]"> / file</span>
              </div>
              <p className="mt-5 text-[14px] text-[var(--ink-muted)] leading-relaxed flex-1">{p.note}</p>
              <ul className="mt-6 space-y-2 text-[13px] text-[var(--ink-soft)]">
                {["Title search", "Client summary", "Attorney AOL", "Warranty deed", "Settlement stmt"].map((line) => (
                  <li key={line} className="flex items-center">
                    <span>{line}</span>
                    <span className="dotted-leader" />
                    <span className="font-sc text-[10px] text-[var(--gold-deep)]">incl.</span>
                  </li>
                ))}
              </ul>
              <a
                href={`/signup?pack=${p.size}`}
                className={`mt-8 block text-center py-3.5 font-sc text-[12px] tracking-[0.08em] uppercase transition ${
                  p.recommended
                    ? "bg-[var(--orange-ga)] text-[#FFFDF7] hover:bg-[var(--orange-ga-ink)]"
                    : "border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
                }`}
              >
                Open Pack
              </a>
            </div>
          ))}
        </div>

        {/* Savings calculator */}
        <div className="mt-12 paper-card p-8 max-w-3xl mx-auto">
          <h3 className="font-sc text-[12px] text-[var(--gold-deep)] mb-6 text-center">Throughput &amp; Savings vs. Abstractor</h3>
          <div className="mb-6">
            <div className="flex justify-between text-[13px] mb-2 text-[var(--ink-soft)]">
              <span>Closings you run today (per month)</span>
              <span className="font-mono">{closingsPerMonth}</span>
            </div>
            <input
              type="range"
              min={2}
              max={40}
              value={closingsPerMonth}
              onChange={(e) => setClosingsPerMonth(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="font-sc text-[10px] text-[var(--gold-deep)]">Cliros</div>
              <div className="font-display text-[28px] text-[var(--ink)] mt-1">${monthlyCliros.toLocaleString()}</div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">/ month</div>
            </div>
            <div>
              <div className="font-sc text-[10px] text-[var(--gold-deep)]">Abstractor</div>
              <div className="font-display text-[28px] text-[var(--ink-muted)] mt-1 line-through">${monthlyManual.toLocaleString()}</div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">/ month</div>
            </div>
            <div>
              <div className="font-sc text-[10px] text-[var(--gold-deep)]">You save</div>
              <div className="font-display text-[28px] text-[var(--orange-ga)] mt-1">{savingsPct}%</div>
              <div className="text-[11px] text-[var(--ink-muted)] mt-1">${monthlySavings.toLocaleString()} / mo</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────────────────── */
function FAQ() {
  const faqs = [
    { q: "What is an Attorney Opinion Letter (AOL)?", a: "A Fannie Mae-approved alternative to title insurance. An attorney reviews the title search and issues a legal opinion confirming clear title. AOLs generate $500–1,500 per closing while saving homebuyers vs. title insurance premiums." },
    { q: "How accurate are the reports?", a: "We search the same GSCCCA databases human abstractors use. Every report runs through a six-persona quality panel. You verify findings and apply professional judgment before signing." },
    { q: "Which states do you cover?", a: "All 159 Georgia counties via direct GSCCCA access, plus federal court records for Georgia districts. Additional AOL states planned." },
    { q: "Who is liable if something is missed?", a: "Cliros provides data and analysis tools. You provide the legal opinion. Your professional judgment remains the standard of care, as with a traditional abstractor." },
    { q: "How long does a search take?", a: "The full ten-document closing package — title search, commitment, AOL, draft warranty deed, settlement statement, homeowner summary, PT-61, seller's affidavit of title, IRS Form 1099-S, and owner's policy affidavit — is typically ready in under 5 minutes. Your review and approval take minutes, not hours." },
    { q: "Is there a free trial?", a: "Yes. Founding attorneys reply with the account email and one Georgia property. We build the account, prepare the first file, and add 10 free title-closing dossiers. No code and no card required." },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-28 bg-[var(--paper-deep)]">
      <div className="max-w-[760px] mx-auto px-6">
        <p className="eyebrow text-center">Frequently Asked</p>
        <h2 className="mt-3 text-center font-display text-[var(--ink)]" style={{ fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1.1 }}>
          Common questions
        </h2>
        <div className="mt-12">
          {faqs.map((faq, i) => (
            <div key={i} className="border-t border-[var(--gold)]/40 last:border-b">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-2 py-5 text-left"
              >
                <span className="font-display text-[20px] text-[var(--ink)] pr-4">{faq.q}</span>
                <span className={`text-[var(--gold)] text-2xl shrink-0 transition-transform ${open === i ? "rotate-45" : ""}`}>+</span>
              </button>
              {open === i && (
                <div className="px-2 pb-6 text-[16px] text-[var(--ink-soft)] leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── ABOUT + PLEDGE ────────────────────────────────────────────── */
function AboutAndPledge() {
  return (
    <section id="pledge" className="py-28 bg-[var(--paper)]">
      <div className="max-w-[1200px] mx-auto px-6 grid md:grid-cols-2 gap-16 items-start">
        <div>
          <p className="eyebrow">About</p>
          <h2 className="mt-3 font-display text-[var(--ink)]" style={{ fontSize: "clamp(28px, 3.4vw, 44px)", lineHeight: 1.1, letterSpacing: "-0.015em" }}>
            Built for GA closing attorneys, with closing attorneys.
          </h2>
          <p className="mt-5 text-[16px] text-[var(--ink-soft)] leading-relaxed">
            Cliros is built by Alex Antoniou for Georgia closing attorneys, refined with input from our founding-attorney design partners. We&apos;re not a title insurance underwriter and we don&apos;t practice law. Cliros assembles the research and the document drafts; the reviewing attorney provides the legal judgment and signs the final opinion.
          </p>
        </div>
        <div className="paper-card-deep p-10 relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] gold-foil" />
          <div className="flex items-start gap-5">
            <div className="shrink-0 w-16 h-16 rounded-full border-2 border-[var(--gold)] flex items-center justify-center font-display text-[24px] text-[var(--gold-deep)]">
              10%
            </div>
            <div>
              <p className="font-sc text-[11px] text-[var(--gold-deep)]">The Mission Fund</p>
              <h3 className="mt-2 font-display text-[26px] text-[var(--ink)] leading-snug">
                Ten percent of every closing fee goes to the Cliros Mission Fund — to help people who can&apos;t yet help themselves.
              </h3>
              <p className="mt-3 text-[13px] text-[var(--ink-soft)] italic leading-relaxed">
                Inspired by the Good Samaritan: see the person on the road, stop, pay the innkeeper.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────── */
function CTA() {
  const [address, setAddress] = useState("");
  return (
    <section className="py-28 bg-[var(--paper-deep)] border-t border-[var(--paper-edge)]">
      <div className="max-w-[760px] mx-auto px-6 text-center">
        <p className="eyebrow">Begin</p>
        <h2 className="mt-3 font-display text-[var(--ink)]" style={{ fontSize: "clamp(32px, 4vw, 56px)", lineHeight: 1.08, letterSpacing: "-0.015em" }}>
          Enter an address. Pour the coffee.
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (address.trim()) {
              window.location.href = `/signup?address=${encodeURIComponent(address.trim())}`;
            }
          }}
          className="mt-10"
        >
          <div className="flex flex-col sm:flex-row paper-input" style={{ borderLeft: "4px solid var(--gold)" }}>
            <div className="flex flex-1 items-center min-w-0 px-4 py-1">
              <SearchIcon className="w-5 h-5 text-[var(--gold-deep)] shrink-0" />
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                className="flex-1 min-w-0"
                inputClassName="w-full px-3 py-4 text-[16px] bg-transparent outline-none text-[var(--ink)] placeholder:text-[var(--ink-muted)]/60"
              />
            </div>
            <button
              type="submit"
              className="shrink-0 bg-[var(--orange-ga)] text-[#FFFDF7] font-semibold tracking-[0.04em] uppercase px-7 py-4 text-[14px] hover:bg-[var(--orange-ga-ink)] transition inline-flex items-center justify-center gap-2"
            >
              Open File <ArrowIcon className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ── FOOTER ────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-[var(--obsidian)] text-[var(--paper)]/80">
      <div className="gold-rule-foil" />
      <div className="max-w-[1200px] mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-12">
          <div>
            <Image src="/logo-white.svg" alt="Cliros" width={108} height={24} style={{ width: 108, height: "auto" }} />
            <p className="font-sc text-[11px] mt-4 text-[var(--gold-foil)]">Cliros, PBC</p>
            <address className="not-italic mt-3 text-[13px] leading-[1.65] text-[var(--paper)]/75">
              999 Peachtree Street NE<br />
              Suite 2300<br />
              Atlanta, Georgia 30309<br />
              <a href="mailto:alex@cliros.ai" className="hover:text-[var(--gold-foil)] transition">alex@cliros.ai</a>
              {" · "}
              <CompanyPhoneLink className="hover:text-[var(--gold-foil)] transition" />
            </address>
          </div>
          <div>
            <h4 className="font-sc text-[11px] text-[var(--gold-foil)] mb-4">Product</h4>
            <ul className="space-y-2.5 text-[13px] text-[var(--paper)]/75">
              <li><a href="#package" className="hover:text-[var(--paper)] transition">The 10-Doc Package</a></li>
              <li><a href="#pricing" className="hover:text-[var(--paper)] transition">Pricing</a></li>
              <li><a href="mailto:alex@cliros.ai?subject=Cliros%20founding%20attorney%20preview" className="hover:text-[var(--paper)] transition">Start a Preview File</a></li>
              <li><a href="/login" className="hover:text-[var(--paper)] transition">Sign In</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sc text-[11px] text-[var(--gold-foil)] mb-4">Firm</h4>
            <ul className="space-y-2.5 text-[13px] text-[var(--paper)]/75">
              <li><a href="#pledge" className="hover:text-[var(--paper)] transition">About</a></li>
              <li><a href="#pledge" className="hover:text-[var(--paper)] transition">The Mission Fund</a></li>
              <li><a href="mailto:alex@cliros.ai?subject=Press%20inquiry" className="hover:text-[var(--paper)] transition">Press</a></li>
              <li><a href="mailto:alex@cliros.ai?subject=Cliros%20question" className="hover:text-[var(--paper)] transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-sc text-[11px] text-[var(--gold-foil)] mb-4">Legal</h4>
            <ul className="space-y-2.5 text-[13px] text-[var(--paper)]/75">
              <li><a href="/terms" className="hover:text-[var(--paper)] transition">Terms</a></li>
              <li><a href="/privacy" className="hover:text-[var(--paper)] transition">Privacy</a></li>
              <li><a href="https://www.gabar.org" target="_blank" rel="noreferrer" className="hover:text-[var(--paper)] transition">State Bar of Georgia ↗</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[var(--paper)]/10 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px]">
          <p className="text-[var(--paper)]/55 text-center md:text-left">
            © {new Date().getFullYear()} Cliros, PBC. Attorney advertising. Past results do not guarantee future outcomes.
          </p>
          <a href="#pledge" className="inline-flex items-center gap-2 text-[var(--gold-foil)] hover:text-[var(--paper)] transition" aria-label="The Cliros Mission Fund — 10% of revenue">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-[var(--gold)] text-[9px] font-sc text-[var(--gold-foil)]">10%</span>
            <span className="font-sc text-[10px]">Mission Fund — 10% of revenue</span>
          </a>
          <p className="text-[var(--paper)]/55 text-[11px]">
            Made with <span className="text-[var(--orange-ga)]">♥</span> in the USA <span aria-label="US flag">🇺🇸</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ── PRODUCT WALKTHROUGH TEASER (auto-loop) ─────────────────────── */
function WalkthroughTeaser() {
  return (
    <section className="py-20 md:py-24 bg-[var(--paper-deep)] border-t border-b border-[var(--paper-edge)]">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="eyebrow">See it run</p>
            <h2
              className="mt-3 font-display text-[var(--ink)]"
              style={{ fontSize: "clamp(28px, 3.6vw, 46px)", lineHeight: 1.08 }}
            >
              Address in. <span style={{ color: "var(--orange-ga)", fontStyle: "italic", fontWeight: 500 }}>Closing file out.</span>
            </h2>
            <p className="mt-4 text-[var(--ink-muted)]" style={{ fontSize: 16, lineHeight: 1.6, maxWidth: "42ch" }}>
              Type the property, let it run, and come back to every document — the opinion letter, the
              curative plan, the client summary, the raw deeds. Then just ask the assistant to change a
              line, approve it, and the files update.
            </p>
            <a
              href="/how-it-works"
              className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold tracking-[0.04em] uppercase text-[var(--ink)] border border-[var(--gold)] rounded-sm px-5 py-2.5 hover:bg-[var(--gold)]/10 transition"
            >
              See the full walkthrough <ArrowIcon className="w-4 h-4" />
            </a>
          </div>
          <ProductWalkthrough mode="auto" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <DocumentChain />
      <WalkthroughTeaser />
      <SampleReport />
      <TrustedBy />
      <ValuePropStrip />
      {/* ImpactStats deleted (founder 2026-05-25) — duplicated ValuePropStrip's
          same 10x/80%/<5min row. Single source of truth lives in ValuePropStrip. */}
      <Security />
      <Pricing />
      <FAQ />
      <AboutAndPledge />
      <CTA />
      <Footer />
    </>
  );
}
