-- 019_fec_money_graph.sql
--
-- FEC money graph from bulk pas2 (committee→candidate edges) + candidate master.
-- The keystone for "who funded the sponsor" AND "who else those PACs funded" — the
-- same committee_id appears on every candidate a PAC funds. All on stable FEC IDs
-- (no name matching). Populated by scripts/fec-bulk-money-graph.mjs.

create table if not exists cr_fec_candidates (
  candidate_id text primary key,            -- FEC CAND_ID (e.g. S4WV00159)
  name text,
  party text,
  office text,                              -- H | S | P
  state text,
  district text,
  bioguide text,                            -- crosswalk (from congress-legislators)
  updated_at timestamptz not null default now()
);
create index if not exists cr_fec_candidates_bioguide_idx on cr_fec_candidates (bioguide);

-- committee → candidate contribution edge, aggregated per cycle (net of refunds).
create table if not exists cr_pac_to_candidate (
  committee_id text not null,               -- the GIVING committee (FEC CMTE_ID)
  candidate_id text not null,               -- recipient (FEC CAND_ID)
  cycle int not null,
  total numeric not null default 0,
  count int not null default 0,
  last_date date,
  updated_at timestamptz not null default now(),
  primary key (committee_id, candidate_id, cycle)
);
create index if not exists cr_pac_to_candidate_cand_idx on cr_pac_to_candidate (candidate_id, cycle);
create index if not exists cr_pac_to_candidate_cmte_idx on cr_pac_to_candidate (committee_id, cycle);

grant select on cr_fec_candidates, cr_pac_to_candidate to anon, authenticated;
grant select, insert, update, delete on cr_fec_candidates, cr_pac_to_candidate to service_role;
