-- Drop existing policies on user_messages to redefine them with more specific permissions.
DROP POLICY IF EXISTS admin_all_access_user_messages ON public.user_messages;
DROP POLICY IF EXISTS user_manage_own_messages ON public.user_messages;

-- Policy: Authenticated users can insert their own messages.
DROP POLICY IF EXISTS user_can_insert_own_message ON public.user_messages;
CREATE POLICY user_can_insert_own_message ON public.user_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can select their own messages.
DROP POLICY IF EXISTS user_can_select_own_messages ON public.user_messages;
CREATE POLICY user_can_select_own_messages ON public.user_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Administrators can select all messages.
DROP POLICY IF EXISTS admin_can_select_all_messages ON public.user_messages;
CREATE POLICY admin_can_select_all_messages ON public.user_messages
FOR SELECT
USING (is_admin());

-- Policy: Administrators can update the status of any message.
DROP POLICY IF EXISTS admin_can_update_message_status ON public.user_messages;
CREATE POLICY admin_can_update_message_status ON public.user_messages
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());
