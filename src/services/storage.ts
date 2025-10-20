import { supabase } from '@/lib/supabase/client'

export const uploadAvatar = async (file: File): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const formData = new FormData()
  formData.append('avatar', file)

  const { data, error } = await supabase.functions.invoke('upload-avatar', {
    body: formData,
  })

  if (error) {
    console.error('Error invoking upload-avatar function:', error)
    throw new Error(error.message || 'Falha ao enviar a foto para o servidor.')
  }

  if (data.error) {
    console.error('Error from upload-avatar function:', data.error)
    throw new Error(data.error)
  }

  if (!data.publicUrl) {
    console.error('Function did not return a publicUrl', data)
    throw new Error('Falha ao obter o URL público da foto.')
  }

  return data.publicUrl
}
