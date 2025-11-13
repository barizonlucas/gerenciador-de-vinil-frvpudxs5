-- This index ensures that only one poll can be active (is_active = true) at any given time.
-- The WHERE clause creates a partial index, which only includes rows that meet the condition.
-- The uniqueness constraint is then applied only to this subset of rows.
CREATE UNIQUE INDEX IF NOT EXISTS feature_polls_only_one_active
ON public.feature_polls (is_active)
WHERE (is_active = true);
