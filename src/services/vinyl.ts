import { supabase } from '@/lib/supabase/client'
import { VinylRecord } from '@/types/vinyl'
import { TablesInsert, TablesUpdate } from '@/lib/supabase/types'

type VinylRecordInsert = TablesInsert<'vinyl_records'>
type VinylRecordUpdate = TablesUpdate<'vinyl_records'>

export const getRecords = async (): Promise<VinylRecord[]> => {
  const { data, error } = await supabase
    .from('vinyl_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching records:', error)
    throw error
  }

  return data.map((record) => ({
    ...record,
    albumTitle: record.albumTitle,
    artist: record.artist,
    condition: (record.condition as VinylRecord['condition']) || undefined,
  }))
}

export const addRecord = async (
  record: Omit<VinylRecord, 'id'>,
): Promise<VinylRecord> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const recordToInsert: VinylRecordInsert = {
    ...record,
    user_id: user.id,
  }

  const { data, error } = await supabase
    .from('vinyl_records')
    .insert(recordToInsert)
    .select()
    .single()

  if (error) {
    console.error('Error adding record:', error)
    throw error
  }
  return {
    ...data,
    albumTitle: data.albumTitle,
    artist: data.artist,
    condition: (data.condition as VinylRecord['condition']) || undefined,
  }
}

export const updateRecord = async (
  record: VinylRecord,
): Promise<VinylRecord> => {
  const recordToUpdate: VinylRecordUpdate = {
    ...record,
  }

  const { data, error } = await supabase
    .from('vinyl_records')
    .update(recordToUpdate)
    .eq('id', record.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating record:', error)
    throw error
  }
  return {
    ...data,
    albumTitle: data.albumTitle,
    artist: data.artist,
    condition: (data.condition as VinylRecord['condition']) || undefined,
  }
}

export const deleteRecord = async (id: string): Promise<void> => {
  const { error } = await supabase.from('vinyl_records').delete().eq('id', id)

  if (error) {
    console.error('Error deleting record:', error)
    throw error
  }
}
