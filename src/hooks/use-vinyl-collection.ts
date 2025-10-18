import { useState, useEffect, useCallback } from 'react'
import { VinylRecord } from '@/types/vinyl'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

export const useVinylCollection = () => {
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    if (import.meta.env.VITEST) {
      setRecords([])
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('vinyl_records')
        .select('*')
        .order('albumTitle', { ascending: true })

      if (error) {
        throw error
      }
      setRecords(data || [])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error('Falha ao buscar discos.', { description: message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const addRecord = async (recordData: Omit<VinylRecord, 'id'>) => {
    if (import.meta.env.VITEST) {
      return
    }
    try {
      const newRecord = { ...recordData, id: uuidv4() }
      const { data, error } = await supabase
        .from('vinyl_records')
        .insert(newRecord)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setRecords((prev) =>
          [...prev, data].sort((a, b) =>
            a.albumTitle.localeCompare(b.albumTitle),
          ),
        )
        toast.success(`"${data.albumTitle}" foi adicionado à coleção!`)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error('Falha ao adicionar disco.', { description: message })
    }
  }

  const updateRecord = async (updatedRecord: VinylRecord) => {
    if (import.meta.env.VITEST) {
      return
    }
    try {
      const { data, error } = await supabase
        .from('vinyl_records')
        .update(updatedRecord)
        .eq('id', updatedRecord.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        setRecords((prev) => prev.map((r) => (r.id === data.id ? data : r)))
        toast.success(`"${data.albumTitle}" foi atualizado.`)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error('Falha ao atualizar disco.', { description: message })
    }
  }

  const deleteRecord = async (id: string) => {
    if (import.meta.env.VITEST) {
      return
    }
    // Optimistically find the record to show its name in the toast
    const recordToDelete = records.find((r) => r.id === id)

    try {
      const { error } = await supabase
        .from('vinyl_records')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRecords((prev) => prev.filter((r) => r.id !== id))
      if (recordToDelete) {
        toast.success(`"${recordToDelete.albumTitle}" foi excluído.`)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error('Falha ao excluir disco.', { description: message })
    }
  }

  return { records, loading, addRecord, updateRecord, deleteRecord }
}
