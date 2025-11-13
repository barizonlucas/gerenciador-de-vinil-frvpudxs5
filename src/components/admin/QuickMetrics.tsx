import { useState, useEffect, useCallback, ComponentType } from 'react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  RefreshCw,
  Download,
  Activity,
  Users,
  Repeat,
  Mail,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { getQuickMetrics, QuickMetricsData } from '@/services/metrics'
import { logEvent } from '@/services/telemetry'
import { toast } from 'sonner'

const numberFormatter = new Intl.NumberFormat('pt-BR')

const MetricCard = ({
  title,
  value,
  description,
  Icon,
  isLoading,
}: {
  title: string
  value: string | number | null
  description: string
  Icon: ComponentType<{ className?: string }>
  isLoading: boolean
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-20 mt-1" />
            <Skeleton className="h-4 w-4/5 mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">
              {typeof value === 'number'
                ? numberFormatter.format(value)
                : (value ?? '—')}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export const QuickMetrics = () => {
  const [metrics, setMetrics] = useState<QuickMetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getQuickMetrics()
      setMetrics(data)
    } catch (err) {
      setError('Não foi possível carregar as métricas. Tente novamente.')
      toast.error('Falha ao carregar métricas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const handleRefresh = () => {
    logEvent('admin_metrics_refreshed', {}, 'admin')
    fetchMetrics()
  }

  if (error && !loading) {
    return (
      <Card className="text-center py-10">
        <CardContent>
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <p className="mt-4 text-destructive">{error}</p>
          <Button onClick={handleRefresh} className="mt-6">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Métricas rápidas</h2>
          <p className="text-sm text-muted-foreground">
            Desempenho da interação dos colecionadores nos últimos dias.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Aberturas do widget (7d)"
          value={metrics?.cards.widgetOpens7d ?? null}
          description="Total de visualizações da enquete."
          Icon={Activity}
          isLoading={loading}
        />
        <MetricCard
          title="Conversão em voto (7d)"
          value={
            metrics?.cards.voteConversion7d !== null &&
            metrics?.cards.voteConversion7d !== undefined
              ? `${metrics.cards.voteConversion7d}%`
              : null
          }
          description="Dos que abriram, % que votaram."
          Icon={Users}
          isLoading={loading}
        />
        <MetricCard
          title="Troca de voto (%) (7d)"
          value={
            metrics?.cards.voteChangePct7d !== null &&
            metrics?.cards.voteChangePct7d !== undefined
              ? `${metrics.cards.voteChangePct7d}%`
              : null
          }
          description="% de votos que foram alterados."
          Icon={Repeat}
          isLoading={loading}
        />
        <MetricCard
          title="Mensagens recebidas (7d)"
          value={metrics?.cards.messagesReceived7d ?? null}
          description="Novas mensagens de colecionadores."
          Icon={Mail}
          isLoading={loading}
        />
        <MetricCard
          title="SLA 1ª resposta (min)"
          value={metrics?.cards.avgFirstReplyTime ?? null}
          description="Tempo médio para primeira resposta."
          Icon={Clock}
          isLoading={loading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aberturas do widget (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <LineChart data={metrics?.charts.widgetOpens14d}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    dataKey="count"
                    type="monotone"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mensagens por dia (14d)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <BarChart data={metrics?.charts.messages14d}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
