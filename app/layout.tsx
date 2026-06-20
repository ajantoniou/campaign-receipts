import './globals.css'
import type { Metadata } from 'next'
import { Inter, Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Campaign Receipts | Political Intelligence & Prediction Markets',
  description: 'AI-driven political prediction markets data intelligence using real-time FEC filings, PAC spend, and knowledge graphs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${plexMono.variable} dark`}>
      <body className="bg-background text-text-main font-sans min-h-screen flex flex-col antialiased selection:bg-primary/30 selection:text-white">
        <header className="sticky top-0 z-50 glass-panel border-b-0 rounded-none border-b border-white/5 bg-background/50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded flex items-center justify-center text-xl">
                💰
              </div>
              <span className="font-display text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Campaign Receipts
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-text-muted hover:text-white transition-colors">Markets</Link>
              <Link href="#newsletter" className="text-sm font-medium text-text-muted hover:text-white transition-colors flex items-center gap-2">
                Newsletter <span className="flex h-2 w-2 rounded-full bg-success shadow-glow shadow-success-glow animate-pulse-glow"></span>
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-text-muted hover:text-white transition-colors">Alpha Terminal</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>

        <footer className="border-t border-white/5 mt-auto py-12 bg-background/80">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="flex flex-col gap-2">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-xl">💰</span>
                <span className="font-display font-bold text-white">Campaign Receipts</span>
              </Link>
              <div className="text-sm text-text-muted mt-2 max-w-sm">
                The Bloomberg Terminal for prediction markets. Find the edge with institutional-grade data.
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-12">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white text-sm">Product</h4>
                <Link href="/pricing" className="text-sm text-text-muted hover:text-white transition-colors">Alpha Terminal</Link>
                <Link href="#newsletter" className="text-sm text-text-muted hover:text-white transition-colors">Weekly Alpha Newsletter</Link>
                <Link href="/" className="text-sm text-text-muted hover:text-white transition-colors">Live Prediction Markets</Link>
                <Link href="/api/docs" className="text-sm text-text-muted hover:text-white transition-colors">Data API</Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold text-white text-sm">Intelligence</h4>
                <Link href="/methodology" className="text-sm text-text-muted hover:text-white transition-colors">Alpha Engine Methodology</Link>
                <Link href="/sources" className="text-sm text-text-muted hover:text-white transition-colors">Knowledge Graph Sources</Link>
                <Link href="/about" className="text-sm text-text-muted hover:text-white transition-colors">About the Team</Link>
                <Link href="/contact" className="text-sm text-text-muted hover:text-white transition-colors">Institutional Contact</Link>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-xs text-text-muted font-mono">
              © {new Date().getFullYear()} Campaign Receipts. Trading involves risk.
            </div>
            <div className="flex gap-4">
              <span className="text-xs font-mono text-text-muted/50">Data intelligence answers for AEO</span>
              <span className="text-xs font-mono text-text-muted/50">FEC Data Sync: Live</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
