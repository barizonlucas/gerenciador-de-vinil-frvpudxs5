import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { DiscAlbum, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      toast.error(
        error.message || 'Falha no login. Verifique suas credenciais.',
      )
      setIsSubmitting(false)
    } else {
      toast.success('Login realizado com sucesso!')
      // Redirect is usually handled by PublicRoute/AuthContext listener
      // but explicit navigation provides immediate feedback if needed
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <DiscAlbum className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Teko</h1>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu email e senha para continuar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-right text-sm">
                <Link
                  to="/forgot-password"
                  className="underline hover:text-primary"
                >
                  Esqueceu sua senha?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link to="/register" className="underline hover:text-primary">
              Registre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
