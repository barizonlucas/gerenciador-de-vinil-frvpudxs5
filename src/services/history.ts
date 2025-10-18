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

  // Handle invocation error (network, auth, etc.)
  if (error) {
    console.error('Error invoking get-record-history function:', error)
    // Use the specific message from the FunctionsError
    throw new Error(error.message || 'Falha ao invocar a função de histórico.')
  }

  // Hand