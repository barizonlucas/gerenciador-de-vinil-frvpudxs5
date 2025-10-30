import { supabase } from '@/lib/supabase/client'

export interface AIResponse {
  artist: string | null
  album_title: string | null
}

export const identifyAlbumCover = async (
  imageFile: File,
): Promise<AIResponse> => {
  const formData = new FormData()
  formData.append('cover', imageFile)

  const { data, error } = await supabase.functions.invoke(
    'identify-album-cover',
    {
      body: formData,
    },
  )

  if (error) {
    console.error('Error invoking identify-album-cover function:', error)
    throw new Error(
      error.message || 'Falha ao se comunicar com o serviço de IA.',
    )
  }

  if (data.error) {
    console.error('Error from identify-album-cover function:', data.error)
    throw new Error(data.error)
  }

  if (!data.artist || !data.album_title) {
    throw new Error(
      'Não foi possível identificar o álbum. Tente novamente com outra foto.',
    )
  }

  return data as AIResponse
}
