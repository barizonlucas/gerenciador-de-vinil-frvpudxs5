import { Link, NavLink } from 'react-router-dom'
import { LogOut, User as UserIcon, Plus, DiscAlbum, Camera } from 'lucide-react'
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
import { Button } from './ui/button'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export const Header = () => {
  const { user, profile, signOut } = useAuth()
  const { openAddModal, openAddByPhotoModal } = useVinylContext()

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-sm font-medium transition-colors hover:text-primary',
      isActive ? 'text-primary' : 'text-muted-foreground',
    )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="mr-6 flex items-center gap-2">
          <DiscAlbum className="h-6 w-6 text-primary" />
          <span className="font-bold">Teko</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={navLinkClass}>
            Início
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            Perfil
          </NavLink>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button onClick={openAddModal}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Disco
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={openAddByPhotoModal} size="icon">
                <Camera className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adicionar por foto</p>
            </TooltipContent>
          </Tooltip>
          <ThemeToggle />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar>
                    <AvatarImage
                      src={profile?.avatar_url ?? undefined}
                      alt={profile?.display_name ?? user.email ?? ''}
                    />
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || 'Logado como'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/">Início</Link>
                </DropdownMenuItem>
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
          )}
        </div>
      </div>
    </header>
  )
}
