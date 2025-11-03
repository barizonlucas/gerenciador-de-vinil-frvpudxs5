import { supabase } from '@/lib/supabase/client' // <-- usa o client que você mostrou
import type { DiscogsSearchResult } from '@/types/discogs'

const DEFAULT_ERROR_MESSAGE = 'Erro ao buscar informações no Discogs.'

const ENDPOINTS = {
  SEARCH_DISCOGS:
    'https://cackmzlupxtgtgyljjqy.supabase.co/functions/v1/search-discogs',
}

export class SearchDiscogsError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'SearchDiscogsError'
    this.status = status
  }
}

export async function searchDiscogsMaster(
  artist: string,
  albumTitle: string
): Promise<DiscogsSearchResult | null> {
  // 1. pega sessão atual do usuário logado
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Erro ao obter sessão do Supabase:', error)
  }

  const token = session?.access_token
  if (!token) {
    // Isso alimenta exatamente a mensagem que você já mostra na UI
    throw new SearchDiscogsError('Sessão expirada. Faça login novamente.', 403)
  }

  // 2. monta string de busca
  const q = `${artist} ${albumTitle}`.trim()

  // 3. chama a edge function
  let res: Response
  try {
    res = await fetch(ENDPOINTS.SEARCH_DISCOGS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`, // <-- ESSENCIAL
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q }),
    })
  } catch (networkErr) {
    console.error('Erro de rede ao chamar search-discogs:', networkErr)
    throw new SearchDiscogsError(DEFAULT_ERROR_MESSAGE)
  }

  // 4. interpreta resposta
  const contentType = res.headers.get('Content-Type') ?? ''
  let payload: any = null

  try {
    payload = contentType.includes('application/json')
      ? await res.json()
      : await res.text()
  } catch (parseErr) {
    console.error('Falha ao interpretar resposta da função:', parseErr)
  }

  if (!res.ok) {
    const status = res.status
    let message = DEFAULT_ERROR_MESSAGE

    if (status === 403) {
      message = 'Sessão expirada. Faça login novamente.'
    } else if (status >= 500) {
      message = payload?.error || DEFAULT_ERROR_MESSAGE
    } else if (status >= 400) {
      message = payload?.error || 'Não foi possível buscar no Discogs.'
    }

    throw new SearchDiscogsError(message, status)
  }

  // payload esperado: { results: [...] }
  if (!payload || !Array.isArray(payload.results)) {
    return null
  }

  // você estava usando só o primeiro resultado
  return payload.results[0] ?? null
}
