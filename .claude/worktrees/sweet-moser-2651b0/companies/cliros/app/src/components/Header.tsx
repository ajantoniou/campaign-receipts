"use client";

import Logo from "./Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--paper)]/95 backdrop-blur-sm border-b border-[var(--gold)]/40">
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-[76px]">
        <div className="flex items-center gap-10">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 text-[14px] text-[var(--ink-soft)]">
            <a href="/#practice" className="hover:text-[var(--ink)] transition-colors">Practice</a>
            <a href="/#counties" className="hover:text-[var(--ink)] transition-colors">Counties</a>
            <a href="/#pricing" className="hover:text-[var(--ink)] transition-colors">Pricing</a>
            <a href="/#pledge" className="hover:text-[var(--ink)] transition-colors">Pledge</a>
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
