-- 020: independent expenditures (Schedule E, support/oppose) + ingest run log.
create table if not exists cr_schedule_e (
  sub_id text primary key, spender_committee_id text, spender_name text,
  candidate_id text, candidate_name text, support_oppose text, amount numeric,
  expenditure_date date, dissemination_date date, cycle int, load_date date,
  updated_at timestamptz not null default now()
);
create index if not exists cr_schedule_e_cand_idx on cr_schedule_e (candidate_id, support_oppose);
create index if not exists cr_schedule_e_date_idx on cr_schedule_e (dissemination_date desc);
create index if not exists cr_schedule_e_spender_idx on cr_schedule_e (spender_committee_id);
create table if not exists cr_ingest_runs (
  job text primary key, cursor text, last_run_at timestamptz, last_status text,
  rows_last_run int, note text, updated_at timestamptz not null default now()
);
grant select on cr_schedule_e, cr_ingest_runs to anon, authenticated;
grant select, insert, update, delete on cr_schedule_e, cr_ingest_runs to service_role;
