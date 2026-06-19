-- 009_two_paid_products.sql
-- Founder pricing lock 2026-05-30: TWO separate paid subscriptions, bought
-- independently (either, both, or neither):
--   1. Newsletter   — $12/mo — the weekly Friday "money trail" email.
--   2. Software/Pro  — $45/mo — the /investigate donor-intelligence dossiers.
--
-- Previously cr_subscribers was one row per user = the single "Pro" entitlement.
-- Now it is one row per (user_id, product) so a user can hold one, the other,
-- or both. The webhook keys `product` off the LS variant_id in the payload.
--
-- The FREE top-of-funnel email list stays in cr_free_subscribers (migration 008) —
-- that is the marketing/announcement list, NOT the paid weekly newsletter.

alter table public.cr_subscribers
  add column if not exists product text not null default 'software'
    check (product in ('newsletter','software'));

update public.cr_subscribers set product = 'software' where product is null;

-- Re-key to composite primary key.
alter table public.cr_subscribers drop constraint if exists cr_subscribers_pkey;
alter table public.cr_subscribers add constraint cr_subscribers_pkey primary key (user_id, product);

-- tier column is legacy; relax its single-value check.
alter table public.cr_subscribers drop constraint if exists cr_subscribers_tier_check;

create index if not exists cr_subscribers_user_product_idx on public.cr_subscribers(user_id, product);

-- GRANTs (per feedback_supabase_grants.md — Oct 30 2026 breaking change)
grant all on public.cr_subscribers to service_role;
