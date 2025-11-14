import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { submitMessage, getUserMessageThreads } from '@/services/messages'
import { toast } from 'sonner'
import { logEvent } from '@/services/telemetry'
import { LAST_REPLY_SEEN_KEY } from '@/services/messages'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { MessageThread } from '@/types/messages'

const messageSchema = z.object({
  message: z
    .string()
    .min(5, { message: 'Escreva pelo menos 5 caracteres.' })
    .max(500, { message: 'Limite de 500 caracteres.' }),
})

type MessageFormValues = z.infer<typeof messageSchema>

interface MessageFormProps {
  onCancel: () => void
  onRepliesViewed?: (latestReplyAt?: string | null) => void
}

type ChatEntry = {
  id: string
  type: 'user' | 'admin'
  content: string
  created_at: string
  senderName: string
}

export const MessageForm = ({
  onCancel,
  onRepliesViewed,
}: MessageFormProps) => {
  const isOnline = useOnlineStatus()
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: '' },
    mode: 'onChange',
  })

  const {
    formState: { isSubmitting, isValid },
    watch,
    reset,
  } = form

  const messageValue = watch('message')
  const charCount = messageValue?.length || 0

  const fetchThreads = useCallback(async () => {
    if (!isOnline) {
      setHistoryLoading(false)
      setHistoryError('Conecte-se para ver suas mensagens anteriores.')
      return
    }

    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const data = await getUserMessageThreads()
      setThreads(data)
    } catch (error) {
      console.error('Error loading user message history:', error)
      setHistoryError('Não foi possível carregar sua conversa.')
    } finally {
      setHistoryLoading(false)
    }
  }, [isOnline])

  useEffect(() => {
    fetchThreads()
  }, [fetchThreads])

  const chatEntries = useMemo<ChatEntry[]>(() => {
    return threads
      .flatMap((thread) => {
        const base: ChatEntry[] = [
          {
            id: thread.message.id,
            type: 'user',
            content: thread.message.message,
            created_at: thread.message.created_at,
            senderName:
              thread.message.user_display_name ||
              thread.message.user_email ||
              'Você',
          },
        ]

        const replies = thread.replies.map((reply) => ({
          id: reply.id,
          type: 'admin' as const,
          content: reply.reply,
          created_at: reply.created_at,
          senderName: reply.profiles?.display_name || 'Equipe Teko',
        }))

        return [...base, ...replies]
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
  }, [threads])

  const latestAdminReplyAt = useMemo(() => {
    const replyDates = threads.flatMap((thread) =>
      thread.replies.map((reply) => reply.created_at),
    )
    if (replyDates.length === 0) return null
    return replyDates.reduce((latest, current) =>
      new Date(current) > new Date(latest) ? current : latest,
    )
  }, [threads])

  useEffect(() => {
    if (historyLoading) return
    if (onRepliesViewed) {
      onRepliesViewed(latestAdminReplyAt ?? null)
      return
    }
    if (typeof window !== 'undefined' && latestAdminReplyAt) {
      localStorage.setItem(LAST_REPLY_SEEN_KEY, latestAdminReplyAt)
    }
  }, [historyLoading, latestAdminReplyAt, onRepliesViewed])

  const onSubmit = async (data: MessageFormValues) => {
    try {
      await submitMessage(data.message)
      toast.success('✅ Mensagem enviada. Obrigado por contribuir!')
      logEvent('message_sent', {
        message_length: data.message.length,
      })
      reset()
      await fetchThreads()
    } catch (error: any) {
      toast.error('Não foi possível enviar agora. Tente novamente.')
      logEvent('message_send_failed', {
        reason: error.message,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Histórico de mensagens</p>
              <p className="text-xs text-muted-foreground">
                Veja respostas anteriores do time.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchThreads}
              disabled={historyLoading || !isOnline}
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  historyLoading && 'animate-spin text-muted-foreground',
                )}
              />
            </Button>
          </div>
          <div className="rounded-lg border bg-muted/40">
            {historyLoading ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando suas mensagens…
              </div>
            ) : historyError ? (
              <div className="flex flex-col gap-2 p-4 text-sm">
                <span className="text-destructive">{historyError}</span>
                {isOnline && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchThreads}
                  >
                    Tentar novamente
                  </Button>
                )}
              </div>
            ) : chatEntries.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Ainda não há respostas. Envie a primeira mensagem!
              </div>
            ) : (
              <ScrollArea className="h-56">
                <div className="space-y-4 p-4 pr-6">
                  {chatEntries.map((entry) => (
                    <div
                      key={`${entry.type}-${entry.id}`}
                      className={cn(
                        'flex',
                        entry.type === 'user'
                          ? 'justify-end'
                          : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                          entry.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground',
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {entry.content}
                        </p>
                        <span
                          className={cn(
                            'mt-1 block text-xs opacity-70',
                            entry.type === 'user'
                              ? 'text-right'
                              : 'text-left',
                          )}
                        >
                          {entry.senderName} •{' '}
                          {formatDistanceToNow(new Date(entry.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </section>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Sua mensagem</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Escreva sua mensagem…"
                  className="resize-none"
                  rows={4}
                  aria-describedby="message-hint"
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between items-center">
                <FormDescription id="message-hint">
                  Conte o que faria o Teko mais útil pra você.
                </FormDescription>
                <span className="text-xs text-muted-foreground">
                  {charCount}/500
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Tooltip open={!isOnline ? undefined : false}>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid || !isOnline}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enviar
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Conecte-se para enviar.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </form>
    </Form>
  )
}
