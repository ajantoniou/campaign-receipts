-- Proactive GRANT migration for Supabase breaking change (Oct 30 2026).
-- After that date, new tables in public schema won't auto-grant access.
-- This ensures explicit grants exist for all current and future tables.

-- Existing table: public.email_subscribers
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_subscribers TO anon, authenticated;
GRANT ALL ON public.email_subscribers TO service_role;

-- Default privileges for any future tables created in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
