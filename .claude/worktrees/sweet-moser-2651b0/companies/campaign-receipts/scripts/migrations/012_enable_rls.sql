-- 012_enable_rls.sql
-- Lock down RLS on every cr_* table/view in the public schema.
--
-- THREAT: NEXT_PUBLIC_SUPABASE_ANON_KEY ships in the browser. With RLS off,
-- that key can read (and per grants, possibly write) every row via the REST
-- data API, including PII/auth/billing tables.
--
-- DESIGN:
--   * The Next.js app fetches ALL data server-side via `supabaseService`
--     (SUPABASE_SERVICE_ROLE_KEY), which BYPASSES RLS. `supabaseRead` (anon
--     client in lib/supabase.ts) is never imported anywhere. So enabling RLS
--     breaks no read path.
--   * SENSITIVE tables: RLS enabled, NO anon/authenticated policy => anon is
--     fully blocked. Service role still works (bypass).
--   * PUBLIC-CONTENT tables: RLS enabled + a `SELECT ... USING (true)` policy
--     for anon/authenticated. Harmless belt-and-suspenders today (reads are
--     server-side) and correct if a future surface ever reads them with anon.
--   * NO insert/update/delete granted to anon on anything. The two legacy
--     anon INSERT policies (cr_disputes, cr_waitlist) are intentionally
--     DROPPED here because those write paths go through server routes
--     (lib/supabase.ts -> service role), so anon write is unnecessary surface.
--
-- Idempotent: re-runnable. ENABLE RLS is idempotent; policies are dropped
-- before create.

begin;

-- ---------------------------------------------------------------------------
-- 1. ENABLE RLS ON EVERY cr_* TABLE (idempotent; skips views/matviews)
-- ---------------------------------------------------------------------------
do $$
declare r record;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname like 'cr\_%'
      and c.relkind in ('r','p')          -- ordinary + partitioned tables only
  loop
    execute format('alter table public.%I enable row level security;', r.relname);
    execute format('alter table public.%I force row level security;', r.relname);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. DROP legacy anon-write policies (writes go through server/service role)
-- ---------------------------------------------------------------------------
drop policy if exists "anyone can submit a dispute" on public.cr_disputes;
drop policy if exists "anyone can join waitlist"   on public.cr_waitlist;
drop policy if exists "public_read_disputes"       on public.cr_disputes;  -- disputes can carry submitter PII; server-only
drop policy if exists "public_read_waitlist"       on public.cr_waitlist;  -- waitlist holds emails; server-only

-- ---------------------------------------------------------------------------
-- 3. PUBLIC-CONTENT SELECT policies (anon + authenticated, USING (true))
--    Belt-and-suspenders; all current reads are server-side service-role.
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  public_tables text[] := array[
    'cr_politicians','cr_promises','cr_receipts','cr_articles','cr_races',
    'cr_states','cr_bills','cr_bill_timeline_nodes','cr_bill_money_trail',
    'cr_bill_industry_positions','cr_committees','cr_pac_contributions',
    'cr_campaign_finance','cr_donor_vote_alignment','cr_industry_breakdown',
    'cr_top_donors','cr_roll_calls','cr_compare_pairs','cr_leaderboard_history',
    'cr_foreign_donor_records','cr_citizenships','cr_corrections',
    'cr_homepage_pulse','cr_weekly','cr_weekly_snapshot','cr_recent_activity'
  ];
begin
  foreach t in array public_tables loop
    -- only act if the relation exists as a TABLE (skip views: cr_recent_activity)
    if exists (
      select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relname=t and c.relkind in ('r','p')
    ) then
      execute format('drop policy if exists %I on public.%I;', 'public_select_'||t, t);
      execute format(
        'create policy %I on public.%I for select to anon, authenticated using (true);',
        'public_select_'||t, t
      );
    end if;
  end loop;
end $$;

commit;
