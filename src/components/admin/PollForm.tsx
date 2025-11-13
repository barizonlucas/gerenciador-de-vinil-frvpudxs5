import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Poll } from '@/types/poll'
import { upsertPoll, activatePoll, deactivatePoll } from '@/services/polls'
import { logEvent } from '@/services/telemetry'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, Eye } from 'lucide-react'
import { PollPreviewModal } from './PollPreviewModal'

const optionSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(3, 'O título curto deve ter no mínimo 3 caracteres.')
    .max(60, 'O título curto deve ter no máximo 60 caracteres.'),
  short_desc: z
    .string()
    .max(140, 'A descrição curta deve ter no máximo 140 caracteres.')
    .optional()
    .nullable(),
})

const pollSchema = z.object({
  id: z.string().optional(),
  title: z
    .string()
    .min(5, 'O título da enquete deve ter no mínimo 5 caracteres.')
    .max(120, 'O título da enquete deve ter no máximo 120 caracteres.'),
  options: z.array(optionSchema).length(3, 'Deve haver exatamente 3 opções.'),
})

type PollFormValues = z.infer<typeof pollSchema>

interface PollFormProps {
  initialPoll: Poll | null
  onPollUpdate: (poll: Poll) => void
}

export const PollForm = ({ initialPoll, onPollUpdate }: PollFormProps) => {
  const { user } = useAuth()
  const [poll, setPoll] = useState<Poll | null>(initialPoll)
  const [isLoading, setIsLoading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    mode: 'onChange',
  })

  const { fields } = useFieldArray({
    control: form.control,
    name: 'options',
  })

  useEffect(() => {
    const defaultOptions = [
      { title: '', short_desc: '' },
      { title: '', short_desc: '' },
      { title: '', short_desc: '' },
    ]
    form.reset({
      id: poll?.id,
      title: poll?.title || '',
      options: poll?.options?.length === 3 ? poll.options : defaultOptions,
    })
  }, [poll, form])

  const handleSave = async (activate = false) => {
    setIsLoading(true)
    try {
      const values = form.getValues()
      const isNewPoll = !values.id
      const pollToSave = {
        id: values.id,
        title: values.title,
        is_active: activate ? true : poll?.is_active || false,
        options: values.options,
      }

      const savedPoll = await upsertPoll(pollToSave)
      if (!savedPoll) throw new Error('Failed to save poll')

      if (activate) {
        await activatePoll(savedPoll.id)
        logEvent('admin_poll_activated', {
          user_id: user?.id,
          poll_id: savedPoll.id,
        })
        toast.success('✅ Enquete ativada')
      } else {
        toast.success('✅ Enquete salva')
        logEvent(isNewPoll ? 'admin_poll_created' : 'admin_poll_updated', {
          user_id: user?.id,
          poll_id: savedPoll.id,
        })
      }

      setPoll(savedPoll)
      onPollUpdate(savedPoll)
    } catch (error) {
      toast.error('Não foi possível salvar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeactivate = async () => {
    if (!poll?.id) return
    setIsLoading(true)
    try {
      await deactivatePoll(poll.id)
      const updatedPoll = { ...poll, is_active: false }
      setPoll(updatedPoll)
      onPollUpdate(updatedPoll)
      logEvent('admin_poll_deactivated', {
        user_id: user?.id,
        poll_id: poll.id,
      })
      toast.success('✅ Enquete desativada')
    } catch (error) {
      toast.error('Não foi possível desativar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const optionLetters = ['A', 'B', 'C']

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSave(false)
          }}
        >
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Enquete ativa (prioridades)</CardTitle>
                  <CardDescription>
                    Defina a enquete que os colecionadores usarão para votar.
                  </CardDescription>
                </div>
                {poll && (
                  <Badge variant={poll.is_active ? 'default' : 'secondary'}>
                    {poll.is_active ? 'Ativa' : 'Rascunho'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título da enquete</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Qual recurso devemos priorizar?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-4">
                    <h3 className="font-semibold">
                      Opção {optionLetters[index]}
                    </h3>
                    <FormField
                      control={form.control}
                      name={`options.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título curto</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Melhorias na busca"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`options.${index}.short_desc`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição curta (opcional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva a opção em poucas palavras."
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t px-6 py-4">
              <div>
                {poll?.updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Última atualização em{' '}
                    {format(
                      new Date(poll.updated_at),
                      "dd/MM/yyyy 'às' HH:mm",
                      { locale: ptBR },
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPreviewOpen(true)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Pré-visualizar
                </Button>
                {poll?.is_active ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeactivate}
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Desativar
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={isLoading || !form.formState.isValid}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Ativar enquete
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isDirty}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
      <PollPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        poll={{ ...poll, ...form.getValues() } as Poll}
      />
    </>
  )
}
