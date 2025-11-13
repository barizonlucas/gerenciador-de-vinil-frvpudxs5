-- Create feature polls table
CREATE TABLE IF NOT EXISTS public.feature_polls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create feature poll options table
CREATE TABLE IF NOT EXISTS public.feature_poll_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.feature_polls(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create feature poll votes table
CREATE TABLE IF NOT EXISTS public.feature_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id UUID NOT NULL REFERENCES public.feature_polls(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.feature_poll_options(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(poll_id, user_id) -- A user can only vote once per poll
);

-- Create user messages table
CREATE TABLE IF NOT EXISTS public.user_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user message replies table
CREATE TABLE IF NOT EXISTS public.user_message_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.user_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Admin user ID
    reply_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_message_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS profiles_admin_read ON public.profiles;
CREATE POLICY profiles_admin_read ON public.profiles
FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update ON public.profiles
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for admin tables (Admins can do anything)
DROP POLICY IF EXISTS admin_all_access_polls ON public.feature_polls;
CREATE POLICY admin_all_access_polls ON public.feature_polls FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS admin_all_access_poll_options ON public.feature_poll_options;
CREATE POLICY admin_all_access_poll_options ON public.feature_poll_options FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS admin_all_access_user_messages ON public.user_messages;
CREATE POLICY admin_all_access_user_messages ON public.user_messages FOR ALL USING (is_admin()) WITH CHECK (is_admin());
DROP POLICY IF EXISTS admin_all_access_user_message_replies ON public.user_message_replies;
CREATE POLICY admin_all_access_user_message_replies ON public.user_message_replies FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- RLS Policies for regular users
-- Users can read active polls and their options
DROP POLICY IF EXISTS user_read_active_polls ON public.feature_polls;
CREATE POLICY user_read_active_polls ON public.feature_polls FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS user_read_poll_options ON public.feature_poll_options;
CREATE POLICY user_read_poll_options ON public.feature_poll_options FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.feature_polls p WHERE p.id = poll_id AND p.is_active = TRUE
    )
);

-- Users can manage their own votes
DROP POLICY IF EXISTS user_manage_own_votes ON public.feature_poll_votes;
CREATE POLICY user_manage_own_votes ON public.feature_poll_votes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can read all votes for a poll they voted in
DROP POLICY IF EXISTS user_read_votes_for_voted_poll ON public.feature_poll_votes;
CREATE POLICY user_read_votes_for_voted_poll ON public.feature_poll_votes FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.feature_poll_votes v WHERE v.poll_id = feature_poll_votes.poll_id AND v.user_id = auth.uid()
    )
);

-- Users can manage their own messages and see replies
DROP POLICY IF EXISTS user_manage_own_messages ON public.user_messages;
CREATE POLICY user_manage_own_messages ON public.user_messages FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_read_own_message_replies ON public.user_message_replies;
CREATE POLICY user_read_own_message_replies ON public.user_message_replies FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_messages m WHERE m.id = message_id AND m.user_id = auth.uid()
    )
);
