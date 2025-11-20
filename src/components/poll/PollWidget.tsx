import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Vote } from 'lucide-react'
import { usePoll } from '@/hooks/use-poll'
import { PollDialog } from './PollDialog'
import { logEvent } from '@/services/telemetry'
import { useAuth } from '@/contexts/AuthContext'
import { getLatestAdminReplyAt, LAST_REPLY_SEEN_KEY } from '@/services/messages'

export const PollWidget = () => {
  const {
    poll,
    loading,
    error,
    showNewBadge,
    handleVote,
    fetchPoll,
    markAsInteracted,
  } = usePoll()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [hasMessageAlert, setHasMessageAlert] = useState(false)
  const [latestReplyAt, setLatestReplyAt] = useState<string | null>(null)
  const { user } = useAuth()

  const checkReplyAlerts = useCallback(async () => {
    if (!user) {
      setHasMessageAlert(false)
      setLatestReplyAt(null)
      return
    }
    try {
      if (typeof window === 'undefined') return
      const latest = await getLatestAdminReplyAt()
      setLatestReplyAt(latest)
      if (!latest) {
        setHasMessageAlert(false)
        return
      }
      const lastSeen = localStorage.getItem(LAST_REPLY_SEEN_KEY)
      if (!lastSeen || new Date(latest) > new Date(lastSeen)) {
        setHasMessageAlert(true)
      } else {
        setHasMessageAlert(false)
      }
    } catch (error) {
      console.error('Failed to check message replies:', error)
    }
  }, [user])

  useEffect(() => {
    checkReplyAlerts()
  }, [checkReplyAlerts])

  useEffect(() => {
    if (!isDialogOpen) {
      checkReplyAlerts()
    }
  }, [isDialogOpen, checkReplyAlerts])

  const handleMessagesViewed = useCallback(
    (timestamp?: string | null) => {
      if (!user || typeof window === 'undefined') return
      const value = timestamp ?? latestReplyAt ?? new Date().toISOString()
      localStorage.setItem(LAST_REPLY_SEEN_KEY, value)
      setHasMessageAlert(false)
      if (timestamp) {
        setLatestReplyAt(timestamp)
      }
    },
    [user, latestReplyAt],
  )

  const handleOpenDialog = () => {
    markAsInteracted()
    setIsDialogOpen(true)
    logEvent('poll_widget_opened', { poll_id: poll?.id })
  }

  if (loading || error || !poll) {
    return null
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={handleOpenDialog}
          className="relative h-14 w-14 rounded-full shadow-lg md:h-auto md:w-auto md:px-6 md:py-3"
        >
          <Vote className="h-6 w-6 md:mr-2" />
          <span className="hidden md:inline">Opine no Teko</span>
          {showNewBadge && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative">!</span>
            </span>
          )}
          {hasMessageAlert && (
            <span className="absolute -bottom-1 -left-1 h-4 w-4 rounded-full border-2 border-background bg-terracotaEscuro" />
          )}
        </Button>
      </div>
      <PollDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        pollData={poll}
        loading={loading}
        error={error}
        onVote={handleVote}
        onRetry={fetchPoll}
        onMessagesViewed={handleMessagesViewed}
      />
    </>
  )
}
