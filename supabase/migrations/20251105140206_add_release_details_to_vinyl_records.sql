ALTER TABLE public.vinyl_records
ADD COLUMN IF NOT EXISTS release_label TEXT,
ADD COLUMN IF NOT EXISTS release_country TEXT,
ADD COLUMN IF NOT EXISTS release_catno TEXT;
