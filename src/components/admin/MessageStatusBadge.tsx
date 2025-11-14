import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MessageStatus } from '@/types/messages'
import { Circle } from 'lucide-react'

interface MessageStatusBadgeProps {
  status: MessageStatus
}

export const MessageStatusBadge = ({ status }: MessageStatusBadgeProps) => {
  const statusConfig = {
    new: {
      label: 'Novo',
      className: 'bg-terracota/15 text-terracota',
      iconColor: 'text-terracota',
    },
    read: {
      label: 'Lido',
      className: 'bg-areia/60 text-azulPetroleo',
      iconColor: 'text-azulPetroleo',
    },
    replied: {
      label: 'Respondido',
      className: 'bg-verdeOlivaClaro/30 text-verdeOliva',
      iconColor: 'text-verdeOliva',
    },
  }

  const config = statusConfig[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent font-medium flex items-center gap-1.5',
        config.className,
      )}
    >
      <Circle className={cn('h-2.5 w-2.5 fill-current', config.iconColor)} />
      <span>{config.label}</span>
    </Badge>
  )
}
