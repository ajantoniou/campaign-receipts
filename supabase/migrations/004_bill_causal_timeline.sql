-- Causal-timeline rollout schema for hand-picked bill pages.
--
-- Per Phase B post-build panel (2026-05-19): "Ship CausalTimeline first
-- to 3-5 hand-picked bill pages where the chronology is genuinely tight,
-- not as a sitewide dossier component." This migration unblocks that
-- rollout. The component itself (app/components/CausalTimeline.tsx)
-- ships data via props — this migration adds the durable storage.
--
-- Two additive surfaces:
--
--   1. cr_bills gets two columns — next_event_date + next_event_label.
--      The bill detail page can show "Next: floor vote · Jun 12 2026"
--      above the timeline, which is what makes a static chronology feel
--      live. NULL on most rows; populated only on the seeded bills.
--
--   2. cr_bill_timeline_nodes is the new table. One row per node on the
--      timeline (donation, bill introduced, vote, outcome). Ordered by
--      sort_index. The bill page reads it on render and feeds it into
--      <CausalTimeline nodes={...} />. Editorial picks land here via
--      scripts/seed-causal-timeline.mjs — no auto-generation.
--
-- Hard-rule reminder: explicit GRANTs at the bottom (Supabase Oct 2026
-- breaking change). Service role gets all; anon gets SELECT only on
-- public-read tables.

alter table public.cr_bills
  add column if not exists next_event_date date,
  add column if not exists next_event_label text;

comment on column public.cr_bills.next_event_date is
  'Editorial: next anticipated event on this bill (floor vote, conference, signing). NULL except on the 3-5 timeline-rollout picks.';
comment on column public.cr_bills.next_event_label is
  'Editorial: short label for next_event_date ("Floor vote", "Conference report", "Veto deadline").';

create table if not exists public.cr_bill_timeline_nodes (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.cr_bills(id) on delete cascade,
  sort_index smallint not null,
  kind text not null check (kind in ('donation','bill','vote','outcome','event')),
  title text not null,
  amount_usd numeric(14,2),
  event_date date,
  href text,
  meta text,
  created_at timestamptz not null default now(),
  unique (bill_id, sort_index)
);

create index if not exists cr_bill_timeline_nodes_bill_idx
  on public.cr_bill_timeline_nodes(bill_id, sort_index);

-- ─────────────────────────────────────────────────────────────────────
-- GRANTs (Supabase Oct-30-2026 breaking change — every table needs
-- explicit grants or PostgREST refuses to expose it).
-- ─────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.cr_bill_timeline_nodes to service_role;
grant select on public.cr_bill_timeline_nodes to anon, authenticated;
