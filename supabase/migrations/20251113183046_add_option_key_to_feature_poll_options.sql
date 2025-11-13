-- Add the 'option_key' column to store identifiers like 'A', 'B', 'C'.
-- It is set to NOT NULL to ensure data integrity.
ALTER TABLE public.feature_poll_options
ADD COLUMN option_key TEXT NOT NULL DEFAULT '';

-- Add a unique constraint to ensure that each option within a single poll has a unique key.
-- This prevents duplicate option keys (e.g., two 'A' options) for the same poll.
ALTER TABLE public.feature_poll_options
ADD CONSTRAINT feature_poll_options_poll_id_option_key_key UNIQUE (poll_id, option_key);
