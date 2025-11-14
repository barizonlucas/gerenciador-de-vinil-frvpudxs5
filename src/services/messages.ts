import { supabase } from '@/lib/supabase/client'
import {
  UserMessage,
  MessageReply,
  MessageThread,
  MessageStatus,
  AdminConversationSummary,
  AdminConversation,
} from '@/types/messages'

export const LAST_REPLY_SEEN_KEY = 'teko-last-reply-seen'

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

export const getAdminConversationSummaries =
  async (): Promise<AdminConversationSummary[]> => {
    const { data, error } = await supabase.rpc(
      'get_admin_conversation_summaries',
    )
    if (error) {
      console.error('Error fetching admin conversation summaries:', error)
      throw error
    }
    return (data as AdminConversationSummary[]) ?? []
  }

export const getAdminConversation = async (
  userId: string,
): Promise<AdminConversation> => {
  const { data, error } = await supabase.rpc('get_admin_user_thread', {
    p_user_id: userId,
  })
  if (error) {
    console.error('Error fetching admin conversation:', error)
    throw error
  }

  const payload = (data as any) || { user: null, messages: [] }
  const messages = (payload.messages ?? []).map((entry: any) => ({
    message: entry.message as UserMessage,
    replies: (entry.replies ?? []).map(
      (reply: any) =>
        ({
          id: reply.id,
          message_id: reply.message_id,
          admin_user_id: reply.admin_user_id,
          reply: reply.reply,
          created_at: reply.created_at,
          updated_at: reply.updated_at,
          profiles: {
            display_name:
              reply.admin_display_name ?? reply.profiles?.display_name ?? null,
            avatar_url:
              reply.admin_avatar_url ?? reply.profiles?.avatar_url ?? null,
          },
        }) satisfies MessageReply,
    ),
  }))

  return {
    user: payload.user ?? null,
    messages,
  }
}

export const getUserMessageThreads = async (): Promise<MessageThread[]> => {
  const { data, error } = await supabase.rpc('get_user_message_threads')
  if (error) {
    console.error('Error fetching user message threads:', error)
    throw error
  }
  return (data as MessageThread[]) ?? []
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

export const getLatestAdminReplyAt = async (): Promise<string | null> => {
  const { data, error } = await supabase
    .from('user_message_replies')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest reply timestamp:', error)
    throw error
  }

  return data?.created_at ?? null
}
