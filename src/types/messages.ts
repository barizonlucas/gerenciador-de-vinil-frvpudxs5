export type MessageStatus = 'new' | 'read' | 'replied'

export interface UserMessage {
  id: string
  user_id?: string
  message: string
  status: MessageStatus
  created_at: string
  updated_at?: string
  user_email?: string | null
  user_display_name?: string | null
  user_avatar_url?: string | null
}

export type AdminMessage = Pick<
  UserMessage,
  | 'id'
  | 'message'
  | 'status'
  | 'created_at'
  | 'user_email'
  | 'user_display_name'
>

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

export interface AdminConversationSummary {
  user_id: string
  user_email: string | null
  user_display_name: string | null
  user_avatar_url: string | null
  latest_message_id: string
  latest_message: string
  latest_status: MessageStatus
  latest_created_at: string
  total_messages: number
}

export interface AdminConversationMessage {
  message: UserMessage
  replies: MessageReply[]
}

export interface AdminConversation {
  user: {
    user_id: string | null
    email: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
  messages: AdminConversationMessage[]
}
