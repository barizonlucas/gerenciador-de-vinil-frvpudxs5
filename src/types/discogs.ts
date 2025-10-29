export interface DiscogsSearchResult {
  id: number
  albumTitle: string
  artist: string
  year?: string
  genre?: string | string[]
  thumb?: string        // ← 150x150
  coverArtUrl?: string  // ← 600x600
  format?: string
}
