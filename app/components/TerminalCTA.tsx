import Link from 'next/link'
import { Search, ArrowRight } from 'lucide-react'

// Donor-influence CTA shown on bill / detail pages. (Formerly an "Alpha Terminal"
// prediction-market CTA — reverted to the donor-influence model 2026-06-20: all
// data is free; this nudges readers into the free money-trail tools.)
export default function TerminalCTA({ title }: { title?: string }) {
  const subject = title ? `this ${title}` : 'this'
  return (
    <div className="my-12 relative overflow-hidden rounded-lg border border-line bg-paper-2 p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between">
      <div className="relative z-10 sm:max-w-xl">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-ink-2 mb-3">
          <Search className="w-5 h-5" />
          <span className="font-mono text-xs uppercase tracking-widest font-bold">Follow the money</span>
        </div>
        <h3 className="text-2xl font-display font-bold text-ink mb-2 leading-tight">
          See who funded {subject}.
        </h3>
        <p className="text-ink-2 text-sm leading-relaxed mb-6 sm:mb-0">
          Trace the donors, PACs, and industries behind it — cross-linked to votes and sourced to public FEC filings. Always free.
        </p>
      </div>

      <div className="relative z-10 sm:ml-6 shrink-0">
        <Link
          href="/investigate"
          className="inline-flex items-center justify-center gap-2 bg-ink text-paper font-mono font-bold text-sm px-6 py-3 rounded hover:bg-ink-2 transition-colors whitespace-nowrap"
        >
          OPEN THE MONEY TRAIL
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
