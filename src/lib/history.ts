import { supabase } from '@/lib/supabase/client'
import type { VinylRecord } from '../types/vinyl'

export type { VinylRecord }

export async function getRecordHistory(
  record: VinylRecord,
): Promise<{ history: string }> {
  if (!record.releaseYear) {
    throw new Error('Ano de lançamento é necessário para buscar a história.')
  }

  const { data, error } = await supabase.functions.invoke(
    'get-record-history',
    {
      body: {
        albumTitle: record.albumTitle,
        artist: record.artist,
        releaseYear: record.releaseYear,
      },
    },
  )

  if (error) {
    console.error('Error invoking get-record-history function:', error)
    throw new Error(error.message || 'Falha ao invocar a função de histórico.')
  }

  if (data.error) {
    console.error('Error from get-record-history function:', data.error)
    throw new Error(data.error)
  }

  return data
}
