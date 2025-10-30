import { supabase } from '@/lib/supabase/client'
import { DiscogsSearchResult } from '@/types/discogs'

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[]
}

export const searchDiscogsMaster = async (
  artist: string,
  album_title: string,
): Promise<DiscogsSearchResult | null> => {
  const { data, error } =
    await supabase.functions.invoke<DiscogsSearchResponse>('search-discogs', {
      body: { artist, album_title, type: 'master' },
    })

  if (error) {
    console.error('Error invoking search-discogs function:', error)
    throw new Error(error.message || 'Falha ao buscar no Discogs.')
  }

  if (data.error) {
    console.error('Error from search-discogs function:', data.error)
    throw new Error(data.error)
  }

  if (!data.results || data.results.length === 0) {
    return null
  }

  return data.results[0]
}
