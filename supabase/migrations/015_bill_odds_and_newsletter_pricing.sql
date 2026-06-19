-- 015_bill_odds_and_newsletter_pricing.sql
-- Add live_odds to cr_bills and cr_politicians to store real-time probabilities for legislative and appointment bets.

alter table public.cr_bills
  add column if not exists live_odds jsonb default '{}'::jsonb;

alter table public.cr_politicians
  add column if not exists live_odds jsonb default '{}'::jsonb;
