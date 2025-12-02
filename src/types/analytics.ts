export interface DailyActiveUser {
  day: string
  active_users_count: number
}

export interface EventFrequency {
  day: string
  event_count: number
}

export interface TopEvent {
  event_name: string
  total_count: number
}

export interface AvgEventsPerUser {
  average_events_per_user: number
}

export interface DistinctEventName {
  event_name: string
}
