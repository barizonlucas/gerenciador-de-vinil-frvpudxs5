-- Create a composite type to define the structure of the returned message data.
DROP TYPE IF EXISTS public.admin_message_view CASCADE;
CREATE TYPE public.admin_message_view AS (
  id UUID,
  user_id UUID,
  message TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_display_name TEXT,
  user_avatar_url TEXT
);

-- Create the function for admins to fetch messages with user details.
CREATE OR REPLACE FUNCTION public.get_admin_messages()
RETURNS SETOF public.admin_message_view
LANGUAGE plpgsql
SECURITY DEFINER -- Important for accessing auth.users
AS $
BEGIN
  -- Check if the caller is an admin.
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function.';
  END IF;

  -- Return the query joining messages with profiles and auth users.
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.message,
    m.status,
    m.created_at,
    m.updated_at,
    u.email AS user_email,
    p.display_name AS user_display_name,
    p.avatar_url AS user_avatar_url
  FROM
    public.user_messages m
  LEFT JOIN
    auth.users u ON m.user_id = u.id
  LEFT JOIN
    public.profiles p ON m.user_id = p.user_id;
END;
$;

