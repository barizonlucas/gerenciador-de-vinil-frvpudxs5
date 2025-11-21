import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (url: string | undefined) => {
  try {
    return !!url && new URL(url).protocol.startsWith('http')
  } catch {
    return false
  }
}

const url = isValidUrl(supabaseUrl)
  ? supabaseUrl
  : 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient<Database>(url, key, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})
