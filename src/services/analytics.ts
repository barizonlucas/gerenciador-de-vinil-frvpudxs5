import { supabase } from '@/lib/supabase/client'
import {
  DailyActiveUser,
  EventFrequency,
  TopEvent,
  AvgEventsPerUser,
  DistinctEventName,
} from '@/types/analytics'

export const fetchDailyActiveUsers = async (): Promise<DailyActiveUser[]> => {
  const { data, error } = await supabase.rpc('get_daily_active_users_last_30d')
  if (error) {
    console.error('Error fetching daily active users:', error)
    throw error
  }
  return data as DailyActiveUser[]
}

export const fetchEventFrequency = async (
  eventName: string,
): Promise<EventFrequency[]> => {
  const { data, error } = await supabase.rpc('get_event_frequency_last_30d', {
    p_event_name: eventName,
  })
  if (error) {
    console.error('Error fetching event frequency:', error)
    throw error
  }
  return data as EventFrequency[]
}

export const fetchTopEvents = async (): Promise<TopEvent[]> => {
  const { data, error } = await supabase.rpc('get_top_10_events_last_30d')
  if (error) {
    console.error('Error fetching top events:', error)
    throw error
  }
  return data as TopEvent[]
}

export const fetchAvgEventsPerUser = async (): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_avg_events_per_user_last_30d')
    .single()
  if (error) {
    console.error('Error fetching average events per user:', error)
    throw error
  }
  return (data as AvgEventsPerUser).average_events_per_user
}

export const fetchDistinctEventNames = async (): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_distinct_event_names')
  if (error) {
    console.error('Error fetching distinct event names:', error)
    throw error
  }
  return (data as DistinctEventName[]).map((item) => item.event_name)
}
