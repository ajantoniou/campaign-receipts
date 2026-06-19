-- ─── Cliros prospect/outreach ledger ───
-- Mirrors estimateproof.prospects shape (battle-tested) but specialized for
-- real-estate-attorney outreach. Default business_type is 're_attorney'.
-- Added columns vs estimateproof:
--   * county        — which GA county the firm sits in (cliros mandate state map)
--   * state_bar_no  — placeholder for State Bar of Georgia enrichment later
--   * attorney_name — primary attorney at the firm (if scraper extracts)
--
-- Why a new schema-local table instead of crossing into estimateproof.prospects:
-- different ICP (attorneys vs repair shops), different outreach state machine,
-- different DNC rules (attorneys are professionals, not robocall-restricted).
-- Same scraper backend (Leadsscraper) and same Instantly campaign destination.

create table if not exists cliros.prospects (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  business_type text default 're_attorney',
  attorney_name text,
  attorney_first_name text,
  state_bar_no text,
  email text,
  email_status text,
  email_verified_at timestamptz,
  phone text,
  website text,
  linkedin_url text,
  street_address text,
  city text,
  county text,
  state text,
  zip text,
  country text default 'US',
  latitude double precision,
  longitude double precision,
  google_place_id text,
  google_rating numeric,
  google_review_count integer,
  outreach_status text default 'new',
  outreach_priority integer default 5,
  outreach_stage integer default 0,
  instantly_lead_id text,
  last_contacted_at timestamptz,
  last_response_at timestamptz,
  converted_at timestamptz,
  do_not_contact boolean default false,
  do_not_contact_reason text,
  source text,
  notes text,
  raw_data jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists cliros_prospects_place_id_uniq
  on cliros.prospects (google_place_id)
  where google_place_id is not null;

create index if not exists cliros_prospects_email_idx on cliros.prospects (lower(email));
create index if not exists cliros_prospects_state_idx on cliros.prospects (state);
create index if not exists cliros_prospects_outreach_status_idx on cliros.prospects (outreach_status);

-- Outreach attempts ledger (per-channel, per-touch). Mirrors estimateproof.
create table if not exists cliros.outreach_attempts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references cliros.prospects(id) on delete cascade,
  channel text not null,
  template_id text,
  outcome text,
  outcome_detail text,
  cost_usd numeric,
  external_id text,
  raw_payload jsonb,
  created_at timestamptz default now()
);

create index if not exists cliros_outreach_attempts_prospect_idx
  on cliros.outreach_attempts (prospect_id, created_at desc);

-- Outreach emails (one row per email actually delivered). Mirrors estimateproof.
create table if not exists cliros.outreach_emails (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references cliros.prospects(id) on delete cascade,
  subject text,
  body text,
  template_id text,
  delivered_at timestamptz default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  external_id text,
  raw_payload jsonb,
  created_at timestamptz default now()
);

create index if not exists cliros_outreach_emails_prospect_idx
  on cliros.outreach_emails (prospect_id, delivered_at desc);

-- RLS: service-role full access (cron jobs), no anon/authenticated access
-- (these are internal outreach lists, never surfaced in dashboard).
alter table cliros.prospects enable row level security;
alter table cliros.outreach_attempts enable row level security;
alter table cliros.outreach_emails enable row level security;

drop policy if exists "service role full access" on cliros.prospects;
create policy "service role full access" on cliros.prospects
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role full access" on cliros.outreach_attempts;
create policy "service role full access" on cliros.outreach_attempts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role full access" on cliros.outreach_emails;
create policy "service role full access" on cliros.outreach_emails
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- updated_at trigger for prospects (kept lightweight — re-uses pattern from cliros.users)
create or replace function cliros.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists cliros_prospects_touch on cliros.prospects;
create trigger cliros_prospects_touch
  before update on cliros.prospects
  for each row execute function cliros.touch_updated_at();
