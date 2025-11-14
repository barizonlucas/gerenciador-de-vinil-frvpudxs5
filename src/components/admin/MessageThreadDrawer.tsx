import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { MessageStatusBadge } from './MessageStatusBadge'
import {
  AdminConversation,
  AdminConversationSummary,
  MessageStatus,
} from '@/types/messages'
import {
  getAdminConversation,
  replyToMessage,
  updateMessageStatus,
} from '@/services/messages'
import { logEvent } from '@/services/telemetry'
import { toast } from 'sonner'
import { Loader2, Send, User as UserIcon } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const replySchema = z.object({
  reply: z
    .string()
    .min(1, 'A resposta não pode estar vazia.')
    .max(500, 'A resposta não pode exceder 500 caracteres.'),
})
type ReplyFormValues = z.infer<typeof replySchema>

type ChatEntry = {
  id: string
  type: 'user' | 'admin'
  content: string
  created_at: string
  displayName: string
  avatarUrl: string | null
}

interface MessageThreadDrawerProps {
  isOpen: boolean
  onClose: () => void
  conversation: AdminConversationSummary | null
  onConversationChange: (
    userId: string,
    updates: Partial<AdminConversationSummary>,
  ) => void
}

export const MessageThreadDrawer = ({
  isOpen,
  onClose,
  conversation,
  onConversationChange,
}: MessageThreadDrawerProps) => {
  const isOnline = useOnlineStatus()
  const [thread, setThread] = useState<AdminConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { reply: '' },
    mode: 'onChange',
  })
  const {
    formState: { isSubmitting, isValid },
    watch,
    reset,
  } = form
  const replyValue = watch('reply')
  const charCount = replyValue?.length || 0

  const chatEntries = useMemo<ChatEntry[]>(() => {
    if (!thread) return []
    return thread.messages
      .flatMap((entry) => {
        const userEntry: ChatEntry = {
          id: entry.message.id,
          type: 'user',
          content: entry.message.message,
          created_at: entry.message.created_at,
          displayName:
            entry.message.user_display_name ||
            entry.message.user_email ||
            'Colecionador',
          avatarUrl: entry.message.user_avatar_url || null,
        }

        const replies = entry.replies.map((reply) => ({
          id: reply.id,
          type: 'admin' as const,
          content: reply.reply,
          created_at: reply.created_at,
          displayName: reply.profiles?.display_name || 'Equipe Teko',
          avatarUrl: reply.profiles?.avatar_url || null,
        }))

        return [userEntry, ...replies]
      })
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )
  }, [thread])

  const fetchThread = useCallback(async () => {
    if (!conversation) return
    setLoading(true)
    setError(null)
    try {
      logEvent(
        'admin_message_opened',
        { user_id: conversation.user_id },
        'admin',
      )
      const data = await getAdminConversation(conversation.user_id)
      setThread(data)
      if (conversation.latest_status === 'new') {
        const updated = await updateMessageStatus(
          conversation.latest_message_id,
          'read',
        )
        onConversationChange(conversation.user_id, {
          latest_status: 'read',
          latest_message: updated.message,
          latest_created_at: updated.created_at,
        })
        setThread((prev) =>
          prev
            ? {
                ...prev,
                messages: prev.messages.map((entry) =>
                  entry.message.id === updated.id
                    ? { ...entry, message: updated }
                    : entry,
                ),
              }
            : prev,
        )
        logEvent(
          'admin_message_status_changed',
          {
            message_id: conversation.latest_message_id,
            from: 'new',
            to: 'read',
          },
          'admin',
        )
        toast.info('🟡 Mensagem marcada como lida.')
      }
    } catch (err) {
      setError('Não foi possível carregar a conversa.')
    } finally {
      setLoading(false)
    }
  }, [conversation, onConversationChange])

  useEffect(() => {
    if (isOpen && conversation) {
      fetchThread()
    } else {
      setThread(null)
      reset()
    }
  }, [isOpen, conversation, fetchThread, reset])

  const onSubmit = async (data: ReplyFormValues) => {
    if (!thread || !conversation) return
    try {
      const newReply = await replyToMessage(
        conversation.latest_message_id,
        data.reply,
      )
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', newReply.admin_user_id)
        .single()
      const fullReply = { ...newReply, profiles: profileData }
      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((entry) =>
                entry.message.id === conversation.latest_message_id
                  ? {
                      ...entry,
                      message: { ...entry.message, status: 'replied' },
                      replies: [...entry.replies, fullReply],
                    }
                  : entry,
              ),
            }
          : null,
      )
      onConversationChange(conversation.user_id, {
        latest_status: 'replied',
      })
      logEvent(
        'admin_message_replied',
        {
          message_id: conversation.latest_message_id,
          reply_length: data.reply.length,
        },
        'admin',
      )
      toast.success('✅ Resposta enviada com sucesso.')
      reset()
    } catch (err) {
      toast.error('❌ Falha ao enviar. Tente novamente.')
    }
  }

  const handleMarkAsRead = async () => {
    if (
      !thread ||
      !conversation ||
      conversation.latest_status === 'read' ||
      conversation.latest_status === 'replied'
    )
      return
    try {
      const updated = await updateMessageStatus(
        conversation.latest_message_id,
        'read',
      )
      setThread((prev) =>
        prev
          ? {
              ...prev,
              messages: prev.messages.map((entry) =>
                entry.message.id === updated.id
                  ? { ...entry, message: { ...entry.message, status: 'read' } }
                  : entry,
              ),
            }
          : null,
      )
      onConversationChange(conversation.user_id, {
        latest_status: 'read',
        latest_message: updated.message,
        latest_created_at: updated.created_at,
      })
      logEvent(
        'admin_message_status_changed',
        {
          message_id: conversation.latest_message_id,
          from: conversation.latest_status,
          to: 'read',
        },
        'admin',
      )
      toast.success('🟡 Mensagem marcada como lida.')
    } catch (err) {
      toast.error('Falha ao marcar como lida.')
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh]">
        <div className="container mx-auto max-w-3xl h-full flex flex-col">
          <DrawerHeader className="pt-6">
            {loading ? (
              <Skeleton className="h-7 w-3/4" />
            ) : (
              <DrawerTitle className="truncate">
                {thread?.user?.display_name ||
                  thread?.user?.email ||
                  conversation?.user_display_name ||
                  conversation?.user_email ||
                  'Usuário desconhecido'}
              </DrawerTitle>
            )}
            {loading ? (
              <Skeleton className="h-4 w-1/2" />
            ) : (
              <DrawerDescription className="flex items-center gap-2">
                {conversation && (
                  <>
                    <MessageStatusBadge status={conversation.latest_status} />
                    {conversation.latest_created_at && (
                      <span>
                        {format(
                          new Date(conversation.latest_created_at),
                          "dd/MM/yyyy 'às' HH:mm",
                        )}
                      </span>
                    )}
                  </>
                )}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <Separator className="my-4" />
          <ScrollArea className="flex-1 pr-4 -mr-4">
            {loading ? (
              <ThreadSkeleton />
            ) : error ? (
              <div className="text-center py-10 text-destructive">{error}</div>
            ) : (
              chatEntries.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  Nenhuma mensagem encontrada para este usuário.
                </div>
              ) : (
                <div className="space-y-6">
                  {chatEntries.map((entry) => (
                    <ChatBubble key={`${entry.type}-${entry.id}`} entry={entry} />
                  ))}
                </div>
              )
            )}
          </ScrollArea>
          <DrawerFooter className="pt-4 border-t">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-2"
              >
                <FormField
                  control={form.control}
                  name="reply"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Escreva sua resposta..."
                          rows={3}
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between items-center">
                        <FormMessage />
                        <span className="text-xs text-muted-foreground">
                          {charCount}/500
                        </span>
                      </div>
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-center">
                  <div>
                    {conversation &&
                      conversation.latest_status !== 'read' &&
                      conversation.latest_status !== 'replied' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAsRead}
                        >
                          Marcar como lida
                        </Button>
                      )}
                  </div>
                  <div className="flex gap-2">
                    <DrawerClose asChild>
                      <Button variant="outline">Fechar</Button>
                    </DrawerClose>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        !isValid ||
                        !isOnline ||
                        !conversation?.latest_message_id
                      }
                    >
                      {isSubmitting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Send className="mr-2 h-4 w-4" />
                      Enviar resposta
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

const ChatBubble = ({ entry }: { entry: ChatEntry }) => {
  const isAdmin = entry.type === 'admin'
  const date = formatDistanceToNow(new Date(entry.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <div
      className={cn(
        'flex items-start gap-4',
        isAdmin && 'flex-row-reverse text-right',
      )}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={entry.avatarUrl ?? undefined} />
        <AvatarFallback>
          {entry.displayName ? (
            entry.displayName.charAt(0).toUpperCase()
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[80%] space-y-1">
        <div
          className={cn(
            'flex items-center gap-2 text-xs text-muted-foreground',
            isAdmin && 'justify-end',
          )}
        >
          <span className="font-semibold text-sm text-foreground">
            {entry.displayName}
          </span>
          <span>{date}</span>
        </div>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap break-words',
            isAdmin
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted text-foreground',
          )}
        >
          {entry.content}
        </div>
      </div>
    </div>
  )
}

const ThreadSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
    <div className="flex items-start gap-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  </div>
)
