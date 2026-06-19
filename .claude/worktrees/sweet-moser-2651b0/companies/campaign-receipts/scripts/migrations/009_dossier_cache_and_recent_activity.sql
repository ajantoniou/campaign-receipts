-- 009_dossier_cache_and_recent_activity
-- Applied to Supabase jivahkfdkduxasnzpzgx 2026-05-30 (already live).
-- Backs the connection-matrix dossier product (briefs/2026-05-30-connection-matrix-backfill.md §3-§4).
--
-- cr_dossier_cache: one row per (entity_type, entity_id, inputs_hash) where
--   inputs_hash = sha256 of the deterministic bundle fed to Opus. A changed
--   bundle -> new key -> cache miss; an identical bundle never re-bills Opus.
-- cr_recent_activity: UNION view over the freshest timestamp per entity type,
--   powering the FREE "recently updated" teaser feed.

create table if not exists cr_dossier_cache (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('politician','donor','bill','vote')),
  entity_id text not null,
  inputs_hash text not null,
  entity_name text,
  bundle jsonb not null,
  dossier_md text not null,
  model text not null,
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_id, inputs_hash)
);

create index if not exists cr_dossier_cache_entity_idx
  on cr_dossier_cache (entity_type, entity_id, created_at desc);

-- Explicit GRANTs (Oct-30-2026 rule).
grant select on cr_dossier_cache to anon, authenticated;
grant select, insert, update, delete on cr_dossier_cache to service_role;

create or replace view cr_recent_activity as
  select 'politician'::text as entity_type,
         p.slug as entity_id,
         p.name as label,
         coalesce(
           nullif(p.scorecard_percentage_kept::text,'') || '% promises kept',
           p.party || ' · ' || p.state
         ) as teaser,
         p.last_refreshed_at as updated_at
  from cr_politicians p
  where p.last_refreshed_at is not null

  union all
  select 'donor', c.committee_id, c.name,
         coalesce(c.industry_label, c.committee_type_full, 'Political committee'),
         c.last_synced_at
  from cr_committees c
  where c.last_synced_at is not null
    and exists (select 1 from cr_pac_contributions pc where pc.committee_id = c.committee_id)

  union all
  select 'bill', b.id::text,
         coalesce(b.short_title, b.title),
         coalesce(b.bill_type || ' ' || b.bill_number::text, 'Bill') ||
           coalesce(' · ' || b.status, ''),
         b.latest_action_at
  from cr_bills b
  where b.latest_action_at is not null

  union all
  select 'bill', mt.bill_id::text,
         coalesce(b2.short_title, b2.title, 'Bill'),
         '$' || round(mt.total_from_industry)::text || ' from ' || mt.industry_label,
         mt.computed_at
  from cr_bill_money_trail mt
  join cr_bills b2 on b2.id = mt.bill_id
  where mt.computed_at is not null and mt.rank = 1;

grant select on cr_recent_activity to anon, authenticated, service_role;
