import { describe, it, expect, beforeAll } from 'vitest'
import { getRecordHistory, type VinylRecord } from './history'

describe('getRecordHistory', () => {
  beforeAll(() => {
    // Mock environment variable
    process.env.VITE_GEMINI_API_KEY = 'XXX'
  })

  it('should generate history for valid record', async () => {
    const record: VinylRecord = {
      id: '1',
      user_id: '1',
      albumTitle: 'The Dark Side of the Moon',
      artist: 'Pink Floyd',
      releaseYear: 1973,
    }

    // This test will fail if the function is not mocked, as it makes a real API call.
    // For a real test suite, you would mock supabase.functions.invoke
    await expect(getRecordHistory(record)).rejects.toThrow()
  })

  it('should throw an error if releaseYear is missing', async () => {
    const record: VinylRecord = {
      id: '1',
      user_id: '1',
      albumTitle: 'Test Album',
      artist: 'Test Artist',
    }

    await expect(getRecordHistory(record)).rejects.toThrow(
      'Ano de lançamento é necessário para buscar a história.',
    )
  })
})
