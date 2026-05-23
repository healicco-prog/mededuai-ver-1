CREATE TABLE IF NOT EXISTS public.saved_vocabulary (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    course text NOT NULL,
    subject text NOT NULL,
    topic text NOT NULL,
    terms jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_vocabulary ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all saved vocab (or restrict as needed)
CREATE POLICY "Allow authenticated read access" ON public.saved_vocabulary
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert vocab
CREATE POLICY "Allow authenticated insert access" ON public.saved_vocabulary
    FOR INSERT TO authenticated WITH CHECK (true);

-- Grant privileges
GRANT ALL ON TABLE public.saved_vocabulary TO authenticated;
GRANT ALL ON TABLE public.saved_vocabulary TO service_role;
