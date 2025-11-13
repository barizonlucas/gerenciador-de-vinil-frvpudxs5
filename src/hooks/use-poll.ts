import { useState, useEffect, useCallback } from 'react'
import {
  getActivePoll,
  submitVote,
  updateVote,
  ActivePollData,
} from '@/services/polls'
import { toast } from 'sonner'
import { logEvent } from '@/services/telemetry'

const POLL_INTERACTED_KEY_PREFIX = 'teko_poll_interacted_'

export const usePoll = () => {
  const [poll, setPoll] = useState<ActivePollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewBadge, setShowNewBadge] = useState(false)

  const getInteractionKey = (pollId: string) =>
    `${POLL_INTERACTED_KEY_PREFIX}${pollId}`

  const fetchPoll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getActivePoll()
      setPoll(data)
      if (data && !data.userVote) {
        const hasInteracted = localStorage.getItem(getInteractionKey(data.id))
        if (!hasInteracted) {
          setShowNewBadge(true)
        }
      } else {
        setShowNewBadge(false)
      }
    } catch (err: any) {
      setError('Não foi possível carregar a enquete.')
      logEvent('poll_load_error', { reason: err.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPoll()
  }, [fetchPoll])

  const markAsInteracted = useCallback(() => {
    if (poll) {
      localStorage.setItem(getInteractionKey(poll.id), 'true')
      setShowNewBadge(false)
    }
  }, [poll])

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!poll) return

      const previousVote = poll.userVote
      const selectedOption = poll.options.find((o) => o.id === optionId)
      if (!selectedOption) return

      try {
        // submitVote handles both insert and update on conflict
        await submitVote(poll.id, optionId)

        if (previousVote && previousVote.option_id !== optionId) {
          logEvent('poll_vote_changed', {
            poll_id: poll.id,
            from_key: previousVote.option_key,
            to_key: selectedOption.option_key,
          })
          toast.success('Voto alterado com sucesso!')
        } else if (!previousVote) {
          logEvent('poll_voted', {
            poll_id: poll.id,
            option_key: selectedOption.option_key,
          })
          toast.success('Obrigado por votar!')
        }

        await fetchPoll()
      } catch (err: any) {
        toast.error('Ocorreu um erro ao registrar seu voto.')
        logEvent('poll_vote_error', {
          poll_id: poll.id,
          option_id: optionId,
          reason: err.message,
        })
        // Re-throw to allow caller to handle UI state (e.g., isSubmitting)
        throw err
      }
    },
    [poll, fetchPoll],
  )

  return {
    poll,
    loading,
    error,
    showNewBadge,
    handleVote,
    fetchPoll,
    markAsInteracted,
  }
}
