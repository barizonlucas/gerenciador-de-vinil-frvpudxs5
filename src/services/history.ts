import { supabase } from '@/lib/supabase/client'

export const getRecordHistory = async (
  albumTitle: string,
  artist: string,
  releaseYear: number,
): Promise<{ history: string }> => {
  const { data, error } = await supabase.functions.invoke(
    'get-record-history',
    {
      query: {
        albumTitle,
        artist,
        releaseYear,
      },
    },
  )

  if (error) {
    console.error('Error invoking get-record-history function:', error)
    throw new Error('Failed to get record history.')
  }

  if (data.error) {
    console.error('Error from get-record-history function:', data.error)
    throw new Error(data.error)
  }

  return data
}
