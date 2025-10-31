import { supabase } from '@/lib/supabase/client'
import { DiscogsSearchResult } from '@/types/discogs'
import { ENDPOINTS } from '@/lib/api'

interface DiscogsSearchResponse {
  results: DiscogsSearchResult[]
  error?: string
}

export class SearchDiscogsError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'SearchDiscogsError'
    this.status = status
  }
}

const DEFAULT_ERROR_MESSAGE =
  'Não foi possível buscar no Discogs, tente novamente.'

export const searchDiscogsMaster = async (
  artist: string,
  album_title: string,
): Promise<DiscogsSearchResult | null> => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Erro ao obter sessão do Supabase:', sessionError)
  }

  const token = session?.access_token
  if (!token) {
    throw new SearchDiscogsError('Sessão expirada. Faça login novamente.', 403)
  }

  let response: Response
  try {
    response = await fetch(ENDPOINTS.SEARCH_DISCOGS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        artist,
        album_title,
        type: 'master',
      }),
    })
  } catch (error) {
    console.error('Erro de rede ao chamar search-discogs:', error)
    throw new SearchDiscogsError(DEFAULT_ERROR_MESSAGE)
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  let payload: DiscogsSearchResponse | string | null = null

  try {
    if (contentType.includes('application/json')) {
      payload = (await response.json()) as DiscogsSearchResponse
    } else {
      payload = await response.text()
    }
  } catch (parseError) {
    console.error('Falha ao interpretar resposta do Discogs:', parseError)
  }

  if (!response.ok) {
    const status = response.status
    let message = DEFAULT_ERROR_MESSAGE

    const extractedError =
      typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object'
          ? payload.error
          : null

    if (status === 403) {
      message = 'Sessão expirada. Faça login novamente.'
    } else if (status >= 500) {
      message = extractedError || DEFAULT_ERROR_MESSAGE
    } else if (status >= 400) {
      message = extractedError || 'Não foi possível buscar no Discogs.'
    }

    throw new SearchDiscogsError(message, status)
  }

  if (!payload || typeof payload !== 'object') {
    throw new SearchDiscogsError(DEFAULT_ERROR_MESSAGE)
  }

  const data = payload as DiscogsSearchResponse

  if (data.error) {
    throw new SearchDiscogsError(data.error)
  }

  if (!data.results || data.results.length === 0) {
    return null
  }

  return data.results[0]
}
