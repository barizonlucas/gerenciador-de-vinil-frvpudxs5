ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS theme_preference TEXT NOT NULL DEFAULT 'light';

COMMENT ON COLUMN public.profiles.avatar_url IS 'URL for the user''s profile picture.';
COMMENT ON COLUMN public.profiles.theme_preference IS 'User''s preferred theme (light or dark).';
