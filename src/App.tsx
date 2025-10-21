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
import { ThemeProvider } from './contexts/ThemeContext'
import AddRecordPage from './pages/AddRecord'

export default function App() {
  return (
    <BrowserRouter>
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
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/add-record" element={<AddRecordPage />} />
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
                <Route path="*" element={<NotFound />} />
              </Routes>
            </VinylCollectionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
