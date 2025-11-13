import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MessageSquare, Search, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useDebounce } from '@/hooks/use-debounce'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { getAdminMessages } from '@/services/messages'
import { logEvent } from '@/services/telemetry'
import { UserMessage, MessageStatus } from '@/types/messages'
import { MessageStatusBadge } from '@/components/admin/MessageStatusBadge'
import { MessageThreadDrawer } from '@/components/admin/MessageThreadDrawer'

const AdminMessagesPage = () => {
  const isOnline = useOnlineStatus()
  const [messages, setMessages] = useState<UserMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'all'>('all')
  const [selectedMessage, setSelectedMessage] = useState<UserMessage | null>(
    null,
  )
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminMessages()
      setMessages(data)
      logEvent(
        'admin_inbox_viewed',
        {
          total_messages: data.length,
          unread_count: data.filter((m) => m.status === 'new').length,
        },
        'admin',
      )
    } catch (err) {
      setError('Não foi possível carregar as mensagens.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOnline) {
      fetchMessages()
    }
  }, [isOnline, fetchMessages])

  const filteredMessages = useMemo(() => {
    return messages
      .filter((message) => {
        if (statusFilter === 'all') return true
        return message.status === statusFilter
      })
      .filter((message) => {
        const search = debouncedSearchTerm.toLowerCase()
        if (!search) return true
        return (
          message.message.toLowerCase().includes(search) ||
          message.user_email?.toLowerCase().includes(search) ||
          message.user_display_name?.toLowerCase().includes(search)
        )
      })
  }, [messages, statusFilter, debouncedSearchTerm])

  const handleStatusFilterChange = (value: string) => {
    const newStatus = value as MessageStatus | 'all'
    setStatusFilter(newStatus)
    logEvent('admin_inbox_filtered', { filter: { status: newStatus } }, 'admin')
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  useEffect(() => {
    if (debouncedSearchTerm) {
      logEvent(
        'admin_inbox_filtered',
        { filter: { search: debouncedSearchTerm } },
        'admin',
      )
    }
  }, [debouncedSearchTerm])

  const handleUpdateMessage = (updatedMessage: UserMessage) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)),
    )
  }

  const renderContent = () => {
    if (!isOnline) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            Conecte-se para ver novas mensagens.
          </p>
        </div>
      )
    }
    if (loading) {
      return <TableSkeleton />
    }
    if (error) {
      return (
        <div className="text-center py-10">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchMessages} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      )
    }
    if (filteredMessages.length === 0) {
      return (
        <div className="text-center py-10">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            {messages.length > 0
              ? 'Nenhuma mensagem corresponde aos filtros.'
              : 'Nenhum feedback por enquanto. Quando alguém enviar, aparecerá aqui.'}
          </p>
        </div>
      )
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuário</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Data de envio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredMessages.map((message) => (
            <TableRow
              key={message.id}
              onClick={() => setSelectedMessage(message)}
              className="cursor-pointer"
            >
              <TableCell className="font-medium">
                {message.user_display_name || message.user_email}
              </TableCell>
              <TableCell className="max-w-sm truncate">
                {message.message}
              </TableCell>
              <TableCell>
                <MessageStatusBadge status={message.status} />
              </TableCell>
              <TableCell className="text-right">
                {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', {
                  locale: ptBR,
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Mensagens dos Colecionadores
        </h1>
        <p className="text-muted-foreground mb-8">
          Leia e responda às mensagens enviadas pelos usuários.
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Caixa de Entrada</CardTitle>
            <CardDescription>
              Mensagens recebidas, ordenadas pelas mais recentes.
            </CardDescription>
            <div className="flex items-center gap-4 pt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por email ou mensagem..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Novos</SelectItem>
                  <SelectItem value="read">Lidos</SelectItem>
                  <SelectItem value="replied">Respondidos</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={fetchMessages}
                disabled={loading || !isOnline}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>{renderContent()}</CardContent>
        </Card>
      </div>
      <MessageThreadDrawer
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
        onUpdate={handleUpdateMessage}
      />
    </>
  )
}

const TableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>
          <Skeleton className="h-4 w-24" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-32" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-20" />
        </TableHead>
        <TableHead>
          <Skeleton className="h-4 w-28" />
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

export default AdminMessagesPage
