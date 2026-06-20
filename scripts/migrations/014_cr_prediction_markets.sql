CREATE TABLE IF NOT EXISTS public.cr_prediction_markets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    question TEXT NOT NULL,
    group_name TEXT,
    volume_usd NUMERIC DEFAULT 0,
    end_date TIMESTAMPTZ,
    outcomes JSONB DEFAULT '[]'::jsonb,
    edge_true_odds NUMERIC,
    edge_headline TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cr_prediction_markets ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public Read Access" 
    ON public.cr_prediction_markets 
    FOR SELECT 
    USING (true);

-- Allow service role full access
CREATE POLICY "Service Role Full Access" 
    ON public.cr_prediction_markets 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);
