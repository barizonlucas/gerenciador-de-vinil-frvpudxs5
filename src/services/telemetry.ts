import { supabase } from '@/lib/supabase/client'

export type TelemetryEvent =
  // Collector Events
  | 'poll_widget_opened'
  | 'poll_option_selected'
  | 'poll_voted'
  | 'poll_vote_changed'
  | 'message_opened'
  | 'message_sent'
  | 'message_send_failed'
  // Admin Events
  | 'admin_accessed'
  | 'admin_poll_ranking_viewed'
  | 'admin_poll_ranking_refreshed'
  | 'admin_message_opened'
  | 'admin_message_replied'
  | 'admin_message_status_changed'
  | 'admin_poll_created'
  | 'admin_poll_updated'
  | 'admin_poll_activated'
  | 'admin_poll_deactivated'
  // Error Events
  | 'poll_load_error'
  | 'poll_vote_error'
  | 'poll_vote_conflict'

type TelemetrySource = 'web' | 'admin'

/**
 * Logs a telemetry event to the app_events table.
 * This is a best-effort function and will not throw errors.
 * @param eventName The name of the event to log.
 * @param props Additional properties for the event.
 * @param source The source of the event (e.g., 'web', 'admin').
 */
export const logEvent = async (
  eventName: TelemetryEvent,
  props: Record<string, any> = {},
  source: TelemetrySource = 'web',
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from('app_events').insert([
      {
        user_id: user?.id ?? null,
        event_name: eventName,
        event_props: props,
        source,
      },
    ])

    if (error) {
      // Log to console but don't block the user experience
      console.error(`[Telemetry] Failed to log event "${eventName}":`, error)
    }
  } catch (error) {
    console.error(
      `[Telemetry] An unexpected error occurred while logging event "${eventName}":`,
      error,
    )
  }
}
