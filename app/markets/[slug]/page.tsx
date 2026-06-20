import { Metadata } from 'next';
import { supabaseRead } from '../../../lib/supabase';
import { MarketClientPage } from './MarketClientPage';

export const dynamicParams = true; 
export const revalidate = 60; // Revalidate every minute

export async function generateStaticParams() {
  const { data } = await supabaseRead.from('cr_prediction_markets').select('slug').limit(200);
  return (data || []).map(market => ({
    slug: market.slug
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data: market } = await supabaseRead
    .from('cr_prediction_markets')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!market) return { title: 'Market Not Found' };

  return {
    title: `${market.question} | Campaign Receipts Prediction Markets`,
    description: `Trade on ${market.question}. Volume: $${market.volume_usd?.toLocaleString()}. Access live FEC donor intelligence to gain an edge.`,
    openGraph: {
      title: `${market.question} - Campaign Receipts`,
      description: `Volume: $${market.volume_usd?.toLocaleString()}. Live prediction market data and Alpha edge insights.`,
    }
  };
}

export default async function MarketPage({ params }: { params: { slug: string } }) {
  const { data: market } = await supabaseRead
    .from('cr_prediction_markets')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!market) {
    return <div className="text-center py-20 text-white">Market not found.</div>;
  }

  return (
    <MarketClientPage dbMarket={market} />
  );
}
