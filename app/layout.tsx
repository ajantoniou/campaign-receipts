import './globals.css'
import type { Metadata } from 'next'
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AlphaPredict | Political Intelligence & Prediction Markets',
  description: 'AI-driven political prediction markets using real-time FEC data and knowledge graphs.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${jetbrains.variable} dark`}>
      <body className="bg-background text-text-main font-sans min-h-screen flex flex-col antialiased selection:bg-primary/30 selection:text-white">
        <header className="sticky top-0 z-50 glass-panel border-b-0 rounded-none border-b border-white/5 bg-background/50">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow shadow-primary-glow/50 group-hover:scale-105 transition-transform">
                <span className="font-display font-bold text-white text-lg">α</span>
              </div>
              <span className="font-display text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                AlphaPredict
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/markets" className="text-sm font-medium text-text-muted hover:text-white transition-colors">Markets</Link>
              <Link href="/intel" className="text-sm font-medium text-text-muted hover:text-white transition-colors flex items-center gap-2">
                Intel <span className="flex h-2 w-2 rounded-full bg-success shadow-glow shadow-success-glow animate-pulse-glow"></span>
              </Link>
              <Link href="/portfolio" className="text-sm font-medium text-text-muted hover:text-white transition-colors">Portfolio</Link>
              <button className="btn-primary text-sm py-2 px-5">Connect Wallet</button>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
          {children}
        </main>

        <footer className="border-t border-white/5 mt-auto py-8">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-text-muted font-mono">
              © 2026 AlphaPredict. Trading involves risk.
            </div>
            <div className="flex gap-4">
              <span className="text-xs font-mono text-text-muted/50">Powered by Fable AI</span>
              <span className="text-xs font-mono text-text-muted/50">FEC Data Sync: Live</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
