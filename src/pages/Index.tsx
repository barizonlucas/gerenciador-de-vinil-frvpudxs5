import { useState, useMemo, useEffect } from 'react'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { RecordCard } from '@/components/RecordCard'
import { Input } from '@/components/ui/input'
import { Search, Music } from 'lucide-react'
import { VinylRecord } from '@/types/vinyl'
import { ViewRecordModal } from '@/components/modals/ViewRecordModal'
import { EditRecordModal } from '@/components/modals/EditRecordModal'
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Index = () => {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { records, loading, updateRecord, deleteRecord } = useVinylContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalState, setModalState] = useState<{
    view: VinylRecord | null
    edit: VinylRecord | null
    delete: VinylRecord | null
  }>({ view: null, edit: null, delete: null })

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
    }
  }, [user, authLoading, navigate])

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records
    return records.filter(
      (record) =>
        record.albumTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.genre?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [records, searchTerm])

  const handleView = (record: VinylRecord) =>
    setModalState({ ...modalState, view: record })
  const handleEdit = (record: VinylRecord) =>
    setModalState({ ...modalState, edit: record })
  const handleDelete = (record: VinylRecord) =>
    setModalState({ ...modalState, delete: record })

  const handleUpdateRecord = (updated: VinylRecord) => {
    updateRecord(updated)
    setModalState({ ...modalState, edit: null })
  }

  const handleConfirmDelete = (id: string) => {
    deleteRecord(id)
    setModalState({ ...modalState, delete: null })
  }

  const closeModal = () =>
    setModalState({ view: null, edit: null, delete: null })

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <section className="relative mb-12 overflow-hidden rounded-2xl p-8 text-center">
        <div className="absolute inset-0 bg-hero-gradient"></div>
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bem-vindo, {profile?.display_name || user?.email}!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore, gerencie e curta sua coleção de vinis.
          </p>
        </div>
      </section>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar por álbum, artista ou gênero..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 text-base rounded-full shadow-sm bg-secondary"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-auto aspect-square rounded-xl" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecords.map((record, index) => (
            <div
              key={record.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms`, opacity: 0 }}
            >
              <RecordCard
                record={record}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-xl mt-8">
          <Music className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {searchTerm ? 'Nenhum disco encontrado' : 'Sua coleção está vazia!'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? 'Tente uma pesquisa diferente.'
              : 'Clique em "Adicionar Disco" na barra lateral para começar.'}
          </p>
        </div>
      )}

      <ViewRecordModal
        isOpen={!!modalState.view}
        onClose={closeModal}
        record={modalState.view}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <EditRecordModal
        isOpen={!!modalState.edit}
        onClose={closeModal}
        record={modalState.edit}
        onUpdateRecord={handleUpdateRecord}
      />
      <DeleteConfirmationModal
        isOpen={!!modalState.delete}
        onClose={closeModal}
        record={modalState.delete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  )
}

export default Index
