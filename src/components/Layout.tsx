import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { toast } from 'sonner'
import { VinylRecord } from '@/types/vinyl'

export default function Layout() {
  const { isAddModalOpen, closeAddModal, addRecord } = useVinylContext()

  const handleAddRecord = async (
    recordData: Omit<VinylRecord, 'id' | 'user_id'>,
  ) => {
    try {
      await addRecord(recordData)
      toast.success('Disco adicionado com sucesso!')
      closeAddModal()
    } catch (error) {
      toast.error('Falha ao adicionar o disco. Tente novamente.')
      console.error('Failed to add record:', error)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
