export interface VinylRecord {
  id: string // UUID único
  albumTitle: string // Título do Álbum (obrigatório)
  artist: string // Artista (obrigatório)
  releaseYear?: number // Ano de Lançamento (opcional, 4 dígitos)
  genre?: string // Gênero (opcional)
  coverArtUrl?: string // URL da Capa do Álbum (opcional)
  condition?: 'Novo' | 'Excelente' | 'Bom' | 'Regular' | 'Ruim' // Condição do Disco (opcional)
  purchaseDate?: string // Data da Compra (formato YYYY-MM-DD, opcional)
  price?: number // Preço de Compra (opcional)
  notes?: string // Observações (opcional)
}
