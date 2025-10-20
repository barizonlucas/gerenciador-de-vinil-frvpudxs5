interface RecordDetailsProps {
  record: {
    artist: string
    album: string
    year: number
    genre?: string
    condition?: string
    purchaseDate?: string
    price?: number
    notes?: string
  }
}

export function RecordDetails({ record }: RecordDetailsProps) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-center gap-3 mb-4">
        <h1 className="text-2xl font-bold">{record.album}</h1>
      </div>

      <div className="grid gap-3">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Artista</h3>
          <p className="text-sm">{record.artist}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Ano</h3>
          <p className="text-sm">{record.year}</p>
        </div>

        {record.genre && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Gênero
            </h3>
            <p className="text-sm">{record.genre}</p>
          </div>
        )}

        {record.condition && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Condição
            </h3>
            <p className="text-sm">{record.condition}</p>
          </div>
        )}

        {record.purchaseDate && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Data da Compra
            </h3>
            <p className="text-sm">{record.purchaseDate}</p>
          </div>
        )}

        {record.price && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Preço</h3>
            <p className="text-sm">R$ {record.price.toFixed(2)}</p>
          </div>
        )}

        {record.notes && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">
              Observações
            </h3>
            <p className="text-sm">{record.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
