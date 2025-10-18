import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RecordForm } from './RecordForm'
import { VinylRecord } from '@/types/vinyl'

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onAddRecord: (data: Omit<VinylRecord, 'id'>) => void
}

export const AddRecordModal = ({
  isOpen,
  onClose,
  onAddRecord,
}: AddRecordModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl shadow-modal data-[state=open]:animate-scale-up">
        <DialogHeader>
          <DialogTitle className="text-2xl">Adicionar Novo Disco</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para adicionar um novo disco à sua
            coleção.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RecordForm
            onSubmit={onAddRecord}
            onCancel={onClose}
            submitButtonText="Salvar Disco"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
