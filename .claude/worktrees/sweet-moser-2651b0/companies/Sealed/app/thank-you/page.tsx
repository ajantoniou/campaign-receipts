import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Thank you — SEALED Press',
  description: 'Confirmation page after buying SEALED Press; Lemon Squeezy sends the download and fulfillment emails separately.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-16 text-ink-900">
      {/* Licensed reader copy seal — civic palette */}
      <figure
        aria-label="Licensed reader copy — SEALED, 2026 edition"
        className="mx-auto mb-10 w-full max-w-md rounded-md border border-civic-gold/40 bg-parchment-50 px-8 py-7 text-center shadow-civic-card"
      >
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-civic-blue">
          Licensed reader copy
        </p>
        <p className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-900">
          SEALED
        </p>
        <p className="mt-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-600">
          2026 edition · 145 promises on the record
        </p>
        <div className="mx-auto mt-4 h-px w-12 bg-civic-gold" aria-hidden />
        <p className="mt-3 text-xs leading-relaxed text-ink-600">
          Your individual PDF is watermarked on every page with your name and order number.
        </p>
      </figure>

      <section className="space-y-6 rounded-md border border-ink-900/15 bg-parchment-50 px-8 py-10 shadow-civic-card">
        <h1 className="font-serif text-3xl font-bold text-ink-900">Thank you for your purchase</h1>
        <div className="gold-rule max-w-[8rem]" aria-hidden />
        <p className="font-serif text-lg text-ink-700">
          Lemon Squeezy handles checkout, receipts, and file delivery. Expect your watermarked
          <strong className="text-ink-900"> PDF and ePub</strong> in your inbox within a few minutes — your name,
          email, and order number are stamped on every page, and a fresh download link is included so you can
          re-download anytime.
        </p>

        {/* "Read it on your devices" card — mirrors the e-reader hints in the
            purchase email so buyers know the ePub opens cleanly in Apple Books,
            Kindle, Kobo / Nook, or stays as a PDF for desktop reading. */}
        <section
          aria-label="How to read on your devices"
          className="rounded-md border border-civic-gold/40 bg-parchment-200/40 px-6 py-6"
        >
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
            Read it on your devices
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-700">
            <li className="flex gap-3">
              <span
                aria-hidden
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900 font-serif text-base font-bold text-civic-gold"
              >
                B
              </span>
              <span>
                <strong className="text-ink-900">Apple Books</strong> (iPhone, iPad, Mac). Tap the{' '}
                <em>SEALED-v1-retail.epub</em> attachment in your purchase email — your device offers to
                open it in Books, and your library syncs across devices via iCloud.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-civic-red font-serif text-base font-bold text-parchment-50"
              >
                K
              </span>
              <span>
                <strong className="text-ink-900">Kindle.</strong> Forward your purchase email — or the ePub
                attachment — to your{' '}
                <a
                  href="https://www.amazon.com/sendtokindle/email"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-civic-blue hover:underline"
                >
                  Send-to-Kindle
                </a>{' '}
                address (looks like <em>yourname@kindle.com</em>). Amazon converts and delivers it.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-civic-blue font-serif text-base font-bold text-parchment-50"
              >
                K
              </span>
              <span>
                <strong className="text-ink-900">Kobo · Nook · Boox.</strong> Save the ePub to your reader&rsquo;s{' '}
                <em>Library</em> folder via USB or your provider&rsquo;s app. ePub is the standard format for
                non-Amazon readers.
              </span>
            </li>
            <li className="flex gap-3">
              <span
                aria-hidden
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-verdict-reader font-serif text-base font-bold text-parchment-50"
              >
                P
              </span>
              <span>
                <strong className="text-ink-900">Plain reading.</strong> The PDF opens in any browser, Preview,
                or Adobe Reader. Best for desktop and for printing a hardcopy.
              </span>
            </li>
          </ul>
          <p className="mt-5 text-xs text-ink-500">
            Both files are watermarked with your name and order number. Treat the ePub the same way as the
            PDF — if you upload or forward it, you&rsquo;re publishing your own email address with it.
          </p>
        </section>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-md border border-ink-900/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-ink-700 transition hover:border-civic-blue hover:text-civic-blue"
          >
            ← Back to SEALED
          </Link>
        </div>
        <section className="rounded-md border border-ink-900/15 bg-parchment-200/60 px-5 py-6 text-sm leading-relaxed text-ink-700">
          <h2 className="font-serif text-base font-semibold text-ink-900">Optional: VotingCitizen 1-month trial</h2>
          <p className="mt-3 text-ink-700">
            This is a <strong className="text-ink-900">separate</strong> civic briefing — not part of your SEALED download.
            If you want to stay in the know because you help elect your mayor, state legislators, or other officials — or you
            hold strong values and want a steady read on <strong className="text-ink-900">national legislation</strong> on
            issues you track (for example abortion access, gun rights, climate, education) — look for a follow-up message from
            VotingCitizen with an activation link. Opt in only if you want it; your SEALED files are already yours through Lemon
            Squeezy either way.
          </p>
          <p className="mt-3 text-xs text-ink-500">
            Lemon Squeezy handles receipts and downloads. VotingCitizen runs its own list, privacy line, and unsubscribe rules.
          </p>
        </section>
        <p className="text-xs text-ink-500">
          Questions or issues? Email{' '}
          <a href="mailto:support@sealed2016.com" className="text-civic-blue hover:underline">
            support@sealed2016.com
          </a>
          . Downloads, receipts, and refunds are governed by Lemon Squeezy&apos;s terms; privacy details live on our{' '}
          <Link href="/privacy" className="text-civic-blue hover:underline">
            privacy page
          </Link>
          .
        </p>
      </section>
      <SiteFooter />
    </main>
  )
}
