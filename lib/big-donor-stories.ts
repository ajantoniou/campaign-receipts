// Curated big-donor narratives for /big-donor-map.
//
// Mirrors the hand-curated pattern of lib/anchor-cards.ts: this array is
// the single source of truth for the donor→race→outcome map page. Every
// dollar figure here is sourced from material ALREADY in this repo —
// lib/anchor-cards.ts (the Adelson founding quote) and the TX Senate
// 2026 super-PAC storyboard at
// content/scripts/cr-tx-senate-2026-superpacs-v8-doc.md (HARD FACTS LOCK).
//
// RULE (founder + CLAUDE.md "verify before quoting"): no dollar amount
// appears here unless it can be pointed to a line in one of those two
// files. Do NOT add a donor or a number you cannot source — omit it.
//
// Caricature availability (public/brand/caricatures/): john-nau,
// reid-hoffman, john-cornyn, ken-paxton, jasmine-crockett,
// james-talarico, wesley-hunt, colin-allred, ed-gallrein, jeff-yass,
// stephen-schwarzman. There is NO Adelson/Trump caricature in the repo,
// so those image fields are left undefined and the card renders a
// monogram fallback. Never reference a file that does not exist.

export type RaceOutcome = 'won' | 'lost' | 'in-race'

export type RaceFunded = {
  /** Slug for the funded politician's caricature (public/brand/caricatures/<slug>.png), if one exists. */
  politicianSlug?: string
  politicianName: string
  outcome: RaceOutcome
  /** One plain line: what the money did, and what happened. Sourced. */
  note: string
}

export type BigDonorStory = {
  /** Slug for the donor's caricature, if one exists in the repo. */
  donorSlug?: string
  donorName: string
  /** Short descriptor — who they are. */
  donorRole: string
  /** Display amount string (caller controls formatting). */
  amount: string
  cycle: string
  racesFunded: RaceFunded[]
  /** FEC committee id or filing reference. */
  fecRef: string
  /** Where on the site a reader can dig further. */
  href: string
  /** Source note shown on the card — which repo artifact backs the figures. */
  sourceNote: string
}

export const BIG_DONOR_STORIES: BigDonorStory[] = [
  {
    // Sourced from lib/anchor-cards.ts 'adelson-250m': Trump's own
    // White House quote ($250M) + the verified Preserve America PAC FEC
    // independent-expenditure figure ($112.3M) for Trump 2024.
    donorName: 'Miriam Adelson',
    donorRole: 'GOP megadonor · Las Vegas Sands',
    amount: '$250M',
    cycle: '2024',
    racesFunded: [
      {
        politicianName: 'Donald J. Trump',
        outcome: 'won',
        note:
          'Trump said on the White House stage that Miriam Adelson gave his campaign "indirectly and directly $250 million." Her Preserve America PAC posted a verified $112.3M FEC independent expenditure for Trump in 2024. He won the presidency.',
      },
    ],
    fecRef: 'FEC C00878801 — Preserve America PAC',
    href: '/leaderboard',
    sourceNote:
      'Quote: White House Hanukkah reception, Dec 16, 2025. FEC: committee C00878801. (lib/anchor-cards.ts)',
  },
  {
    // Sourced from cr-tx-senate-2026-superpacs-v8-doc.md HARD FACTS LOCK.
    donorSlug: 'john-nau',
    donorName: 'John Nau',
    donorRole: "Houston billionaire · Cornyn's former finance chair",
    amount: '$7.9M',
    cycle: '2026',
    racesFunded: [
      {
        politicianSlug: 'ken-paxton',
        politicianName: 'Ken Paxton',
        outcome: 'won',
        note:
          'Nau\'s $7.9M went to the pro-Cornyn super PAC "Texans for a Conservative Majority," which spent $39.3M AGAINST Paxton. Paxton won the primary anyway with about 64%.',
      },
      {
        politicianSlug: 'wesley-hunt',
        politicianName: 'Wesley Hunt',
        outcome: 'lost',
        note:
          'The same pro-Cornyn PAC spent $10.3M against Wesley Hunt and $10.6M for Cornyn in the TX Senate race.',
      },
    ],
    fecRef: 'FEC C00542217 — Texans for a Conservative Majority',
    href: '/leaderboard',
    sourceNote:
      'TX Senate 2026 super-PAC HARD FACTS LOCK (content/scripts/cr-tx-senate-2026-superpacs-v8-doc.md). FEC C00542217.',
  },
  {
    donorSlug: 'reid-hoffman',
    donorName: 'Reid Hoffman',
    donorRole: 'California tech billionaire · co-founded LinkedIn',
    amount: '$1.5M',
    cycle: '2026',
    racesFunded: [
      {
        politicianSlug: 'james-talarico',
        politicianName: 'James Talarico',
        outcome: 'won',
        note:
          'Hoffman\'s $1.5M went to the pro-Talarico super PAC "Lone Star Rising," which spent $7.96M for Talarico. Talarico won — and campaigns to ban super PACs.',
      },
      {
        politicianSlug: 'jasmine-crockett',
        politicianName: 'Jasmine Crockett',
        outcome: 'lost',
        note:
          'The same "Lone Star Rising" PAC spent $8.95M AGAINST Jasmine Crockett, the more progressive rival in the Democratic primary.',
      },
    ],
    fecRef: 'FEC C00918268 — Lone Star Rising',
    href: '/leaderboard',
    sourceNote:
      'TX Senate 2026 super-PAC HARD FACTS LOCK (content/scripts/cr-tx-senate-2026-superpacs-v8-doc.md). FEC C00918268.',
  },
]
