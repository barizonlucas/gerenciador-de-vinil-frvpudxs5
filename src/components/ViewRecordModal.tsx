import { useState } from 'react'
import { RecordModal } from './RecordModal'
// Removed duplicate import: using the local VinylRecord type defined below

export type VinylRecord = {
  id: string // UUID único
  user_id: string // Foreign key to auth.users
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

export function ViewRecordModal({
  selectedRecord,
}: {
  selectedRecord?: VinylRecord
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button onClick={() => setOpen(true)}>Ver detalhes</button>

      <RecordModal record={selectedRecord} isOpen={open} />

      {/* feche com setOpen(false) onde necessário (botão Fechar do modal) */}
    </>
  )
}
