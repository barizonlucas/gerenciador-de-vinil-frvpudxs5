import { useState, useEffect, useCallback } from 'react'
import { VinylRecord } from '@/types/vinyl'
import * as vinylService from '@/services/vinyl'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

export const useVinylCollection = () => {
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)
  const { session } = useAuth()

  const fetchRecords = useCallback(async () => {
    if (!session) {
      setRecords([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await vinylService.getRecords()
      setRecords(data)
    } catch (error) {
      toast.error('Erro ao buscar os discos.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const addRecord = async (recordData: Omit<VinylRecord, 'id'>) => {
    try {
      const newRecord = await vinylService.addRecord(recordData)
      setRecords((prev) => [newRecord, ...prev])
      toast.success(`"${newRecord.albumTitle}" adicionado com sucesso!`)
    } catch (error) {
      toast.error('Erro ao adicionar o disco.')
      console.error(error)
    }
  }

  const updateRecord = async (updatedRecord: VinylRecord) => {
    try {
      const returnedRecord = await vinylService.updateRecord(updatedRecord)
      setRecords((prev) =>
        prev.map((r) => (r.id === returnedRecord.id ? returnedRecord : r)),
      )
      toast.success(`"${returnedRecord.albumTitle}" atualizado com sucesso!`)
    } catch (error) {
      toast.error('Erro ao atualizar o disco.')
      console.error(error)
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
      toast.error('Erro ao excluir o disco.')
      console.error(error)
    }
  }

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords,
  }
}
