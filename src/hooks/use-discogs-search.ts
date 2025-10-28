// src/hooks/use-discogs-search.ts
import { useState, useEffect } from 'react'
import axios from 'axios'

const DISCOSGS_TOKEN = import.meta.env.VITE_DISCOGS_TOKEN

if (!DISCOSGS_TOKEN) {
  console.warn('⚠️ VITE_DISCOGS_TOKEN não encontrado no .env')
}

interface DiscogsResult {
  id: number
  title: string
  artist?: string
  year?: string
  thumb?: string
  cover_image?: string
}

export const useDiscogsSearch = (
  query: string,
  type: 'release' | 'artist' = 'release',
  options?: { perPage?: number },
) => {
  const [results, setResults] = useState<DiscogsResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim() || !DISCOSGS_TOKEN) {
      setResults([])
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const search = async () => {
      try {
        const res = await axios.get('https://api.discogs.com/database/search', {
          params: {
            q: query,
            type,
            per_page: options?.perPage ?? 10,
          },
          headers: {
            Authorization: `Discogs token=${DISCOSGS_TOKEN}`,
            'User-Agent': 'TekoApp/1.0 +https://teko.app', // obrigatório
          },
          signal: controller.signal,
        })

        const formatted = res.data.results.map((r: any) => ({
          id: r.id,
          title: r.title,
          artist: r.artist?.[0]?.name,
          year: r.year,
          thumb: r.thumb,
          cover_image: r.cover_image,
        }))

        setResults(formatted)
      } catch (err: any) {
        if (!axios.isCancel(err)) {
          setError(err.response?.data?.message || 'Erro na busca')
          console.error('Discogs API error:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    const timeout = setTimeout(search, 300) // debounce
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, type, options?.perPage])

  return { results, loading, error }
}
