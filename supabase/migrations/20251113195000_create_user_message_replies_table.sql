create table if not exists public.user_message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.user_messages(id) on delete cascade,
  admin_user_id uuid not null references auth.users(id) on delete cascade,
  reply text not null check (char_length(reply) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.user_message_replies.admin_user_id is 'FK to auth.users.id of the replying admin';

alter table public.user_message_replies enable row level security;

-- Create a trigger to automatically update the 'updated_at' timestamp on any row update.
create trigger on_user_message_replies_updated
before update on public.user_message_replies
for each row
execute function public.trigger_set_timestamp();

