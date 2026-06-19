-- 012: shared public-form submission log (2026-06-10).
-- Companion to 011 (magic-link hardening). One row per ACCEPTED public
-- form submission (newsletter / waitlist / comp-request); the form-guard
-- helper counts rows here to enforce per-email and per-IP hourly caps
-- that survive deploys and span Render instances — unlike the in-memory
-- Maps these endpoints used before. Magic links keep their own counter
-- in cr_magic_links.

create table if not exists public.cr_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form text not null,
  email text not null,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists cr_form_submissions_email_created_idx
  on public.cr_form_submissions (email, created_at);
create index if not exists cr_form_submissions_ip_created_idx
  on public.cr_form_submissions (ip, created_at);

-- Service-role only: RLS forced with zero policies, explicit grant
-- (required for all new tables since the Oct 30 2026 Supabase change).
alter table public.cr_form_submissions enable row level security;
alter table public.cr_form_submissions force row level security;
grant all on public.cr_form_submissions to service_role;
