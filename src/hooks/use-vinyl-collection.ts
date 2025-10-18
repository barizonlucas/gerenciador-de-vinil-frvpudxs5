import { useState, useEffect, useCallback } from 'react'
import { VinylRecord } from '@/types/vinyl'
import * as vinylService from '@/services/vinyl'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

export const useVinylCollection = () => {
  const { user } = useAuth()
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await vinylService.getRecords()
      setRecords(data)
    } catch (error) {
      toast.error('Falha ao carregar os discos.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const addRecord = async (record: Omit<VinylRecord, 'id' | 'user_id'>) => {
    try {
      const newRecord = await vinylService.addRecord({
        ...record,
        user_id: user!.id,
      })
      setRecords((prev) => [newRecord, ...prev])
      toast.success(`"${newRecord.albumTitle}" adicionado com sucesso!`)
    } catch (error) {
      toast.error('Falha ao adicionar o disco.')
    }
  }

  const updateRecord = async (record: VinylRecord) => {
    try {
      const updatedRecord = await vinylService.updateRecord(record)
      setRecords((prev) =>
        prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)),
      )
      toast.success(`"${updatedRecord.albumTitle}" atualizado com sucesso!`)
    } catch (error) {
      toast.error('Falha ao atualizar o disco.')
    }
  }

  const deleteRecord = async (id: string) => {
    const recordToDelete = records.find((r) => r.id === id)
    try {
      await vinylService.deleteRecord(id)
      setRecords((prev) => prev.filter((r) => r.id !== id))
      if (recordToDelete) {
        toast.success(`"${recordToDelete.albumTitle}" excluído com sucesso!`)
      }
    } catch (error) {
      toast.error('Falha ao excluir o disco.')
    }
  }

  return { records, loading, addRecord, updateRecord, deleteRecord }
}
