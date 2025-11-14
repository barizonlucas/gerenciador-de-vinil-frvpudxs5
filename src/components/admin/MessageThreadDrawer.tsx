import { useState, useEffect, useCallback } from 'react'
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
import { UserMessage, MessageThread, MessageStatus } from '@/types/messages'
import {
  getMessageThread,
  replyToMessage,
  updateMessageStatus,
} from '@/services/messages'
import { logEvent } from '@/services/telemetry'
import { toast } from 'sonner'
import { Loader2, Send, User as UserIcon } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { supabase } from '@/lib/supabase/client'

const replySchema = z.object({
  reply: z
    .string()
    .min(1, 'A resposta não pode estar vazia.')
    .max(500, 'A resposta não pode exceder 500 caracteres.'),
})
type ReplyFormValues = z.infer<typeof replySchema>

interface MessageThreadDrawerProps {
  isOpen: boolean
  onClose: () => void
  message: UserMessage | null
  onUpdate: (updatedMessage: UserMessage) => void
}

export const MessageThreadDrawer = ({
  isOpen,
  onClose,
  message,
  onUpdate,
}: MessageThreadDrawerProps) => {
  const isOnline = useOnlineStatus()
  const [thread, setThread] = useState<MessageThread | null>(null)
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

  const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

  const fetchThread = useCallback(async () => {
    if (!message) return
    setLoading(true)
    setError(null)
    try {
      if (!isUuid(message.id)) {
      console.error('Message com id inválido:', message)   // 🔎 vai te mostrar se id==texto
      throw new Error('ID de mensagem inválido')
    }
      logEvent('admin_message_opened', { message_id: message.id }, 'admin')
      const data = await getMessageThread(message.id)
      setThread(data)
      if (data.message.status === 'new') {
        const updated = await updateMessageStatus(message.id, 'read')
        onUpdate(updated)
        logEvent(
          'admin_message_status_changed',
          { message_id: message.id, from: 'new', to: 'read' },
          'admin',
        )
        toast.info('🟡 Mensagem marcada como lida.')
      }
    } catch (err) {
      setError('Não foi possível carregar a conversa.')
    } finally {
      setLoading(false)
    }
  }, [message, onUpdate])

  useEffect(() => {
    if (isOpen && message) {
      fetchThread()
    } else {
      setThread(null)
      reset()
    }
  }, [isOpen, message, fetchThread, reset])

  const onSubmit = async (data: ReplyFormValues) => {
    if (!thread) return
    try {
      const newReply = await replyToMessage(thread.message.id, data.reply)
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
              message: { ...prev.message, status: 'replied' },
              replies: [...prev.replies, fullReply],
            }
          : null,
      )
      onUpdate({ ...thread.message, status: 'replied' })
      logEvent(
        'admin_message_replied',
        { message_id: thread.message.id, reply_length: data.reply.length },
        'admin',
      )
      toast.success('✅ Resposta enviada com sucesso.')
      reset()
    } catch (err) {
      toast.error('❌ Falha ao enviar. Tente novamente.')
    }
  }

  const handleMarkAsRead = async () => {
    if (!thread || thread.message.status === 'read') return
    try {
      const updated = await updateMessageStatus(thread.message.id, 'read')
      setThread((prev) =>
        prev ? { ...prev, message: { ...prev.message, status: 'read' } } : null,
      )
      onUpdate(updated)
      logEvent(
        'admin_message_status_changed',
        {
          message_id: thread.message.id,
          from: thread.message.status,
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
                {thread?.message.user_display_name ||
                  thread?.message.user_email ||
                  'Usuário desconhecido'}
              </DrawerTitle>
            )}
            {loading ? (
              <Skeleton className="h-4 w-1/2" />
            ) : (
              <DrawerDescription className="flex items-center gap-2">
                {thread && (
                  <>
                    <MessageStatusBadge status={thread.message.status} />
                    <span>
                      {format(
                        new Date(thread.message.created_at),
                        "dd/MM/yyyy 'às' HH:mm",
                      )}
                    </span>
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
              thread && (
                <div className="space-y-6">
                  <MessageBubble message={thread.message} isReply={false} />
                  {thread.replies.map((reply) => (
                    <MessageBubble key={reply.id} message={reply} isReply />
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
                    {thread?.message.status !== 'read' &&
                      thread?.message.status !== 'replied' && (
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
                      disabled={isSubmitting || !isValid || !isOnline}
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

const MessageBubble = ({
  message,
  isReply,
}: {
  message: any
  isReply: boolean
}) => {
  const displayName = isReply
    ? message.profiles?.display_name || 'Admin'
    : message.user_display_name || message.user_email
  const avatarUrl = isReply
    ? message.profiles?.avatar_url
    : message.user_avatar_url
  const content = isReply ? message.reply : message.message
  const date = formatDistanceToNow(new Date(message.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={avatarUrl} />
        <AvatarFallback>
          {displayName ? (
            displayName.charAt(0).toUpperCase()
          ) : (
            <UserIcon className="h-5 w-5" />
          )}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <div className="mt-1 text-sm text-foreground whitespace-pre-wrap">
          {content}
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
