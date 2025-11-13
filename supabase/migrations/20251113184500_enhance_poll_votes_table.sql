-- Add the updated_at column to track when a vote was last changed.
ALTER TABLE public.feature_poll_votes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create a trigger to automatically update the 'updated_at' timestamp on any row update.
-- This reuses the function created in a previous migration (20251113180723_update_polls_schema.sql).
CREATE OR REPLACE TRIGGER on_feature_poll_votes_updated
BEFORE UPDATE ON public.feature_poll_votes
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- The unique constraint on (poll_id, user_id) is already present from migration 20251113174900_setup_admin_tables_and_rls.sql.
-- This comment serves as a confirmation of its existence.

-- Update foreign key constraints to cascade deletes.
-- This ensures that if a poll or an option is deleted, all related votes are also removed.

-- Drop existing constraints first to modify them
ALTER TABLE public.feature_poll_votes
DROP CONSTRAINT IF EXISTS feature_poll_votes_poll_id_fkey,
DROP CONSTRAINT IF EXISTS feature_poll_votes_option_id_fkey;

-- Re-add constraints with ON DELETE CASCADE
ALTER TABLE public.feature_poll_votes
ADD CONSTRAINT feature_poll_votes_poll_id_fkey
FOREIGN KEY (poll_id) REFERENCES public.feature_polls(id) ON DELETE CASCADE;

ALTER TABLE public.feature_poll_votes
ADD CONSTRAINT feature_poll_votes_option_id_fkey
FOREIGN KEY (option_id) REFERENCES public.feature_poll_options(id) ON DELETE CASCADE;


-- RLS Policies for Votes
-- Add a policy to allow administrators to view all votes, for reporting and moderation.
DROP POLICY IF EXISTS admin_can_select_all_votes ON public.feature_poll_votes;
CREATE POLICY admin_can_select_all_votes
ON public.feature_poll_votes
FOR SELECT
USING (is_admin());

-- The policies for users to manage their own votes (INSERT, UPDATE, SELECT)
-- are already in place from previous migrations (user_manage_own_votes, user_read_own_votes).
-- This ensures users can only interact with their own data.
