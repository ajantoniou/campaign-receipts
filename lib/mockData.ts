export type MarketStatus = 'OPEN' | 'CLOSED' | 'RESOLVED';

export interface PredictionMarket {
  id: string;
  title: string;
  category: 'FEDERAL' | 'STATE' | 'POLICY' | 'DONOR_INTEL';
  impliedProbability: number; // 0 to 1
  volume: number; // USD amount
  expirationDate: string; // ISO date string
  status: MarketStatus;
  fecEdgeAvailable: boolean;
  options: { name: string; price: number }[];
}

export const mockMarkets: PredictionMarket[] = [
  {
    id: 'mkt_1',
    title: 'Will Senator X win re-election in 2026?',
    category: 'FEDERAL',
    impliedProbability: 0.62,
    volume: 1250000,
    expirationDate: '2026-11-03T23:59:59Z',
    status: 'OPEN',
    fecEdgeAvailable: true,
    options: [
      { name: 'Yes', price: 0.62 },
      { name: 'No', price: 0.38 },
    ],
  },
  {
    id: 'mkt_2',
    title: 'Super PAC "Liberty First" spends >$5M before Q3?',
    category: 'DONOR_INTEL',
    impliedProbability: 0.85,
    volume: 340000,
    expirationDate: '2026-09-30T23:59:59Z',
    status: 'OPEN',
    fecEdgeAvailable: true,
    options: [
      { name: 'Yes', price: 0.85 },
      { name: 'No', price: 0.15 },
    ],
  },
  {
    id: 'mkt_3',
    title: 'Will the Tech Anti-Trust Bill pass the House?',
    category: 'POLICY',
    impliedProbability: 0.31,
    volume: 890000,
    expirationDate: '2026-08-15T23:59:59Z',
    status: 'OPEN',
    fecEdgeAvailable: false,
    options: [
      { name: 'Yes', price: 0.31 },
      { name: 'No', price: 0.69 },
    ],
  },
  {
    id: 'mkt_4',
    title: '0DTE: Will Candidate Y announce campaign today?',
    category: 'FEDERAL',
    impliedProbability: 0.12,
    volume: 56000,
    expirationDate: '2026-06-19T23:59:59Z',
    status: 'OPEN',
    fecEdgeAvailable: false,
    options: [
      { name: 'Yes', price: 0.12 },
      { name: 'No', price: 0.88 },
    ],
  },
  {
    id: 'mkt_5',
    title: 'Who will be the top donor in the NY-14 primary?',
    category: 'DONOR_INTEL',
    impliedProbability: 0.45,
    volume: 210000,
    expirationDate: '2026-06-25T23:59:59Z',
    status: 'CLOSED', // Invite only / premium market
    fecEdgeAvailable: true,
    options: [
      { name: 'Tech PAC', price: 0.45 },
      { name: 'Labor Union', price: 0.30 },
      { name: 'Other', price: 0.25 },
    ],
  },
];
