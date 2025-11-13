export interface PollOption {
  id: string
  poll_id: string
  title: string
  short_desc: string | null
  created_at: string
}

export interface Poll {
  id: string
  title: string
  is_active: boolean
  created_at: string
  updated_at: string
  options: PollOption[]
}
