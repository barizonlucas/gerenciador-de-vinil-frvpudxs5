import { supabase } from '@/lib/supabase/client'
import { VinylRecord } from '@/types/vinyl'

type VinylRecordInsert = Omit<VinylRecord, 'id' | 'user_id'>

export const getVinylRecords = async () => {
  const { data, error } = await supabase
    .from('vinyl_records')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export const addVinylRecord = async (
  record: VinylRecordInsert,
  userId: string,
) => {
  const { data, error } = await supabase
    .from('vinyl_records')
    .insert([{ ...record, user_id: userId }])
    .select()
    .single()

  return { data, error }
}

export const updateVinylRecord = async (record: VinylRecord) => {
  const { id, ...updateData } = record
  const { data, error } = await supabase
    .from('vinyl_records')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export const deleteVinylRecord = async (id: string) => {
  const { error } = await supabase.from('vinyl_records').delete().eq('id', id)

  return { error }
}
