import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { VinylRecord } from '@/types/vinyl'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  record: VinylRecord | null
  onConfirmDelete: (id: string) => void
}

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  record,
  onConfirmDelete,
}: DeleteConfirmationModalProps) => {
  if (!record) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-2xl shadow-modal data-[state=open]:animate-scale-up">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o disco "{record.albumTitle}" de sua
            coleção? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} className="rounded-full">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmDelete(record.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
