import Link from 'next/link';

export const metadata = {
  title: 'Alpha Terminal Pricing',
  description: 'Unlock institutional-grade political prediction market data and donor intelligence.',
};

export default function PricingPage() {
  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-6">
          Pricing that preserves your <span className="text-success">Edge.</span>
        </h1>
        <p className="text-lg text-text-muted mb-16 max-w-2xl mx-auto leading-relaxed">
          Prediction markets are zero-sum. To prevent alpha decay, we strictly limit access to our proprietary donor intelligence models.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
          
          {/* Market-by-Market Tier */}
          <div className="glass-panel p-8 flex flex-col">
            <div className="text-xs font-mono text-primary mb-2">RETAIL TRADERS</div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Pay-Per-Market</h2>
            <div className="text-3xl font-mono text-white mb-6">
              $49 <span className="text-sm text-text-muted">/ one-time</span>
            </div>
            <p className="text-sm text-text-muted mb-8 flex-1">
              Perfect for targeted bets. Unlock the donor intelligence model for a single specific market until it resolves.
            </p>
            <ul className="space-y-4 mb-8 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                Real-time FEC alerts for that specific market
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                Super PAC spending overlays
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-0.5">✓</span>
                Expires when market resolves
              </li>
            </ul>
            <Link href="/" className="btn-secondary w-full text-center">
              Browse Markets
            </Link>
          </div>

          {/* Institutional Tier */}
          <div className="glass-panel p-8 flex flex-col relative overflow-hidden border-success/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
            <div className="absolute top-4 right-4 bg-success/10 text-success text-xs font-mono px-2 py-1 rounded border border-success/20">
              ONLY 50 SEATS
            </div>
            
            <div className="text-xs font-mono text-success mb-2">INSTITUTIONAL</div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Alpha Terminal</h2>
            <div className="text-3xl font-mono text-white mb-6">
              $2,500 <span className="text-sm text-text-muted">/ month</span>
            </div>
            <p className="text-sm text-text-muted mb-8 flex-1">
              Unrestricted API access and real-time scanning across all 1,000+ active political prediction markets.
            </p>
            <ul className="space-y-4 mb-8 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5">✓</span>
                Access all markets simultaneously
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5">✓</span>
                Sub-millisecond API Execution endpoints
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5">✓</span>
                WebSockets for live FEC anomalies
              </li>
              <li className="flex items-start gap-3">
                <span className="text-success mt-0.5">✓</span>
                Direct Slack channel with our Quants
              </li>
            </ul>
            <button className="btn-primary w-full text-center group relative overflow-hidden">
              <span className="relative z-10">Apply for Access</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
