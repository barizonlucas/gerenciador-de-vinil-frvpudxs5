import { useEffect, useState } from 'react'
import { getRecordHistory } from '../lib/history'
import type { VinylRecord } from '../types/vinyl'

interface RecordModalProps {
  record?: VinylRecord
  isOpen?: boolean
  onClose?: () => void
}

export function RecordModal({
  record,
  isOpen = false,
  onClose,
}: RecordModalProps) {
  const [history, setHistory] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historyLoading, setHistoryLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!isOpen || !record) return

    let mounted = true
    ;(async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)

        const res = await getRecordHistory(record)

        if (!mounted) return
        setHistory(res.history ?? null)
      } catch (err: any) {
        if (mounted) setHistoryError(String(err?.message ?? err))
      } finally {
        if (mounted) setHistoryLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [isOpen, record])

  if (!isOpen) return null
  if (!record) return null

  return (
    <div className="modal">
      <div className="modal-content max-w-4xl p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{record.albumTitle}</h1>
            <p className="text-sm text-muted-foreground">{record.artist}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-500"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Ano</h3>
              <p>{record.releaseYear}</p>
            </div>
            {record.genre && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Gênero
                </h3>
                <p>{record.genre}</p>
              </div>
            )}
            {record.condition && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Condição
                </h3>
                <p>{record.condition}</p>
              </div>
            )}
            {record.purchaseDate && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Data da Compra
                </h3>
                <p>{record.purchaseDate}</p>
              </div>
            )}
            {record.price && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Preço
                </h3>
                <p>R$ {record.price.toFixed(2)}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">História</h3>
            {historyLoading && (
              <div className="p-4 text-center">Carregando história...</div>
            )}
            {historyError && (
              <div className="p-4 text-red-500">{historyError}</div>
            )}
            {!historyLoading && !historyError && history && (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: history }}
              />
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button className="btn" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
