import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VinylRecord } from '@/types/vinyl'
import { Button } from '@/components/ui/button'
import { parseISO } from 'date-fns'
import { useEffect } from 'react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar } from '../ui/calendar'

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  albumTitle: z.string().min(1, 'Título do álbum é obrigatório.'),
  artist: z.string().min(1, 'Artista é obrigatório.'),

  releaseYear: z
    .number({
      required_error: 'Ano é obrigatório.',
      invalid_type_error: 'Ano inválido.',
    })
    .int('Ano deve ser inteiro.')
    .gte(1850, 'Ano mínimo: 1850')
    .lte(currentYear + 1, 'Ano muito no futuro.')
    .optional(),

  genre: z
    .string()
    .transform((v) => v?.trim() || undefined)
    .optional(),
  notes: z
    .string()
    .transform((v) => v?.trim() || undefined)
    .optional(),

  coverArtUrl: z
    .string()
    .url('URL inválida.')
    .regex(
      /\.(jpe?g|png|gif|webp)$/i,
      'URL deve ser de uma imagem (jpg, png, etc.)',
    )
    .optional()
    .transform((v) => v || undefined),

  condition: z.enum(['Novo', 'Excelente', 'Bom', 'Regular', 'Ruim']).optional(),
  purchaseDate: z.date().optional(),

  price: z.number().optional(),
})

type RecordFormValues = z.infer<typeof formSchema>

interface RecordFormProps {
  onSubmit: (data: Omit<VinylRecord, 'id' | 'user_id'>) => void
  onCancel: () => void
  initialData?: VinylRecord
  submitButtonText: string
}

export const RecordForm = ({
  onSubmit,
  onCancel,
  initialData,
  submitButtonText,
}: RecordFormProps) => {
  const form = useForm<RecordFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      albumTitle: initialData?.albumTitle ?? '',
      artist: initialData?.artist ?? '',
      releaseYear: initialData?.releaseYear ?? undefined,
      genre: initialData?.genre ?? undefined,
      coverArtUrl: initialData?.coverArtUrl ?? undefined,
      condition: initialData?.condition ?? undefined,
      purchaseDate: initialData?.purchaseDate
        ? parseISO(initialData.purchaseDate as string)
        : undefined,
      price: initialData?.price ?? undefined,
      notes: initialData?.notes ?? undefined,
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        albumTitle: initialData.albumTitle ?? '',
        artist: initialData.artist ?? '',
        releaseYear: initialData.releaseYear ?? undefined,
        genre: initialData.genre ?? undefined,
        coverArtUrl: initialData.coverArtUrl ?? undefined,
        condition: initialData.condition ?? undefined,
        purchaseDate: initialData.purchaseDate
          ? parseISO(initialData.purchaseDate as string)
          : undefined,
        price: initialData.price ?? undefined,
        notes: initialData.notes ?? undefined,
      })
    } else {
      form.reset() // Limpa tudo se não há initialData
    }
  }, [initialData, form])

  const handleSubmit = (data: RecordFormValues) => {
    const purchaseDateString = data.purchaseDate
      ? format(data.purchaseDate, 'yyyy-MM-dd')
      : undefined // use null se o banco exigir

    const payload: Omit<VinylRecord, 'id' | 'user_id'> = {
      albumTitle: data.albumTitle.trim(),
      artist: data.artist.trim(),
      releaseYear: data.releaseYear, // já é number garantido pelo schema

      // Se o seu tipo VinylRecord usa nullables no Supabase, troque para null:
      condition: data.condition, // union ok
      genre: data.genre?.trim() || null,
      coverArtUrl: data.coverArtUrl || null,
      purchaseDate: purchaseDateString ?? null,
      price: typeof data.price === 'number' ? data.price : null,
      notes: data.notes?.trim() || null,
    }

    onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="albumTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Álbum *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Abbey Road" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="artist"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Artista *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., The Beatles" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="releaseYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 1969" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="genre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gênero</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Rock" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="coverArtUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Capa</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condição</FormLabel>
                <Select
                  value={field.value ?? ''}
                  onValueChange={field.onChange}
                  aria-label="Condição do vinil"
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['Novo', 'Excelente', 'Bom', 'Regular', 'Ruim'].map(
                      (c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col pt-2">
                <FormLabel className="mb-2">Data da Compra</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                        aria-label={`Selecionar data da compra${field.value ? `, selecionada: ${format(field.value, 'dd/MM/yyyy')}` : ''}`}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Escolha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g., 25.50"
                    {...field}
                    aria-describedby="price-help"
                  />
                  <span id="price-help" className="sr-only">
                    em reais
                  </span>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea placeholder="Qualquer nota adicional..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset()
              onCancel()
            }}
          >
            Cancelar
          </Button>
          <Button type="submit">{submitButtonText}</Button>
        </div>
      </form>
    </Form>
  )
}
