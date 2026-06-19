-- Corrections feed schema.
--
-- Added 2026-05-21 per ChatGPT audit + 4-expert panel newsroom-buyer
-- persona: "A corrections log with RSS — that's the single artifact
-- that converts a $200/mo subscription to legal-approved sourcing."
--
-- Founder decision (2026-05-20): new dedicated table, not page-level
-- fields, so the corrections log can be sitewide (covering any
-- politician, race, bill, weekly receipt) and surface a single RSS
-- feed for newsrooms to subscribe to.
--
-- Insertion is SQL-only for v1 — no admin UI. Founder + future editorial
-- INSERT rows directly via Supabase studio. Each correction is short:
-- headline + what was wrong + what now says + optional affected URLs +
-- optional editor note. The page renders newest-first; RSS feed mirrors.

create table if not exists public.cr_corrections (
  id uuid primary key default gen_random_uuid(),
  -- When the correction was published (UI sort key)
  occurred_at timestamptz not null default now(),
  -- Short one-line headline of the correction (newsroom-grade)
  headline text not null,
  -- What the page said before
  what_was_wrong text not null,
  -- What it now says (the corrected statement)
  what_now_says text not null,
  -- Optional URLs / receipt IDs affected by this correction
  affects_urls text[] default '{}',
  -- Optional editorial note (context, methodology change, etc.)
  editor_note text,
  -- Row-creation audit (separate from occurred_at to allow back-dating)
  created_at timestamptz not null default now()
);

create index if not exists cr_corrections_occurred_idx
  on public.cr_corrections(occurred_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- GRANTs (Supabase Oct-30-2026 breaking change — every table needs
-- explicit grants or PostgREST refuses to expose it).
-- ─────────────────────────────────────────────────────────────────────
grant select on public.cr_corrections to anon, authenticated;
grant select, insert, update on public.cr_corrections to service_role;
