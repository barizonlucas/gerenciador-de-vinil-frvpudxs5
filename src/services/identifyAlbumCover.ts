import { supabase } from '@/lib/supabase/client'
import { ENDPOINTS } from '@/lib/api'

export interface IdentifyAlbumCoverResponse {
  artist: string | null
  album_title: string | null
}

export class IdentifyAlbumCoverError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'IdentifyAlbumCoverError'
    this.status = status
  }
}

const DEFAULT_FAILURE_MESSAGE =
  'Não consegui identificar automaticamente, preencha manualmente.'

const UNEXPECTED_RESPONSE_MESSAGE =
  'Não foi possível interpretar a resposta da identificação. Preencha manualmente.'

export const identifyAlbumCover = async (
  imageFile: File,
): Promise<IdentifyAlbumCoverResponse> => {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('Erro ao obter sessão do Supabase:', sessionError)
  }

  const accessToken = session?.access_token

  if (!accessToken) {
    throw new IdentifyAlbumCoverError(
      'Sessão expirada. Faça login novamente.',
      401,
    )
  }

  const formData = new FormData()
  formData.append('cover', imageFile)

  let response: Response
  try {
    response = await fetch(ENDPOINTS.IDENTIFY_ALBUM_COVER, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    })
  } catch (error) {
    console.error('Falha na requisição identify-album-cover:', error)
    throw new IdentifyAlbumCoverError(
      'Não foi possível se conectar ao serviço. Verifique sua conexão e tente novamente.',
    )
  }

  const contentType = response.headers.get('Content-Type') ?? ''
  let payload: unknown = null

  try {
    if (contentType.includes('application/json')) {
      payload = await response.json()
    } else {
      payload = await response.text()
    }
  } catch (parseErr) {
    console.error('Falha ao ler resposta identify-album-cover:', parseErr)
  }

  if (!response.ok) {
    const status = response.status
    let message = DEFAULT_FAILURE_MESSAGE

    if (status === 401) {
      message = 'Sessão expirada. Faça login novamente.'
    } else if (status >= 400 && status < 500) {
      const extracted =
        typeof payload === 'string'
          ? payload
          : (payload as { error?: string })?.error
      if (extracted) {
        message = extracted
      } else {
        message = 'Não foi possível identificar o disco automaticamente.'
      }
    } else if (status >= 500) {
      const extracted =
        typeof payload === 'string'
          ? payload
          : (payload as { error?: string })?.error
      if (extracted) {
        message = extracted
      } else {
        message = DEFAULT_FAILURE_MESSAGE
      }
    }

    throw new IdentifyAlbumCoverError(message, status)
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !('artist' in payload) ||
    !('album_title' in payload)
  ) {
    throw new IdentifyAlbumCoverError(UNEXPECTED_RESPONSE_MESSAGE)
  }

  const { artist, album_title } = payload as IdentifyAlbumCoverResponse

  if (!artist && !album_title) {
    throw new IdentifyAlbumCoverError(DEFAULT_FAILURE_MESSAGE)
  }

  return { artist, album_title }
}
