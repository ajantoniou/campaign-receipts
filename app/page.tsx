import { supabaseRead } from '../lib/supabase';
import Link from 'next/link';
import ClientPageGSAPWrapper from '@/components/ClientPageGSAPWrapper';
import CheckoutButton from '@/app/components/CheckoutButton';

// Campaign Receipts homepage — showcase DONOR INFLUENCE.
// Flow: HERO --> What we track --> Explore (links to the real donor pages)
//       --> Newsletter --> Footer.

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  // Light, defensive headline stats from the donor-influence core. Each is wrapped
  // so a missing table never breaks the homepage.
  let politicianCount = 0;
  let raceCount = 0;
  try {
    const { count: pc } = await supabaseRead
      .from('cr_politicians')
      .select('*', { count: 'exact', head: true });
    politicianCount = pc || 0;
    const { count: rc } = await supabaseRead
      .from('cr_races')
      .select('*', { count: 'exact', head: true });
    raceCount = rc || 0;
  } catch {
    // stats are decorative; ignore failures
  }

  const explore = [
    { href: '/leaderboard', emoji: '🏆', title: 'Donor Leaderboard', desc: 'Who funds whom — the biggest PACs and company money flowing to the politicians we track.' },
    { href: '/big-donor-map', emoji: '🗺️', title: 'Big Donor Map', desc: 'Follow the money from donor to race to outcome, mapped end-to-end.' },
    { href: '/foreign-donors', emoji: '🌐', title: 'Foreign Donor Records', desc: 'Where foreign-linked money shows up in U.S. political finance.' },
    { href: '/bills', emoji: '📜', title: 'Bill Money Trails', desc: 'Which industries funded the sponsors behind the bills that matter.' },
    { href: '/race', emoji: '🗳️', title: 'Races', desc: 'Campaign-finance breakdowns for individual races and candidates.' },
    { href: '/investigate', emoji: '🔍', title: 'Investigate', desc: 'Search politicians, donors, and committees across the full dataset.' },
  ];

  return (
    <ClientPageGSAPWrapper>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-accent/20 rounded-full blur-[120px] pointer-events-none -z-10 mix-blend-screen opacity-30" />

      {/* 1. HERO */}
      <section className="reveal w-full max-w-5xl pt-32 px-6 text-center flex flex-col items-center gap-8">
        <h1 className="text-5xl md:text-7xl font-display font-[800] tracking-[-0.04em] text-primary leading-[1.05]">
          Follow the money behind <span className="font-serif italic font-normal text-white">every vote.</span>
        </h1>
        <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          For <span className="text-white font-medium">less than $2.50 a week</span>, follow the web of connections that tie
          donations to political influence — across the bills they sponsor, the votes they cast, and the elections they win.
          Sourced to public FEC filings and official roll-call records.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <CheckoutButton className="btn-primary">Sign up today</CheckoutButton>
          <Link href="/leaderboard" className="btn-secondary">Explore the free data</Link>
        </div>
        {(politicianCount > 0 || raceCount > 0) && (
          <div className="flex gap-8 mt-6 font-mono text-xs tracking-[0.1em] uppercase text-text-muted">
            {politicianCount > 0 && <span><span className="text-primary font-bold">{politicianCount.toLocaleString()}</span> politicians tracked</span>}
            {raceCount > 0 && <span><span className="text-primary font-bold">{raceCount.toLocaleString()}</span> races mapped</span>}
            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-success animate-pulse-glow"></span> FEC data: live</span>
          </div>
        )}
      </section>

      {/* 2. EXPLORE THE DONOR-INFLUENCE DATA */}
      <section className="reveal w-full max-w-[1200px] px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2 border-b border-white/10 pb-4">
          <h2 className="text-2xl font-display font-bold text-primary tracking-tight">Explore the money trail</h2>
          <p className="text-sm text-text-muted">Every figure below is sourced from public FEC filings and roll-call records.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {explore.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="glass-panel p-8 flex flex-col gap-3 border border-white/5 hover:border-white/20 transition-colors group"
            >
              <div className="text-3xl">{c.emoji}</div>
              <h3 className="text-xl font-display font-bold text-primary group-hover:text-white transition-colors">{c.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="reveal w-full max-w-[1200px] px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10 opacity-50" />
        <div className="glass-panel p-12 md:p-16 flex flex-col gap-16 border-none bg-surface/50">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary tracking-tight text-center">How Campaign Receipts works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-primary text-lg font-mono font-bold">1</div>
              <h3 className="text-xl font-display font-bold text-primary">Ingest the filings</h3>
              <p className="text-sm text-text-muted leading-relaxed">We continuously pull FEC receipts, independent expenditures, and PAC contributions from the public record.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-primary text-lg font-mono font-bold">2</div>
              <h3 className="text-xl font-display font-bold text-primary">Trace the money</h3>
              <p className="text-sm text-text-muted leading-relaxed">We connect donors and industries to the politicians, races, and bills they fund — building the money trail.</p>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-primary text-lg font-mono font-bold">3</div>
              <h3 className="text-xl font-display font-bold text-primary">Show the influence</h3>
              <p className="text-sm text-text-muted leading-relaxed">We surface how donor money lines up with roll-call votes, so you can judge the influence for yourself.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEWSLETTER */}
      <section id="newsletter" className="reveal w-full max-w-[1200px] px-6">
        <div className="glass-panel p-10 md:p-12 flex flex-col gap-8 max-w-2xl mx-auto text-center items-center">
          <div className="flex flex-col gap-4">
            <div className="text-[11px] font-mono tracking-[0.1em] text-text-muted uppercase">Friday Receipts · $9/month</div>
            <h3 className="text-3xl font-display font-bold text-primary tracking-tight">The weekly money-trail briefing</h3>
            <p className="text-text-muted leading-relaxed">
              Every Friday: the week&apos;s most revealing money trails — who voted for which industry&apos;s bill,
              and which donors funded them — plus a 5-minute audio briefing. We read the bills so you don&apos;t have to.
            </p>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-text-muted text-left max-w-md w-full">
            <li className="flex items-center gap-2"><span className="text-success">✓</span> The vote-and-money exposés, before anyone else covers them</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> Listen or read — 5-min audio briefing included</li>
            <li className="flex items-center gap-2"><span className="text-success">✓</span> Every figure sourced to public FEC filings &amp; roll-call records</li>
          </ul>
          <CheckoutButton className="btn-primary text-base px-8 py-3">Sign up today</CheckoutButton>
          <p className="text-xs text-text-muted">The donor data is always free. <Link href="/leaderboard" className="underline hover:text-primary">Explore it →</Link></p>
        </div>
      </section>
    </ClientPageGSAPWrapper>
  );
}
