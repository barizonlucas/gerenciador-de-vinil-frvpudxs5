import { useState, useEffect, useCallback } from 'react'
import { VinylRecord } from '@/types/vinyl'
import { toast } from 'sonner'

const STORAGE_KEY = 'vinylCollection'

const initialData: VinylRecord[] = [
  {
    id: '1',
    albumTitle: 'The Dark Side of the Moon',
    artist: 'Pink Floyd',
    releaseYear: 1973,
    genre: 'Progressive Rock',
    coverArtUrl:
      'https://img.usecurling.com/p/500/500?q=dark%20side%20of%20the%20moon',
    condition: 'Excelente',
  },
  {
    id: '2',
    albumTitle: 'Abbey Road',
    artist: 'The Beatles',
    releaseYear: 1969,
    genre: 'Rock',
    coverArtUrl: 'https://img.usecurling.com/p/500/500?q=abbey%20road',
    condition: 'Bom',
  },
  {
    id: '3',
    albumTitle: 'Rumours',
    artist: 'Fleetwood Mac',
    releaseYear: 1977,
    genre: 'Rock',
    coverArtUrl: 'https://img.usecurling.com/p/500/500?q=rumours%20album',
    condition: 'Novo',
  },
  {
    id: '4',
    albumTitle: 'Kind of Blue',
    artist: 'Miles Davis',
    releaseYear: 1959,
    genre: 'Jazz',
    coverArtUrl: 'https://img.usecurling.com/p/500/500?q=kind%20of%20blue',
    condition: 'Regular',
  },
]

export function useVinylCollection() {
  const [records, setRecords] = useState<VinylRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedRecords = localStorage.getItem(STORAGE_KEY)
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords))
      } else {
        setRecords(initialData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
      }
    } catch (error) {
      console.error('Failed to load records from local storage', error)
      toast.error('Não foi possível carregar a coleção.')
      setRecords(initialData)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateLocalStorage = (updatedRecords: VinylRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords))
    } catch (error) {
      console.error('Failed to save records to local storage', error)
      toast.error('Não foi possível salvar as alterações.')
    }
  }

  const addRecord = useCallback((record: Omit<VinylRecord, 'id'>) => {
    setRecords((prevRecords) => {
      const newRecord = { ...record, id: crypto.randomUUID() }
      const updatedRecords = [...prevRecords, newRecord]
      updateLocalStorage(updatedRecords)
      toast.success('Disco adicionado com sucesso!')
      return updatedRecords
    })
  }, [])

  const updateRecord = useCallback((updatedRecord: VinylRecord) => {
    setRecords((prevRecords) => {
      const updatedRecords = prevRecords.map((record) =>
        record.id === updatedRecord.id ? updatedRecord : record,
      )
      updateLocalStorage(updatedRecords)
      toast.success('Disco atualizado!')
      return updatedRecords
    })
  }, [])

  const deleteRecord = useCallback((id: string) => {
    setRecords((prevRecords) => {
      const updatedRecords = prevRecords.filter((record) => record.id !== id)
      updateLocalStorage(updatedRecords)
      toast.success('Disco excluído!')
      return updatedRecords
    })
  }, [])

  return { records, loading, addRecord, updateRecord, deleteRecord, setRecords }
}
