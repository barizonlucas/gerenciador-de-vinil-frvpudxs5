import { useMemo, useState, useEffect, useRef, type ComponentType } from 'react'
import {
  Disc,
  Users,
  Layers,
  Music,
  Star,
  Globe,
  Plus,
  Sparkles,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/client'

type StatCard = {
  key: string
  label: string
  value: string
  description: string
  icon: ComponentType<{ className?: string }>
}

const numberFormatter = new Intl.NumberFormat('pt-BR')

const formatCountWithLabel = (
  count: number,
  singular: string,
  plural: string,
) => `${numberFormatter.format(count)} ${count === 1 ? singular : plural}`

const formatPercentage = (value: number | null | undefined) =>
  typeof value === 'number' && !Number.isNaN(value) ? `${value}%` : '—'

const formatDecadeLabel = (decade: number | null) => {
  if (decade === null) return '—'
  if (decade >= 2000) return `Anos ${decade}`
  const lastTwo = decade.toString().slice(-2)
  return `Anos ${lastTwo}`
}

const formatCountryName = (country: string | null) => {
  if (!country) return ''
  const normalized = country.trim().toLowerCase()
  const overrides: Record<string, string> = {
    brazil: 'Brasil',
    'united states': 'Estados Unidos',
    usa: 'Estados Unidos',
    'united kingdom': 'Reino Unido',
    uk: 'Reino Unido',
  }
  if (overrides[normalized]) {
    return overrides[normalized]
  }
  return normalized
    .split(/[\s/-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const DashboardPage = () => {
  const { records, loading, openAddModal } = useVinylContext()
  const [essenceMessage, setEssenceMessage] = useState<string | null>(null)
  const [essenceError, setEssenceError] = useState<string | null>(null)
  const [essenceLoading, setEssenceLoading] = useState(false)
  const essencePayloadRef = useRef<string | null>(null)

  const stats = useMemo(() => {
    const totalRecords = records.length

    type CounterValue = { label: string; count: number }

    const artistCounter = new Map<string, CounterValue>()
    const genreCounter = new Map<string, CounterValue>()
    const decadeCount = new Map<number, number>()
    const conditionCount = new Map<string, number>()
    const countryCount = new Map<string, number>()

    let totalWithYear = 0
    let totalWithCountry = 0

    const incrementCounter = (
      map: Map<string, CounterValue>,
      rawLabel: string,
    ) => {
      const trimmed = rawLabel.trim()
      if (!trimmed) return
      const normalized = trimmed.toLowerCase()
      const existing = map.get(normalized)
      if (existing) {
        existing.count += 1
      } else {
        map.set(normalized, { label: trimmed, count: 1 })
      }
    }

    records.forEach((record) => {
      const artist = record.artist?.trim()
      if (artist) {
        incrementCounter(artistCounter, artist)
      }

      if (record.genre) {
        const uniqueGenresForRecord = new Set<string>()
        record.genre
          .split(',')
          .map((part) => part.trim())
          .filter(Boolean)
          .forEach((part) => uniqueGenresForRecord.add(part))
        uniqueGenresForRecord.forEach((genre) =>
          incrementCounter(genreCounter, genre),
        )
      }

      if (
        typeof record.releaseYear === 'number' &&
        !Number.isNaN(record.releaseYear)
      ) {
        const decade = Math.floor(record.releaseYear / 10) * 10
        decadeCount.set(decade, (decadeCount.get(decade) ?? 0) + 1)
        totalWithYear += 1
      }

      if (record.condition) {
        conditionCount.set(
          record.condition,
          (conditionCount.get(record.condition) ?? 0) + 1,
        )
      }

      const country = record.release_country?.trim()
      if (country) {
        countryCount.set(country, (countryCount.get(country) ?? 0) + 1)
        totalWithCountry += 1
      }
    })

    const uniqueArtists = artistCounter.size
    const uniqueGenres = genreCounter.size

    const getTopCounterValue = (
      map: Map<string, CounterValue>,
    ): (CounterValue & { normalized: string }) | null => {
      let topEntry: (CounterValue & { normalized: string }) | null = null
      map.forEach((value, key) => {
        if (!topEntry || value.count > topEntry.count) {
          topEntry = { ...value, normalized: key }
        }
      })
      return topEntry
    }

    const findTop = <T,>(map: Map<T, number>) => {
      let topKey: T | null = null
      let topCount = 0
      map.forEach((count, key) => {
        if (count > topCount) {
          topKey = key
          topCount = count
        }
      })
      return { topKey, topCount }
    }

    const topGenreEntry = getTopCounterValue(genreCounter)
    const topArtistEntry = getTopCounterValue(artistCounter)

    const { topKey: predominantDecade, topCount: decadeOccurrences } =
      findTop(decadeCount)
    const { topKey: predominantCondition } = findTop(conditionCount)
    const { topKey: predominantCountry, topCount: countryOccurrences } =
      findTop(countryCount)

    const decadeLabel = formatDecadeLabel(
      predominantDecade !== null ? (predominantDecade as number) : null,
    )

    const decadeShare =
      predominantDecade !== null && totalWithYear > 0
        ? Math.round((decadeOccurrences / totalWithYear) * 100)
        : null

    const conditionLabel = predominantCondition ?? '—'
    const countryLabel = formatCountryName(
      (predominantCountry as string | null) ?? null,
    )
    const countryShare =
      predominantCountry && totalWithCountry > 0
        ? Math.round((countryOccurrences / totalWithCountry) * 100)
        : null

    const topGenre =
      topGenreEntry && totalRecords > 0
        ? {
            label: topGenreEntry.label,
            count: topGenreEntry.count,
            percentage: Math.round((topGenreEntry.count / totalRecords) * 100),
          }
        : null

    const topArtist =
      topArtistEntry && totalRecords > 0
        ? {
            label: topArtistEntry.label,
            count: topArtistEntry.count,
            percentage: Math.round((topArtistEntry.count / totalRecords) * 100),
          }
        : null

    const cards: StatCard[] = [
      {
        key: 'total',
        label: 'Discos cadastrados',
        value: numberFormatter.format(totalRecords),
        description:
          totalRecords > 0
            ? `Você tem ${formatCountWithLabel(totalRecords, 'disco', 'discos')}.`
            : 'Comece sua coleção adicionando o primeiro vinil.',
        icon: Disc,
      },
      {
        key: 'artists',
        label: 'Artistas únicos',
        value: totalRecords > 0 ? numberFormatter.format(uniqueArtists) : '—',
        description:
          uniqueArtists > 0
            ? `${formatCountWithLabel(
                uniqueArtists,
                'artista diferente',
                'artistas diferentes',
              )}.`
            : 'Cada artista conta uma história — adicione novos nomes.',
        icon: Users,
      },
      {
        key: 'genres',
        label: 'Gêneros presentes',
        value: totalRecords > 0 ? numberFormatter.format(uniqueGenres) : '—',
        description:
          uniqueGenres > 1
            ? `${formatCountWithLabel(
                uniqueGenres,
                'gênero musical',
                'gêneros musicais',
              )} presentes no acervo.`
            : 'Informe o gênero dos discos para acompanhar a diversidade.',
        icon: Layers,
      },
      {
        key: 'decade',
        label: 'Década predominante',
        value: decadeLabel,
        description:
          decadeShare && predominantDecade !== null
            ? `${decadeShare}% dos seus discos são dos ${decadeLabel.toLowerCase()}.`
            : 'Adicione o ano de lançamento para descobrir a década dominante.',
        icon: Music,
      },
      {
        key: 'condition',
        label: 'Condição mais comum',
        value: conditionLabel,
        description:
          predominantCondition && conditionLabel !== '—'
            ? `A maioria dos seus discos está em condição ${conditionLabel.toLowerCase()}.`
            : 'Informe a condição dos discos para monitorar o estado do acervo.',
        icon: Star,
      },
      {
        key: 'country',
        label: 'País de edição mais frequente',
        value: countryLabel || '—',
        description:
          countryShare && countryLabel
            ? `${countryShare}% das suas edições vieram de ${countryLabel}.`
            : 'Adicione o país de edição para ver esta métrica.',
        icon: Globe,
      },
    ]

    return {
      totalRecords,
      cards,
      topGenre,
      topArtist,
      topDecade:
        predominantDecade !== null
          ? {
              decade: predominantDecade as number,
              label: decadeLabel,
              share: decadeShare,
            }
          : null,
      topCountry:
        predominantCountry && countryLabel
          ? {
              label: countryLabel,
              share: countryShare,
            }
          : null,
    }
  }, [records])

  const essenceData = useMemo(() => {
    if (stats.totalRecords === 0 || !stats.topGenre || !stats.topArtist) {
      return null
    }
    return {
      totalRecords: stats.totalRecords,
      topGenre: stats.topGenre,
      topArtist: stats.topArtist,
      topDecade: stats.topDecade,
      topCountry: stats.topCountry,
    }
  }, [
    stats.totalRecords,
    stats.topGenre?.label,
    stats.topGenre?.count,
    stats.topGenre?.percentage,
    stats.topArtist?.label,
    stats.topArtist?.count,
    stats.topArtist?.percentage,
    stats.topDecade?.decade,
    stats.topDecade?.share,
    stats.topCountry?.label,
    stats.topCountry?.share,
  ])

  useEffect(() => {
    if (loading) {
      return
    }

    if (!essenceData) {
      essencePayloadRef.current = null
      setEssenceMessage(null)
      setEssenceError(null)
      setEssenceLoading(false)
      return
    }

    const payloadKey = JSON.stringify(essenceData)
    if (essencePayloadRef.current === payloadKey) {
      return
    }
    essencePayloadRef.current = payloadKey

    let isCancelled = false
    setEssenceLoading(true)
    setEssenceError(null)

    supabase.functions
      .invoke<{ message: string }>('identify-album-cover', {
        body: { mode: 'essence', ...essenceData },
      })
      .then(({ data, error }) => {
        if (isCancelled) return
        if (error) {
          console.error('Erro ao gerar essência musical:', error)
          setEssenceError(
            'Não foi possível gerar a mensagem interpretativa agora.',
          )
          setEssenceMessage(null)
          return
        }
        if (data?.message) {
          const trimmed = data.message.trim()
          setEssenceMessage(trimmed.length > 0 ? trimmed : null)
        } else {
          setEssenceMessage(null)
        }
      })
      .catch((err) => {
        if (isCancelled) return
        console.error('Erro ao gerar essência musical:', err)
        setEssenceError(
          'Não foi possível gerar a mensagem interpretativa agora.',
        )
        setEssenceMessage(null)
      })
      .finally(() => {
        if (!isCancelled) {
          setEssenceLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [loading, essenceData])

  const renderSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={`skeleton-${index}`}>
          <CardHeader className="space-y-3 pb-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Disc className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">
        Comece sua coleção adicionando seu primeiro vinil.
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Esses números vão ganhar vida assim que você cadastrar seus primeiros
        discos.
      </p>
      <Button className="mt-6" onClick={openAddModal}>
        <Plus className="mr-2 h-4 w-4" />
        Adicionar disco agora
      </Button>
    </div>
  )

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sua coleção em números</h1>
          <p className="text-muted-foreground">
            Esses indicadores contam a história do seu acervo — orgulho puro.
          </p>
        </div>
        {stats.totalRecords > 0 && (
          <span className="text-sm text-muted-foreground">
            Atualizado automaticamente conforme você gerencia a coleção.
          </span>
        )}
      </div>

      {loading ? (
        renderSkeleton()
      ) : stats.totalRecords === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {stats.cards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.key} className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                    <div className="space-y-1">
                      <CardDescription className="uppercase tracking-wide text-xs">
                        {card.label}
                      </CardDescription>
                      <CardTitle className="text-3xl font-bold">
                        {card.value}
                      </CardTitle>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <section className="mt-12 space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold">Essência musical</h2>
              <p className="text-sm text-muted-foreground">
                Descubra o som da sua coleção — os padrões que definem seu gosto
                e contam sua história musical.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              <Card className="transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardDescription className="uppercase tracking-wide text-xs">
                      Gênero predominante
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold">
                      {stats.topGenre?.label ?? '—'}
                    </CardTitle>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Music className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {stats.topGenre
                      ? `Seu gênero predominante é ${stats.topGenre.label}${
                          typeof stats.topGenre.percentage === 'number'
                            ? ` (${formatPercentage(stats.topGenre.percentage)})`
                            : ''
                        }.`
                      : 'Complete os gêneros dos seus discos para descobrir sua essência musical.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardDescription className="uppercase tracking-wide text-xs">
                      Artista mais representado
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold">
                      {stats.topArtist?.label ?? '—'}
                    </CardTitle>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {stats.topArtist
                      ? `Seu artista mais presente é ${stats.topArtist.label} (${formatCountWithLabel(
                          stats.topArtist.count,
                          'disco',
                          'discos',
                        )}).`
                      : 'Informe o artista dos discos para revelar quem domina a vitrola.'}
                  </p>
                </CardContent>
              </Card>

              <Card className="transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1">
                    <CardDescription className="uppercase tracking-wide text-xs">
                      Mensagem interpretativa
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold">
                      Sua essência musical
                    </CardTitle>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  {essenceData && essenceLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {essenceData
                        ? essenceError
                          ? essenceError
                          : (essenceMessage ??
                            'Ainda não foi possível gerar uma leitura personalizada.')
                        : 'Complete gênero e artista dos seus discos para gerar uma leitura personalizada.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardPage
