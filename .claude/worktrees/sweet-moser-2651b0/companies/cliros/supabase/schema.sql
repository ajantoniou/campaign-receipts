-- ============================================================
-- Cliros — Supabase Schema
-- AI-powered property title search & AOL generation
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ─── Users ───
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  role text not null default 'other' check (role in ('attorney','agent','investor','title_company','other')),
  state text,                -- 2-letter state code
  bar_number text,           -- for attorneys
  free_reports_used int not null default 0,
  free_reports_total int not null default 3,
  subscription_tier text check (subscription_tier in ('quick_lien','full_search','full_search_aol','pro_monthly','firm_monthly')),
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Properties ───
-- Cached property metadata to avoid re-fetching
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  street text not null,
  city text not null,
  state text not null,       -- 2-letter
  zip text not null,
  county text,
  full_address text not null,
  parcel_id text,
  legal_description text,
  property_type text,
  acreage numeric,
  assessed_value numeric,
  tax_year int,
  raw_data jsonb,            -- full API response cached
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(full_address)
);

create index idx_properties_state on public.properties(state);
create index idx_properties_county on public.properties(county);
create index idx_properties_parcel on public.properties(parcel_id);

-- ─── Search Reports ───
create table public.search_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),
  property_id uuid not null references public.properties(id),
  tier text not null default 'full_search' check (tier in ('quick_lien','full_search','full_search_aol')),
  status text not null default 'pending' check (status in ('pending','searching','analyzing','complete','failed')),

  -- Report content (populated when status = complete)
  chain_of_title jsonb,      -- array of deed records
  chain_breaks jsonb,        -- array of break descriptions
  years_searched int,
  search_start_date date,
  search_end_date date,
  liens jsonb,               -- array of lien records
  easements jsonb,           -- array of easements
  defects jsonb,             -- array of title defects with severity
  summary text,
  risk_score int check (risk_score >= 0 and risk_score <= 100),

  -- Billing
  amount_cents int,           -- price charged in cents
  stripe_payment_id text,
  is_free_trial boolean not null default false,

  -- Timing
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failed_at timestamptz,
  error_message text,

  -- Source tracking
  data_sources jsonb          -- which APIs/scrapers were used
);

create index idx_reports_user on public.search_reports(user_id);
create index idx_reports_property on public.search_reports(property_id);
create index idx_reports_status on public.search_reports(status);
create index idx_reports_created on public.search_reports(created_at desc);

-- ─── Attorney Opinion Letters ───
create table public.aol_drafts (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references public.search_reports(id),
  content text not null,       -- markdown/HTML of the AOL
  fannie_mae_compliant boolean not null default true,
  status text not null default 'draft' check (status in ('draft','reviewed','signed')),
  generated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  signed_at timestamptz
);

create index idx_aol_report on public.aol_drafts(report_id);

-- ─── County Coverage ───
-- Tracks which counties we can search and how
create table public.county_coverage (
  id uuid primary key default uuid_generate_v4(),
  state text not null,
  county text not null,
  fips_code text,
  recorder_url text,
  data_source text not null check (data_source in ('propmix','titleflex','scraper','manual')),
  digital_records_from int,   -- earliest year of digital records
  supported boolean not null default false,
  notes text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),

  unique(state, county)
);

create index idx_county_state on public.county_coverage(state);
create index idx_county_supported on public.county_coverage(supported);

-- ─── Audit Log ───
-- Track all search actions for compliance and debugging
create table public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  report_id uuid references public.search_reports(id),
  action text not null,        -- 'search_started', 'api_called', 'report_generated', 'aol_generated', etc.
  details jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_user on public.audit_log(user_id);
create index idx_audit_report on public.audit_log(report_id);
create index idx_audit_created on public.audit_log(created_at desc);

-- ─── Row Level Security ───
alter table public.users enable row level security;
alter table public.search_reports enable row level security;
alter table public.aol_drafts enable row level security;
alter table public.audit_log enable row level security;

-- Users can read/update their own row
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Users can view their own reports
create policy "Users can view own reports"
  on public.search_reports for select
  using (auth.uid() = user_id);

create policy "Users can create reports"
  on public.search_reports for insert
  with check (auth.uid() = user_id);

-- Users can view AOLs for their own reports
create policy "Users can view own AOLs"
  on public.aol_drafts for select
  using (
    exists (
      select 1 from public.search_reports sr
      where sr.id = aol_drafts.report_id
        and sr.user_id = auth.uid()
    )
  );

-- County coverage is public read
alter table public.county_coverage enable row level security;
create policy "County coverage is public"
  on public.county_coverage for select
  using (true);

-- Properties are public read (cached data)
alter table public.properties enable row level security;
create policy "Properties are public read"
  on public.properties for select
  using (true);
