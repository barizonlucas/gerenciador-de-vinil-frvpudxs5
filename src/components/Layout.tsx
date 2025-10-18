import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useState } from 'react'
import { AddRecordModal } from '@/components/modals/AddRecordModal'
import { useVinylContext } from '@/contexts/VinylCollectionContext'

export default function Layout() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { addRecord } = useVinylContext()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onAddRecord={() => setIsAddModalOpen(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AddRecordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRecord={(record) => {
          addRecord(record)
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}
