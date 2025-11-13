-- Create a composite type to define the structure of the returned data.
-- This provides strong typing for the function's output.
DROP TYPE IF EXISTS public.poll_ranking_result CASCADE;
CREATE TYPE public.poll_ranking_result AS (
  option_key TEXT,
  option_title TEXT,
  votes_total BIGINT,
  pct_total NUMERIC,
  votes_7d BIGINT,
  votes_prev_7d BIGINT
);

-- Create the main function to calculate and return the active poll's ranking.
CREATE OR REPLACE FUNCTION public.get_active_poll_ranking_for_admin()
RETURNS TABLE (
  poll_id UUID,
  poll_title TEXT,
  ranking public.poll_ranking_result[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  active_poll RECORD;
BEGIN
  -- Find the currently active poll.
  SELECT id, title INTO active_poll FROM public.feature_polls WHERE is_active = TRUE LIMIT 1;

  -- If no poll is active, return an empty result set.
  IF active_poll.id IS NULL THEN
    RETURN;
  END IF;

  -- Use a temporary table to aggregate results before returning.
  CREATE TEMP TABLE temp_ranking ON COMMIT DROP AS
  WITH votes_in_range AS (
    -- Select all votes for the active poll with timestamps.
    SELECT
      v.option_id,
      v.created_at
    FROM public.feature_poll_votes v
    WHERE v.poll_id = active_poll.id
  ),
  aggregated_votes AS (
    -- Aggregate votes into total, last 7 days, and previous 7 days counts.
    SELECT
      o.id AS option_id,
      o.option_key,
      o.title AS option_title,
      COUNT(v.option_id)::BIGINT AS votes_total,
      COUNT(CASE WHEN v.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::BIGINT AS votes_7d,
      COUNT(CASE WHEN v.created_at < NOW() - INTERVAL '7 days' AND v.created_at >= NOW() - INTERVAL '14 days' THEN 1 END)::BIGINT AS votes_prev_7d
    FROM public.feature_poll_options o
    LEFT JOIN votes_in_range v ON o.id = v.option_id
    WHERE o.poll_id = active_poll.id
    GROUP BY o.id, o.option_key, o.title
  ),
  total_poll_votes AS (
    -- Calculate the total number of votes for the entire poll.
    SELECT COUNT(*)::BIGINT AS total_count FROM votes_in_range
  )
  -- Final selection and percentage calculation.
  SELECT
    av.option_key,
    av.option_title,
    av.votes_total,
    -- Calculate percentage, handling division by zero.
    CASE
      WHEN tpv.total_count > 0 THEN ROUND((av.votes_total::NUMERIC / tpv.total_count) * 100, 2)
      ELSE 0
    END AS pct_total,
    av.votes_7d,
    av.votes_prev_7d
  FROM aggregated_votes av, total_poll_votes tpv
  ORDER BY av.option_key;

  -- Return the final aggregated result.
  RETURN QUERY
  SELECT
    active_poll.id,
    active_poll.title,
    ARRAY(SELECT ROW(tr.option_key, tr.option_title, tr.votes_total, tr.pct_total, tr.votes_7d, tr.votes_prev_7d)::public.poll_ranking_result FROM temp_ranking tr);

END;
$$;

-- RLS Policy to allow admins to read all votes for aggregation purposes.
-- This is necessary for the get_active_poll_ranking_for_admin function to work correctly for admins.
DROP POLICY IF EXISTS admin_can_aggregate_votes ON public.feature_poll_votes;
CREATE POLICY admin_can_aggregate_votes
ON public.feature_poll_votes
FOR SELECT
USING (is_admin());
