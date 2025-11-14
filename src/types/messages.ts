export type MessageStatus = 'new' | 'read' | 'replied'

export interface UserMessage {
  id: string
  user_id?: string
  message: string
  status: 'new' | 'read' | 'replied'
  created_at: string
  updated_at?: string
  user_email?: string | null
  user_display_name?: string | null
  user_avatar_url?: string | null
}

export interface MessageReply {
  id: string
  message_id: string
  admin_user_id: string
  reply: string
  created_at: string
  updated_at: string
  profiles: {
    display_name: string | null
    avatar_url: string | null
  } | null
}

export interface MessageThread {
  message: UserMessage
  replies: MessageReply[]
}
