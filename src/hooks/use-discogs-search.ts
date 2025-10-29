import { useEffect, useState, useRef } from 'react'
import { ENDPOINTS } from '@/lib/api'

const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export function useDiscogsSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 3) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(ENDPOINTS.SEARCH_DISCOGS, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${KEY}`,
            'Content-Type': 'application/json',
            // Supabase pode adicionar apikey ou x-client-info → permita tudo
            apikey: KEY,
          },
          body: JSON.stringify({ q: query }),
        })

        if (!res.ok) {
          const err = await res.text()
          throw new Error(`HTTP ${res.status}: ${err}`)
        }

        const data = await res.json()
        setResults(data.results || [])
      } catch (err: any) {
        console.error('Erro na busca Discogs:', err)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  return { query, setQuery, results, loading }
}