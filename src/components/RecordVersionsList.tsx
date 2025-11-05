import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getDiscogsVersions, DiscogsVersion } from '@/services/discogs'
import { Loader2, Users, Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RecordVersionsListProps {
  masterId: string
  currentReleaseId?: string | null
  onVersionSelect: (releaseId: string) => Promise<void>
}

export const RecordVersionsList = ({
  masterId,
  currentReleaseId,
  onVersionSelect,
}: RecordVersionsListProps) => {
  const [versions, setVersions] = useState<DiscogsVersion[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<string | null>(null)
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

  const sortedVersions = useMemo(() => {
    if (versions.length === 0) return []
    const rank = (v: DiscogsVersion) => ({
      br: v.country?.toLowerCase() === 'brazil' ? 0 : 1,
      pop: -(v.community?.have ?? 0),
    })
    return [...versions].sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      return ra.br - rb.br || ra.pop - rb.pop
    })
  }, [versions])

  const handleSelectVersion = async (releaseId: string) => {
    setIsSaving(releaseId)
    try {
      await onVersionSelect(releaseId)
    } finally {
      setIsSaving(null)
    }
  }

  if (loading && versions.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span>Buscando edições no Discogs…</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-10 text-destructive">{error}</div>
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Não encontramos edições cadastradas para este álbum.
      </div>
    )
  }

  return (
    <div className="max-h-[400px] overflow-y-auto pr-2 space-y-2">
      {sortedVersions.map((version, index) => {
        const isCurrent = currentReleaseId === version.id.toString()
        const isSavingThis = isSaving === version.id.toString()
        return (
          <div
            key={`${version.id}-${index}`}
            ref={index === sortedVersions.length - 1 ? lastElementRef : null}
            className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent"
          >
            <Avatar className="h-16 w-16 rounded-md">
              <AvatarImage src={version.thumb} alt={version.title} />
              <AvatarFallback className="rounded-md">?</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-sm space-y-1">
              <p className="font-semibold">{version.title}</p>
              <p className="text-muted-foreground">
                {version.label} ({version.catno}) • {version.country} •{' '}
                {version.year}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {version.community?.have ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> {version.community?.want ?? 0}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {isCurrent && <Badge variant="secondary">Sua versão atual</Badge>}
              <Button
                size="sm"
                onClick={() => handleSelectVersion(version.id.toString())}
                disabled={isSavingThis}
                variant={isCurrent ? 'outline' : 'default'}
              >
                {isSavingThis && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isCurrent ? 'Trocar' : 'Esta é a minha versão'}
              </Button>
            </div>
          </div>
        )
      })}
      {loading && versions.length > 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  )
}
