import { useState, useEffect, useCallback } from 'react'
import { VinylRecord } from '@/types/vinyl'
import * as vinylService from '@/services/vinyl'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export const useVinylCollection = () => {
  const { user } = useAuth()
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!user) {
      setRecords([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await vinylService.getRecords()
      setRecords(data)
      setError(null)
    } catch (err) {
      const errorMessage =
        'Ocorreu um erro ao buscar os discos. Tente novamente mais tarde.'
      setError(errorMessage)
      toast.error(errorMessage)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const addRecord = async (record: Omit<VinylRecord, 'id' | 'user_id'>) => {
    try {
      const newRecord = await vinylService.addRecord(record)
      setRecords((prev) => [newRecord, ...prev])
      toast.success(`"${newRecord.albumTitle}" foi adicionado à sua coleção!`)
    } catch (err) {
      toast.error('Falha ao adicionar o disco.')
      console.error(err)
    }
  }

  const updateRecord = async (record: VinylRecord) => {
    try {
      const updatedRecord = await vinylService.updateRecord(record)
      setRecords((prev) =>
        prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)),
      )
      toast.success(`"${updatedRecord.albumTitle}" foi atualizado.`)
    } catch (err) {
      toast.error('Falha ao atualizar o disco.')
      console.error(err)
    }
  }

  const deleteRecord = async (id: string) => {
    const recordToDelete = records.find((r) => r.id === id)
    if (!recordToDelete) return

    try {
      await vinylService.deleteRecord(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      toast.success(`"${recordToDelete.albumTitle}" foi excluído.`)
    } catch (err) {
      toast.error('Falha ao excluir o disco.')
      console.error(err)
    }
  }

  return {
    records,
    loading,
    error,
    fetchRecords,
    addRecord,
    updateRecord,
    deleteRecord,
  }
}
