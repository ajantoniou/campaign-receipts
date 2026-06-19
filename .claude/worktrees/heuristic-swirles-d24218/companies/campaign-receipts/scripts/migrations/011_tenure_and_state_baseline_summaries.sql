-- 011_tenure_and_state_baseline_summaries
-- Applied to Supabase jivahkfdkduxasnzpzgx 2026-05-30 (already live).
--
-- Backfilled AI narration summaries (computed once, stored, rendered statically;
-- NOT per-request AI). The model NARRATES deterministic, fully-sourced facts
-- (lib/dossier.ts assembleBundle + per-state aggregates) — it never invents
-- figures. Same nonpartisan, sourced-or-omit contract as the dossier engine.
--
--   cr_politicians.tenure_summary_md  — investigative-journalist narration of
--     WHO funds the member, what they voted YES on / sponsored, and their
--     BROKEN promises (broken > kept — broken is the signal). Donor + bill
--     names are highlighted inline (<u>/<strong>) so the page is scannable.
--   cr_states                          — one row per state, baseline_summary_md =
--     narration of the state's federal-money picture (biggest donors, R/D money
--     split, recent bills + member votes) + governor BROKEN promises only.

alter table cr_politicians add column if not exists tenure_summary_md text;
alter table cr_politicians add column if not exists tenure_summary_built_at timestamptz;

create table if not exists cr_states (
  code text primary key,                  -- 'TX', 'CA', ...
  name text not null,
  baseline_summary_md text,
  baseline_facts jsonb not null default '{}'::jsonb,  -- deterministic audit trail the summary narrates
  baseline_summary_built_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Explicit GRANTs (Oct-30-2026 rule).
grant select on cr_states to anon, authenticated;
grant select, insert, update, delete on cr_states to service_role;
grant select (tenure_summary_md, tenure_summary_built_at) on cr_politicians to anon, authenticated;
