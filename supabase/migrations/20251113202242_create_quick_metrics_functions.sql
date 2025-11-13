-- This migration creates a set of PostgreSQL functions to efficiently query
-- key performance indicators (KPIs) for the admin dashboard's "Métricas rápidas" section.
-- Each function is designed to be called via Supabase RPC.

-- Function to get the total count of widget opens in the last 7 days.
create or replace function get_quick_metrics_widget_opens_7d()
returns table(count bigint)
language plpgsql
as $
begin
  return query
  select count(*) from public.app_events
  where event_name = 'poll_widget_opened'
  and created_at >= now() - interval '7 days';
end;
$;

-- Function to calculate the vote conversion rate in the last 7 days.
-- Conversion is defined as the percentage of users who opened the widget and then voted.
create or replace function get_quick_metrics_vote_conversion_7d()
returns table(conversion_pct numeric)
language plpgsql
as $
begin
  return query
  with opens as (
    select distinct user_id
    from public.app_events
    where event_name = 'poll_widget_opened'
      and created_at >= now() - interval '7 days'
      and user_id is not null
  ),
  voters as (
    select distinct user_id
    from public.app_events
    where event_name = 'poll_voted'
      and created_at >= now() - interval '7 days'
      and user_id is not null
  )
  select
    case when (select count(*) from opens) = 0
      then 0
      else round(100.0 * (select count(*) from voters)::numeric / (select count(*) from opens), 2)
    end;
end;
$;

-- Function to calculate the percentage of votes that were changed in the last 7 days.
create or replace function get_quick_metrics_vote_change_pct_7d()
returns table(pct_over_votes numeric)
language plpgsql
as $
begin
  return query
  select
    round(100.0 * count(*)::numeric /
      nullif((select count(*) from app_events where event_name='poll_voted' and created_at >= now() - interval '7 days'),0), 2)
  from app_events
  where event_name = 'poll_vote_changed'
    and created_at >= now() - interval '7 days';
end;
$;

-- Function to get the total count of messages received in the last 7 days.
create or replace function get_quick_metrics_messages_received_7d()
returns table(count bigint)
language plpgsql
as $
begin
  return query
  select count(*) from public.user_messages
  where created_at >= now() - interval '7 days';
end;
$;

-- Function to calculate the average time to the first reply for user messages, in minutes.
create or replace function get_quick_metrics_avg_first_reply_time()
returns table(avg_minutes numeric)
language plpgsql
as $
begin
  return query
  with first_reply as (
    select
      m.id as message_id,
      min(r.created_at) as first_reply_at
    from public.user_messages m
    join public.user_message_replies r on r.message_id = m.id
    group by m.id
  )
  select
    round(avg(extract(epoch from (f.first_reply_at - m.created_at)))/60.0, 1)
  from public.user_messages m
  join first_reply f on f.message_id = m.id;
end;
$;

-- Function to provide data for the widget opens chart (last 14 days).
create or replace function get_quick_metrics_widget_opens_chart_14d()
returns table(dia date, count bigint)
language plpgsql
as $
begin
  return query
  select
    date_trunc('day', created_at)::date as dia,
    count(*) as count
  from public.app_events
  where event_name = 'poll_widget_opened'
    and created_at >= now() - interval '14 days'
  group by 1
  order by 1;
end;
$;

-- Function to provide data for the messages received chart (last 14 days).
create or replace function get_quick_metrics_messages_chart_14d()
returns table(dia date, count bigint)
language plpgsql
as $
begin
  return query
  select
    date_trunc('day', created_at)::date as dia,
    count(*) as count
  from public.user_messages
  where created_at >= now() - interval '14 days'
  group by 1
  order by 1;
end;
$;

