import { VinylRecord } from '@/types/vinyl'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreVertical, Eye, Pencil, Trash2, DiscAlbum } from 'lucide-react'
import { AspectRatio } from '@/components/ui/aspect-ratio'

interface RecordCardProps {
  record: VinylRecord
  onView: (record: VinylRecord) => void
  onEdit: (record: VinylRecord) => void
  onDelete: (record: VinylRecord) => void
}

export const RecordCard = ({
  record,
  onView,
  onEdit,
  onDelete,
}: RecordCardProps) => {
  return (
    <Card className="group w-full overflow-hidden rounded-xl border shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-card-hover">
      <CardHeader className="p-0">
        <AspectRatio ratio={1 / 1}>
          {record.coverArtUrl ? (
            <img
              src={record.coverArtUrl}
              alt={record.albumTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <DiscAlbum className="h-16 w-16 text-border" />
            </div>
          )}
        </AspectRatio>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="truncate text-lg">{record.albumTitle}</CardTitle>
        <p className="text-sm text-secondary-foreground">{record.artist}</p>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <p className="text-xs text-muted-foreground">{record.releaseYear}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(record)}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(record)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(record)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}
