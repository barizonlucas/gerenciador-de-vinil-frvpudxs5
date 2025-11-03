import { useState, useEffect, useRef, useCallback } from 'react'
import { getDiscogsVersions, DiscogsVersion } from '@/services/discogs'
import { Loader2, Users, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

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
    // Reset state when masterId changes
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
      {versions.map((version, index) => (
        <div
          key={version.id}
          ref={index === versions.length - 1 ? lastElementRef : null}
          className="flex items-start gap-4 p-2 rounded-lg hover:bg-accent"
        >
          <Avatar className="h-16 w-16 rounded-md">
            <AvatarImage src={version.thumb} alt={version.title} />
            <AvatarFallback className="rounded-md">?</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-sm">
            <p className="font-semibold">{version.title}</p>
            <p className="text-muted-foreground">
              {version.label} • {version.country} • {version.year}
            </p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {version.community.have}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> {version.community.want}
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
