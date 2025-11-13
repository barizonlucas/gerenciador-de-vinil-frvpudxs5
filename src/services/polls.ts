import { supabase } from '@/lib/supabase/client'
import { Poll, PollOption } from '@/types/poll'

export const getPollData = async (): Promise<Poll | null> => {
  // First, try to get the active poll
  let { data: poll, error } = await supabase
    .from('feature_polls')
    .select('*')
    .eq('is_active', true)
    .single()

  // If no active poll, get the most recently updated draft
  if (error || !poll) {
    const { data: latestDraft, error: draftError } = await supabase
      .from('feature_polls')
      .select('*')
      .eq('is_active', false)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (draftError && draftError.code !== 'PGRST116') {
      console.error('Error fetching latest poll draft:', draftError)
      throw draftError
    }
    poll = latestDraft
  }

  if (!poll) {
    return null
  }

  // Fetch options for the poll
  const { data: options, error: optionsError } = await supabase
    .from('feature_poll_options')
    .select('*')
    .eq('poll_id', poll.id)
    .order('created_at', { ascending: true })

  if (optionsError) {
    console.error('Error fetching poll options:', optionsError)
    throw optionsError
  }

  return { ...poll, options: options || [] }
}

export const upsertPoll = async (
  pollData: Partial<Poll>,
): Promise<Poll | null> => {
  const { options, ...pollFields } = pollData

  // Upsert the poll
  const { data: savedPoll, error: pollError } = await supabase
    .from('feature_polls')
    .upsert(pollFields)
    .select()
    .single()

  if (pollError) {
    console.error('Error upserting poll:', pollError)
    throw pollError
  }

  if (!options || options.length === 0) {
    return { ...savedPoll, options: [] }
  }

  // Upsert the options
  const optionsToUpsert = options.map((opt) => ({
    ...opt,
    poll_id: savedPoll.id,
  }))

  const { data: savedOptions, error: optionsError } = await supabase
    .from('feature_poll_options')
    .upsert(optionsToUpsert)
    .select()
    .order('created_at', { ascending: true })

  if (optionsError) {
    console.error('Error upserting poll options:', optionsError)
    throw optionsError
  }

  return { ...savedPoll, options: savedOptions }
}

export const activatePoll = async (pollId: string): Promise<void> => {
  const { error } = await supabase.rpc('activate_feature_poll', {
    p_poll_id: pollId,
  })
  if (error) {
    console.error('Error activating poll:', error)
    throw error
  }
}

export const deactivatePoll = async (pollId: string): Promise<void> => {
  const { error } = await supabase
    .from('feature_polls')
    .update({ is_active: false })
    .eq('id', pollId)

  if (error) {
    console.error('Error deactivating poll:', error)
    throw error
  }
}
