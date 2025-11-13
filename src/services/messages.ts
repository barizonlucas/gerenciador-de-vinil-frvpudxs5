import { supabase } from '@/lib/supabase/client'
import {
  UserMessage,
  MessageReply,
  MessageThread,
  MessageStatus,
} from '@/types/messages'

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

export const getAdminMessages = async (): Promise<UserMessage[]> => {
  const { data, error } = await supabase.rpc('get_admin_messages')
  if (error) {
    console.error('Error fetching admin messages:', error)
    throw error
  }
  return (data as unknown as UserMessage[]) || []
}

export const getMessageThread = async (
  messageId: string,
): Promise<MessageThread> => {
  const { data, error } = await supabase.rpc('get_message_thread', {
    p_message_id: messageId,
  })

  if (error) {
    console.error('Error fetching message thread:', error)
    throw error
  }

  const rawThread = data as any
  const message: UserMessage = {
    ...rawThread.message,
  }

  const replies: MessageReply[] = rawThread.replies.map((r: any) => ({
    id: r.id,
    message_id: r.message_id,
    admin_user_id: r.admin_user_id,
    reply: r.reply,
    created_at: r.created_at,
    updated_at: r.updated_at,
    profiles: {
      display_name: r.admin_display_name,
      avatar_url: r.admin_avatar_url,
    },
  }))

  return { message, replies }
}

export const updateMessageStatus = async (
  messageId: string,
  status: MessageStatus,
): Promise<UserMessage> => {
  const { data, error } = await supabase
    .from('user_messages')
    .update({ status })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    console.error('Error updating message status:', error)
    throw error
  }
  return data as UserMessage
}

export const replyToMessage = async (
  messageId: string,
  reply: string,
): Promise<MessageReply> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Admin not authenticated')

  const { data, error } = await supabase
    .from('user_message_replies')
    .insert({
      message_id: messageId,
      admin_user_id: user.id,
      reply,
    })
    .select()
    .single()

  if (error) {
    console.error('Error sending reply:', error)
    throw error
  }

  await updateMessageStatus(messageId, 'replied')

  return data as MessageReply
}
