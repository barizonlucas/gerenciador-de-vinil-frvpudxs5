export interface Profile {
  id: string
  user_id: string
  display_name: string | null
  avatar_url: string | null
  theme_preference: 'light' | 'dark'
  is_admin: boolean
}
