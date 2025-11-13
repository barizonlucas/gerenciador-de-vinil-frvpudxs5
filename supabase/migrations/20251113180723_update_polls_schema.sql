-- Rename 'question' to 'title' in the feature_polls table
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='feature_polls' AND column_name='question') THEN
    ALTER TABLE public.feature_polls RENAME COLUMN question TO title;
  END IF;
END $$;

-- Rename 'option_text' to 'title' in the feature_poll_options table
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='feature_poll_options' AND column_name='option_text') THEN
    ALTER TABLE public.feature_poll_options RENAME COLUMN option_text TO title;
  END IF;
END $$;

-- Add 'short_desc' column to the feature_poll_options table
ALTER TABLE public.feature_poll_options
ADD COLUMN IF NOT EXISTS short_desc TEXT;

-- Add 'updated_at' column to track poll updates
ALTER TABLE public.feature_polls
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create a trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp ON public.feature_polls;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.feature_polls
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
