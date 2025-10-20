import { GoogleGenerativeAI } from '@google/generative-ai'
import type { VinylRecord } from '../types/vinyl'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

export type { VinylRecord }

export async function getRecordHistory(
  record: VinylRecord,
): Promise<{ history: string }> {
  const EDGE_BASE =
    import.meta.env.VITE_EDGE_URL ??
    'https://cackmzlupxtgtgyljjqy.supabase.co/functions/v1'

  try {
    const res = await fetch(`${EDGE_BASE}/get-record-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    })

    if (!res.ok) {
      throw new Error('Failed to fetch history')
    }

    const data = await res.json()
    return { history: data.history }
  } catch (error) {
    console.error('Error fetching history:', error)
    throw error
  }
}
