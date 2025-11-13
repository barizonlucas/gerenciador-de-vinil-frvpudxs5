-- Drop the previous, more permissive read policy on votes.
DROP POLICY IF EXISTS user_read_votes_for_voted_poll ON public.feature_poll_votes;

-- Create a new, stricter policy that allows users to read only their own votes.
-- This enhances privacy and aligns with the principle of least privilege.
DROP POLICY IF EXISTS user_read_own_votes ON public.feature_poll_votes;
CREATE POLICY user_read_own_votes ON public.feature_poll_votes
FOR SELECT
USING (auth.uid() = user_id);
