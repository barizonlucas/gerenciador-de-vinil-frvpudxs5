import { supabase } from '@/lib/supabase/client'

export const uploadAvatar = async (file: File): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError)
    throw uploadError
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

  if (!data.publicUrl) {
    throw new Error('Could not get public URL for avatar')
  }

  return data.publicUrl
}
