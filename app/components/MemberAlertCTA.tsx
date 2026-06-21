import Link from 'next/link'
import { Bell } from 'lucide-react'

// Topic-matched PAID membership CTA for high-intent pages (a specific bill or
// politician). CRO review 2026-06-20: bill/politician pages are peak money-
// curiosity — capture the paid intent here, not just the free list. The pitch is
// the ALERT job-to-be-done ("be first to know when money moves") framed to the
// specific subject, linking to the membership/pricing page.
//
// `subject` is the specific thing the reader is looking at, e.g. a bill title or
// a politician's name. Keep it short — it's interpolated into the headline.
export default function MemberAlertCTA({ subject }: { subject?: string }) {
  const what = subject?.trim() || 'this'
  return (
    <div className="my-8 rounded-lg border border-line bg-paper-2 p-6 sm:flex sm:items-center sm:justify-between gap-5">
      <div className="sm:max-w-xl">
        <div className="flex items-center gap-2 text-ink-2 mb-2">
          <Bell className="w-4 h-4" />
          <span className="font-mono text-[11px] uppercase tracking-widest font-bold">Member alert</span>
        </div>
        <h3 className="text-lg font-display font-bold text-ink m-0 leading-snug">
          Be first to know when money moves behind {what}.
        </h3>
        <p className="text-sm text-ink-2 leading-relaxed mt-1 mb-4 sm:mb-0">
          The data is free. Members get the one money trail that matters each Friday — explained, with
          a tap straight into the map. $9/mo, cancel anytime.
        </p>
      </div>
      <Link
        href="/pricing"
        className="shrink-0 inline-flex items-center justify-center rounded-full bg-ink text-paper font-sans text-sm font-medium px-5 py-2.5 no-underline hover:bg-ink-2 transition-colors whitespace-nowrap"
      >
        Become a member →
      </Link>
    </div>
  )
}
