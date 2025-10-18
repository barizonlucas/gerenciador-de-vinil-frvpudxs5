import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DiscAlbum, Plus, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface HeaderProps {
  onAddRecord: () => void
}

export const Header = ({ onAddRecord }: HeaderProps) => {
  const { user } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const getInitials = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U'
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-[72px] items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <DiscAlbum className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary font-display hidden sm:inline">
            Minha Coleção de Vinis
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Button
            onClick={onAddRecord}
            className="rounded-full px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-semibold transition-transform hover:scale-105 shadow-sm"
          >
            <Plus className="mr-2 h-5 w-5" />
            Adicionar Disco
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar>
                    <AvatarImage
                      src={user.user_metadata.avatar_url}
                      alt={user.email}
                    />
                    <AvatarFallback>
                      {getInitials(user.email || '')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
