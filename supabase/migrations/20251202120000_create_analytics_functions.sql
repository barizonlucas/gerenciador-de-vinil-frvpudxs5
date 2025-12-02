-- Migration to add analytics functions for the admin dashboard

-- Function to get daily active users over the last 30 days
-- Returns an array of objects with day (YYYY-MM-DD) and active_users_count
CREATE OR REPLACE FUNCTION get_daily_active_users_last_30d()
RETURNS TABLE(day text, active_users_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
    count(distinct user_id)::bigint as active_users_count
  FROM
    public.app_events
  WHERE
    created_at >= (now() - interval '30 days')
    AND user_id IS NOT NULL
  GROUP BY
    1
  ORDER BY
    1;
END;
$$;

-- Function to get event frequency for a specific event over the last 30 days
-- Returns an array of objects with day (YYYY-MM-DD) and event_count
CREATE OR REPLACE FUNCTION get_event_frequency_last_30d(p_event_name text)
RETURNS TABLE(day text, event_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
    count(*)::bigint as event_count
  FROM
    public.app_events
  WHERE
    created_at >= (now() - interval '30 days')
    AND event_name = p_event_name
  GROUP BY
    1
  ORDER BY
    1;
END;
$$;

-- Function to get top 10 most used events in the last 30 days
-- Returns an array of objects with event_name and total_count
CREATE OR REPLACE FUNCTION get_top_10_events_last_30d()
RETURNS TABLE(event_name text, total_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    public.app_events.event_name,
    count(*)::bigint as total_count
  FROM
    public.app_events
  WHERE
    created_at >= (now() - interval '30 days')
  GROUP BY
    1
  ORDER BY
    2 DESC
  LIMIT 10;
END;
$$;

-- Function to get average events per user in the last 30 days
-- Returns a single numeric value
CREATE OR REPLACE FUNCTION get_avg_events_per_user_last_30d()
RETURNS TABLE(average_events_per_user numeric)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH counts AS (
    SELECT
      count(*) as total_events,
      count(distinct user_id) as total_users
    FROM
      public.app_events
    WHERE
      created_at >= (now() - interval '30 days')
      AND user_id IS NOT NULL
  )
  SELECT
    CASE
      WHEN total_users = 0 THEN 0
      ELSE round(total_events::numeric / total_users, 2)
    END as average_events_per_user
  FROM
    counts;
END;
$$;

-- Helper function to get all distinct event names for the dropdown
CREATE OR REPLACE FUNCTION get_distinct_event_names()
RETURNS TABLE(event_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT public.app_events.event_name
  FROM public.app_events
  ORDER BY 1;
END;
$$;

-- Grant execute permissions to authenticated users (checking for admin is done via RLS or app logic usually, but here functions are SECURITY DEFINER, so we rely on the caller to be authorized, but standard practice is to grant execute)
GRANT EXECUTE ON FUNCTION get_daily_active_users_last_30d TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_frequency_last_30d TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_10_events_last_30d TO authenticated;
GRANT EXECUTE ON FUNCTION get_avg_events_per_user_last_30d TO authenticated;
GRANT EXECUTE ON FUNCTION get_distinct_event_names TO authenticated;
