import { useState, useEffect, useCallback } from 'react'
import { getActivePoll, submitVote, ActivePollData } from '@/services/polls'
import { toast } from 'sonner'
import { logEvent } from '@/services/telemetry'

const POLL_INTERACTED_KEY = 'teko-poll-interacted'

export const usePoll = () => {
  const [poll, setPoll] = useState<ActivePollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewBadge, setShowNewBadge] = useState(false)

  const fetchPoll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getActivePoll()
      setPoll(data)
      if (data) {
        const hasInteracted = localStorage.getItem(POLL_INTERACTED_KEY)
        setShowNewBadge(!hasInteracted)
      }
    } catch (err: any) {
      setError('Não foi possível carregar a enquete. Tente mais tarde.')
      logEvent('poll_load_error', { reason: err.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPoll()
  }, [fetchPoll])

  const markAsInteracted = () => {
    localStorage.setItem(POLL_INTERACTED_KEY, 'true')
    setShowNewBadge(false)
  }

  const handleVote = async (optionId: string) => {
    if (!poll) return
    try {
      const result = await submitVote(poll.id, optionId)
      const selectedOption = poll.options.find((o) => o.id === optionId)

      if (result.isNew) {
        toast.success('✅ Voto computado. Obrigado!')
        logEvent('poll_voted', {
          poll_id: poll.id,
          option_key: selectedOption?.option_key,
        })
      } else {
        toast.success('✅ Voto alterado com sucesso!')
        const previousOption = poll.options.find(
          (o) => o.id === result.previousOptionId,
        )
        logEvent('poll_vote_changed', {
          poll_id: poll.id,
          from_key: previousOption?.option_key,
          to_key: selectedOption?.option_key,
        })
      }
      markAsInteracted()
      await fetchPoll() // Refresh poll data to show new vote
    } catch (err: any) {
      toast.error('Não foi possível registrar seu voto. Tente novamente.')
      logEvent('poll_vote_error', {
        poll_id: poll.id,
        reason: err.message,
      })
      throw err
    }
  }

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
