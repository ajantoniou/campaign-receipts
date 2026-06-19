-- 013_roll_call_compound_index.sql
-- Adds a compound index to cr_roll_calls to optimize the nightly alignment 
-- compute jobs (compute-alignment.mjs and compute-bill-money-trail.mjs).
-- These pipelines join cr_roll_calls heavily and filter on bill_id, 
-- is_procedural, and vote. The compound index ensures millisecond 
-- query execution, avoiding full table scans.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_roll_calls_terminal 
ON public.cr_roll_calls (bill_id, is_procedural, vote);
