-- Paywall + autonomous-GTM schema for CampaignReceipts Pro launch.
-- Adds: users (magic-link auth), subscribers (Stripe-backed paid access),
-- trial_codes (cold-outreach comps), outreach_targets + outreach_log
-- (the GTM sequencer's working set + audit log), and weekly (the
-- "Worst Broken Promise of the Week" picks).
--
-- All tables follow the cr_ prefix convention. Explicit GRANTs at the
-- bottom (Oct 30 2026 Supabase breaking change requires this).

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────
-- Auth: passwordless magic-link, Resend-delivered. We mint a token,
-- email it, accept it once at /auth/verify/[token], drop a session
-- cookie. Keeps things simple — no Supabase Auth, no NextAuth.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.cr_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.cr_magic_links (
  token text primary key,
  email text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists cr_magic_links_email_idx on public.cr_magic_links(email);

-- Long-lived session token written to an httpOnly cookie after either
-- a magic-link verify or a /redeem flow. Avoid JWT for now — DB lookup
-- is cheap at our scale.
create table if not exists public.cr_sessions (
  token text primary key,
  user_id uuid not null references public.cr_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_used_at timestamptz
);
create index if not exists cr_sessions_user_id_idx on public.cr_sessions(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- Subscribers: one row per user with a paid or trial entitlement.
-- Source = how they got it: 'stripe' (paid), 'trial_code' (comped),
-- 'magic_link_trial' (14-day self-serve free trial on signup).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.cr_subscribers (
  user_id uuid primary key references public.cr_users(id) on delete cascade,
  tier text not null default 'pro' check (tier in ('pro')),
  status text not null check (status in ('trialing','active','past_due','canceled','expired')),
  source text not null check (source in ('stripe','trial_code','magic_link_trial')),
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  commercial_license boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cr_subscribers_status_idx on public.cr_subscribers(status);
create index if not exists cr_subscribers_stripe_customer_idx on public.cr_subscribers(stripe_customer_id);

-- ─────────────────────────────────────────────────────────────────────
-- Trial codes: single-use comp codes embedded in cold-outreach emails.
-- 7-day redemption window from issuance; grants `days_granted` of Pro
-- access on redemption. requires_public_mention is the influencer
-- comp condition (we ship the code, track redemption, audit mentions
-- via a follow-up cron).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.cr_trial_codes (
  code text primary key,
  intended_email text,
  days_granted int not null check (days_granted > 0 and days_granted <= 365),
  source_campaign text,
  requires_public_mention boolean not null default false,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by_user_id uuid references public.cr_users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists cr_trial_codes_intended_email_idx on public.cr_trial_codes(intended_email);

-- ─────────────────────────────────────────────────────────────────────
-- Outreach targets: built once by scripts/build-outreach-list.mjs from
-- Muck Rack + Apify + Hunter. Stable working set the sequencer pulls
-- from on each day in the 7-day launch.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.cr_outreach_targets (
  id uuid primary key default gen_random_uuid(),
  email text,
  handle text,
  display_name text,
  channel text not null check (channel in ('email','x','bluesky','reddit','substack','podcast')),
  cohort text not null check (cohort in ('journalist','youtuber','influencer','substack','reddit','podcast','reply_bait')),
  beat_tags text[] not null default '{}',
  follower_count int,
  outlet text,
  source_list text,
  created_at timestamptz not null default now(),
  unique (email, channel),
  unique (handle, channel)
);
create index if not exists cr_outreach_targets_cohort_idx on public.cr_outreach_targets(cohort);

-- ─────────────────────────────────────────────────────────────────────
-- Outreach log: every send + every event (open, click, reply,
-- redemption). One row per touch attempt. Day-in-sequence makes the
-- digest aggregation trivial.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.cr_outreach_log (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references public.cr_outreach_targets(id) on delete cascade,
  channel text not null,
  day_in_sequence int not null check (day_in_sequence between 1 and 14),
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  reply_sentiment text check (reply_sentiment in ('positive','neutral','negative','question','unsubscribe')),
  reply_excerpt text,
  code_id text references public.cr_trial_codes(code) on delete set null,
  message_id text,
  error text
);
create index if not exists cr_outreach_log_target_idx on public.cr_outreach_log(target_id);
create index if not exists cr_outreach_log_day_idx on public.cr_outreach_log(day_in_sequence);
create index if not exists cr_outreach_log_replied_idx on public.cr_outreach_log(replied_at) where replied_at is not null;

-- ─────────────────────────────────────────────────────────────────────
-- Worst Broken Promise of the Week. One row per ISO week. Picked by a
-- Monday cron from BROKEN verdicts published in the prior 7 days,
-- ranked by politician page_views_30d + an editorial impact score.
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.cr_weekly (
  iso_year int not null,
  iso_week int not null,
  picked_at timestamptz not null default now(),
  promise_id uuid not null,
  politician_id uuid not null,
  headline text not null,
  blurb text not null,
  share_image_url text,
  primary key (iso_year, iso_week)
);

-- ─────────────────────────────────────────────────────────────────────
-- Comparison pairs (programmatic SEO). One row per /compare/[A]-vs-[B]
-- page. Seeded by scripts/seed-comparison-pairs.mjs (200 pairs in v1).
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.cr_compare_pairs (
  slug_a text not null,
  slug_b text not null,
  kind text not null check (kind in ('predecessor','same_seat','same_state','rivals','party_foils')),
  created_at timestamptz not null default now(),
  primary key (slug_a, slug_b)
);

-- ─────────────────────────────────────────────────────────────────────
-- GRANTs (per Oct 30 2026 breaking change — required, not optional)
-- ─────────────────────────────────────────────────────────────────────
grant select on public.cr_weekly to anon, authenticated;
grant select on public.cr_compare_pairs to anon, authenticated;

-- Auth + subscriber tables are server-only. anon must NOT read magic
-- links, sessions, subscribers, trial codes, or outreach data.
grant all on public.cr_users to service_role;
grant all on public.cr_magic_links to service_role;
grant all on public.cr_sessions to service_role;
grant all on public.cr_subscribers to service_role;
grant all on public.cr_trial_codes to service_role;
grant all on public.cr_outreach_targets to service_role;
grant all on public.cr_outreach_log to service_role;
grant all on public.cr_weekly to service_role;
grant all on public.cr_compare_pairs to service_role;
