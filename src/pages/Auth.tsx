import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
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

const Auth = () => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) toast.error(error.message)
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Verifique seu e-mail para o link de confirmação!')
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary/50">
      <Card className="w-full max-w-sm mx-4 shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <DiscAlbum className="h-10 w-10 text-primary" />
            <h1 className="text-2xl font-bold text-primary font-display">
              Minha Coleção de Vinis
            </h1>
          </div>
          <CardTitle className="text-2xl">
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </CardTitle>
          <CardDescription>
            {isLogin
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <Button
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="pl-1"
            >
              {isLogin ? 'Cadastre-se' : 'Entrar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Auth
