import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import Auth from './pages/Auth'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { VinylCollectionProvider } from './contexts/VinylCollectionContext'
import { AuthProvider } from './hooks/use-auth'
import { ProtectedRoute } from './components/ProtectedRoute'

const App = () => (
  <BrowserRouter
    future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
  >
    <TooltipProvider>
      <AuthProvider>
        <VinylCollectionProvider>
          <Toaster />
          <Sonner richColors position="top-right" />
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </VinylCollectionProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
