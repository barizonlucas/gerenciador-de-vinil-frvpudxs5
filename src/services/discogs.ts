import { supabase } from '@/lib/supabase/client'
import { DiscogsSearchResult } from '@/types/discogs'

export const searchDiscogs = async (
  query: string,
): Promise<DiscogsSearchResult[]> => {
  if (query.length < 3) {
    return []
  }

  const { data, error } = await supabase.functions.invoke('search-discogs', {
    body: { query },
  })

  if (error) {
    console.error('Error invoking search-discogs function:', error)
    throw new Error('Falha ao buscar na base de dados do Discogs.')
  }

  if (data.error) {
    console.error('Error from search-discogs function:', data.error)
    throw new Error(data.error)
  }

  return data as DiscogsSearchResult[]
}
