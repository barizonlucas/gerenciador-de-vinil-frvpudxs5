-- Drop broad policies from initial setup to replace with more specific ones.
DROP POLICY IF EXISTS admin_all_access_user_message_replies ON public.user_message_replies;
DROP POLICY IF EXISTS user_read_own_message_replies ON public.user_message_replies;

-- RLS Policies for user_message_replies
-- Admins can insert replies.
CREATE POLICY admin_can_insert_reply ON public.user_message_replies
FOR INSERT WITH CHECK (is_admin());

-- Admins can select all replies.
CREATE POLICY admin_can_select_replies ON public.user_message_replies
FOR SELECT USING (is_admin());

-- Admins can update their own replies.
CREATE POLICY admin_can_update_own_replies ON public.user_message_replies
FOR UPDATE USING (is_admin() AND auth.uid() = admin_user_id);

-- Admins can delete their own replies.
CREATE POLICY admin_can_delete_own_replies ON public.user_message_replies
FOR DELETE USING (is_admin() AND auth.uid() = admin_user_id);
