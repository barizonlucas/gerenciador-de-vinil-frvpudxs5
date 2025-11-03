import { supabase } from '@/lib/supabase/client'
import { DiscogsSearchResult } from '@/types/discogs'

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[]
}

export interface DiscogsVersion {
  id: number
  title: string
  year: string
  country: string
  label: string
  thumb: string
  community: {
    have: number
    want: number
  }
}

export interface DiscogsVersionsResponse {
  pagination: {
    page: number
    pages: number
    per_page: number
    items: number
  }
  versions: DiscogsVersion[]
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

  if ((data as any).error) {
    console.error('Error from search-discogs function:', (data as any).error)
    throw new Error((data as any).error)
  }

  if (!data.results || data.results.length === 0) {
    return null
  }

  return data.results[0]
}

export const getDiscogsVersions = async (
  master_id: string,
  page: number,
): Promise<DiscogsVersionsResponse> => {
  const { data, error } =
    await supabase.functions.invoke<DiscogsVersionsResponse>(
      'get-discogs-versions',
      {
        body: { master_id, page },
      },
    )

  if (error) {
    console.error('Error invoking get-discogs-versions function:', error)
    throw new Error(error.message || 'Falha ao buscar versões no Discogs.')
  }

  if ((data as any).error) {
    console.error(
      'Error from get-discogs-versions function:',
      (data as any).error,
    )
    throw new Error((data as any).error)
  }

  return data
}
