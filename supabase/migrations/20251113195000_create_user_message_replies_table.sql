-- This migration refactors the user_message_replies table created in a previous step.
-- It renames columns for clarity, adds an updated_at timestamp, and sets up constraints.

-- Add the 'updated_at' column if it doesn't exist.
ALTER TABLE public.user_message_replies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Safely rename 'user_id' to 'admin_user_id' for clarity.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='user_message_replies' AND column_name='user_id') THEN
    ALTER TABLE public.user_message_replies RENAME COLUMN user_id TO admin_user_id;
  END IF;
END $$;

-- Safely rename 'reply_message' to 'reply'.
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name='user_message_replies' AND column_name='reply_message') THEN
    ALTER TABLE public.user_message_replies RENAME COLUMN reply_message TO reply;
  END IF;
END $$;

-- Add a check constraint for the reply length.
ALTER TABLE public.user_message_replies DROP CONSTRAINT IF EXISTS user_message_replies_reply_length_check;
ALTER TABLE public.user_message_replies ADD CONSTRAINT user_message_replies_reply_length_check CHECK (char_length(reply) BETWEEN 1 AND 500);

-- Add a comment to the admin_user_id column for clarity.
COMMENT ON COLUMN public.user_message_replies.admin_user_id IS 'FK to auth.users.id of the replying admin';

-- Ensure RLS is enabled on the table.
ALTER TABLE public.user_message_replies ENABLE ROW LEVEL SECURITY;

-- Create a trigger to automatically update the 'updated_at' timestamp on any row update.
DROP TRIGGER IF EXISTS on_user_message_replies_updated ON public.user_message_replies;
CREATE TRIGGER on_user_message_replies_updated
BEFORE UPDATE ON public.user_message_replies
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
