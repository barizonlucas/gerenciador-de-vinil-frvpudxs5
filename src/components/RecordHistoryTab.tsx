import { useState, useEffect } from 'react'
import { getRecordHistory } from '@/services/history'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal, UserX } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface RecordHistoryTabProps {
  albumTitle: string
  artist: string
  releaseYear?: number | null
}

export const RecordHistoryTab = ({
  albumTitle,
  artist,
  releaseYear,
}: RecordHistoryTabProps) => {
  const { user, loading: authLoading } = useAuth()
  const [history, setHistory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) {
      setLoading(true)
      return
    }

    if (!user) {
      setError('Autenticação necessária para ver o histórico.')
      setLoading(false)
      return
    }

    if (!releaseYear) {
      setError('Ano de lançamento não disponível para gerar a história.')
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getRecordHistory(albumTitle, artist, releaseYear)
        setHistory(data.history)
      } catch (err) {
        setError(
          'Não foi possível carregar a história. Tente novamente mais tarde.',
        )
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [albumTitle, artist, releaseYear, user, authLoading])

  if (loading || authLoading) {
    return (
      <div className="space-y-4 py-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="pt-4 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <Alert variant="destructive">
          {error === 'Autenticação necessária para ver o histórico.' ? (
            <UserX className="h-4 w-4" />
          ) : (
            <Terminal className="h-4 w-4" />
          )}
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p>{history}</p>
      </div>
    </div>
  )
}
