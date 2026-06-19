import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Thank you — SEALED Press',
  description: 'Confirmation page after buying from SEALED Press; Lemon Squeezy sends the receipt and download emails separately.',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Post-checkout landing for both Lemon Squeezy SKUs:
 *   - $25 paperback (Lulu drop-ships the printed copy; digital PDF included)
 *   - $5 "2024 Deleted Promises" companion PDF
 * 2026-06-11: watermark + ePub + VotingCitizen copy removed — the per-buyer
 * watermark service was retired 2026-05-25 (LS now delivers plain files),
 * no ePub file exists in LS, and VotingCitizen was deprecated.
 */
export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-6 py-16 text-ink-900">
      {/* Reader copy seal — civic palette */}
      <figure
        aria-label="SEALED Press — 2026 edition"
        className="mx-auto mb-10 w-full max-w-md rounded-md border border-civic-gold/40 bg-parchment-50 px-8 py-7 text-center shadow-civic-card"
      >
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-civic-blue">
          Order received
        </p>
        <p className="mt-3 font-serif text-3xl font-bold tracking-tight text-ink-900">
          SEALED
        </p>
        <p className="mt-1 font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-600">
          SEALED Press · Receipts on the record
        </p>
        <div className="mx-auto mt-4 h-px w-12 bg-civic-gold" aria-hidden />
        <p className="mt-3 text-xs leading-relaxed text-ink-600">
          Lemon Squeezy emails your receipt and download link within minutes.
        </p>
      </figure>

      <section className="space-y-6 rounded-md border border-ink-900/15 bg-parchment-50 px-8 py-10 shadow-civic-card">
        <h1 className="font-serif text-3xl font-bold text-ink-900">Thank you for your purchase</h1>
        <div className="gold-rule max-w-[8rem]" aria-hidden />
        <p className="font-serif text-lg text-ink-700">
          Lemon Squeezy handles checkout, receipts, and file delivery. Your{' '}
          <strong className="text-ink-900">digital PDF</strong> arrives in your inbox within a few
          minutes, with a download link you can reuse anytime. If you ordered the paperback, the
          printed copy ships separately from our printer &mdash; you read the PDF while it travels.
        </p>

        {/* "Read it on your devices" card — short, PDF-accurate hints. */}
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
                <strong className="text-ink-900">Phone &amp; tablet.</strong> Open the PDF from your
                purchase email &mdash; iPhone and iPad offer to save it to Apple Books; Android opens
                it in your reader of choice.
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
                <strong className="text-ink-900">Kindle.</strong> Forward the PDF to your{' '}
                <a
                  href="https://www.amazon.com/sendtokindle/email"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-civic-blue hover:underline"
                >
                  Send-to-Kindle
                </a>{' '}
                address (looks like <em>yourname@kindle.com</em>) and Amazon delivers it to your
                device.
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
                <strong className="text-ink-900">Desktop.</strong> The PDF opens in any browser,
                Preview, or Adobe Reader. Best for big screens and for printing a hardcopy.
              </span>
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/"
            className="rounded-md border border-ink-900/20 px-4 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-ink-700 transition hover:border-civic-blue hover:text-civic-blue"
          >
            ← Back to SEALED
          </Link>
        </div>
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
