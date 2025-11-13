-- Drop the 'subject' column as it's no longer needed for the new message system.
ALTER TABLE public.user_messages DROP COLUMN IF EXISTS subject;

-- Drop the 'is_read' column in favor of the new, more descriptive 'status' column.
ALTER TABLE public.user_messages DROP COLUMN IF EXISTS is_read;

-- Add the 'status' column to track the message state (e.g., new, read, replied).
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';

-- Add a check constraint to ensure the 'status' column only contains valid values.
-- First, drop the constraint if it exists to avoid errors on re-runs.
ALTER TABLE public.user_messages DROP CONSTRAINT IF EXISTS user_messages_status_check;
ALTER TABLE public.user_messages ADD CONSTRAINT user_messages_status_check CHECK (status IN ('new', 'read', 'replied'));

-- Add the 'updated_at' column to track when a message is last updated.
ALTER TABLE public.user_messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add a check constraint for the message length to enforce business rules at the database level.
-- First, drop the constraint if it exists to avoid errors on re-runs.
ALTER TABLE public.user_messages DROP CONSTRAINT IF EXISTS user_messages_message_length_check;
ALTER TABLE public.user_messages ADD CONSTRAINT user_messages_message_length_check CHECK (char_length(message) BETWEEN 5 AND 500);
