import { createContext, useContext, ReactNode } from 'react'
import { useVinylCollection } from '@/hooks/use-vinyl-collection'
import { VinylRecord } from '@/types/vinyl'

type VinylCollectionContextType = ReturnType<typeof useVinylCollection>

const VinylCollectionContext = createContext<
  VinylCollectionContextType | undefined
>(undefined)

export const VinylCollectionProvider = ({
  children,
}: {
  children: ReactNode
}) => {
  const collection = useVinylCollection()
  return (
    <VinylCollectionContext.Provider value={collection}>
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
