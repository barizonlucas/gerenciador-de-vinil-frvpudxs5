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
import { Loader2 } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { submitMessage } from '@/services/messages'
import { toast } from 'sonner'
import { logEvent } from '@/services/telemetry'

const messageSchema = z.object({
  message: z
    .string()
    .min(5, { message: 'Escreva pelo menos 5 caracteres.' })
    .max(500, { message: 'Limite de 500 caracteres.' }),
})

type MessageFormValues = z.infer<typeof messageSchema>

interface MessageFormProps {
  onCancel: () => void
}

export const MessageForm = ({ onCancel }: MessageFormProps) => {
  const isOnline = useOnlineStatus()
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

  const onSubmit = async (data: MessageFormValues) => {
    try {
      await submitMessage(data.message)
      toast.success('✅ Mensagem enviada. Obrigado por contribuir!')
      logEvent('message_sent', {
        message_length: data.message.length,
      })
      reset()
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
