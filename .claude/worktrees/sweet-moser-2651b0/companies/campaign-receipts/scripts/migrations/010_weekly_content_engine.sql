-- 010_weekly_content_engine
-- Applied to Supabase jivahkfdkduxasnzpzgx 2026-05-30 (already live).
-- Two-phase weekly content engine.
--   Phase 1 (Thu): weekly-content-build.mjs assembles + persists an issue,
--     creates weekly_story blog posts, queues video handoffs.
--   Phase 2 (Fri 05:00 local): weekly-newsletter-send.mjs sends per-tz.

-- Subscriber timezone (Phase 2 sends at local Friday 05:00).
alter table cr_users add column if not exists timezone text not null default 'America/New_York';

-- Built newsletter issue (one row per ISO week).
create table if not exists cr_newsletter_issues (
  id uuid primary key default gen_random_uuid(),
  week_of date not null unique,          -- Monday of the ISO week
  subject text not null,
  html text not null,
  text_body text,
  top_story_slugs text[] not null default '{}',
  receipts_count integer not null default 0,
  status text not null default 'built',  -- built | sending | sent | skipped
  built_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cr_newsletter_issues_week_idx on cr_newsletter_issues (week_of desc);

-- Per-recipient send ledger (dedupe; one send per user per issue).
create table if not exists cr_newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references cr_newsletter_issues(id) on delete cascade,
  user_id uuid not null references cr_users(id) on delete cascade,
  email text not null,
  sent_at timestamptz not null default now(),
  resend_id text,
  unique (issue_id, user_id)
);
create index if not exists cr_newsletter_sends_issue_idx on cr_newsletter_sends (issue_id);

-- Video production handoff queue. Phase 1 enqueues the top weekly_story
-- article; the CR production pipeline / founder picks it up, produces +
-- uploads, then sets youtube_id back on the article (video_companion
-- linkage already embeds it). Status flow: queued -> in_production ->
-- founder_upload_pending -> published.
create table if not exists cr_video_queue (
  id uuid primary key default gen_random_uuid(),
  article_slug text not null,
  article_id uuid references cr_articles(id) on delete set null,
  week_of date not null,
  title text not null,
  brief text not null,            -- storytelling source for the pipeline
  source_refs jsonb not null default '[]'::jsonb,
  status text not null default 'queued',
  youtube_id text,
  priority integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_slug, week_of)
);
create index if not exists cr_video_queue_status_idx on cr_video_queue (status, priority desc, created_at);

-- Explicit GRANTs (Oct-30-2026 rule).
grant select on cr_newsletter_issues to anon, authenticated;
grant select, insert, update, delete on cr_newsletter_issues to service_role;
grant select on cr_newsletter_sends to authenticated;
grant select, insert, update, delete on cr_newsletter_sends to service_role;
grant select on cr_video_queue to anon, authenticated;
grant select, insert, update, delete on cr_video_queue to service_role;

-- Allow the new article kind (was: race_funding|weekly_receipt|editorial|video_companion).
alter table cr_articles drop constraint if exists cr_articles_kind_check;
alter table cr_articles add constraint cr_articles_kind_check
  check (kind = any (array['race_funding','weekly_receipt','editorial','video_companion','weekly_story']));
