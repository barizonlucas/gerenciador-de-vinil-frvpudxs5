import { createClient } from '@supabase/supabase-js'
import { VinylRecord } from '@/types/vinyl'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file')
}

// Define a type for our database schema if we had more tables.
// For now, we can define the structure for 'vinyl_records'.
export type Database = {
  public: {
    Tables: {
      vinyl_records: {
        Row: VinylRecord // The type of data returned from the table
        Insert: Omit<VinylRecord, 'id'> // The type of data you can insert
        Update: Partial<VinylRecord> // The type of data you can update
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
