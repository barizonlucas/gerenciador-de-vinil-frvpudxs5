import { useEffect, useState } from 'react'
import { getRecordHistory } from '@/lib/history'
import type { VinylRecord } from '@/types/vinyl'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal } from 'lucide-react'

interface RecordHistoryProps {
  record: VinylRecord
}

export function RecordHistory({ record }: RecordHistoryProps) {
  const [history, setHistory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!record.releaseYear) {
      setError('Ano de lançamento não disponível para gerar a história.')
      return
    }

    let mounted = true
    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await getRecordHistory(record)
        if (mounted) {
          setHistory(res.history ?? null)
        }
      } catch (err: any) {
        if (mounted) {
          setError(
            err.message || 'Ocorreu um erro ao buscar a história do disco.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      mounted = false
    }
  }, [record])

  if (loading) {
    return (
      <div className="space-y-2 py-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (history) {
    return (
      <div
        className="prose prose-sm dark:prose-invert max-w-none py-4"
        dangerouslySetInnerHTML={{ __html: history }}
      />
    )
  }

  return null
}
