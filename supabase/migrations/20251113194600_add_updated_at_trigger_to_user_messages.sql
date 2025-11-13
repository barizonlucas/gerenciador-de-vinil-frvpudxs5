-- Create a trigger to automatically update the 'updated_at' timestamp on any row update.
-- This reuses the 'trigger_set_timestamp' function defined in a previous migration.
DROP TRIGGER IF EXISTS on_user_messages_updated ON public.user_messages;
CREATE TRIGGER on_user_messages_updated
BEFORE UPDATE ON public.user_messages
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();
