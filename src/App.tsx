import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { VinylCollectionProvider } from './contexts/VinylCollectionContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import LoginPage from './pages/Auth/Login'
import RegisterPage from './pages/Auth/Register'
import ForgotPasswordPage from './pages/Auth/ForgotPassword'
import UpdatePasswordPage from './pages/Auth/UpdatePassword'
import ProfilePage from './pages/Profile'
import DashboardPage from './pages/Dashboard'
import { ThemeProvider } from './contexts/ThemeContext'
import { AdminRoute } from './components/admin/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboardPage from './pages/admin/Index'
import AdminPollsPage from './pages/admin/Polls'
import AdminMessagesPage from './pages/admin/Messages'
import UnauthorizedPage from './pages/Unauthorized'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from './lib/analytics'

const AnalyticsListener = () => {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AnalyticsListener />
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <VinylCollectionProvider>
              <Toaster />
              <Sonner richColors position="top-right" />
              <Routes>
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<Index />} />
                    <Route path="/dash" element={<DashboardPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                  </Route>
                </Route>
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<AdminDashboardPage />} />
                    <Route path="polls" element={<AdminPollsPage />} />
                    <Route path="messages" element={<AdminMessagesPage />} />
                  </Route>
                </Route>
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPasswordPage />}
                  />
                </Route>
                <Route
                  path="/update-password"
                  element={<UpdatePasswordPage />}
                />
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </VinylCollectionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
