// Single source of truth for SEALED book references across the site.

export const BOOK = {
  /** Canonical book site (per sealed2016.com canonical tag). */
  url: 'https://sealed2016.com',

  /** Publisher imprint site. */
  publisherUrl: 'https://sealed-press.onrender.com',

  /** Format-specific deep links. */
  buyPdfUrl: 'https://sealed2016.com',

  /** Pricing — sourced from the live sealed2016.com listing. */
  pdfPrice: '$15',
  pdfPriceCents: 1500,

  /** Page count from sealed2016.com FAQ. */
  pages: 116,

  /** Total promises in the book. */
  totalPromises: 145,

  /** SEALED book #1 — canonical 2016 cycle scorecard.
   * Source: published retail PDF (artifacts/SEALED-v1-retail.pdf, 2026-05-11):
   *   "Of 145 campaign promises we tracked, 36 were fully kept, 42 were
   *    partially kept, 48 were broken, and 19 are genuinely ambiguous
   *    (we labeled those 'YOU DECIDE')."
   * Promises were made during the 2016 campaign and graded across Trump's
   * 2017-2021 term. The book uses a 5th visual badge (BLOCKED) inside
   * chapters, but the headline tally is 4-bucket. Per editorial standard,
   * 'blocked by Congress' rolls into PARTIAL; 'blocked by courts' is
   * case-by-case in the reasoning text.
   * Once cr_promises is populated with cycle_year=2016 entries, the Trump
   * page will read these numbers from the DB instead of this constant. */
  cycle2016: {
    kept: 36,
    partial: 42,
    broken: 48,
    youDecide: 19,
    total: 145,
    percentageKept: 24.8, // 36 / 145, rounded to one decimal
  },

  /** Cover image URLs (hot-linked from sealed2016.com — see next.config remotePatterns). */
  covers: {
    cover2016: 'https://sealed2016.com/cover-2016.jpg',
    cover2020: 'https://sealed2016.com/cover-2020.jpg',
    cover2024: 'https://sealed2016.com/cover-2024.jpg',
    cover2026: 'https://sealed2016.com/cover-2026.jpg',
  },
} as const
