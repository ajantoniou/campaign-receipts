// @portfolio/fec — public exports
//
// NOTE: This is currently a spec-only package. The architecture and consumer
// integration are documented; implementation is the next FEC work item.
// See README.md and docs/ARCHITECTURE.md for the full design.

export { createFECClient } from './fec-client.js'
export { syncPoliticianFinance } from './sync.js'
export { classifyDonorProfile, rollUpByIndustry, computeInfluenceScore } from './classify.js'
export { generateDDL } from './schema.js'
export { getBillSponsorFinance } from './bill-sponsor.js'

export type {
  FECClient,
  FECClientOptions,
  Politician,
  CampaignFinanceRow,
  TopDonorRow,
  IndustryBreakdownRow,
  DonorProfile,
  SyncResult,
  BillSponsorFinance,
} from './schema.js'
