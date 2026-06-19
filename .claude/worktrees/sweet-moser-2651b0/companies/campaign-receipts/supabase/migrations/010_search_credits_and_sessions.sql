-- 010_search_credits_and_sessions.sql
-- The $45/mo "software" product is a credit-metered Haiku donor-intelligence chat.
--
-- PROFITABILITY LOCK: $45/mo = 100 credits/mo. 1 credit = 1 SEARCH SESSION
-- (one chat context: an initial sourced summary + free follow-up turns until the
-- context window fills). Haiku (not Opus) keeps margin ~75%. Hard block at 100/mo.
--
-- Two new tables:
--   cr_search_credits  — one row per (user_id, billing period). Tracks allotment
--                        (default 100) and credits_used. A new SESSION uses 1
--                        credit; follow-up turns in the same session are FREE.
--   cr_search_sessions — the persisted running summary + message log, so the
--                        chat survives reload. Each row = one credit spent.
--
-- The LS subscription id is already stored on cr_subscribers.stripe_subscription_id
-- (the webhook writes payload.data.id there) — no new column needed for cancel.

create table if not exists public.cr_search_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.cr_users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  credits_allotment int not null default 100,
  credits_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, period_start)
);

create index if not exists cr_search_credits_user_idx
  on public.cr_search_credits(user_id, period_end desc);

create table if not exists public.cr_search_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.cr_users(id) on delete cascade,
  entity_type text not null check (entity_type in ('politician','donor','bill','vote')),
  entity_id text not null,
  entity_name text,
  summary_md text not null default '',
  messages jsonb not null default '[]'::jsonb,
  turns int not null default 0,
  context_full boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cr_search_sessions_user_idx
  on public.cr_search_sessions(user_id, created_at desc);

-- GRANTs (per feedback_supabase_grants.md — Oct 30 2026 breaking change).
-- All access is via the service-role client (server routes enforce ownership +
-- entitlement), so anon/authenticated get nothing.
grant all on public.cr_search_credits to service_role;
grant all on public.cr_search_sessions to service_role;
