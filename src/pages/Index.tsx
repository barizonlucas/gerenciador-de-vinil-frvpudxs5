import { useState, useMemo, useEffect } from 'react'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { RecordCard } from '@/components/RecordCard'
import { Input } from '@/components/ui/input'
import { Search, Music } from 'lucide-react'
import { VinylRecord } from '@/types/vinyl'
import { ViewRecordModal } from '@/components/modals/ViewRecordModal'
import { EditRecordModal } from '@/components/modals/EditRecordModal'
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'

const Index = () => {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { records, loading, updateRecord, deleteRecord } = useVinylContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [modalState, setModalState] = useState<{
    view: VinylRecord | null
    edit: VinylRecord | null
    delete: VinylRecord | null
  }>({ view: null, edit: null, delete: null })
  const [defaultViewTab, setDefaultViewTab] = useState('details')

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

  const handleView = (record: VinylRecord) => {
    setDefaultViewTab('details')
    setModalState((prev) => ({ ...prev, view: record }))
  }
  const handleEdit = (record: VinylRecord) =>
    setModalState((prev) => ({ ...prev, edit: record }))
  const handleDelete = (record: VinylRecord) =>
    setModalState((prev) => ({ ...prev, delete: record }))
  const handleSelectVersion = (record: VinylRecord) => {
    setDefaultViewTab('versions')
    setModalState((prev) => ({ ...prev, view: record }))
  }

  const handleUpdateRecord = (updated: VinylRecord) => {
    updateRecord(updated)
    setModalState((prev) => ({ ...prev, edit: null }))
  }

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteRecord(id)
      toast.success('Disco removido da coleção')
    } catch (error) {
      toast.error('Falha ao remover o disco. Tente novamente.')
      console.error('Failed to delete record:', error)
    } finally {
      setModalState((prev) => ({ ...prev, delete: null }))
    }
  }

  const closeModal = () =>
    setModalState({ view: null, edit: null, delete: null })

  const totalDiscos = records.length
  const discosLabel = totalDiscos === 1 ? 'disco' : 'discos'

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="w-full md:w-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <h1 className="text-3xl font-bold">
              Coleção: {totalDiscos} {discosLabel}
            </h1>
            <Link
              to="/dash"
              className="text-sm font-medium text-primary hover:underline"
            >
              Saber mais
            </Link>
          </div>
          <p className="text-muted-foreground">
            Explore e gerencie sua coleção de vinis.
          </p>
        </div>
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Pesquisar coleção..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-48 w-full" />
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
                onSelectVersion={handleSelectVersion}
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
              : 'Sua coleção ainda está vazia. Adicione seu primeiro vinil e comece a organizar com essência.'}
          </p>
        </div>
      )}

      <ViewRecordModal
        isOpen={!!modalState.view}
        onClose={closeModal}
        record={modalState.view}
        onEdit={handleEdit}
        onDelete={handleDelete}
        defaultTab={defaultViewTab}
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
