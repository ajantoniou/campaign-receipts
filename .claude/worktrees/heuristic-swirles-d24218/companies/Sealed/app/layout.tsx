import type { Metadata } from 'next'
import { Lora, Source_Sans_3 } from 'next/font/google'
import { siteUrl } from '@/lib/site-url'
import {
  paperbackCheckoutUrl,
  deletedPromises2024CheckoutUrl,
} from '@/lib/checkout-urls'
import './globals.css'

/** Self-hosted at build via next/font — editorial register pairs Source Sans (body) + Lora (display).
 *  Civic-trust redesign keeps these but cascades the new parchment/ink palette via tailwind tokens. */
const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sealed-body',
  display: 'swap',
})
const loraDisplay = Lora({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-sealed-display',
  display: 'swap',
})

/** JSON-LD for SEO (steps 24–25 launch tracker).
 *  2026-06-11: two live SKUs, both sold through Lemon Squeezy — the $25
 *  paperback (Lulu drop-ships the printed copy; digital PDF included) and
 *  the $5 "2024 Deleted Promises" companion PDF. The old $15 EBook SKU was
 *  retired 2026-05-25. */
const jsonLdBook = {
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: 'SEALED — The 2016 Promises Before the Deals',
  url: siteUrl,
  inLanguage: 'en-US',
  bookFormat: 'https://schema.org/Paperback',
  publisher: { '@type': 'Organization', name: 'SEALED Press', url: siteUrl },
  offers: {
    '@type': 'Offer',
    price: '25.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: paperbackCheckoutUrl,
  },
  image: `${siteUrl}/product-images/cover-final.jpg`,
}

const jsonLdCompanion = {
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: 'SEALED — The 2024 Deleted Promises (Companion Audit)',
  url: siteUrl,
  inLanguage: 'en-US',
  bookFormat: 'https://schema.org/EBook',
  publisher: { '@type': 'Organization', name: 'SEALED Press', url: siteUrl },
  offers: {
    '@type': 'Offer',
    price: '5.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: deletedPromises2024CheckoutUrl,
  },
}

const jsonLdOrg = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'SEALED Press',
  url: siteUrl,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  title: {
    default: 'SEALED — The 2016 Promises · Before the Deals',
    template: '%s · SEALED Press',
  },
  description:
    '145 verbatim 2016 campaign promises with receipts. $25 paperback, digital PDF included. $5 companion: The 2024 Deleted Promises.',
  openGraph: {
    title: 'SEALED — The 2016 Promises Before the Deals',
    description:
      'Historical archive: campaign-era promises in original context. Not a hot take—a time capsule with receipts.',
    url: siteUrl,
    siteName: 'SEALED Press',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/product-images/cover-final.jpg', width: 1200, height: 630, alt: 'SEALED book cover' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEALED — The 2016 Promises Before the Deals',
    description:
      'Campaign-era promises in original context—compare to the record yourself.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${loraDisplay.variable}`}>
      <body className={sourceSans.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBook) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdCompanion) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        {children}
      </body>
    </html>
  )
}
