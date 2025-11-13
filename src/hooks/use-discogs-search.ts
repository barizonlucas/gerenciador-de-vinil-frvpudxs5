import { useState, useEffect } from 'react'
import { useDebounce } from './use-debounce'
import { supabase } from '@/lib/supabase/client'
import { DiscogsSearchResult } from '@/types/discogs'

export const useDiscogsSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DiscogsSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    if (debouncedQuery.trim().length < 3) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    let isCancelled = false
    const search = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: invokeError } =
          await supabase.functions.invoke<any>('search-discogs', {
            body: { q: debouncedQuery },
          })

        if (isCancelled) return

        if (invokeError) {
          throw new Error(invokeError.message)
        }

        if (data.error) {
          throw new Error(data.error)
        }

        setResults(data.results || [])
      } catch (err: any) {
        if (!isCancelled) {
          setError(
            'Não foi possível buscar no Discogs. Tente novamente mais tarde.',
          )
          console.error('Discogs search error:', err)
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    search()

    return () => {
      isCancelled = true
    }
  }, [debouncedQuery])

  return { query, setQuery, results, loading, error }
}
