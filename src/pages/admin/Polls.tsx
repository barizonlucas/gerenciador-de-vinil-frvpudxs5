import { useState, useEffect } from 'react'
import { Poll } from '@/types/poll'
import { getPollData } from '@/services/polls'
import { PollForm } from '@/components/admin/PollForm'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal } from 'lucide-react'

const AdminPollsPage = () => {
  const [poll, setPoll] = useState<Poll | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        setLoading(true)
        const data = await getPollData()
        setPoll(data)
      } catch (err: any) {
        setError('Não foi possível carregar os dados da enquete.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPoll()
  }, [])

  const handlePollUpdate = (updatedPoll: Poll) => {
    setPoll(updatedPoll)
  }

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <CardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Enquetes</h1>
          <p className="text-muted-foreground">
            Crie, edite e ative a enquete para a comunidade.
          </p>
        </div>
      </div>
      <PollForm initialPoll={poll} onPollUpdate={handlePollUpdate} />
    </div>
  )
}

const CardSkeleton = () => (
  <div className="border rounded-lg p-6 space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-6 w-1/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-4 w-1/5" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  </div>
)

export default AdminPollsPage
