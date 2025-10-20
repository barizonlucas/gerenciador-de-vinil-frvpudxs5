import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DiscAlbum, Plus, User as UserIcon, LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface HeaderProps {
  onAddRecord: () => void
}

export const Header = ({ onAddRecord }: HeaderProps) => {
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-[72px] items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-3">
          <DiscAlbum className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-primary font-display hidden sm:inline">
            Teko
          </span>
        </Link>
        {user && (
          <div className="flex items-center gap-4">
            <Button
              onClick={onAddRecord}
              className="rounded-full px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base font-semibold transition-transform hover:scale-105 shadow-sm"
            >
              <Plus className="mr-2 h-5 w-5" />
              Adicionar Disco
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar>
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?seed=${user.id}`}
                      alt={user.email ?? ''}
                    />
                    <AvatarFallback>
                      {user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Logado como
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  )
}
