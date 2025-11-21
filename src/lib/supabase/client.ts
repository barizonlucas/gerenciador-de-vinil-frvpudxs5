import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const supabaseUrl = isValidUrl(SUPABASE_URL)
  ? SUPABASE_URL
  : 'https://placeholder.supabase.co'

const supabaseKey = SUPABASE_ANON_KEY || 'placeholder-key'

if (!isValidUrl(SUPABASE_URL) || !SUPABASE_ANON_KEY) {
  console.error(
    'Supabase environment variables are missing or invalid. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
})
