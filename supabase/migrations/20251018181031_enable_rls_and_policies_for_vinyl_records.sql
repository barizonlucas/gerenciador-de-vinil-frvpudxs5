-- Enable Row Level Security
ALTER TABLE public.vinyl_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow users to see their own records"
ON public.vinyl_records
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own records"
ON public.vinyl_records
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own records"
ON public.vinyl_records
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own records"
ON public.vinyl_records
FOR DELETE
USING (auth.uid() = user_id);
