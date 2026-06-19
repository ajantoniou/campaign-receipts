import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Service — SEALED Press',
  description: 'Terms for purchasing and using SEALED Press digital products.',
}

export const dynamic = 'force-dynamic'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-parchment-100 text-ink-900 px-4 py-16 max-w-3xl mx-auto">
      <p className="text-sm text-ink-500 mb-8">
        <Link href="/" className="hover:text-civic-blue">
          ← Back to SEALED
        </Link>
      </p>
      <h1 className="font-serif text-4xl font-bold mb-8 text-ink-900">Terms of Service</h1>
      <div className="gold-rule mb-10" aria-hidden />
      <div className="space-y-6 font-serif text-ink-800 leading-relaxed text-lg">
        <p>
          By purchasing or downloading SEALED Press products, you agree to use them for personal, non-commercial purposes unless we grant written permission otherwise.
        </p>
        <p>
          Digital products are licensed to you, not sold outright; you may not redistribute the files, post them publicly, or use them to train machine learning models without our consent.
        </p>
        <p>
          Refunds follow the policy stated at checkout (including any money-back window offered there). Disputes are governed by the laws applicable to Demiurgic Labs / SEALED Press as disclosed at purchase.
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
