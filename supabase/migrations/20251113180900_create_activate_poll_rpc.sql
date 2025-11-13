-- This function atomically activates a new poll while deactivating any existing active poll.
-- This prevents race conditions and ensures the unique index constraint is never violated.
CREATE OR REPLACE FUNCTION public.activate_feature_poll(p_poll_id uuid)
RETURNS void AS $$
BEGIN
  -- Deactivate any currently active poll in the same transaction.
  UPDATE public.feature_polls
  SET is_active = false
  WHERE is_active = true;

  -- Activate the specified poll.
  UPDATE public.feature_polls
  SET is_active = true
  WHERE id = p_poll_id;
END;
$$ LANGUAGE plpgsql;
