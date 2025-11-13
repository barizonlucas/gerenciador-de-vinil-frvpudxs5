import { useState, useEffect, useCallback } from 'react'
import { getActivePollRanking, PollRankingData } from '@/services/polls'
import { logEvent } from '@/services/telemetry'
import { useAuth } from '@/contexts/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  RefreshCw,
  BarChart,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const TrendIndicator = ({
  votes_7d,
  votes_prev_7d,
}: {
  votes_7d: number
  votes_prev_7d: number
}) => {
  if (votes_prev_7d === 0) {
    if (votes_7d > 0) {
      return (
        <Badge variant="default" className="bg-success hover:bg-success/90">
          <ArrowUp className="h-4 w-4" />
        </Badge>
      )
    }
    return (
      <Badge variant="secondary">
        <ArrowRight className="h-4 w-4" />
      </Badge>
    )
  }

  const change = (votes_7d - votes_prev_7d) / votes_prev_7d
  if (change >= 0.1) {
    return (
      <Badge variant="default" className="bg-success hover:bg-success/90">
        <ArrowUp className="h-4 w-4" />
      </Badge>
    )
  }
  if (change <= -0.1) {
    return (
      <Badge variant="destructive">
        <ArrowDown className="h-4 w-4" />
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      <ArrowRight className="h-4 w-4" />
    </Badge>
  )
}

export const PollRanking = () => {
  const { user } = useAuth()
  const [ranking, setRanking] = useState<PollRankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRanking = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getActivePollRanking()
      setRanking(data)
      if (user?.id) {
        logEvent('admin_poll_ranking_viewed', {
          user_id: user.id,
          poll_id: data?.poll_id,
        })
      }
    } catch (err) {
      setError('Não foi possível carregar o ranking agora. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    fetchRanking()
  }, [fetchRanking])

  const handleRefresh = () => {
    if (user?.id) {
      logEvent('admin_poll_ranking_refreshed', {
        user_id: user.id,
        poll_id: ranking?.poll_id,
      })
    }
    fetchRanking()
  }

  const totalVotes =
    ranking?.ranking.reduce((acc, curr) => acc + curr.votes_total, 0) ?? 0

  if (loading) {
    return <RankingSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking da Enquete</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-destructive">{error}</p>
          <Button onClick={handleRefresh} className="mt-4">
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!ranking) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking da Enquete</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Nenhuma enquete ativa. Ative uma para ver o ranking.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Ranking: {ranking.poll_title}</CardTitle>
          <CardDescription>
            Resultados em tempo real da enquete ativa.
          </CardDescription>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Opção</TableHead>
              <TableHead>Título</TableHead>
              <TableHead className="text-right">Votos</TableHead>
              <TableHead className="text-right">% Total</TableHead>
              <TableHead className="text-right">Tendência (7d)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.ranking.map((option) => (
              <TableRow key={option.option_key}>
                <TableCell className="font-bold text-lg">
                  {option.option_key}
                </TableCell>
                <TableCell>{option.option_title}</TableCell>
                <TableCell className="text-right font-medium">
                  {option.votes_total}
                </TableCell>
                <TableCell className="text-right">
                  {option.pct_total.toFixed(2)}%
                </TableCell>
                <TableCell className="flex justify-end">
                  <TrendIndicator
                    votes_7d={option.votes_7d}
                    votes_prev_7d={option.votes_prev_7d}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-end font-bold border-t pt-4">
        Total de votos: {totalVotes}
      </CardFooter>
    </Card>
  )
}

const RankingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
    <CardFooter className="flex justify-end border-t pt-4">
      <Skeleton className="h-6 w-32" />
    </CardFooter>
  </Card>
)
