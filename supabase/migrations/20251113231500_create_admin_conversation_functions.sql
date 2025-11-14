-- Conversation summary type so the inbox can group messages per collector.
DROP TYPE IF EXISTS public.admin_conversation_summary CASCADE;
CREATE TYPE public.admin_conversation_summary AS (
  user_id UUID,
  user_email TEXT,
  user_display_name TEXT,
  user_avatar_url TEXT,
  latest_message_id UUID,
  latest_message TEXT,
  latest_status TEXT,
  latest_created_at TIMESTAMPTZ,
  total_messages INTEGER
);

-- Returns one row per collector with the latest message metadata.
CREATE OR REPLACE FUNCTION public.get_admin_conversation_summaries()
RETURNS SETOF public.admin_conversation_summary
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function.';
  END IF;

  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (m.user_id)
      m.user_id,
      m.id,
      m.message,
      m.status,
      m.created_at
    FROM public.user_messages m
    ORDER BY m.user_id, m.created_at DESC
  ),
  message_counts AS (
    SELECT user_id, COUNT(*) AS total_messages
    FROM public.user_messages
    GROUP BY user_id
  )
  SELECT
    lm.user_id,
    u.email::text,
    p.display_name::text,
    p.avatar_url::text,
    lm.id,
    lm.message,
    lm.status,
    lm.created_at,
    COALESCE(mc.total_messages, 0)::integer
  FROM latest_messages lm
  LEFT JOIN auth.users u ON u.id = lm.user_id
  LEFT JOIN public.profiles p ON p.user_id = lm.user_id
  LEFT JOIN message_counts mc ON mc.user_id = lm.user_id
  ORDER BY lm.created_at DESC;
END;
$$;

-- Returns the full conversation (all messages + replies) for a collector.
CREATE OR REPLACE FUNCTION public.get_admin_user_thread(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation JSON;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can access this function.';
  END IF;

  WITH user_info AS (
    SELECT
      u.id AS user_id,
      u.email,
      p.display_name,
      p.avatar_url
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.user_id = u.id
    WHERE u.id = p_user_id
  ),
  message_payload AS (
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
              LEFT JOIN public.profiles ap ON ap.user_id = r.admin_user_id
              WHERE r.message_id = m.id
            ),
            '[]'::json
          )
        )
        ORDER BY (m.message_row).created_at ASC
      ),
      '[]'::json
    ) AS messages
    FROM (
      SELECT
        ROW(
          msg.id,
          msg.user_id,
          msg.message,
          msg.status,
          msg.created_at,
          msg.updated_at,
          u.email,
          pr.display_name,
          pr.avatar_url
        )::public.admin_message_view AS message_row,
        msg.id
      FROM public.user_messages msg
      LEFT JOIN auth.users u ON u.id = msg.user_id
      LEFT JOIN public.profiles pr ON pr.user_id = msg.user_id
      WHERE msg.user_id = p_user_id
      ORDER BY msg.created_at ASC
    ) m
  )
  SELECT json_build_object(
    'user', (SELECT row_to_json(user_info) FROM user_info),
    'messages', (SELECT messages FROM message_payload)
  )
  INTO conversation;

  RETURN conversation;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_conversation_summaries() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_thread(UUID) TO authenticated;
GRANT USAGE ON TYPE public.admin_conversation_summary TO authenticated;
