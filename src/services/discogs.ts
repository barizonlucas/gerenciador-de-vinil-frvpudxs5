import { supabase } from '@/lib/supabase/client'
import { ENDPOINTS } from '@/lib/api'
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
  catno: string
  format?: string | string[]
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
  const invokeSearch = async (
    type: 'master' | 'release',
  ): Promise<DiscogsSearchResult | null> => {
    const { data, error } =
      await supabase.functions.invoke<DiscogsSearchResponse>(
        'search-discogs',
        {
          body: { artist, album_title, type },
        },
      )

    if (error) {
      console.error('Error invoking search-discogs function:', error)
      return null
    }

    if ((data as any)?.error) {
      console.error('Error from search-discogs function:', (data as any).error)
      return null
    }

    if (!data?.results || data.results.length === 0) {
      return null
    }

    return data.results[0]
  }

  const fromMaster = await invokeSearch('master')
  if (fromMaster) {
    return fromMaster
  }

  const fromRelease = await invokeSearch('release')
  if (fromRelease) {
    return fromRelease
  }

  const query = `${artist} ${album_title}`.trim()
  if (!query) {
    return null
  }

  const getValidToken = async (): Promise<string | null> => {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Erro ao obter sessão do Supabase:', sessionError)
    }

    if (session?.access_token) {
      return session.access_token
    }

    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession()

    if (refreshError) {
      console.error('Erro ao atualizar sessão do Supabase:', refreshError)
      return null
    }

    return refreshed.session?.access_token ?? null
  }

  const performRequest = async (
    token: string,
  ): Promise<DiscogsSearchResult | null> => {
    try {
      const response = await fetch(ENDPOINTS.SEARCH_DISCOGS, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, per_page: 1 }),
      })

      if (response.status === 403) {
        return null
      }

      if (!response.ok) {
        const text = await response.text().catch(() => null)
        console.error('Falha na busca Discogs (fallback HTTP):', text)
        return null
      }

      const payload = (await response.json()) as DiscogsSearchResponse
      return payload.results?.[0] ?? null
    } catch (error) {
      console.error('Erro na busca Discogs (fallback HTTP):', error)
      return null
    }
  }

  let token = await getValidToken()

  if (!token) {
    return null
  }

  let result = await performRequest(token)

  if (!result) {
    const { data: refreshed, error: refreshError } =
      await supabase.auth.refreshSession()

    if (refreshError) {
      console.error(
        'Erro ao atualizar sessão do Supabase (fallback HTTP):',
        refreshError,
      )
      return null
    }

    token = refreshed.session?.access_token ?? null

    if (!token) {
      return null
    }

    result = await performRequest(token)
  }

  return result ?? null
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
