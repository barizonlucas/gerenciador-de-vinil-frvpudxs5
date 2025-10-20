import { describe, it, expect, beforeAll } from 'vitest'
import { getRecordHistory, type VinylRecord } from './history'

describe('getRecordHistory', () => {
  beforeAll(() => {
    // Mock environment variable
    process.env.VITE_GEMINI_API_KEY = 'AIzaSyDGFVn580kTTUzLm3_ZToV82ltwfS2m8IQ'
  })

  it('should generate history for valid record', async () => {
    const record: VinylRecord = {
      artist: 'Pink Floyd',
      album: 'The Dark Side of the Moon',
      year: 1973,
    }

    const result = await getRecordHistory(record)

    expect(result.history).toContain('<p>')
    expect(result.history).toContain('</p>')
  })

  it('should handle errors gracefully', async () => {
    // Temporarily remove API key to test error case
    const originalKey = process.env.VITE_GEMINI_API_KEY
    process.env.VITE_GEMINI_API_KEY = ''

    const record: VinylRecord = {
      artist: 'Test',
      album: 'Test',
      year: 2024,
    }

    const result = await getRecordHistory(record)
    expect(result.history).toContain('Não foi possível')

    // Restore API key
    process.env.VITE_GEMINI_API_KEY = originalKey
  })
})
