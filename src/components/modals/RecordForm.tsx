import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VinylRecord } from '@/types/vinyl'
import { Button } from '@/components/ui/button'
import { parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import React, { useEffect, useState } from 'react'

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
import { DiscogsSearch } from '../DiscogsSearch'
import { DiscogsSearchResult } from '@/types/discogs'

const currentYear = new Date().getFullYear()

const formSchema = z.object({
  albumTitle: z.string().min(1, 'Título do álbum é obrigatório.'),
  artist: z.string().min(1, 'Artista é obrigatório.'),
  master_id: z.string().optional(),
  releaseYear: z.coerce
    .number({ invalid_type_error: 'Ano deve ser um número.' })
    .int()
    .min(1800)
    .max(currentYear + 1)
    .optional(),
  genre: z.string().optional(),
  coverArtUrl: z.string().url('URL inválida.').optional().or(z.literal('')),
  condition: z.enum(['Novo', 'Excelente', 'Bom', 'Regular', 'Ruim']).optional(),
  purchaseDate: z.date().optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Preço deve ser um número.' })
    .min(0, 'Preço não pode ser negativo.')
    .optional(),
  notes: z.string().optional(),
})

type RecordFormValues = z.infer<typeof formSchema>

interface RecordFormProps {
  onSubmit: (data: Omit<VinylRecord, 'id' | 'user_id'>) => Promise<void> | void
  onCancel: () => void
  initialData?: Partial<VinylRecord>
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
      ...initialData,
      albumTitle: initialData?.albumTitle ?? '',
      artist: initialData?.artist ?? '',
      master_id:
        typeof initialData?.master_id === 'string'
          ? initialData.master_id
          : undefined,
      purchaseDate: initialData?.purchaseDate
        ? parseISO(initialData.purchaseDate as string)
        : undefined,
    },
  })

  const {
    formState: { isSubmitting },
  } = form

  const coverArtPreviewUrl = form.watch('coverArtUrl') ?? ''

  // estado local opcional pra saber se a imagem falhou
  const [coverError, setCoverError] = React.useState(false)

  useEffect(() => {
    form.reset({
      albumTitle: initialData?.albumTitle ?? '',
      artist: initialData?.artist ?? '',
      master_id:
        typeof initialData?.master_id === 'string'
          ? initialData.master_id
          : undefined,
      releaseYear: initialData?.releaseYear ?? undefined,
      genre: initialData?.genre ?? '',
      coverArtUrl: initialData?.coverArtUrl ?? '',
      condition: initialData?.condition ?? undefined,
      purchaseDate: initialData?.purchaseDate
        ? parseISO(initialData.purchaseDate as string)
        : undefined,
      price: initialData?.price ?? undefined,
      notes: initialData?.notes ?? '',
    })
  }, [initialData, form])

  const handleDiscogsSelect = (result: DiscogsSearchResult) => {
    form.setValue('albumTitle', result.albumTitle, { shouldValidate: true })
    form.setValue('artist', result.artist, { shouldValidate: true })
    const masterId = result.masterId ?? result.id
    form.setValue(
      'master_id',
      masterId !== undefined ? masterId.toString() : undefined,
      { shouldDirty: true },
    )
    if (result.year) {
      form.setValue('releaseYear', parseInt(result.year, 10), {
        shouldValidate: true,
      })
    }
    const genre = Array.isArray(result.genre)
      ? result.genre.join(', ')
      : result.genre
    if (genre) {
      form.setValue('genre', genre)
    }
    if (result.coverArtUrl) {
      form.setValue('coverArtUrl', result.coverArtUrl)
    }
  }

  const handleFormSubmit = async (data: RecordFormValues) => {
    const payload: Omit<VinylRecord, 'id' | 'user_id'> = {
      ...data,
      purchaseDate: data.purchaseDate
        ? format(data.purchaseDate, 'yyyy-MM-dd')
        : undefined,
    }
    await onSubmit(payload)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        {!initialData?.id && (
          <>
            <FormItem>
              <FormLabel>Busca Rápida</FormLabel>
              <FormControl>
                <DiscogsSearch onSelect={handleDiscogsSelect} />
              </FormControl>
            </FormItem>
            <Separator className="my-6" />
          </>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="albumTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Álbum</FormLabel>
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
                <FormLabel>Artista</FormLabel>
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
                <FormLabel>Ano de Lançamento</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 1969"
                    {...field}
                    value={field.value ?? ''}
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

              {/* Preview da capa */}
              {coverArtPreviewUrl && !coverError ? (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="h-24 w-24 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                    <img
                      src={coverArtPreviewUrl}
                      alt="Prévia da capa"
                      className="h-full w-full object-cover"
                      onError={() => setCoverError(true)}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground leading-snug">
                    Pré-visualização da capa.
                    <br />
                    Salvo junto com o disco.
                  </div>
                </div>
              ) : null}

              {coverError && coverArtPreviewUrl ? (
                <p className="mt-2 text-xs text-destructive">
                  Não foi possível carregar essa imagem.
                </p>
              ) : null}

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
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
                          <span>Escolha uma data</span>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
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
                    placeholder="250,00"
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
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  )
}
