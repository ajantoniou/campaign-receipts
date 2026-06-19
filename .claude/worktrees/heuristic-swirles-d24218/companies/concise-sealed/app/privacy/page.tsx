import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy Policy — SEALED Press',
  description: 'How SEALED Press handles information you submit on this site.',
}

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900 px-4 py-16 max-w-3xl mx-auto">
      <p className="text-sm text-ink-500 mb-8">
        <Link href="/" className="hover:text-civic-blue">
          ← Back to SEALED
        </Link>
      </p>
      <h1 className="font-serif text-4xl font-bold mb-8 text-ink-900">Privacy Policy</h1>
      <div className="gold-rule mb-10" aria-hidden />
      <div className="space-y-6 font-serif text-ink-800 leading-relaxed text-lg">
        <p>
          SEALED Press operates this site to sell digital editions of archival publications and to offer optional email updates.
        </p>
        <p>
          When you submit your email through our forms, we use it only for the purpose stated next to the form (for example, sending a preview or product updates). We do not sell your email address. You can unsubscribe from marketing messages using the link in any email we send.
        </p>
        <p>
          Purchases are processed by our payment provider (Lemon Squeezy). They collect payment and fulfillment data under their own terms; we receive what is needed to deliver your order and meet legal obligations.
        </p>
        <p className="text-ink-500 text-sm">
          Last updated 2026-05-05. For questions:{' '}
          <a href="mailto:support@sealed2016.com" className="text-civic-blue hover:underline">
            support@sealed2016.com
          </a>
          .
        </p>
      </div>
      <SiteFooter />
    </main>
  )
}
