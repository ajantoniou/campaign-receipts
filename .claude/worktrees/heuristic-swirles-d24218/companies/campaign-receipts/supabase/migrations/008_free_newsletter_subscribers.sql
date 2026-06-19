-- 008_free_newsletter_subscribers.sql
-- Free top-of-funnel newsletter list — separate from paid cr_subscribers.
-- Strategist decision: eng/strategy/newsletter-capture-strategy-2026-05-26.md
-- Why a new table (not ALTER cr_subscribers): migration 003 hard-locks
-- cr_subscribers.tier to 'pro' via check constraint. Free signups have
-- different consent + billing semantics — keep them isolated.

create extension if not exists "pgcrypto";

create table if not exists cr_free_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'homepage',  -- 'homepage' | 'article' | 'video-companion' | 'short' | 'manual'
  source_slug text,                          -- article/video slug if applicable
  consent_marketing boolean not null default true,
  confirmed_at timestamptz,                  -- double opt-in confirmation
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cr_free_subscribers_email_idx on cr_free_subscribers (lower(email));
create index if not exists cr_free_subscribers_source_idx on cr_free_subscribers (source);
create index if not exists cr_free_subscribers_active_idx on cr_free_subscribers (unsubscribed_at) where unsubscribed_at is null;

-- updated_at trigger
create or replace function cr_free_subscribers_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cr_free_subscribers_touch on cr_free_subscribers;
create trigger cr_free_subscribers_touch
  before update on cr_free_subscribers
  for each row execute function cr_free_subscribers_touch_updated_at();

-- RLS: nobody but service role reads/writes. Signup goes through API route
-- using service-role key; unsubscribe link uses a signed token, also server-side.
alter table cr_free_subscribers enable row level security;

-- Explicit grants (per feedback_supabase_grants.md — Oct 30 2026 breaking change)
grant select, insert, update, delete on cr_free_subscribers to service_role;
grant usage on schema public to service_role;
