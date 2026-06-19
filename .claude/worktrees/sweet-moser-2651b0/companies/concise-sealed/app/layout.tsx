import type { Metadata } from 'next'
import { Lora, Source_Sans_3 } from 'next/font/google'
import { siteUrl } from '@/lib/site-url'
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

/** JSON-LD for SEO (steps 24–25 launch tracker). */
const jsonLdBook = {
  '@context': 'https://schema.org',
  '@type': 'Book',
  name: 'SEALED — The 2016 Promises Before the Deals',
  url: siteUrl,
  inLanguage: 'en-US',
  bookFormat: 'https://schema.org/EBook',
  publisher: { '@type': 'Organization', name: 'SEALED Press', url: siteUrl },
  offers: {
    '@type': 'Offer',
    price: '15.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url:
      process.env.NEXT_PUBLIC_SEALED_CHECKOUT_STANDARD_URL ||
      'https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767?logo=0',
  },
  image: `${siteUrl}/product-images/cover-final.jpg`,
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
    'Primary-source archive of 2015–2016 campaign promises — verbatim, dated, sourced, paired with the receipts that test them. 116-page watermarked PDF, $15.',
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        {children}
      </body>
    </html>
  )
}
