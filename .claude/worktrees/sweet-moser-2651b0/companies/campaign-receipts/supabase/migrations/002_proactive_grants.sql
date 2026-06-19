-- Proactive GRANT migration for Supabase breaking change (Oct 30 2026).
-- CampaignReceipts uses public schema with cr_ prefix (not directory schema).
-- This ensures explicit grants exist + default privileges for future tables.

-- Explicit grants on all cr_ tables
GRANT SELECT ON public.cr_politicians TO anon, authenticated;
GRANT SELECT ON public.cr_promises TO anon, authenticated;
GRANT SELECT ON public.cr_receipts TO anon, authenticated;
GRANT SELECT ON public.cr_disputes TO anon, authenticated;
GRANT SELECT ON public.cr_review_logs TO anon, authenticated;
GRANT SELECT ON public.cr_audit_findings TO anon, authenticated;
GRANT SELECT ON public.cr_waitlist TO anon, authenticated;

-- Allow public to submit disputes and waitlist signups
GRANT INSERT ON public.cr_disputes TO anon, authenticated;
GRANT INSERT ON public.cr_waitlist TO anon, authenticated;

-- Service role gets full access
GRANT ALL ON public.cr_politicians TO service_role;
GRANT ALL ON public.cr_promises TO service_role;
GRANT ALL ON public.cr_receipts TO service_role;
GRANT ALL ON public.cr_disputes TO service_role;
GRANT ALL ON public.cr_review_logs TO service_role;
GRANT ALL ON public.cr_waitlist TO service_role;
GRANT ALL ON public.cr_audit_findings TO service_role;

-- Default privileges for future tables in public schema
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;
