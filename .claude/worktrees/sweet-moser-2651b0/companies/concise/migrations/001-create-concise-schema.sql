-- Concise Schema Initialization
-- Created: 2026-05-03 07:20 ET
-- Database: Supabase project jivahkfdkduxasnzpzgx
-- Schema: concise (isolated per AgentCompanies architecture)

-- Create schema
CREATE SCHEMA IF NOT EXISTS concise;

-- Grant permissions
GRANT USAGE ON SCHEMA concise TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA concise GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- books table
CREATE TABLE IF NOT EXISTS concise.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author_name TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  pdf_storage_path TEXT NOT NULL,
  cover_storage_path TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- customers table
CREATE TABLE IF NOT EXISTS concise.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  source TEXT
);

-- orders table
CREATE TABLE IF NOT EXISTS concise.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES concise.customers(id) ON DELETE CASCADE,
  book_id UUID REFERENCES concise.books(id),
  bundle_id UUID,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  ordered_at TIMESTAMPTZ DEFAULT now(),
  pdf_delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- email_subscribers table
CREATE TABLE IF NOT EXISTS concise.email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  source_book_id UUID REFERENCES concise.books(id),
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- bundles table
CREATE TABLE IF NOT EXISTS concise.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  book_ids UUID[] NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_product_id TEXT,
  slug TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- amazon_revenue_baseline table
CREATE TABLE IF NOT EXISTS concise.amazon_revenue_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,
  amount_cents INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indices for common queries
CREATE INDEX IF NOT EXISTS idx_concise_books_slug ON concise.books(slug);
CREATE INDEX IF NOT EXISTS idx_concise_books_status ON concise.books(status);
CREATE INDEX IF NOT EXISTS idx_concise_customers_email ON concise.customers(email);
CREATE INDEX IF NOT EXISTS idx_concise_orders_customer_id ON concise.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_concise_orders_stripe_session_id ON concise.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_concise_email_subscribers_email ON concise.email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_concise_bundles_slug ON concise.bundles(slug);

-- Disable RLS for now (phase 1 — public access to stub)
-- Will be enabled in phase 2+ after authentication implemented
ALTER TABLE concise.books DISABLE ROW LEVEL SECURITY;
ALTER TABLE concise.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE concise.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE concise.bundles DISABLE ROW LEVEL SECURITY;
ALTER TABLE concise.amazon_revenue_baseline DISABLE ROW LEVEL SECURITY;

-- Enable RLS on email_subscribers because only the authenticated server route writes here (CON-112)
ALTER TABLE concise.email_subscribers ENABLE ROW LEVEL SECURITY;

-- Schema initialization complete
-- Verify tables:
-- SELECT * FROM information_schema.tables WHERE table_schema = 'concise';
