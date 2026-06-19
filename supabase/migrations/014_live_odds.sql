-- 014_live_odds.sql
-- Add live_odds to cr_races to store real-time Polymarket probabilities

alter table public.cr_races
  add column if not exists live_odds jsonb default '{}'::jsonb;
