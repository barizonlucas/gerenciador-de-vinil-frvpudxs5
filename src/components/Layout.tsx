import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useState } from 'react'
import { AddRecordModal } from '@/components/modals/AddRecordModal'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'

export default function Layout() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { addRecord } = useVinylContext()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-secondary">
        <AppSidebar onAddRecord={() => setIsAddModalOpen(true)} />
        <div className="flex flex-1 flex-col bg-background md:pl-72">
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <AddRecordModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddRecord={(record) => {
            addRecord(record)
            setIsAddModalOpen(false)
          }}
        />
      </div>
    </SidebarProvider>
  )
}
