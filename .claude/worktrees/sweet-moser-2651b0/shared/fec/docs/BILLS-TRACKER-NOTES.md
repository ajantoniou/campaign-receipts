# BillsTracker — Forward Notes

What the future BillsTracker project will look like, and how it uses `@portfolio/fec`.

This is not a buildable spec yet — it's a forward-pointing doc so the FEC library is shaped correctly to serve it.

---

## The Product

**Working name:** *BillsTracker* (or *BillReceipts.com* — to match the brand family)

**Tagline:** *Every bill. Every sponsor. Every donor.*

**What it does:** A free directory of every active federal and state bill, where each bill page shows:
1. The bill's text and current status
2. Sponsors and co-sponsors
3. **For each sponsor: their donor profile + top industry contributors** ← powered by `@portfolio/fec`
4. The bill's likely industry beneficiaries (from a separate classifier)
5. Vote history once votes occur

**The pitch:** Most people see "Senator X sponsored bill Y" and have no context. BillsTracker says: "Senator X sponsored bill Y, which would benefit the oil & gas industry. Senator X's top donor industry, with 38% of their last-cycle contributions, was oil & gas."

That correlation isn't a verdict — it's a fact that lets readers draw their own conclusions, same as CampaignReceipts.

---

## How It Uses `@portfolio/fec`

### Schema
```typescript
import { generateDDL } from '@portfolio/fec'

const sql = generateDDL({
  tablePrefix: 'bt_',
  fkPoliticianTable: 'bt_legislators',
})
```

Plus BillsTracker-specific tables (NOT in the library):
- `bt_bills` — bill metadata, text, status
- `bt_legislators` — federal + state legislators (BillsTracker may cover state legislators that CampaignReceipts doesn't yet)
- `bt_bill_sponsors` — many-to-many bills ↔ legislators with role (sponsor / co-sponsor)
- `bt_bill_industry_beneficiaries` — derived industry tagging per bill (separate classifier, not FEC-related)
- `bt_bill_sponsor_finance` — snapshot of sponsor's donor profile at bill-creation time

### Per-bill render flow
```typescript
import { getBillSponsorFinance } from '@portfolio/fec'

async function renderBillPage(billId: string) {
  const bill = await getBill(billId)
  const sponsors = await getBillSponsors(billId)

  const finance = await getBillSponsorFinance(fecClient, {
    billId,
    sponsors,
  })

  return (
    <BillPage
      bill={bill}
      sponsors={sponsors}
      sponsorFinance={finance}
      industryBeneficiaries={bill.industry_beneficiaries}
    />
  )
}
```

### UI moment
On each bill page, below the bill summary:

```
SPONSORED BY                                   FUNDED BY (LAST CYCLE)

┌─────────────────────┐                       ┌─────────────────────┐
│ Sen. Joe Manchin    │ (D-WV)                │ Oil & Gas    $1.2M  │
│ Sponsor             │                       │ Coal Mining  $640K  │
│                     │                       │ Lobbyists    $410K  │
└─────────────────────┘                       └─────────────────────┘

THIS BILL WOULD BENEFIT:
  Oil & Gas industry (high impact)
  Mining industry (high impact)
  Coal-fired utilities (moderate impact)

⚠ Donor-industry overlap with bill beneficiaries: HIGH
```

The "donor-industry overlap" indicator is the killer feature. It uses `computeInfluenceScore()` from `@portfolio/fec/classify` cross-referenced with the bill's industry-beneficiary tagging.

---

## What BillsTracker Inherits "Free" From `@portfolio/fec`

When the library is built for CampaignReceipts, BillsTracker gets:
1. **Name disambiguation** — handles "Senator Smith" matching the right FEC record
2. **Industry classification** — same OpenSecrets methodology
3. **Donor profile rules** — same grassroots/corporate/self-funded/mixed thresholds
4. **Rate limit management** — shared 1000/hr budget
5. **Caching strategy** — file-based or pluggable
6. **State-adapter pattern** — once a state adapter is built for CampaignReceipts, it's available to BillsTracker

The marginal effort for BillsTracker is just: `bt_bills` table, bill ingestion from Congress.gov, industry-beneficiary classifier, UI. The hard FEC plumbing is reused.

---

## What BillsTracker Will Need That `@portfolio/fec` Won't Provide

These are NOT in the FEC library and BillsTracker must build separately:

1. **Bill text ingestion** — from Congress.gov bulk-data XML for federal, varied state APIs for state
2. **Bill industry-beneficiary classifier** — LLM-based or rule-based, separate from donor classification
3. **Bill status tracking** — introduced / in-committee / passed-chamber / signed / vetoed
4. **Vote-record cross-reference** — when votes happen, attach them to sponsor records
5. **Search and filter UI** — by industry, status, sponsor, state, etc.

---

## When to Build BillsTracker

Trigger conditions:
- ✅ CampaignReceipts has 200+ politicians and substantive traffic (proves the brand framework works)
- ✅ FEC library is implemented and stable in CampaignReceipts (proves the data pipeline)
- ✅ SEALED book sales are sustaining or showing trajectory (proves monetization framework)
- ⏳ At least 1 person in addition to the founder is committed to the project (BillsTracker is genuinely bigger than CampaignReceipts in scope)

Not before. The discipline is: ship CampaignReceipts to 200+ politicians, prove the brand framework, then expand to bills.

---

## Naming Decision

Three brand options for the bills product:
1. **BillsTracker.com** — generic, descriptive, available?
2. **BillReceipts.com** — fits the brand family (CampaignReceipts / BillReceipts)
3. **Sponsored.com** or **WhoSponsored.com** — focuses on the "who's behind this bill" question

My recommendation: **BillReceipts.com** to extend the brand family. The "receipts" framing is the moat — it's the meta-brand across all the products in this space you're building. Future products could include `VoteReceipts.com` (per-vote donor analysis), `LobbyReceipts.com` (lobbying disclosure tracking), etc.

When you're ready to build, the first step is checking if `BillReceipts.com` is available via Cloudflare Registrar (same pattern as CampaignReceipts).
