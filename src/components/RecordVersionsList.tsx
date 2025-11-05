import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getDiscogsVersions, DiscogsVersion } from '@/services/discogs'
import { Loader2, Users, Heart, Flame } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RecordVersionsListProps {
  masterId: string
}

export const RecordVersionsList = ({ masterId }: RecordVersionsListProps) => {
  const [versions, setVersions] = useState<DiscogsVersion[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const observer = useRef<IntersectionObserver>()
  const lastElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          setPage((prevPage) => prevPage + 1)
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, page, totalPages],
  )

  useEffect(() => {
    setVersions([])
    setPage(1)
    setTotalPages(1)
    setLoading(true)
    setError(null)
  }, [masterId])

  useEffect(() => {
    let isMounted = true
    const fetchVersions = async () => {
      setLoading(true)
      try {
        const response = await getDiscogsVersions(masterId, page)
        if (isMounted) {
          setVersions((prev) => [...prev, ...response.versions])
          setTotalPages(response.pagination.pages)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.message || 'Não foi possível carregar as versões do disco.',
          )
          toast.error('Falha ao buscar versões.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchVersions()
    return () => {
      isMounted = false
    }
  }, [masterId, page])

  const sortedAndHighlightedVersions = useMemo(() => {
    if (versions.length === 0) return []

    const sorted = [...versions].sort((a, b) => {
      const aIsBrazil = a.country === 'Brazil'
      const bIsBrazil = b.country === 'Brazil'

      if (aIsBrazil && !bIsBrazil) return -1
      if (!aIsBrazil && bIsBrazil) return 1

      return (b.community?.have ?? 0) - (a.community?.have ?? 0)
    })

    const topThreeIds = new Set(sorted.slice(0, 3).map((v) => v.id))

    return sorted.map((version) => ({
      ...version,
      isHighlighted: topThreeIds.has(version.id),
    }))
  }, [versions])

  if (loading && versions.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Buscando versões no Discogs…</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Não encontramos edições cadastradas para esse álbum.
      </div>
    )
  }

  return (
    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4">
      {sortedAndHighlightedVersions.map((version, index) => (
        <div
          key={`${version.id}-${index}`}
          ref={
            index === sortedAndHighlightedVersions.length - 1
              ? lastElementRef
              : null
          }
          className="flex items-start gap-4 p-2 rounded-lg hover:bg-accent"
        >
          <Avatar className="h-16 w-16 rounded-md">
            <AvatarImage src={version.thumb} alt={version.title} />
            <AvatarFallback className="rounded-md">?</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-sm">
            <p className="font-semibold flex items-center gap-1.5">
              {version.title}
              {version.isHighlighted && (
                <Tooltip>
                  <TooltipTrigger>
                    <Flame className="h-4 w-4 text-orange-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edição Popular</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </p>
            <p className="text-muted-foreground">
              {version.label} • {version.country} • {version.year}
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {version.community?.have ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> {version.community?.want ?? 0}
              </span>
            </div>
          </div>
        </div>
      ))}
      {loading && versions.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  )
}
