import { NavLink, Outlet } from 'react-router-dom'
import { Home, BarChart2, MessageSquare, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const AdminLayout = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
      isActive && 'bg-muted text-primary',
    )

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/" className="flex items-center gap-2 font-semibold">
              <Home className="h-6 w-6" />
              <span>Voltar ao Teko</span>
            </NavLink>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavLink to="/admin" end className={navLinkClass}>
                <BarChart2 className="h-4 w-4" />
                Dashboard
              </NavLink>
              <NavLink to="/admin/polls" className={navLinkClass}>
                <Users className="h-4 w-4" />
                Enquetes
              </NavLink>
              <NavLink to="/admin/messages" className={navLinkClass}>
                <MessageSquare className="h-4 w-4" />
                Mensagens
              </NavLink>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
