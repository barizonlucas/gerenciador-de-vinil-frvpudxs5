import { useState, useEffect, useCallback } from 'react'
import { VinylRecord } from '@/types/vinyl'
import {
  getVinylRecords,
  addVinylRecord,
  updateVinylRecord,
  deleteVinylRecord,
} from '@/services/vinyl'
import { toast } from 'sonner'
import { useAuth } from './use-auth'

export const useVinylCollection = () => {
  const { user } = useAuth()
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await getVinylRecords()
    if (error) {
      toast.error('Falha ao buscar os discos.', {
        description: error.message,
      })
      setRecords([])
    } else {
      setRecords(data as VinylRecord[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const addRecord = async (record: Omit<VinylRecord, 'id' | 'user_id'>) => {
    if (!user) {
      toast.error('Você precisa estar logado para adicionar um disco.')
      return
    }
    const { data: newRecord, error } = await addVinylRecord(record, user.id)
    if (error) {
      toast.error('Falha ao adicionar o disco.', {
        description: error.message,
      })
    } else if (newRecord) {
      setRecords((prev) => [newRecord as VinylRecord, ...prev])
      toast.success('Disco adicionado com sucesso!')
    }
  }

  const updateRecord = async (record: VinylRecord) => {
    const { data: updatedRecord, error } = await updateVinylRecord(record)
    if (error) {
      toast.error('Falha ao atualizar o disco.', {
        description: error.message,
      })
    } else if (updatedRecord) {
      setRecords((prev) =>
        prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)),
      )
      toast.success('Disco atualizado com sucesso!')
    }
  }

  const deleteRecord = async (id: string) => {
    const { error } = await deleteVinylRecord(id)
    if (error) {
      toast.error('Falha ao excluir o disco.', {
        description: error.message,
      })
    } else {
      setRecords((prev) => prev.filter((r) => r.id !== id))
      toast.success('Disco excluído com sucesso!')
    }
  }

  return { records, loading, addRecord, updateRecord, deleteRecord }
}
