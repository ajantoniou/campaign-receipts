import { supabaseRead } from '../lib/supabase';
import { MarketCard } from '../components/MarketCard';
import Link from 'next/link';

// The new flow:
// HERO-->Super well organized Political prediction markets list-->How it Works-->Newsleter Signup -->Footer. done.

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home() {
  const { data: markets } = await supabaseRead
    .from('cr_prediction_markets')
    .select('*')
    .order('volume_usd', { ascending: false })
    .limit(100);

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* 1. HERO SECTION */}
      <section className="w-full max-w-5xl py-20 px-4 text-center">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6">
          The Bloomberg Terminal for <span className="text-accent">Prediction Markets</span>
        </h1>
        <p className="text-lg md:text-xl text-text-muted max-w-3xl mx-auto leading-relaxed">
          Access institutional-grade data intelligence. We ingest FEC data, Super PAC filings, and knowledge graphs to give you the ultimate edge in political betting.
        </p>
      </section>

      {/* 2. MARKETS LIST */}
      <section className="w-full max-w-6xl px-4 pb-20">
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <h2 className="text-3xl font-display font-bold text-white">Live Political Markets</h2>
          <div className="text-sm font-mono text-text-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow"></span>
            Syncing live from Polymarket
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(markets || []).map((market) => (
            <MarketCard key={market.slug} dbMarket={market} />
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="w-full bg-surface border-y border-white/5 py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-white text-center mb-16">How Alpha Engine Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center text-primary text-2xl font-bold mb-6">1</div>
              <h3 className="text-xl font-bold text-white mb-3">Live Ingestion</h3>
              <p className="text-text-muted">We continuously pull real-time odds from prediction markets and cross-reference them with live events.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-accent/10 border border-accent/30 rounded-full flex items-center justify-center text-accent text-2xl font-bold mb-6">2</div>
              <h3 className="text-xl font-bold text-white mb-3">Deep Data Mining</h3>
              <p className="text-text-muted">Our models analyze FEC filings, Super PAC burn rates, and K-Street lobbying disclosures to find the hidden money trails.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-success/10 border border-success/30 rounded-full flex items-center justify-center text-success text-2xl font-bold mb-6">3</div>
              <h3 className="text-xl font-bold text-white mb-3">The Alpha Edge</h3>
              <p className="text-text-muted">We expose true probabilities, uncovering arbitrage opportunities where the market consensus is demonstrably wrong.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEWSLETTER & TERMINAL CTAs */}
      <section className="w-full max-w-5xl px-4 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Free Newsletter CTA */}
          <div className="glass-panel p-8 md:p-10 text-center flex flex-col justify-between">
            <div>
              <div className="text-sm font-mono text-primary mb-2">FREE TIER</div>
              <h3 className="text-3xl font-display font-bold text-white mb-4">Weekly Market Pulse</h3>
              <p className="text-text-muted mb-8">
                Get a weekly digest of the biggest political prediction markets, major odds shifts, and free insights delivered straight to your inbox.
              </p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-2" action="https://formspree.io/f/placeholder" method="POST">
                <input type="email" placeholder="Your best email..." className="flex-1 bg-surface border border-white/10 rounded px-4 py-3 text-white focus:outline-none focus:border-primary" required />
                <button type="submit" className="btn-primary py-3 px-6">Subscribe Free</button>
              </form>
            </div>
          </div>

          {/* Premium Terminal CTA */}
          <div className="glass-panel p-8 md:p-10 border border-accent/30 bg-accent/5 text-center flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              100 SEATS ONLY
            </div>
            <div>
              <div className="text-sm font-mono text-accent mb-2">ALPHA TERMINAL</div>
              <h3 className="text-3xl font-display font-bold text-white mb-4">Full Data Intelligence</h3>
              <p className="text-text-muted mb-8">
                Unrestricted access to the Alpha Engine. Live FEC insights, real-time alerts, and proprietary true-odds modeling to preserve your betting edge.
              </p>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-6">$2,500<span className="text-lg text-text-muted font-normal"> / month</span></div>
              <button className="w-full btn-secondary bg-accent hover:bg-accent/90 text-white border-none py-3 text-lg font-bold">Apply for Access</button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
