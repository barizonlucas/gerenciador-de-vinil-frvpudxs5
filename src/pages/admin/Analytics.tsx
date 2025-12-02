import { useState, useEffect, useCallback } from 'react'
import {
  fetchDailyActiveUsers,
  fetchEventFrequency,
  fetchTopEvents,
  fetchAvgEventsPerUser,
  fetchDistinctEventNames,
} from '@/services/analytics'
import { DailyActiveUser, EventFrequency, TopEvent } from '@/types/analytics'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { AlertTriangle, Activity, Users } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const AnalyticsPage = () => {
  const [dailyActiveUsers, setDailyActiveUsers] = useState<DailyActiveUser[]>(
    [],
  )
  const [eventFrequency, setEventFrequency] = useState<EventFrequency[]>([])
  const [topEvents, setTopEvents] = useState<TopEvent[]>([])
  const [avgEventsPerUser, setAvgEventsPerUser] = useState<number | null>(null)
  const [availableEvents, setAvailableEvents] = useState<string[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')

  const [loadingDAU, setLoadingDAU] = useState(true)
  const [loadingFreq, setLoadingFreq] = useState(false)
  const [loadingTop, setLoadingTop] = useState(true)
  const [loadingAvg, setLoadingAvg] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)

  const [errorDAU, setErrorDAU] = useState(false)
  const [errorFreq, setErrorFreq] = useState(false)
  const [errorTop, setErrorTop] = useState(false)
  const [errorAvg, setErrorAvg] = useState(false)

  const loadInitialData = useCallback(async () => {
    setLoadingDAU(true)
    setErrorDAU(false)
    try {
      const data = await fetchDailyActiveUsers()
      setDailyActiveUsers(data)
    } catch (error) {
      setErrorDAU(true)
    } finally {
      setLoadingDAU(false)
    }

    setLoadingTop(true)
    setErrorTop(false)
    try {
      const data = await fetchTopEvents()
      setTopEvents(data)
    } catch (error) {
      setErrorTop(true)
    } finally {
      setLoadingTop(false)
    }

    setLoadingAvg(true)
    setErrorAvg(false)
    try {
      const data = await fetchAvgEventsPerUser()
      setAvgEventsPerUser(data)
    } catch (error) {
      setErrorAvg(true)
    } finally {
      setLoadingAvg(false)
    }

    setLoadingEvents(true)
    try {
      const events = await fetchDistinctEventNames()
      setAvailableEvents(events)
      if (events.length > 0 && !selectedEvent) {
        setSelectedEvent(events[0])
      }
    } catch (error) {
      console.error('Failed to load event names')
    } finally {
      setLoadingEvents(false)
    }
  }, [selectedEvent])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (!selectedEvent) return

    const loadFrequency = async () => {
      setLoadingFreq(true)
      setErrorFreq(false)
      try {
        const data = await fetchEventFrequency(selectedEvent)
        setEventFrequency(data)
      } catch (error) {
        setErrorFreq(true)
      } finally {
        setLoadingFreq(false)
      }
    }

    loadFrequency()
  }, [selectedEvent])

  const formatDateAxis = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd/MM', { locale: ptBR })
    } catch {
      return dateStr
    }
  }

  const RetryButton = ({ onClick }: { onClick: () => void }) => (
    <div className="flex flex-col items-center justify-center h-full py-8 text-destructive">
      <AlertTriangle className="h-8 w-8 mb-2" />
      <p className="text-sm font-medium mb-4">Erro ao carregar dados</p>
      <Button variant="outline" size="sm" onClick={onClick}>
        Tentar novamente
      </Button>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Métricas de uso e engajamento da aplicação nos últimos 30 dias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Card: Avg Events Per User */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média de Eventos por Usuário
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loadingAvg ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : errorAvg ? (
              <p className="text-sm text-destructive">Erro ao carregar</p>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {avgEventsPerUser !== null ? avgEventsPerUser : '—'}
                </div>
                <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Placeholder for future metrics */}
        <Card className="md:col-span-2 bg-muted/10 border-dashed flex items-center justify-center">
          <CardContent className="py-6 text-center text-muted-foreground">
            <p>Mais métricas em breve...</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart: Daily Active Users */}
        <Card>
          <CardHeader>
            <CardTitle>Usuários Ativos Diários</CardTitle>
            <CardDescription>Últimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingDAU ? (
              <Skeleton className="h-full w-full" />
            ) : errorDAU ? (
              <RetryButton onClick={() => loadInitialData()} />
            ) : (
              <ChartContainer
                config={{
                  active_users_count: {
                    label: 'Usuários',
                    color: 'hsl(var(--primary))',
                  },
                }}
              >
                <LineChart
                  data={dailyActiveUsers}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDateAxis}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="active_users_count"
                    stroke="var(--color-active_users_count)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Chart: Event Frequency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Frequência de Eventos</CardTitle>
              <CardDescription>Ocorrências diárias (30d)</CardDescription>
            </div>
            <div className="w-[200px]">
              <Select
                value={selectedEvent}
                onValueChange={setSelectedEvent}
                disabled={loadingEvents}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  {availableEvents.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingFreq ? (
              <Skeleton className="h-full w-full" />
            ) : errorFreq ? (
              <RetryButton onClick={() => setSelectedEvent(selectedEvent)} />
            ) : eventFrequency.length > 0 ? (
              <ChartContainer
                config={{
                  event_count: {
                    label: 'Ocorrências',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
              >
                <BarChart
                  data={eventFrequency}
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={formatDateAxis}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="event_count"
                    fill="var(--color-event_count)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Selecione um evento para visualizar os dados
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Table: Top 10 Events */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Eventos Mais Frequentes</CardTitle>
          <CardDescription>Últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTop ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : errorTop ? (
            <RetryButton onClick={() => loadInitialData()} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Evento</TableHead>
                  <TableHead className="text-right">
                    Total de Ocorrências
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEvents.length > 0 ? (
                  topEvents.map((event) => (
                    <TableRow key={event.event_name}>
                      <TableCell className="font-medium">
                        {event.event_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {event.total_count}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground"
                    >
                      Nenhum dado encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AnalyticsPage
