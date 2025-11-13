import { useState, useEffect, useCallback } from 'react'
import {
  getActivePoll,
  submitVote,
  updateVote,
  type ActivePollData,
} from '@/services/polls'
import { toast } from 'sonner'
import { logEvent } from '@/services/telemetry'
import { useAuth } from '@/contexts/AuthContext'

const POLL_INTERACTION_KEY = 'teko_poll_interaction'

export const usePoll = () => {
  const { user } = useAuth()
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
      if (!data) {
        setShowNewBadge(false)
      }
    } catch (err) {
      setError('Não foi possível carregar a enquete. Tente novamente.')
      logEvent('poll_load_error', { reason: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPoll()
  }, [fetchPoll])

  useEffect(() => {
    if (poll) {
      try {
        const lastInteraction = localStorage.getItem(
          `${POLL_INTERACTION_KEY}_${poll.id}`,
        )
        if (!lastInteraction) {
          setShowNewBadge(true)
        } else {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          if (new Date(lastInteraction) < sevenDaysAgo) {
            setShowNewBadge(true)
          } else {
            setShowNewBadge(false)
          }
        }
      } catch (e) {
        console.error('Failed to read from localStorage', e)
        setShowNewBadge(true)
      }
    }
  }, [poll])

  const markAsInteracted = useCallback(() => {
    if (poll) {
      try {
        localStorage.setItem(
          `${POLL_INTERACTION_KEY}_${poll.id}`,
          new Date().toISOString(),
        )
        setShowNewBadge(false)
      } catch (e) {
        console.error('Failed to write to localStorage', e)
      }
    }
  }, [poll])

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!poll) return

      const originalVote = poll.userVote
      const selectedOption = poll.options.find((o) => o.id === optionId)
      if (!selectedOption) return

      // Optimistic update
      const newVote = {
        id: originalVote?.id ?? 'temp-id',
        option_id: optionId,
        option_key: selectedOption.option_key,
      }
      setPoll((prev) => (prev ? { ...prev, userVote: newVote } : null))

      try {
        if (originalVote) {
          await updateVote(originalVote.id, optionId)
          toast.success('✅ Voto atualizado.')
          logEvent('poll_vote_changed', {
            user_id: user?.id,
            poll_id: poll.id,
            from_key: originalVote.option_key,
            to_key: selectedOption.option_key,
          })
        } else {
          const { voteId } = await submitVote(poll.id, optionId)
          setPoll((prev) =>
            prev ? { ...prev, userVote: { ...newVote, id: voteId } } : null,
          )
          toast.success('✅ Obrigado! Seu voto ajuda a priorizar o Teko.')
          logEvent('poll_voted', {
            user_id: user?.id,
            poll_id: poll.id,
            option_key: selectedOption.option_key,
          })
        }
        markAsInteracted()
      } catch (err) {
        // Revert optimistic update on error
        setPoll((prev) => (prev ? { ...prev, userVote: originalVote } : null))
        toast.error('Não foi possível votar agora. Tente novamente.')
        logEvent('poll_vote_error', {
          user_id: user?.id,
          poll_id: poll.id,
          reason: (err as Error).message,
        })
        throw err // Re-throw to be caught by the component
      }
    },
    [poll, user, markAsInteracted],
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
