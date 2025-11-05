import { supabase } from '@/lib/supabase/client'
import { VinylRecord } from '@/types/vinyl'
import { TablesInsert, TablesUpdate } from '@/lib/supabase/types'

type VinylRecordInsert = TablesInsert<'vinyl_records'>
type VinylRecordUpdate = TablesUpdate<'vinyl_records'>

const mapRecord = (record: any): VinylRecord => ({
  ...record,
  albumTitle: record.albumTitle,
  artist: record.artist,
  condition: (record.condition as VinylRecord['condition']) || undefined,
  master_id: record.master_id,
  release_id: record.release_id,
})

export const getRecords = async (): Promise<VinylRecord[]> => {
  const { data, error } = await supabase
    .from('vinyl_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching records:', error)
    throw error
  }

  return data.map(mapRecord)
}

export const addRecord = async (
  record: Omit<VinylRecord, 'id' | 'user_id'>,
): Promise<VinylRecord> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const recordToInsert: VinylRecordInsert = {
    ...record,
    user_id: user.id,
    master_id: record.master_id ?? null,
    release_id: record.release_id ?? null,
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
  return mapRecord(data)
}

export const updateRecord = async (
  record: VinylRecord,
): Promise<VinylRecord> => {
  const recordToUpdate: VinylRecordUpdate = {
    ...record,
    master_id: record.master_id ?? null,
    release_id: record.release_id ?? null,
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
  return mapRecord(data)
}

export const deleteRecord = async (id: string): Promise<void> => {
  const { error } = await supabase.from('vinyl_records').delete().eq('id', id)

  if (error) {
    console.error('Error deleting record:', error)
    throw error
  }
}
