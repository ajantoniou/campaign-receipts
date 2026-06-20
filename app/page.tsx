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
    <div className="w-full flex flex-col items-center gap-32 pb-32">
      
      {/* 1. HERO SECTION */}
      <section className="w-full max-w-5xl pt-32 px-6 text-center flex flex-col items-center gap-8">
        <h1 className="text-5xl md:text-7xl font-display font-[800] tracking-[-0.04em] text-primary leading-[1.05]">
          The Bloomberg Terminal <br /> for <span className="iridescent-text">Prediction Markets</span>
        </h1>
        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          We've built a massive knowledge graph of government data over the last decade. We ingest real-time FEC data, Super PAC filings, and K-Street lobbying records to give you the ultimate edge in political betting. Sell the narrative, buy the outcome.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Link href="/pricing" className="btn-primary">Apply for Access</Link>
          <Link href="#newsletter" className="btn-secondary">Free Weekly Pulse</Link>
        </div>
      </section>

      {/* 2. MARKETS LIST */}
      <section className="w-full max-w-[1200px] px-6 flex flex-col gap-8">
        <div className="flex justify-between items-baseline border-b border-white/10 pb-4">
          <h2 className="text-2xl font-display font-bold text-primary tracking-tight">Live Political Markets</h2>
          <div className="text-[11px] font-mono tracking-[0.1em] uppercase text-text-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow"></span>
            Syncing live from Polymarket, PredictIt, Kalshi
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(markets || []).map((market) => (
            <MarketCard key={market.slug} dbMarket={market} />
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="w-full max-w-[1200px] px-6">
        <div className="glass-panel p-12 md:p-16 flex flex-col gap-16 border-none bg-surface/50">
          <h2 className="text-2xl font-display font-bold text-primary tracking-tight text-center">How Alpha Engine Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-primary text-lg font-mono font-bold">1</div>
              <h3 className="text-xl font-display font-bold text-primary">Live Ingestion</h3>
              <p className="text-sm text-text-muted leading-relaxed">We continuously pull real-time odds from prediction markets and cross-reference them with live events.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-primary text-lg font-mono font-bold">2</div>
              <h3 className="text-xl font-display font-bold text-primary">Deep Data Mining</h3>
              <p className="text-sm text-text-muted leading-relaxed">Our models analyze FEC filings, Super PAC burn rates, and K-Street lobbying disclosures to find the hidden money trails.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-primary text-lg font-mono font-bold">3</div>
              <h3 className="text-xl font-display font-bold text-primary">The Alpha Edge</h3>
              <p className="text-sm text-text-muted leading-relaxed">We expose true probabilities, uncovering arbitrage opportunities where the market consensus is demonstrably wrong.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEWSLETTER & TERMINAL CTAs */}
      <section id="newsletter" className="w-full max-w-[1200px] px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Free Newsletter CTA */}
          <div className="glass-panel p-10 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <div className="text-[11px] font-mono tracking-[0.1em] text-text-muted uppercase">Free Tier</div>
              <h3 className="text-3xl font-display font-bold text-primary tracking-tight">Weekly Market Pulse</h3>
              <p className="text-text-muted leading-relaxed">
                Get a weekly digest of the biggest political prediction markets, major odds shifts, and free insights delivered straight to your inbox.
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3" action="https://formspree.io/f/placeholder" method="POST">
              <input type="email" placeholder="Your best email..." className="flex-1 bg-background border border-white/10 rounded-full px-6 py-3 text-primary text-sm focus:outline-none focus:border-white/30 transition-colors" required />
              <button type="submit" className="btn-secondary">Subscribe</button>
            </form>
          </div>

          {/* Premium Terminal CTA */}
          <div className="glass-panel p-10 border border-accent/20 bg-accent/5 flex flex-col justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-background text-[10px] font-mono font-bold px-4 py-1.5 tracking-wider rounded-bl-lg">
              100 SEATS ONLY
            </div>
            <div className="flex flex-col gap-4">
              <div className="text-[11px] font-mono tracking-[0.1em] text-accent uppercase">Alpha Terminal</div>
              <h3 className="text-3xl font-display font-bold text-primary tracking-tight">Full Data Intelligence</h3>
              <p className="text-text-muted leading-relaxed">
                Unrestricted access to the Alpha Engine. Live FEC insights, real-time alerts, and proprietary true-odds modeling to preserve your betting edge.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="text-4xl font-display font-bold text-primary">$2,500<span className="text-lg text-text-muted font-sans font-normal"> / month</span></div>
              <button className="w-full btn-primary bg-accent hover:bg-accent/90 border-none">Apply for Access</button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
