ALTER TABLE public.vinyl_records
ADD COLUMN IF NOT EXISTS master_id TEXT;
