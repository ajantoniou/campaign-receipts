import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import { MarketClientPage } from './MarketClientPage';

export const dynamicParams = false; // Ensures only the generated markets are valid

// Read market data
function getMarket(slug: string) {
  const filePath = path.join(process.cwd(), 'data', 'markets', `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export async function generateStaticParams() {
  const dataDir = path.join(process.cwd(), 'data', 'markets');
  if (!fs.existsSync(dataDir)) return [];
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  return files.map(file => ({
    slug: file.replace('.json', '')
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const market = getMarket(params.slug);
  if (!market) return { title: 'Market Not Found' };

  return {
    title: `${market.title} | AlphaPredict Prediction Markets`,
    description: `Trade on ${market.title}. Current implied probability: ${(market.impliedProbability * 100).toFixed(0)}%. Access live FEC donor intelligence to gain an edge.`,
    openGraph: {
      title: `${market.title} - AlphaPredict`,
      description: `Current implied probability: ${(market.impliedProbability * 100).toFixed(0)}%. Volume: $${market.volume.toLocaleString()}`,
    }
  };
}

export default function MarketPage({ params }: { params: { slug: string } }) {
  const market = getMarket(params.slug);

  if (!market) {
    return <div className="text-center py-20 text-white">Market not found.</div>;
  }

  return (
    <MarketClientPage market={market} />
  );
}
