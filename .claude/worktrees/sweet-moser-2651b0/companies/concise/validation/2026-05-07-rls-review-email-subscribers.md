---
title: "RLS review — email_subscribers vs subscribe route"
owner: "CTO (concise)"
date: "2026-05-07"
issue: "CON-71 / TASK-012"
---

# Supabase RLS review — `concise.email_subscribers`

## Goal
Validate that the landing-page subscribe route and the `email_subscribers` table have aligned RLS posture before polishing the signup funnel.

## Findings
- `migrations/001-create-concise-schema.sql` disables RLS on the phase‑1 stub tables (`books`, `customers`, `orders`, `bundles`, `amazon_revenue_baseline`) but **enables** RLS on `concise.email_subscribers` (`ALTER TABLE concise.email_subscribers ENABLE ROW LEVEL SECURITY;`). Until that migration is applied in Supabase, production could still diverge from repo intent.
- `/app/api/email/subscribe/route.ts` is the only path that talks to Supabase: it instantiates a Supabase client with `SUPABASE_SERVICE_ROLE_KEY` and performs an `upsert` into `concise.email_subscribers`.
- Because service-role keys bypass RLS, enabling RLS on `email_subscribers` will not break the subscribe route; the server route already runs in a trusted environment (Render + `.env`).
- No browser-written code or public client uses Supabase for this table, so there is no requirement to grant `anon` insert/select rights today, but we should keep inserting solely from the server route.

## Gap
If `email_subscribers` ever ships **without** RLS enabled in the live database, the `anon` key (embedded wherever we ship Supabase URLs) could read or inject rows into that table and expose subscriber emails and source metadata without guardrails.

## Recommendation
1. Turn RLS back on for `concise.email_subscribers` once the migration has been applied:
   ```sql
   ALTER TABLE concise.email_subscribers ENABLE ROW LEVEL SECURITY;
   ```
   `<supabase policy note: service-role inserts will keep working without additional policies.>`
2. Keep the service role key strictly in Render/Supabase envs so no client bundle ever sees it.
3. If we ever add a client-side insert path, add an RLS policy that only allows `insert` on the few columns that the landing page needs (email + opt-in metadata) and rate limit or double opt-in before it hits the database.

## Evidence
- Schema migration: `migrations/001-create-concise-schema.sql` — phase‑1 tables stay RLS-disabled for the stub; `concise.email_subscribers` explicitly enables RLS after those statements.
- Subscribe route: `app/api/email/subscribe/route.ts` lines 56-104 make a service-role upsert and log (but do not expose) Mailchimp sync failures.

## Next actions
1. Apply the SQL above (or a deployment-specific migration) the next time the `migrations/001` script runs so RLS is enabled before we go production.
2. Document the change in `deploys/CON-2-PHASE2-EXECUTION-REPORT.md` or a follow-up `SESSION_DECISIONS` entry so other agents know why RLS is on even though auth is still phase 1.
