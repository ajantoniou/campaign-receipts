// @portfolio/fec — types + DDL generator
//
// STATUS: spec stub. Types are the canonical contract between this library
// and its consumers (CampaignReceipts, BillsTracker, future projects).

export type DonorProfile =
  | 'grassroots'    // individual_pct >= 70% AND large_donor_pct <= 50%
  | 'mixed'         // anything else
  | 'corporate'     // pac_pct >= 30% OR top-3 industries are corporate sectors
  | 'self-funded'   // self_funded_pct >= 25%
  | 'unknown'       // no FEC data (state-level or pre-2002)

export type FECOffice = 'senator' | 'representative' | 'president'

export interface FECClientOptions {
  apiKey: string
  cacheDir?: string
  ratePerHour?: number
  openSecretsApiKey?: string
}

export interface FECClient {
  lookupCandidate(name: string, state: string, office: FECOffice): Promise<string | null>
  getCandidateTotals(candidateId: string, cycle: string): Promise<CandidateTotals>
  getTopDonors(candidateId: string, cycle: string, limit?: number): Promise<RawDonor[]>
  getContributionsBySize(candidateId: string, cycle: string): Promise<ContributionsBySize>
  getCandidateCommittees(candidateId: string): Promise<Committee[]>
  // ...etc
}

export interface CandidateTotals {
  total_raised: number
  total_spent: number
  cash_on_hand: number
  individual_pct: number
  pac_pct: number
  self_funded_pct: number
  in_state_pct: number
  large_donor_pct: number
}

export interface RawDonor {
  name: string
  employer: string | null
  occupation: string | null
  total_contributed: number
  is_pac: boolean
  is_individual: boolean
  industry_code: string | null
}

export interface ContributionsBySize {
  under_200: number
  '200_to_1000': number
  '1000_to_2900': number  // current individual contribution limit
  over_2900: number
}

export interface Committee {
  id: string
  name: string
  type: 'principal' | 'leadership_pac' | 'joint_fundraising' | 'other'
}

// ============================================================
// Normalized rows for upsert into consumer projects
// ============================================================

export interface CampaignFinanceRow {
  politician_id?: string  // FK in CampaignReceipts; optional for projects that key on candidate_id
  fec_candidate_id: string
  cycle: string
  total_raised: number
  total_spent: number
  cash_on_hand: number
  individual_pct: number
  pac_pct: number
  self_funded_pct: number
  in_state_pct: number
  large_donor_pct: number
}

export interface TopDonorRow {
  politician_id?: string
  fec_candidate_id: string
  cycle: string
  rank: number
  donor_name: string
  donor_employer: string | null
  donor_occupation: string | null
  total_contributed: number
  is_pac: boolean
  is_individual: boolean
  industry_code: string | null
  industry_label: string | null
}

export interface IndustryBreakdownRow {
  politician_id?: string
  fec_candidate_id: string
  cycle: string
  industry_code: string
  industry_label: string
  total_contributions: number
  rank: number
}

export interface Politician {
  name: string
  state: string
  office: FECOffice
  cycles?: string[]  // default ['2024', 'lifetime']
}

export interface SyncResult {
  politician: Politician
  fec_candidate_id: string | null
  campaign_finance: CampaignFinanceRow[]
  top_donors: TopDonorRow[]
  industry_breakdown: IndustryBreakdownRow[]
  donor_profile: DonorProfile
}

export interface BillSponsorFinance {
  bill_id: string
  sponsors: Array<{
    legislator_id: string
    fec_candidate_id: string | null
    donor_profile: DonorProfile
    top_industries: Array<{ industry_label: string; total: number }>
    snapshot_at: string
  }>
}

// ============================================================
// DDL generator — same schema, different prefixes per consumer
// ============================================================

export interface DDLOptions {
  tablePrefix: string  // e.g. 'cr_' or 'bt_'
  fkPoliticianTable?: string  // e.g. 'cr_politicians' or 'bt_legislators'
}

export function generateDDL(options: DDLOptions): string {
  const { tablePrefix: p, fkPoliticianTable } = options
  const fkClause = fkPoliticianTable
    ? `politician_id uuid not null references public.${fkPoliticianTable}(id) on delete cascade,`
    : `politician_id uuid,`

  return `
-- @portfolio/fec schema, generated with prefix '${p}'

create table public.${p}campaign_finance (
  id uuid primary key default gen_random_uuid(),
  ${fkClause}
  fec_candidate_id text not null,
  cycle text not null,
  total_raised numeric(14,2),
  total_spent numeric(14,2),
  cash_on_hand numeric(14,2),
  individual_pct numeric(5,2),
  pac_pct numeric(5,2),
  self_funded_pct numeric(5,2),
  in_state_pct numeric(5,2),
  large_donor_pct numeric(5,2),
  last_synced_at timestamptz default now(),
  unique (fec_candidate_id, cycle)
);

create table public.${p}top_donors (
  id uuid primary key default gen_random_uuid(),
  ${fkClause}
  fec_candidate_id text not null,
  cycle text not null,
  rank int not null,
  donor_name text not null,
  donor_employer text,
  donor_occupation text,
  total_contributed numeric(12,2),
  is_pac boolean default false,
  is_individual boolean default false,
  industry_code text,
  industry_label text
);

create table public.${p}industry_breakdown (
  id uuid primary key default gen_random_uuid(),
  ${fkClause}
  fec_candidate_id text not null,
  cycle text not null,
  industry_code text not null,
  industry_label text not null,
  total_contributions numeric(12,2),
  rank int
);

-- Donor profile column on the consumer's politicians/legislators table
${fkPoliticianTable ? `
alter table public.${fkPoliticianTable}
  add column if not exists donor_profile text
  check (donor_profile in ('grassroots','mixed','corporate','self-funded','unknown'));
` : ''}
`.trim()
}
