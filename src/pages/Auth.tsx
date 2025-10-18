import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { DiscAlbum } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

type AuthView = 'login' | 'signup' | 'forgotPassword'

const Auth = () => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState<AuthView>('login')
  const { signIn, signUp, sendPasswordResetEmail } = useAuth()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (view === 'login') {
      const { error } = await signIn(email, password)
      if (error) toast.error(error.message)
    } else {
      const { error } = await signUp(email, password)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Verifique seu e-mail para o link de confirmação!')
        setView('login')
      }
    }
    setLoading(false)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await sendPasswordResetEmail(email)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Link para redefinição de senha enviado para seu e-mail!')
      setView('login')
    }
    setLoading(false)
  }

  const renderContent = () => {
    switch (view) {
      case 'forgotPassword':
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Esqueceu a senha?</CardTitle>
              <CardDescription>
                Digite seu e-mail para receber o link de redefinição.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar Link'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                Lembrou da senha?
                <Button
                  variant="link"
                  onClick={() => setView('login')}
                  className="pl-1"
                >
                  Entrar
                </Button>
              </div>
            </CardContent>
          </>
        )
      case 'signup':
      case 'login':
      default:
        return (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {view === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </CardTitle>
              <CardDescription>
                {view === 'login'
                  ? 'Entre para acessar sua coleção.'
                  : 'Comece a gerenciar sua coleção hoje.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                  />
                </div>
                {view === 'login' && (
                  <div className="text-right text-sm">
                    <Button
                      variant="link"
                      onClick={() => setView('forgotPassword')}
                      className="p-0 h-auto"
                    >
                      Esqueceu a senha?
                    </Button>
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading
                    ? 'Carregando...'
                    : view === 'login'
                      ? 'Entrar'
                      : 'Cadastrar'}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                {view === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <Button
                  variant="link"
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                  className="pl-1"
                >
                  {view === 'login' ? 'Cadastre-se' : 'Entrar'}
                </Button>
              </div>
            </CardContent>
          </>
        )
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-sm mx-4 shadow-card">
        <div className="flex justify-center items-center gap-3 pt-6">
          <DiscAlbum className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold text-primary font-display">
            Minha Coleção de Vinis
          </h1>
        </div>
        {renderContent()}
      </Card>
    </div>
  )
}

export default Auth
