import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import type { ActivePollData, UserVote } from '@/services/polls'
import type { PollOption } from '@/types/poll'

interface PollDialogProps {
  isOpen: boolean
  onClose: () => void
  pollData: ActivePollData | null
  loading: boolean
  error: string | null
  onVote: (optionId: string) => Promise<void>
  onRetry: () => void
}

export const PollDialog = ({
  isOpen,
  onClose,
  pollData,
  loading,
  error,
  onVote,
  onRetry,
}: PollDialogProps) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(
    undefined,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isOnline = useOnlineStatus()

  const userVote = pollData?.userVote
  const options = pollData?.options ?? []

  useEffect(() => {
    if (isOpen) {
      setSelectedOptionId(userVote?.option_id)
    } else {
      // Reset state on close
      setIsSubmitting(false)
    }
  }, [isOpen, userVote])

  const handleSubmit = async () => {
    if (!selectedOptionId) return
    setIsSubmitting(true)
    try {
      await onVote(selectedOptionId)
      // Don't close on success, the dialog state will update
    } catch {
      // Error toast is handled in the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const isVoteChanged =
    selectedOptionId && selectedOptionId !== userVote?.option_id
  const isSubmitDisabled =
    !selectedOptionId ||
    isSubmitting ||
    !isOnline ||
    (!!userVote && !isVoteChanged)

  const ctaText = userVote ? 'Alterar voto' : 'Votar'

  const renderContent = () => {
    if (loading) {
      return <PollSkeleton />
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={onRetry}>Tentar novamente</Button>
        </div>
      )
    }
    if (!pollData || options.length !== 3) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Enquete indisponível. Tente mais tarde.
        </div>
      )
    }

    return (
      <RadioGroup
        value={selectedOptionId}
        onValueChange={setSelectedOptionId}
        className="space-y-3 py-4"
      >
        {options.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            userVote={userVote}
            isSelected={selectedOptionId === option.id}
          />
        ))}
      </RadioGroup>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pollData?.title ?? 'Opine no Teko'}</DialogTitle>
          <DialogDescription>
            Sua opinião ajuda a definir as próximas novidades.
            {userVote && (
              <span className="mt-2 block font-semibold text-primary">
                Você votou na opção: {userVote.option_key}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Tooltip open={!isOnline ? undefined : false}>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {ctaText}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Conecte-se para votar</p>
            </TooltipContent>
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const OptionCard = ({
  option,
  userVote,
  isSelected,
}: {
  option: PollOption
  userVote: UserVote | null
  isSelected: boolean
}) => {
  const isCurrentVote = userVote?.option_id === option.id
  return (
    <Card
      className={`transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader className="flex flex-row items-start gap-4 p-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-base font-bold">
              {option.option_key}
            </Badge>
            <p className="font-semibold">{option.title}</p>
            {isCurrentVote && <Badge variant="secondary">Seu voto atual</Badge>}
          </div>
          {option.short_desc && (
            <p className="text-sm text-muted-foreground pt-1">
              {option.short_desc}
            </p>
          )}
        </div>
        <RadioGroupItem value={option.id} id={option.id} />
      </CardHeader>
    </Card>
  )
}

const PollSkeleton = () => (
  <div className="space-y-3 py-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-8 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </CardContent>
      </Card>
    ))}
  </div>
)
