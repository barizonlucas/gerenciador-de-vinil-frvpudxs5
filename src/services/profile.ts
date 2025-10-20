import { supabase } from '@/lib/supabase/client'
import { Profile } from '@/types/profile'

type ProfileUpdate = Partial<
  Pick<Profile, 'display_name' | 'avatar_url' | 'theme_preference'>
>

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
    console.error('Error fetching profile:', error)
    throw error
  }

  return data as Profile | null
}

export const updateProfile = async (
  profileData: ProfileUpdate,
): Promise<Profile> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: user.id,
        ...profileData,
      },
      { onConflict: 'user_id' },
    )
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw error
  }

  return data as Profile
}
