import { supabase } from '@/lib/supabase/client'

export const submitMessage = async (message: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { error } = await supabase
    .from('user_messages')
    .insert({ message, user_id: user.id })

  if (error) {
    console.error('Error submitting message:', error)
    throw error
  }
}
