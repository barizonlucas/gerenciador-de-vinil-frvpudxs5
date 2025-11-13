import { useState, useEffect, useCallback } from 'react'
import {
  getRecords as apiGetRecords,
  addRecord as apiAddRecord,
  updateRecord as apiUpdateRecord,
  deleteRecord as apiDeleteRecord,
} from '@/services/vinyl'
import { VinylRecord } from '@/types/vinyl'
import { useAuth } from '@/contexts/AuthContext'

export const useVinylCollection = () => {
  const { user, loading: authLoading } = useAuth()
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = useCallback(async () => {
    if (!user) {
      setRecords([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await apiGetRecords()
      setRecords(data)
    } catch (err) {
      setError('Failed to fetch records')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading) {
      fetchRecords()
    }
  }, [authLoading, fetchRecords])

  const addRecord = async (
    recordData: Omit<VinylRecord, 'id' | 'user_id'>,
  ): Promise<VinylRecord> => {
    const newRecord = await apiAddRecord(recordData)
    setRecords((prev) => [newRecord, ...prev])
    return newRecord
  }

  const updateRecord = async (updatedRecord: VinylRecord) => {
    const savedRecord = await apiUpdateRecord(updatedRecord)
    setRecords((prev) =>
      prev.map((r) => (r.id === savedRecord.id ? savedRecord : r)),
    )
    return savedRecord
  }

  const deleteRecord = async (id: string) => {
    await apiDeleteRecord(id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  return {
    records,
    loading,
    error,
    addRecord,
    updateRecord,
    deleteRecord,
    fetchRecords,
  }
}
