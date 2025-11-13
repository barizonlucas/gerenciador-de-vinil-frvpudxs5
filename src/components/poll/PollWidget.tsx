import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquarePlus, Vote } from 'lucide-react'
import { usePoll } from '@/hooks/use-poll'
import { PollDialog } from './PollDialog'
import { cn } from '@/lib/utils'

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

  const handleOpenDialog = () => {
    markAsInteracted()
    setIsDialogOpen(true)
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
      />
    </>
  )
}
