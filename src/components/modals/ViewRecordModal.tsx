import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VinylRecord } from '@/types/vinyl'
import { Badge } from '@/components/ui/badge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DiscAlbum } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RecordHistory } from '@/components/RecordHistory'
import { RecordVersionsList } from '@/components/RecordVersionsList'

interface ViewRecordModalProps {
  isOpen: boolean
  onClose: () => void
  record: VinylRecord | null
  onEdit: (record: VinylRecord) => void
  onDelete: (record: VinylRecord) => void
}

export const ViewRecordModal = ({
  isOpen,
  onClose,
  record,
  onEdit,
  onDelete,
}: ViewRecordModalProps) => {
  if (!record) return null

  const handleEdit = () => {
    onClose()
    onEdit(record)
  }

  const handleDelete = () => {
    onClose()
    onDelete(record)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl truncate">
            {record.albumTitle}
          </DialogTitle>
          <DialogDescription>{record.artist}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList
            className={`grid w-full ${
              record.master_id ? 'grid-cols-3' : 'grid-cols-2'
            }`}
          >
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="history">História</TabsTrigger>
            {record.master_id && (
              <TabsTrigger value="versions">Minha Versão</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="details">
            <div className="grid grid-cols-3 gap-6 py-4">
              <div className="col-span-1">
                {record.coverArtUrl ? (
                  <img
                    src={record.coverArtUrl}
                    alt={record.albumTitle}
                    className="w-full rounded-lg object-cover aspect-square"
                  />
                ) : (
                  <div className="flex aspect-square w-full items-center justify-center rounded-lg bg-secondary">
                    <DiscAlbum className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="col-span-2 space-y-3 text-sm">
                <p>
                  <strong>Ano:</strong> {record.releaseYear || 'N/A'}
                </p>
                <p>
                  <strong>Gênero:</strong> {record.genre || 'N/A'}
                </p>
                <p>
                  <strong>Condição:</strong>{' '}
                  {record.condition ? (
                    <Badge variant="secondary">{record.condition}</Badge>
                  ) : (
                    'N/A'
                  )}
                </p>
                <p>
                  <strong>Data da Compra:</strong>{' '}
                  {record.purchaseDate
                    ? format(
                        parseISO(record.purchaseDate),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR },
                      )
                    : 'N/A'}
                </p>
                <p>
                  <strong>Preço:</strong>{' '}
                  {record.price
                    ? `R$ ${record.price.toFixed(2).replace('.', ',')}`
                    : 'N/A'}
                </p>
                {record.notes && (
                  <div className="pt-2">
                    <strong>Observações:</strong>
                    <p className="text-muted-foreground">{record.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <RecordHistory record={record} />
          </TabsContent>
          {record.master_id && (
            <TabsContent value="versions">
              <RecordVersionsList masterId={record.master_id} />
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="gap-2 sm:justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
