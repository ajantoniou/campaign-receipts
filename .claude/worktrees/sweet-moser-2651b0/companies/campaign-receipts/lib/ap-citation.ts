// AP-style citation builder for Receipt footers.
//
// Added 2026-05-21 per ChatGPT audit + 4-expert panel newsroom-buyer
// persona: "Give me a 'Copy as AP-style citation' button. Newsrooms
// have style guides; OpenSecrets nails this. That's the single
// artifact that converts a $200/mo subscription to legal-approved
// sourcing."
//
// Two variants today; add more as new Receipt surfaces appear:
//   - forPolitician(politician)        — politician dossier scorecard
//   - forWeeklyReceipt(row)            — /receipt/[week] permalinks
//
// All builders take an optional asOfDate (default: today) so unit
// tests + future server-rendered Receipt PDFs can pin the retrieval
// date. The retrieval date is what makes a citation legally usable —
// it's the "we pulled this from the source on YYYY-MM-DD" anchor.

const PUBLISHER = 'Campaign Receipts'

function fmtIsoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10)
}

/** Citation for a politician dossier — covers donors + scorecard. */
export function forPolitician(
  politician: { name: string; slug: string },
  asOfDate: Date = new Date(),
): string {
  return `${PUBLISHER}, scorecard for ${politician.name} — sourced from FEC bulk filings (cycle 2024) and Congress.gov roll-call records, retrieved ${fmtIsoDate(asOfDate)}. campaignreceipts.com/politician/${politician.slug}`
}

/** Citation for a weekly Receipt permalink. */
export function forWeeklyReceipt(
  row: {
    iso_year: number
    iso_week: number
    headline: string
    politicianName?: string
  },
  asOfDate: Date = new Date(),
): string {
  const week = `Week ${row.iso_year}-W${String(row.iso_week).padStart(2, '0')}`
  const subject = row.politicianName ? ` on ${row.politicianName}` : ''
  return `${PUBLISHER}, "${row.headline}"${subject} (${week}) — sourced from FEC bulk filings and Congress.gov primary records, retrieved ${fmtIsoDate(asOfDate)}. campaignreceipts.com/receipt/${row.iso_year}-W${String(row.iso_week).padStart(2, '0')}`
}

/** Citation for a race page. */
export function forRace(
  race: { slug: string; headline: string },
  asOfDate: Date = new Date(),
): string {
  return `${PUBLISHER}, "${race.headline}" — sourced from FEC independent-expenditure filings, retrieved ${fmtIsoDate(asOfDate)}. campaignreceipts.com/race/${race.slug}`
}
