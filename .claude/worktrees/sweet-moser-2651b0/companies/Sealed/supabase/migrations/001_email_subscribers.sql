-- SEALED Press standalone Supabase (`public` schema expected by concise-sealed API routes).
-- Run in the same Supabase project as `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` on Render.
--
-- Diff vs Concise monolith (`concise.email_subscribers`): that table uses UUID `source_book_id` FK.
-- Here `source_book_id` is TEXT so slugs such as `sealed` persist without FK wiring.

CREATE TABLE IF NOT EXISTS public.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  source_book_id TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscribed ON public.email_subscribers (subscribed_at DESC);
