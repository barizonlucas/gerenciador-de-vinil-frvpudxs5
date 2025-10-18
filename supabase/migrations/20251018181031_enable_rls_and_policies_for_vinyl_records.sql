-- Enable Row Level Security for the vinyl_records table
ALTER TABLE public.vinyl_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to ensure idempotency
DROP POLICY IF EXISTS "Allow users to view their own records" ON public.vinyl_records;
DROP POLICY IF EXISTS "Allow users to insert their own records" ON public.vinyl_records;
DROP POLICY IF EXISTS "Allow users to update their own records" ON public.vinyl_records;
DROP POLICY IF EXISTS "Allow users to delete their own records" ON public.vinyl_records;

-- Create a policy that allows users to view their own records
CREATE POLICY "Allow users to view their own records"
ON public.vinyl_records
FOR SELECT
USING (auth.uid() = user_id);

-- Create a policy that allows users to insert their own records
CREATE POLICY "Allow users to insert their own records"
ON public.vinyl_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to update their own records
CREATE POLICY "Allow users to update their own records"
ON public.vinyl_records
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a policy that allows users to delete their own records
CREATE POLICY "Allow users to delete their own records"
ON public.vinyl_records
FOR DELETE
USING (auth.uid() = user_id);
