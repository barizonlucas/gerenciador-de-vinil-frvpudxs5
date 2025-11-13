import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Skeleton } from '@/components/ui/skeleton'
import UnauthorizedPage from '@/pages/Unauthorized'
import { useEffect } from 'react'
import { logEvent } from '@/services/telemetry'

export const AdminRoute = () => {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && user && profile?.is_admin) {
      logEvent('admin_accessed', {}, 'admin')
    }
  }, [loading, user, profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!profile?.is_admin) {
    return <UnauthorizedPage />
  }

  return <Outlet />
}
