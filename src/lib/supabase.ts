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

/**
 * Custom fetch implementation to gracefully handle AbortError.
 * When a fetch is aborted, it normally throws a DOMException.
 * This can cause unhandled promise rejections in tests if not caught.
 * This wrapper catches the AbortError and returns a mock error response
 * that the Supabase client can handle gracefully, converting it into
 * a resolved promise with an error object, instead of a rejected promise.
 */
const customFetch: typeof fetch = (input, init) => {
  return fetch(input, init).catch((error) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('Supabase request was aborted.')
      const mockErrorResponse = {
        message: 'The operation was aborted.',
        details:
          'This is a mock response to handle fetch AbortError gracefully.',
        hint: '',
        code: 'FETCH_ABORTED',
      }
      return new Response(JSON.stringify(mockErrorResponse), {
        status: 400, // Using 400 to indicate a client-side error
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw error
  })
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: customFetch,
  },
})
