-- Create the app_events table to store telemetry data.
create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,                           -- null if public/unauthenticated event
  event_name text not null,                    -- e.g., 'poll_voted'
  event_props jsonb not null default '{}'::jsonb,  -- payload
  source text not null default 'web',          -- e.g., 'web', 'admin'
  created_at timestamptz not null default now()
);

-- Add comments for clarity on the table and its columns.
comment on table public.app_events is 'Stores telemetry events from the application for analytics.';
comment on column public.app_events.user_id is 'The user associated with the event. Can be null for system or unauthenticated events.';
comment on column public.app_events.event_name is 'A unique name identifying the event, e.g., ''poll_voted''.';
comment on column public.app_events.event_props is 'A JSONB object containing metadata about the event.';
comment on column public.app_events.source is 'The source of the event, e.g., ''web'' for the main app, ''admin'' for the admin panel.';

-- Create indexes to optimize query performance.
create index if not exists app_events_name_idx on public.app_events (event_name);
create index if not exists app_events_created_idx on public.app_events (created_at);
create index if not exists app_events_user_idx on public.app_events (user_id);

-- Enable Row Level Security on the app_events table.
alter table public.app_events enable row level security;

-- RLS Policy: Allow logged-in users to insert their own events.
-- This also allows for unauthenticated (user_id is null) events to be inserted.
drop policy if exists user_can_insert_own_events on public.app_events;
create policy user_can_insert_own_events
on public.app_events
for insert
with check (
  (user_id is null) or (user_id = auth.uid())
);

-- RLS Policy: Allow only administrators to select all events.
-- This protects user activity data from being accessed by non-admin users.
drop policy if exists admin_can_select_all_events on public.app_events;
create policy admin_can_select_all_events
on public.app_events
for select
using (is_admin());
