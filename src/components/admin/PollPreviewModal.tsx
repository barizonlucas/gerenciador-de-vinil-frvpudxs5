import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Poll } from '@/types/poll'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PollPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  poll: Poll | null
}

export const PollPreviewModal = ({
  isOpen,
  onClose,
  poll,
}: PollPreviewModalProps) => {
  if (!poll) return null

  const optionLetters = ['A', 'B', 'C']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pré-visualização da Enquete</DialogTitle>
          <DialogDescription>
            É assim que os colecionadores verão a enquete de prioridades.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-lg">{poll.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {poll.options && poll.options.length > 0 ? (
                poll.options.map((option, index) => (
                  <div
                    key={option.id || `option-${index}`}
                    className="flex items-start gap-4 rounded-lg border p-3"
                  >
                    <Badge
                      variant="outline"
                      className="text-lg font-bold h-8 w-8 flex items-center justify-center"
                    >
                      {optionLetters[index]}
                    </Badge>
                    <div className="flex-1">
                      <p className="font-semibold">{option.title}</p>
                      {option.short_desc && (
                        <p className="text-sm text-muted-foreground">
                          {option.short_desc}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Esta enquete não possui opções para exibir.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
