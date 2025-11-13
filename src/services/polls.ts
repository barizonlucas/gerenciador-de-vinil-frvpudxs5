import { supabase } from '@/lib/supabase/client'
import { Poll, PollOption, UserVote } from '@/types/poll'
import { logEvent } from './telemetry'

export interface ActivePollData extends Poll {
  userVote: UserVote | null
}

// For Admin Panel
export const getPollData = async (): Promise<Poll | null> => {
  let { data: poll, error } = await supabase
    .from('feature_polls')
    .select('*')
    .eq('is_active', true)
    .single()

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

  if (!poll) return null

  const { data: options, error: optionsError } = await supabase
    .from('feature_poll_options')
    .select('*')
    .eq('poll_id', poll.id)
    .order('created_at', { ascending: true })

  if (optionsError) throw optionsError
  return { ...poll, options: options || [] }
}

// For Client Widget
export const getActivePoll = async (): Promise<ActivePollData | null> => {
  const { data: poll, error: pollError } = await supabase
    .from('feature_polls')
    .select('id, title, is_active, created_at, updated_at')
    .eq('is_active', true)
    .single()

  if (pollError && pollError.code !== 'PGRST116') throw pollError
  if (!poll) return null

  const { data: options, error: optionsError } = await supabase
    .from('feature_poll_options')
    .select('id, poll_id, title, short_desc, created_at, option_key')
    .eq('poll_id', poll.id)
    .order('option_key', { ascending: true })

  if (optionsError) throw optionsError

  const { data: vote, error: voteError } = await supabase
    .from('feature_poll_votes')
    .select('id, option_id, option:feature_poll_options(option_key)')
    .eq('poll_id', poll.id)
    .single()

  if (voteError && voteError.code !== 'PGRST116') throw voteError

  const userVote = vote
    ? {
        id: vote.id,
        option_id: vote.option_id,
        option_key: (vote.option as any)?.option_key ?? '',
      }
    : null

  return { ...poll, options: options || [], userVote }
}

export const submitVote = async (
  pollId: string,
  optionId: string,
): Promise<{ voteId: string }> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('feature_poll_votes')
    .insert({ poll_id: pollId, option_id: optionId, user_id: user.id })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      logEvent('poll_vote_conflict', {
        user_id: user.id,
        poll_id: pollId,
        option_id: optionId,
        reason: 'User already voted, attempting update.',
      })

      const { data: existingVote, error: selectError } = await supabase
        .from('feature_poll_votes')
        .select('id, option_id')
        .eq('poll_id', pollId)
        .eq('user_id', user.id)
        .single()

      if (selectError || !existingVote) {
        logEvent('poll_vote_error', {
          user_id: user.id,
          poll_id: pollId,
          error: 'Failed to find existing vote after conflict.',
        })
        throw (
          selectError || new Error('Failed to find existing vote to update.')
        )
      }

      if (existingVote.option_id === optionId) {
        return { voteId: existingVote.id } // No change needed
      }

      await updateVote(existingVote.id, optionId)
      logEvent('poll_vote_changed', {
        user_id: user.id,
        poll_id: pollId,
        previous_option_id: existingVote.option_id,
        new_option_id: optionId,
      })
      return { voteId: existingVote.id }
    }
    logEvent('poll_vote_error', {
      user_id: user.id,
      poll_id: pollId,
      option_id: optionId,
      error: error.message,
    })
    throw error
  }

  logEvent('poll_voted', {
    user_id: user.id,
    poll_id: pollId,
    option_id: optionId,
  })
  return { voteId: data.id }
}

export const updateVote = async (
  voteId: string,
  optionId: string,
): Promise<void> => {
  const { error } = await supabase
    .from('feature_poll_votes')
    .update({ option_id: optionId })
    .eq('id', voteId)
  if (error) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    logEvent('poll_vote_error', {
      user_id: user?.id,
      vote_id: voteId,
      error: `Failed to update vote: ${error.message}`,
    })
    throw error
  }
}

// For Admin Panel
export const upsertPoll = async (
  pollData: Partial<Poll>,
): Promise<Poll | null> => {
  const { options, ...pollFields } = pollData
  const { data: savedPoll, error: pollError } = await supabase
    .from('feature_polls')
    .upsert(pollFields)
    .select()
    .single()
  if (pollError) throw pollError
  if (!options || options.length === 0) return { ...savedPoll, options: [] }

  const optionsToUpsert = options.map((opt, i) => ({
    ...opt,
    poll_id: savedPoll.id,
    option_key: ['A', 'B', 'C'][i],
  }))

  const { data: savedOptions, error: optionsError } = await supabase
    .from('feature_poll_options')
    .upsert(optionsToUpsert)
    .select()
    .order('option_key', { ascending: true })
  if (optionsError) throw optionsError
  return { ...savedPoll, options: savedOptions }
}

export const activatePoll = async (pollId: string): Promise<void> => {
  const { error } = await supabase.rpc('activate_feature_poll', {
    p_poll_id: pollId,
  })
  if (error) throw error
}

export const deactivatePoll = async (pollId: string): Promise<void> => {
  const { error } = await supabase
    .from('feature_polls')
    .update({ is_active: false })
    .eq('id', pollId)
  if (error) throw error
}
