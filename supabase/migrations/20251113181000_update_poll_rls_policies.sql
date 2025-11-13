-- Drop existing policies to replace them with the new ones.
DROP POLICY IF EXISTS admin_all_access_polls ON public.feature_polls;
DROP POLICY IF EXISTS user_read_active_polls ON public.feature_polls;
DROP POLICY IF EXISTS admin_all_access_poll_options ON public.feature_poll_options;
DROP POLICY IF EXISTS user_read_poll_options ON public.feature_poll_options;

-- Create a policy to allow public read access to all polls.
DROP POLICY IF EXISTS feature_polls_read_public ON public.feature_polls;
CREATE POLICY feature_polls_read_public ON public.feature_polls
FOR SELECT
USING (true);

-- Create a policy to allow public read access to all poll options.
DROP POLICY IF EXISTS feature_poll_options_read_public ON public.feature_poll_options;
CREATE POLICY feature_poll_options_read_public ON public.feature_poll_options
FOR SELECT
USING (true);

-- Create a policy that allows administrators to perform any action on polls.
-- The is_admin() function is defined in a previous migration.
DROP POLICY IF EXISTS feature_polls_admin_write ON public.feature_polls;
CREATE POLICY feature_polls_admin_write ON public.feature_polls
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Create a policy that allows administrators to perform any action on poll options.
DROP POLICY IF EXISTS feature_poll_options_admin_write ON public.feature_poll_options;
CREATE POLICY feature_poll_options_admin_write ON public.feature_poll_options
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());
