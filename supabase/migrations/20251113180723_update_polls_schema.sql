-- Rename 'question' to 'title' in the feature_polls table
ALTER TABLE public.feature_polls
RENAME COLUMN question TO title;

-- Rename 'option_text' to 'title' in the feature_poll_options table
ALTER TABLE public.feature_poll_options
RENAME COLUMN option_text TO title;

-- Add 'short_desc' column to the feature_poll_options table
ALTER TABLE public.feature_poll_options
ADD COLUMN short_desc TEXT;

-- Add 'updated_at' column to track poll updates
ALTER TABLE public.feature_polls
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.feature_polls
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
