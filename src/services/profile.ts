import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/types/profile'

export const getProfile = async (): Promise<Profile | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116: 'No rows found' which is not an error in this case
    console.error('Error fetching profile:', error)
    throw error
  }

  return data
}

export const updateProfile = async (profileData: {
  display_name: string | null
}): Promise<Profile> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      display_name: profileData.display_name,
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data
}
