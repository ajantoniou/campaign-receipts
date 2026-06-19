import type { Metadata } from 'next'
import Link from 'next/link'
import { CompanyPhoneLink } from '../../../../shared/react/CompanyPhoneLink'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Contact SEALED Press',
  description:
    'Get in touch with SEALED Press about updates for SEALED — The 2016 Promises Before the Deals, or use the homepage waitlist.',
}

export const dynamic = 'force-dynamic'

// Contact email defaults to a real address (support@sealed2016.com → routed
// to CoS Gmail master inbox via Cloudflare Email Routing). Env-var override
// kept in case we want to swap channels without a redeploy.
const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'support@sealed2016.com'
const pressEmail = process.env.NEXT_PUBLIC_PRESS_EMAIL?.trim() || 'press@sealed2016.com'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900 px-6 py-16 max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl font-bold tracking-tight mb-4 text-ink-900">Contact</h1>
      <div className="gold-rule mb-8" aria-hidden />

      <section className="mb-10">
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
          Support &middot; Refunds &middot; Download issues
        </p>
        <p className="mt-2 font-serif text-lg leading-relaxed text-ink-800">
          <a
            href={`mailto:${contactEmail}`}
            className="text-civic-blue font-medium underline underline-offset-4 hover:no-underline"
          >
            {contactEmail}
          </a>
        </p>
        <p className="mt-2 font-serif text-lg leading-relaxed text-ink-800">
          <CompanyPhoneLink className="text-civic-blue font-medium underline underline-offset-4 hover:no-underline" />
        </p>
        <p className="mt-2 text-sm text-ink-600">
          Receipts, refunds, and delivery are governed by{' '}
          <Link href="/terms" className="text-civic-blue underline underline-offset-2">
            our Terms
          </Link>
          . Lemon Squeezy is the merchant of record for both the digital and paperback editions.
        </p>
      </section>

      <section className="mb-10">
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
          Press &middot; Review copies &middot; Editorial
        </p>
        <p className="mt-2 font-serif text-lg leading-relaxed text-ink-800">
          <a
            href={`mailto:${pressEmail}`}
            className="text-civic-blue font-medium underline underline-offset-4 hover:no-underline"
          >
            {pressEmail}
          </a>
        </p>
        <p className="mt-2 text-sm text-ink-600">
          Journalists, podcast hosts, and creators: include your outlet and intended angle, and
          we&rsquo;ll get you a review copy of the PDF and answer methodology questions.
        </p>
      </section>

      <section className="mb-10">
        <p className="font-sans text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-civic-blue">
          Citation archive
        </p>
        <p className="mt-2 font-serif text-base leading-relaxed text-ink-700">
          The companion citation archive lives at{' '}
          <a
            href="https://campaignreceipts.com/trump"
            target="_blank"
            rel="noopener noreferrer"
            className="text-civic-blue underline underline-offset-4 hover:no-underline"
          >
            CampaignReceipts.com/trump
          </a>
          . Preserved 2024 platform pages are at{' '}
          <a
            href="https://campaignreceipts.com/2024-trump-campaign-promises"
            target="_blank"
            rel="noopener noreferrer"
            className="text-civic-blue underline underline-offset-4 hover:no-underline"
          >
            /2024-trump-campaign-promises
          </a>
          . Both free, both citable, both built on primary-source URLs.
        </p>
      </section>

      <p className="text-sm text-ink-500">
        <Link href="/" className="underline underline-offset-2 hover:text-civic-blue">
          Home
        </Link>
        {' · '}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-civic-blue">
          Privacy
        </Link>
        {' · '}
        <Link href="/terms" className="underline underline-offset-2 hover:text-civic-blue">
          Terms
        </Link>
      </p>
      <SiteFooter />
    </main>
  )
}
