import { createContext, useContext, ReactNode, useState } from 'react'
import { useVinylCollection } from '@/hooks/use-vinyl-collection'

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
