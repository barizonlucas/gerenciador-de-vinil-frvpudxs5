import { Link, NavLink } from 'react-router-dom'
import {
  LogOut,
  User as UserIcon,
  Plus,
  DiscAlbum,
  Camera,
  ShieldCheck,
} from 'lucide-react'
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
import { toast } from 'sonner'

export const Header = () => {
  const { user, profile, signOut } = useAuth()
  const { openAddModal, openAddByPhotoModal } = useVinylContext()

  const handleOpenCameraClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      openAddByPhotoModal()
    } catch (err: any) {
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError'
      ) {
        toast.error(
          'Não foi possível acessar a câmera. Por favor, verifique as permissões nas configurações do seu dispositivo.',
        )
      } else {
        console.error('Error accessing camera:', err)
        toast.error('Ocorreu um erro ao tentar acessar a câmera.')
      }
    }
  }

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
      'text-sm font-semibold transition-colors',
      isActive ? 'text-areia' : 'text-areia/80 hover:text-areia',
    )

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-azulPetroleo text-areia shadow-brand">
      <div className="container flex h-auto flex-col gap-3 px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:px-0 md:py-0">
        <Link to="/" className="mr-6 flex items-center gap-2 text-areia">
          <DiscAlbum className="h-6 w-6" />
          <span className="font-bold tracking-wide">Teko</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLinkClass}>
            Início
          </NavLink>
          <NavLink to="/dash" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            Perfil
          </NavLink>
          {profile?.is_admin && (
            <NavLink to="/admin" className={navLinkClass}>
              Admin
            </NavLink>
          )}
        </nav>
        <div className="flex w-full items-center justify-end gap-2 overflow-x-auto pb-1 text-areia md:flex-1 md:justify-end md:overflow-visible md:pb-0">
          <Button onClick={openAddModal} size="sm" className="min-w-[170px]">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Disco
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleOpenCameraClick} size="icon">
                <Camera className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adicionar por foto</p>
            </TooltipContent>
          </Tooltip>
          <ThemeToggle className="text-areia hover:bg-areia/20" />
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full text-areia hover:bg-areia/20"
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
                <DropdownMenuItem asChild className="md:hidden">
                  <Link to="/dash">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {profile?.is_admin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
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
