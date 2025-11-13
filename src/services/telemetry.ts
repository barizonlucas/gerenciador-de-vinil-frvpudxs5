import { supabase } from '@/lib/supabase/client'

type TelemetryEvent =
  | 'admin_accessed'
  | 'admin_poll_created'
  | 'admin_poll_updated'
  | 'admin_poll_activated'
  | 'admin_poll_deactivated'
  | 'poll_widget_opened'
  | 'poll_option_selected'
  | 'poll_voted'
  | 'poll_vote_changed'
  | 'poll_load_error'
  | 'poll_vote_error'

interface TelemetryPayload {
  user_id?: string
  timestamp: string
  [key: string]: any
}

export const logEvent = async (
  eventName: TelemetryEvent,
  payload: Omit<TelemetryPayload, 'timestamp'>,
) => {
  const eventData: TelemetryPayload = {
    ...payload,
    timestamp: new Date().toISOString(),
  }

  // In a real application, this would send to a telemetry service.
  // For this implementation, we'll log to the console.
  console.log(`[TELEMETRY EVENT: ${eventName}]`, eventData)

  // Example of how it could integrate with a Supabase table if one existed
  /*
  const { error } = await supabase.from('telemetry_events').insert({
    event_name: eventName,
    payload: eventData,
  });

  if (error) {
    console.error('Failed to log telemetry event to Supabase:', error);
  }
  */
}
