import { createContext, useContext, ReactNode, useState } from 'react'
import { useVinylCollection } from '@/hooks/use-vinyl-collection'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { RecordForm } from '@/components/modals/RecordForm'
import { AddRecordByPhotoModal } from '@/components/modals/AddRecordByPhotoModal'
import { toast } from 'sonner'
import { VinylRecord } from '@/types/vinyl'

type UseVinylCollectionType = ReturnType<typeof useVinylCollection>

interface VinylCollectionContextType extends UseVinylCollectionType {
  isAddModalOpen: boolean
  openAddModal: () => void
  closeAddModal: () => void
  isAddByPhotoModalOpen: boolean
  openAddByPhotoModal: () => void
  closeAddByPhotoModal: () => void
  recordToViewAfterAdd: VinylRecord | null
  clearRecordToViewAfterAdd: () => void
}

const VinylCollectionContext = createContext<
  VinylCollectionContextType | undefined
>(undefined)

export const VinylCollectionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const collection = useVinylCollection()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAddByPhotoModalOpen, setIsAddByPhotoModalOpen] = useState(false)
  const [recordToViewAfterAdd, setRecordToViewAfterAdd] =
    useState<VinylRecord | null>(null)

  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)
  const openAddByPhotoModal = () => setIsAddByPhotoModalOpen(true)
  const closeAddByPhotoModal = () => setIsAddByPhotoModalOpen(false)
  const clearRecordToViewAfterAdd = () => setRecordToViewAfterAdd(null)

  const handleAddRecord = async (data: Omit<VinylRecord, 'id' | 'user_id'>) => {
    try {
      const newRecord = await collection.addRecord(data)
      toast.success('Disco adicionado com sucesso!')
      closeAddModal()
      if (newRecord.master_id) {
        setRecordToViewAfterAdd(newRecord)
      }
    } catch (error) {
      toast.error('Não foi possível adicionar o disco. Tente novamente.')
      throw error
    }
  }

  const value: VinylCollectionContextType = {
    ...collection,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    isAddByPhotoModalOpen,
    openAddByPhotoModal,
    closeAddByPhotoModal,
    recordToViewAfterAdd,
    clearRecordToViewAfterAdd,
  }

  return (
    <VinylCollectionContext.Provider value={value}>
      {children}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Vinil</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do disco. Use a busca rápida para preencher
              automaticamente.
            </DialogDescription>
          </DialogHeader>
          <RecordForm
            onSubmit={handleAddRecord}
            onCancel={closeAddModal}
            submitButtonText="Adicionar Disco"
          />
        </DialogContent>
      </Dialog>
      <AddRecordByPhotoModal
        isOpen={isAddByPhotoModalOpen}
        onClose={closeAddByPhotoModal}
      />
    </VinylCollectionContext.Provider>
  )
}

export const useVinylContext = () => {
  const context = useContext(VinylCollectionContext)
  if (context === undefined) {
    throw new Error(
      'useVinylContext must be used within a VinylCollectionProvider',
    )
  }
  return context
}
