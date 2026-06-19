-- 006_video_companion_articles.sql
--
-- Extend cr_articles to support 'video_companion' landing pages — the
-- 1:1 article that ships alongside every CR YouTube long-form. Adds:
--   - 'video_companion' to the kind check constraint
--   - youtube_id text column (nullable; only set for video_companion rows)
--
-- Backfill rows are inserted by scripts/backfill-video-companion-articles.py
-- (Bush, Massie, Rabb LFs). The /articles/[slug] route already renders
-- any cr_articles row by slug; this migration just unblocks the new kind.

alter table public.cr_articles
  drop constraint if exists cr_articles_kind_check;

alter table public.cr_articles
  add constraint cr_articles_kind_check
  check (kind = any (array[
    'race_funding'::text,
    'weekly_receipt'::text,
    'editorial'::text,
    'video_companion'::text
  ]));

alter table public.cr_articles
  add column if not exists youtube_id text;

create index if not exists idx_cr_articles_youtube_id
  on public.cr_articles (youtube_id)
  where youtube_id is not null;

-- Service role already has full access (granted in earlier migration).
-- No new GRANT needed; existing anon/authenticated select grant covers
-- the new column automatically.
