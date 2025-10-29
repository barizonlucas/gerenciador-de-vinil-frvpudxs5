import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VinylRecord } from '@/types/vinyl'
import { Button } from '@/components/ui/button'
import { parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useEffect, useState } from 'react'
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
import { CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '../ui/calendar'
import { Separator } from '../ui/separator'
import { useDiscogsSearch } from '@/hooks/use-discogs-search'
import { DiscogsSearchResult } from '@/types/discogs'

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  albumTitle: z.string().min(1, 'Título do álbum é obrigatório.'),
  artist: z.string().min(1, 'Artista é obrigatório.'),
  releaseYear: z.coerce
    .number({
      required_error: 'Ano de lançamento é obrigatório.',
      invalid_type_error: 'Ano deve ser um número.',
    })
    .int('Ano deve ser inteiro.')
    .min(1800, 'Ano de lançamento parece muito antigo.')
    .max(currentYear + 1, 'Ano de lançamento não pode ser no futuro.'),
  genre: z.string().optional(),
  notes: z.string().optional(),
  coverArtUrl: z.string().url('URL inválida.').optional().or(z.literal('')),
  condition: z.enum(['Novo', 'Excelente', 'Bom', 'Regular', 'Ruim']).optional(),
  purchaseDate: z.date().optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Preço deve ser um número.' })
    .min(0, 'Preço não pode ser negativo.')
    .optional(),
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
      genre: initialData?.genre ?? '',
      coverArtUrl: initialData?.coverArtUrl ?? '',
      condition: initialData?.condition ?? undefined,
      purchaseDate: initialData?.purchaseDate
        ? parseISO(initialData.purchaseDate as string)
        : undefined,
      price: initialData?.price ?? undefined,
      notes: initialData?.notes ?? '',
    },
  })

  // Hook de busca Discogs
  const { query, setQuery, results, loading } = useDiscogsSearch()
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (initialData) {
      form.reset({
        albumTitle: initialData.albumTitle ?? '',
        artist: initialData.artist ?? '',
        releaseYear: initialData.releaseYear ?? undefined,
        genre: initialData.genre ?? '',
        coverArtUrl: initialData.coverArtUrl ?? '',
        condition: initialData.condition ?? undefined,
        purchaseDate: initialData.purchaseDate
          ? parseISO(initialData.purchaseDate as string)
          : undefined,
        price: initialData.price ?? undefined,
        notes: initialData.notes ?? '',
      })
    }
  }, [initialData, form])

  const handleDiscogsSelect = (result: DiscogsSearchResult) => {
    form.setValue('albumTitle', result.albumTitle, { shouldValidate: true })
    form.setValue('artist', result.artist, { shouldValidate: true })
    if (result.year) {
      form.setValue('releaseYear', parseInt(result.year, 10), {
        shouldValidate: true,
      })
    }
    if (result.genre) {
      const genreStr = Array.isArray(result.genre) ? result.genre.join(', ') : result.genre
      form.setValue('genre', genreStr)
    }
    if (result.coverArtUrl) {
      form.setValue('coverArtUrl', result.coverArtUrl)
    }
    setQuery(result.albumTitle) // mantém no input
    setShowResults(false)
  }

  const handleSubmit = (data: RecordFormValues) => {
    const purchaseDateString = data.purchaseDate
      ? format(data.purchaseDate, 'yyyy-MM-dd')
      : undefined

    const payload: Omit<VinylRecord, 'id' | 'user_id'> = {
      albumTitle: data.albumTitle.trim(),
      artist: data.artist.trim(),
      releaseYear: data.releaseYear,
      condition: data.condition,
      genre: data.genre?.trim() || undefined,
      coverArtUrl: data.coverArtUrl || undefined,
      purchaseDate: purchaseDateString,
      price: typeof data.price === 'number' ? data.price : undefined,
      notes: data.notes?.trim() || undefined,
    }

    onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* BUSCA RÁPIDA - APENAS NO CADASTRO */}
        {!initialData && (
          <FormItem>
            <FormLabel>Encontre seu disco</FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="Digite banda ou álbum..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setShowResults(true)
                  }}
                  onFocus={() => setShowResults(true)}
                  className="pr-10"
                />
                {loading && (
                  <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </FormControl>

            {/* Dropdown SEM Popover — foco livre */}
            {showResults && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="ml-2 text-sm">Buscando...</span>
                  </div>
                ) : results.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhum resultado encontrado
                  </div>
                ) : (
                  <ul className="max-h-60 overflow-auto">
                    {results.map((result) => (
                      <li
                        key={result.id}
                        onClick={() => {
                          handleDiscogsSelect(result)
                          setShowResults(false)
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleDiscogsSelect(result)
                            setShowResults(false)
                          }
                        }}
                      >
                        {result.thumb ? (
                          <img
                            src={result.thumb}
                            alt={result.albumTitle}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs">?</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{result.albumTitle}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.artist} {result.year && `(${result.year})`}
                            {result.format && ` — ${result.format}`}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <FormMessage />
          </FormItem>
        )}
        <Separator className="my-6" />

        {/* RESTANTE DO FORMULÁRIO (igual antes) */}
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
                <FormLabel>Ano *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 1969"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? undefined : e.target.value,
                      )
                    }
                  />
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
                  <Input
                    placeholder="e.g., Rock"
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <Input
                  type="url"
                  placeholder="https://..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.watch('coverArtUrl') && (
          <div className="mt-2 -mb-2">
            <img
              src={form.watch('coverArtUrl')}
              alt="Pré-visualização da capa"
              className="h-40 w-40 object-cover rounded-md shadow-md border"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

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
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ptBR })
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
                    value={field.value ?? ''}
                  />
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
                <Textarea
                  placeholder="Qualquer nota adicional..."
                  {...field}
                  value={field.value ?? ''}
                />
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
