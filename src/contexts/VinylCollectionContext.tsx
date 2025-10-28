import { createContext, useContext, ReactNode, useState } from 'react'
import { useVinylCollection } from '@/hooks/use-vinyl-collection'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { RecordForm } from '@/components/modals/RecordForm'
type UseVinylCollectionType = ReturnType<typeof useVinylCollection>

interface VinylCollectionContextType extends UseVinylCollectionType {
  isAddModalOpen: boolean
  openAddModal: () => void
  closeAddModal: () => void
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

  const openAddModal = () => setIsAddModalOpen(true)
  const closeAddModal = () => setIsAddModalOpen(false)

  const value: VinylCollectionContextType = {
    ...collection,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
  }

  return (
    <VinylCollectionContext.Provider value={value}>
      {children}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-lg">
          <RecordForm
            onSubmit={async (data) => {
              await collection.addRecord(data)
              setIsAddModalOpen(false)
            }}
            onCancel={closeAddModal}
            submitButtonText="Adicionar"
          />
        </DialogContent>
      </Dialog>
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
