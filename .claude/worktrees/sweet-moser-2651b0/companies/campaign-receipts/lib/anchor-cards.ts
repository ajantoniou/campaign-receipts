// Hard-coded launch-anchor cards. Per viral-influencer panel: the
// Adelson $250M quote is CR's editorial founding document and pins
// permanent #1 on the Trending Receipts strip until something bigger
// lands. These objects are the single source of truth for the anchor
// — both /api/card/[type]/[slug] (PNG renderer) and /r/[id] (short
// URL page) read from here.

import type { CharacterCardData } from '@/app/components/CharacterCard'

export const ANCHOR_CARDS: Record<string, CharacterCardData> = {
  'adelson-250m': {
    id: 'adelson-250m',
    politicianSlug: 'donald-trump',
    candidateName: 'Donald J. Trump',
    office: 'R · 47th President · 2024 cycle',
    photoUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg/500px-Official_Presidential_Portrait_of_President_Donald_J._Trump_%282025%29_%28cropped%29%282%29.jpg',
    donorVoteScore: null,
    donorBillScore: null,
    topDonors: [
      // Trump's own number, said on the White House stage. Listed first
      // because it's the headline. The Preserve America PAC FEC figure
      // is in the "Why this matters" prose on the /r/[id] page.
      { name: 'Miriam Adelson (per Trump, on White House stage)', amount: 250_000_000 },
      { name: 'Preserve America PAC — verified FEC IE for Trump (2024)', amount: 112_300_000 },
    ],
    promisesKept: 36,
    promisesBroken: 48,
    quote: 'Miriam gave my campaign indirectly and directly $250 million.',
    quoteSpeaker: 'Donald J. Trump',
    quoteSource: 'White House Hanukkah reception · Dec 16, 2025',
    fecFilingId: 'C00878801',
    fecFilingUrl: 'https://www.fec.gov/data/committee/C00878801/',
    shortUrl: 'campaignreceipts.com/r/adelson-250m',
    weekLabel: null,
  },
}

export function getAnchorCard(id: string): CharacterCardData | null {
  return ANCHOR_CARDS[id] ?? null
}
