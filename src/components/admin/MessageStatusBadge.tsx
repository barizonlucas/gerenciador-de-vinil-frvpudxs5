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
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
      iconColor: 'text-green-500',
    },
    read: {
      label: 'Lido',
      className:
        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
      iconColor: 'text-yellow-500',
    },
    replied: {
      label: 'Respondido',
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      iconColor: 'text-blue-500',
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
