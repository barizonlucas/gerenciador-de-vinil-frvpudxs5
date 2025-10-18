-- Enable Row Level Security (idempotent)
ALTER TABLE public.vinyl_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them to ensure idempotency
DROP POLICY IF EXISTS "Allow users to see their own records" ON public.vinyl_records;
CREATE POLICY "Allow users to see their own records"
ON public.vinyl_records
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert their own records" ON public.vinyl_records;
CREATE POLICY "Allow users to insert their own records"
ON public.vinyl_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own records" ON public.vinyl_records;
CREATE POLICY "Allow users to update their own records"
ON public.vinyl_records
FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own records" ON public.vinyl_records;
CREATE POLICY "Allow users to delete their own records"
ON public.vinyl_records
FOR DELETE
USING (auth.uid() = user_id);
