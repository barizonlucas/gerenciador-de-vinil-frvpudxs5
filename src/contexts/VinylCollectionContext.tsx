import { createContext, useContext, ReactNode, useState } from 'react'
import { useVinylCollection } from '@/hooks/use-vinyl-collection'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { RecordForm } from '@/components/modals/RecordForm'
import { AddRecordByPhotoModal } from '@/components/modals/AddRecordByPhotoModal'
import { toast } from 'sonner'

type UseVinylCollectionType = ReturnType<typeof useVinylCollection>

interface VinylCollectionContextType extends UseVinylCollectionType {
  isAddModalOpen: boolean
  openAddModal: () => void
  closeAddModal: () => void
  isAddByPhotoModalOpen: boolean
  openAddByPhotoModal: () => void
  closeAddByPhotoModal: () => void
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

  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)
  const openAddByPhotoModal = () => setIsAddByPhotoModalOpen(true)
  const closeAddByPhotoModal = () => setIsAddByPhotoModalOpen(false)

  const value: VinylCollectionContextType = {
    ...collection,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    isAddByPhotoModalOpen,
    openAddByPhotoModal,
    closeAddByPhotoModal,
  }

  return (
    <VinylCollectionContext.Provider value={value}>
      {children}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <RecordForm
            onSubmit={async (data) => {
              try {
                await collection.addRecord(data)
                toast.success('Disco adicionado com sucesso!')
                closeAddModal()
              } catch (error) {
                toast.error('Falha ao adicionar o disco.')
              }
            }}
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
