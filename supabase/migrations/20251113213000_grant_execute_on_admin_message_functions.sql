-- Ensure the admin messaging RPCs can be called from the client.
GRANT EXECUTE ON FUNCTION public.get_admin_messages() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_message_thread(UUID) TO authenticated;

-- Allow the authenticated role to consume the composite types returned by the RPCs.
GRANT USAGE ON TYPE public.admin_message_view TO authenticated;
GRANT USAGE ON TYPE public.admin_reply_view TO authenticated;
