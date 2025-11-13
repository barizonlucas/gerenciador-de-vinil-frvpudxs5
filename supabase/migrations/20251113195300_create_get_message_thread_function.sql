-- Create a composite type for replies with admin profile.
DROP TYPE IF EXISTS public.admin_reply_view CASCADE;
CREATE TYPE public.admin_reply_view AS (
  id UUID,
  message_id UUID,
  admin_user_id UUID,
  reply TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  admin_display_name TEXT,
  admin_avatar_url TEXT
);

-- Create the function to fetch a full message thread.
CREATE OR REPLACE FUNCTION public.get_message_thread(p_message_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  thread_message public.admin_message_view;
  thread_replies public.admin_reply_view[];
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function.';
  END IF;

  -- Get the main message
  SELECT * INTO thread_message FROM public.get_admin_messages() WHERE id = p_message_id;

  -- Get replies with admin profiles
  SELECT ARRAY_AGG(ROW(
    r.id,
    r.message_id,
    r.admin_user_id,
    r.reply,
    r.created_at,
    r.updated_at,
    p.display_name,
    p.avatar_url
  )::public.admin_reply_view)
  INTO thread_replies
  FROM public.user_message_replies r
  LEFT JOIN public.profiles p ON r.admin_user_id = p.user_id
  WHERE r.message_id = p_message_id
  ORDER BY r.created_at ASC;

  -- Return as a single JSON object
  RETURN json_build_object(
    'message', row_to_json(thread_message),
    'replies', COALESCE(array_to_json(thread_replies), '[]'::json)
  );
END;
$;

