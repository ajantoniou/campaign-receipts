-- CampaignReceipts directory schema
-- Politician promise-tracking database

create schema if not exists directory;

-- Politicians
create table if not exists directory.politicians (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  party text not null check (party in ('Republican','Democratic','Independent','Other')),
  branch text not null check (branch in ('Senate','House','Governor','President','Other')),
  state text not null,
  district text,
  gender text,
  religion text,
  minority_status text,
  dob date,
  age int,
  in_office_since date,
  in_office_to date,
  current_term_start date,
  current_term_end date,
  current_status text,
  official_url text,
  photo_url text,
  ideology_label text,
  professional_background text,
  profile_narrative text,
  scorecard_kept int default 0,
  scorecard_partial int default 0,
  scorecard_broken int default 0,
  scorecard_you_decide int default 0,
  scorecard_total int default 0,
  scorecard_percentage_kept numeric(5,2) default 0,
  last_refreshed_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_politicians_party on directory.politicians (party);
create index if not exists idx_politicians_branch on directory.politicians (branch);
create index if not exists idx_politicians_state on directory.politicians (state);
create index if not exists idx_politicians_pct_kept on directory.politicians (scorecard_percentage_kept desc);

-- Promises
create table if not exists directory.promises (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid not null references directory.politicians(id) on delete cascade,
  promise_number int not null,
  promise_text text not null,
  promise_type text check (promise_type in ('EXPLICIT','INFERRED')),
  promise_date text,
  promise_source_url text,
  category text,
  verdict text not null check (verdict in ('KEPT','PARTIAL','BROKEN','YOU_DECIDE','BLOCKED')),
  verdict_reasoning text,
  case_study_narrative text,
  is_featured boolean default false,
  featured_quadrant text,
  created_at timestamptz default now()
);

create index if not exists idx_promises_politician on directory.promises (politician_id);
create index if not exists idx_promises_featured on directory.promises (politician_id, is_featured);

-- Receipts (primary sources)
create table if not exists directory.receipts (
  id uuid primary key default gen_random_uuid(),
  promise_id uuid not null references directory.promises(id) on delete cascade,
  quote text,
  source_url text,
  source_publication text,
  source_date text,
  paper_trail_notes text,
  created_at timestamptz default now()
);

-- Waitlist (per-politician deep-dive interest)
create table if not exists directory.waitlist (
  id uuid primary key default gen_random_uuid(),
  politician_slug text not null,
  email text not null,
  signed_up_at timestamptz default now(),
  unique (politician_slug, email)
);

create index if not exists idx_waitlist_politician on directory.waitlist (politician_slug);

-- Disputes
create table if not exists directory.disputes (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid references directory.politicians(id),
  promise_id uuid references directory.promises(id),
  submitter_email text,
  claim text,
  status text default 'pending',
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Review logs (audit trail of 3-pass adversarial review)
create table if not exists directory.review_logs (
  id uuid primary key default gen_random_uuid(),
  politician_id uuid references directory.politicians(id),
  pass_number int,
  agent_role text,
  transcript_summary text,
  objections_jsonb jsonb,
  created_at timestamptz default now()
);

-- Grant access for the service role (Supabase default)
grant usage on schema directory to anon, authenticated, service_role;
grant select on directory.politicians, directory.promises, directory.receipts to anon, authenticated;
grant all on all tables in schema directory to service_role;
grant all on all sequences in schema directory to service_role;
