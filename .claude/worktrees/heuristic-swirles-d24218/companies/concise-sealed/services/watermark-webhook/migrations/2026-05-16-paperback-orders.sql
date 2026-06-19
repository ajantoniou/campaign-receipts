-- SEALED — paperback order ledger
--
-- Tracks every paperback order fulfilled via Lulu Direct from a Lemon Squeezy
-- webhook trigger. Unlike the digital flow (no PII at rest), the paperback
-- flow MUST persist a row so we can:
--   - look up the Lulu print job ID for a given LS order if a buyer asks
--     "where's my book?"
--   - reconcile Lulu's monthly invoice against LS revenue
--   - support reprints / refunds
--
-- buyer_email is the only PII stored (kept for reconciliation; required
-- for support). NO shipping address persisted — it lives only at Lulu.
--
-- Status values track Lulu's print-job lifecycle:
--   pending     — webhook received, Lulu print job created, awaiting payment
--   in_production — Lulu accepted & is printing
--   shipped     — Lulu marked shipped, tracking_url present
--   cancelled   — Lulu rejected or order cancelled before production
--
-- GRANT statements per portfolio CLAUDE.md (Oct 30 2026 Supabase breaking change).

create table if not exists public.sealed_paperback_orders (
  id              bigserial primary key,
  ls_order_id     text not null unique,
  buyer_email     text not null,
  lulu_print_job_id text,
  status          text not null default 'pending',
  tracking_url    text,
  created_at      timestamptz not null default now(),
  shipped_at      timestamptz
);

create index if not exists sealed_paperback_orders_status_idx
  on public.sealed_paperback_orders (status);
create index if not exists sealed_paperback_orders_lulu_idx
  on public.sealed_paperback_orders (lulu_print_job_id);

-- Service role (used by the watermark-webhook on Render) needs full access.
-- anon and authenticated do NOT — this table is internal-only.
grant select, insert, update on public.sealed_paperback_orders to service_role;
grant usage, select on sequence public.sealed_paperback_orders_id_seq to service_role;

-- Belt-and-suspenders: explicit revoke from anon/authenticated. Default schema
-- grants in Supabase usually keep public schema readable; this is the rare
-- table that should not be.
revoke all on public.sealed_paperback_orders from anon, authenticated;

-- RLS disabled by design — only service_role hits this table, RLS would just
-- add friction. If a future read path from a Postgres-side function is needed,
-- enable RLS and add a policy then.
alter table public.sealed_paperback_orders disable row level security;
