import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { DiscogsSearchResult } from '@/types/discogs'
import { ENDPOINTS } from '@/lib/api'

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[]
  error?: string
}

export function useDiscogsSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DiscogsSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 3) {
      setLoading(false)
      setResults([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    const currentRequestId = ++requestIdRef.current

    debounceRef.current = setTimeout(async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (requestIdRef.current !== currentRequestId) {
          return
        }

        if (sessionError) {
          console.error('Erro ao obter sessão do Supabase:', sessionError)
        }

        const token = session?.access_token
        if (!token) {
          setResults([])
          setError('Sessão expirada. Faça login novamente.')
          return
        }

        const response = await fetch(ENDPOINTS.SEARCH_DISCOGS, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: trimmedQuery }),
        })

        const contentType = response.headers.get('Content-Type') ?? ''
        let payload: DiscogsSearchResponse | string | null = null

        try {
          if (contentType.includes('application/json')) {
            payload = (await response.json()) as DiscogsSearchResponse
          } else {
            payload = await response.text()
          }
        } catch (parseErr) {
          console.error('Falha ao interpretar resposta do Discogs:', parseErr)
        }

        if (requestIdRef.current !== currentRequestId) {
          return
        }

        if (!response.ok) {
          const status = response.status
          const extracted =
            typeof payload === 'string'
              ? payload
              : payload && typeof payload === 'object'
                ? payload.error
                : null

          if (status === 403) {
            setError('Sessão expirada. Faça login novamente.')
          } else if (status >= 500) {
            setError(extracted || 'Não foi possível buscar no Discogs, tente novamente.')
          } else {
            setError(extracted || 'Não foi possível completar a busca.')
          }
          setResults([])
          return
        }

        if (!payload || typeof payload !== 'object') {
          setError('Não foi possível interpretar a resposta do Discogs.')
          setResults([])
          return
        }

        if (payload.error) {
          setError(payload.error)
          setResults([])
          return
        }

        setResults(payload.results ?? [])
        setError(null)
      } catch (err) {
        if (requestIdRef.current !== currentRequestId) {
          return
        }
        console.error('Erro na busca Discogs:', err)
        setResults([])
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível completar a busca. Verifique sua conexão.',
        )
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setLoading(false)
        }
      }
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  return { query, setQuery, results, loading, error }
}
