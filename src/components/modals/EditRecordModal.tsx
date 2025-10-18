import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RecordForm } from './RecordForm'
import { VinylRecord } from '@/types/vinyl'

interface EditRecordModalProps {
  isOpen: boolean
  onClose: () => void
  record: VinylRecord | null
  onUpdateRecord: (data: VinylRecord) => void
}

export const EditRecordModal = ({
  isOpen,
  onClose,
  record,
  onUpdateRecord,
}: EditRecordModalProps) => {
  if (!record) return null

  const handleSubmit = (data: Omit<VinylRecord, 'id'>) => {
    onUpdateRecord({ ...data, id: record.id })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl shadow-modal data-[state=open]:animate-scale-up">
        <DialogHeader>
          <DialogTitle className="text-2xl truncate">
            Editar: {record.albumTitle}
          </DialogTitle>
          <DialogDescription>
            Atualize os detalhes do disco abaixo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RecordForm
            onSubmit={handleSubmit}
            onCancel={onClose}
            initialData={record}
            submitButtonText="Salvar Alterações"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
