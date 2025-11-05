ALTER TABLE public.vinyl_records
ADD COLUMN release_id TEXT;

CREATE INDEX IF NOT EXISTS vinyl_records_release_id_idx ON public.vinyl_records (release_id);
