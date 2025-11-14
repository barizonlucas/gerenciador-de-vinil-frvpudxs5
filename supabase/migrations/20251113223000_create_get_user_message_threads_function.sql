-- Allow collectors to read replies that belong to their own messages.
DROP POLICY IF EXISTS user_can_read_own_replies ON public.user_message_replies;
CREATE POLICY user_can_read_own_replies ON public.user_message_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.user_messages m
    WHERE m.id = user_message_replies.message_id
      AND m.user_id = auth.uid()
  )
);

-- Provide a convenience RPC that returns every message + admin replies for the current collector.
CREATE OR REPLACE FUNCTION public.get_user_message_threads()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  WITH message_rows AS (
    SELECT
      ROW(
        m.id,
        m.user_id,
        m.message,
        m.status,
        m.created_at,
        m.updated_at,
        u.email,
        p.display_name,
        p.avatar_url
      )::public.admin_message_view AS message_row,
      m.created_at AS message_created_at
    FROM public.user_messages m
    LEFT JOIN auth.users u ON m.user_id = u.id
    LEFT JOIN public.profiles p ON m.user_id = p.user_id
    WHERE m.user_id = auth.uid()
    ORDER BY m.created_at ASC
  )
  SELECT COALESCE(
    json_agg(
      json_build_object(
        'message', row_to_json(m.message_row),
        'replies', COALESCE(
          (
            SELECT json_agg(
              row_to_json(ROW(
                r.id,
                r.message_id,
                r.admin_user_id,
                r.reply,
                r.created_at,
                r.updated_at,
                ap.display_name,
                ap.avatar_url
              )::public.admin_reply_view)
              ORDER BY r.created_at ASC
            )
            FROM public.user_message_replies r
            LEFT JOIN public.profiles ap ON r.admin_user_id = ap.user_id
            WHERE r.message_id = (m.message_row).id
          ),
          '[]'::json
        )
      )
      ORDER BY m.message_created_at ASC
    ),
    '[]'::json
  )
  INTO result
  FROM message_rows m;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_message_threads() TO authenticated;
