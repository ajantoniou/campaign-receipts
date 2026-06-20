CREATE TABLE IF NOT EXISTS public.cr_waitlist (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    market_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.cr_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow service role to do anything
CREATE POLICY "Service Role Full Access" 
    ON public.cr_waitlist 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);
