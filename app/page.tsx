import { supabaseRead } from '../lib/supabase';
import { MarketCard } from '@/components/MarketCard';
import { SimulatedLandingPageCard } from '@/components/SimulatedLandingPageCard';
import Link from 'next/link';

// The new flow:
// HERO-->Super well organized Political prediction markets list-->How it Works-->Newsleter Signup -->Footer. done.

export const revalidate = 60; // Revalidate every 60 seconds

export default async function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const filter = searchParams.filter as string || 'volume';

  const { data: allMarkets } = await supabaseRead
    .from('cr_prediction_markets')
    .select('*');

  let markets = allMarkets || [];

  // Post-process
  markets = markets.map(m => {
    let implied = 50;
    if (m.outcomes && m.outcomes.length > 0) {
      implied = m.outcomes[0].price * (m.outcomes[0].price <= 1 ? 100 : 1);
    }
    return { ...m, _implied: implied };
  });

  const now = new Date();

  if (filter === 'expiring-3m') {
    const limit = new Date(); limit.setMonth(now.getMonth() + 3);
    markets = markets.filter(m => m.end_date && new Date(m.end_date) <= limit && new Date(m.end_date) >= now);
    markets.sort((a, b) => new Date(a.end_date as string).getTime() - new Date(b.end_date as string).getTime());
  } else if (filter === 'expiring-6m') {
    const limit = new Date(); limit.setMonth(now.getMonth() + 6);
    markets = markets.filter(m => m.end_date && new Date(m.end_date) <= limit && new Date(m.end_date) >= now);
    markets.sort((a, b) => new Date(a.end_date as string).getTime() - new Date(b.end_date as string).getTime());
  } else if (filter === 'expiring-2y') {
    const limit = new Date(); limit.setFullYear(now.getFullYear() + 2);
    markets = markets.filter(m => m.end_date && new Date(m.end_date) <= limit && new Date(m.end_date) >= now);
    markets.sort((a, b) => new Date(a.end_date as string).getTime() - new Date(b.end_date as string).getTime());
  } else if (filter === 'implied-asc') {
    markets.sort((a, b) => a._implied - b._implied);
  } else if (filter === 'implied-desc') {
    markets.sort((a, b) => b._implied - a._implied);
  } else {
    markets.sort((a, b) => (b.volume_usd || 0) - (a.volume_usd || 0));
  }

  markets = markets.slice(0, 50);

  const pills = [
    { id: 'volume', label: '🔥 Largest Volume' },
    { id: 'expiring-3m', label: '⏳ < 3 Months' },
    { id: 'expiring-6m', label: '⏳ < 6 Months' },
    { id: 'expiring-2y', label: '⏳ < 2 Years' },
    { id: 'implied-asc', label: '📉 Lowest Implied Odds' },
    { id: 'implied-desc', label: '📈 Highest Implied Odds' },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-32 pb-32 overflow-hidden">
      
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
      <section className="w-full max-w-[1200px] px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4">
          <div className="flex justify-between items-baseline">
            <h2 className="text-2xl font-display font-bold text-primary tracking-tight">Live Political Markets</h2>
            <div className="text-[11px] font-mono tracking-[0.1em] uppercase text-text-muted flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-glow"></span>
              Syncing live from Polymarket, PredictIt, Kalshi
            </div>
          </div>
          
          {/* Toggles / Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
            {pills.map(p => (
              <Link 
                key={p.id} 
                href={`/?filter=${p.id}`}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold font-mono transition-colors border ${
                  filter === p.id 
                    ? 'bg-primary text-background border-primary' 
                    : 'bg-white/5 text-text-muted border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Carousel on Mobile / Grid on Desktop */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 pb-6 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide">
          {markets.map((market) => (
            <div key={market.slug} className="min-w-[85vw] sm:min-w-[400px] md:min-w-0 snap-center">
              <MarketCard dbMarket={market} />
            </div>
          ))}
          {markets.length === 0 && (
            <div className="col-span-full py-12 text-center text-text-muted font-mono">
              No active markets match this filter.
            </div>
          )}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="w-full max-w-[1200px] px-6">
        <div className="glass-panel p-12 md:p-16 flex flex-col gap-16 border-none bg-surface/50">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary tracking-tight text-center">How Alpha Engine Works</h2>
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
          
          <div className="flex flex-col gap-8 pt-12 border-t border-white/5 mt-4">
            <div className="text-center">
              <h3 className="text-xl font-display font-bold text-primary mb-2">Simulated Live Arbitrage Scenarios</h3>
              <p className="text-sm text-text-muted">Here is what the $49/mo Paywalled Intel Box reveals when our engine finds an inefficiency.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SimulatedLandingPageCard market={{
                source: "PREDICTIT",
                question: "Will Tulsi Gabbard leave office in 2026?",
                implied: 5,
                alpha: 90
              }} />
              <SimulatedLandingPageCard market={{
                source: "PREDICTIT",
                question: "Who will place first in round one of the 2026 Colombian presidential election?",
                implied: 99,
                alpha: 5
              }} />
              <SimulatedLandingPageCard market={{
                source: "POLYMARKET",
                question: "Which party will win the Senate in 2026?",
                implied: 43,
                alpha: 58.5
              }} />
              <SimulatedLandingPageCard market={{
                source: "POLYMARKET",
                question: "Will any presidential candidate win outright in the first round of the Brazil election?",
                implied: 20,
                alpha: 38
              }} />
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
