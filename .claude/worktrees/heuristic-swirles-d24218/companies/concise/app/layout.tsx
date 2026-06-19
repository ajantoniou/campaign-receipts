import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Concise Books — Direct Sales',
  description: 'Premium educational and advice books, sold directly to readers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
