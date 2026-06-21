-- 017_weekly_branch_pipeline.sql
--
-- Friday Receipts engine: append-only money-event journal + per-week story set +
-- click tracking + viral digest. Powers the automated weekly pipeline:
--   accumulate FEC -> detect NEW connections -> 6 Opus articles by branch ->
--   Friday Receipts newsletter -> click tracking -> Saturday top-title email.
--
-- WHY THE JOURNAL: the live FEC tables are DESTRUCTIVE (cr_top_donors is
-- delete+reinsert per (politician,cycle); cr_bill_money_trail is fully truncated
-- and rebuilt each run). So "what's new THIS week" cannot be diffed from them.
-- cr_money_events is an append-only ledger written at ingest time; first_seen_week
-- = the ISO Monday a connection first appeared, which is how detection finds "new".
--
-- Branch values in cr_politicians (real): House, Senate, Governor, Mayor,
-- President, Other. The newsletter maps President->Executive, House->House,
-- Senate->Senate, Governor/Mayor->States. No Judiciary FEC data exists.

-- ============================================================================
-- A′ — append-only money-event journal (the diff substrate)
-- ============================================================================
create table if not exists cr_money_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in
    ('donor_to_politician','pac_to_politician','pac_to_bill','foreign_linked')),
  entity_key  text not null,                 -- natural dedupe key (see journaler)
  politician_id uuid references cr_politicians(id) on delete set null,
  committee_id  text,                        -- FEC committee_id (text, not uuid)
  bill_id       uuid references cr_bills(id) on delete set null,
  branch        text,                        -- denormalized from cr_politicians.branch
  label         text,                        -- human label for the connection
  amount        numeric not null default 0,  -- current cumulative amount
  last_amount   numeric not null default 0,  -- amount at previous observation
  delta_amount  numeric not null default 0,  -- amount - last_amount (this obs)
  contribution_count integer not null default 0,
  first_seen_week date not null,             -- ISO Monday it first appeared
  last_seen_week  date not null,
  created_at timestamptz not null default now(),
  unique (entity_type, entity_key)
);
create index if not exists cr_money_events_week_idx on cr_money_events (first_seen_week desc);
create index if not exists cr_money_events_branch_idx on cr_money_events (branch, last_seen_week desc);

-- ============================================================================
-- C/D — per-week ranked story set (the 6+ articles, by branch)
-- ============================================================================
create table if not exists cr_story_candidates (
  id uuid primary key default gen_random_uuid(),
  week_of date not null,                     -- ISO Monday
  rank integer not null,
  branch text not null,                      -- Executive | House | Senate | States
  event_id uuid references cr_money_events(id) on delete set null,
  dedupe_hash text not null,                 -- sha1(entity_key) — 60d re-feature guard
  headline text not null,
  source_refs jsonb not null default '[]'::jsonb,  -- structured FEC figures for Opus
  score numeric not null default 0,
  article_slug text,                         -- filled by Stage E once generated
  article_status text,                       -- mirrors cr_articles.status
  created_at timestamptz not null default now(),
  unique (week_of, dedupe_hash)
);
create index if not exists cr_story_candidates_week_idx on cr_story_candidates (week_of, rank);

-- ============================================================================
-- Observability — one row per weekly run
-- ============================================================================
create table if not exists cr_weekly_runs (
  week_of date primary key,
  stage_detect   jsonb,
  stage_generate jsonb,
  stage_build    jsonb,
  viral_winner_slug   text,
  viral_winner_title  text,
  viral_winner_clicks integer,
  digest_sent_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Click instrumentation — /c/[token] redirect + click ledger
-- ============================================================================
create table if not exists cr_newsletter_links (
  token text primary key,                    -- short opaque id in /c/[token]
  issue_id uuid references cr_newsletter_issues(id) on delete cascade,
  article_slug text not null,
  branch text,
  target_url text not null,
  created_at timestamptz not null default now()
);
create index if not exists cr_newsletter_links_issue_idx on cr_newsletter_links (issue_id);

create table if not exists cr_newsletter_clicks (
  id uuid primary key default gen_random_uuid(),
  token text references cr_newsletter_links(token) on delete cascade,
  issue_id uuid,
  article_slug text,
  user_id uuid,                              -- nullable; resolved from ?u= when present
  ua text,
  ip_hash text,                              -- sha256(ip+salt), privacy-safe
  clicked_at timestamptz not null default now()
);
create index if not exists cr_newsletter_clicks_article_idx on cr_newsletter_clicks (issue_id, article_slug);

-- Roll-up view for the Saturday digest.
create or replace view cr_article_click_counts as
select issue_id, article_slug,
       count(*) as clicks,
       count(distinct user_id) as unique_clicks
from cr_newsletter_clicks
group by issue_id, article_slug;

-- ============================================================================
-- Extend existing tables
-- ============================================================================
-- Branch-grouped slug map for the newsletter build:
--   {"Executive":["slug-a"],"House":[...],"Senate":[...],"States":[...]}
alter table cr_newsletter_issues
  add column if not exists branch_story_slugs jsonb not null default '{}'::jsonb;

-- Reuse cr_video_queue for the viral/YouTube handoff.
alter table cr_video_queue
  add column if not exists click_count integer not null default 0;
alter table cr_video_queue
  add column if not exists selected_as_viral boolean not null default false;

-- ============================================================================
-- GRANTs (mandatory per repo convention — RLS/ownership lives in app code).
-- ============================================================================
grant select on cr_money_events, cr_story_candidates, cr_weekly_runs,
                cr_newsletter_links, cr_newsletter_clicks, cr_article_click_counts
  to anon, authenticated;
grant select, insert, update, delete on cr_money_events, cr_story_candidates,
                cr_weekly_runs, cr_newsletter_links, cr_newsletter_clicks
  to service_role;
