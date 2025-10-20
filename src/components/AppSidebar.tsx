import { Link, useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { DiscAlbum, Home, Plus, User as UserIcon } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface AppSidebarProps {
  onAddRecord: () => void
}

export const AppSidebar = ({ onAddRecord }: AppSidebarProps) => {
  const location = useLocation()

  const menuItems = [
    {
      href: '/',
      label: 'Início',
      icon: Home,
    },
    {
      href: '/profile',
      label: 'Perfil',
      icon: UserIcon,
    },
  ]

  return (
    <Sidebar>
      <SidebarContent className="flex flex-col">
        <SidebarHeader>
          <Link to="/" className="flex items-center gap-3">
            <DiscAlbum className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary font-display">
              Teko
            </span>
          </Link>
        </SidebarHeader>

        <div className="flex-1">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={location.pathname === item.href}
                >
                  <Link to={item.href}>
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <SidebarFooter className="gap-4">
          <SidebarMenuButton
            onClick={onAddRecord}
            className="w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-5 w-5" />
            Adicionar Disco
          </SidebarMenuButton>
          <ThemeToggle />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}
