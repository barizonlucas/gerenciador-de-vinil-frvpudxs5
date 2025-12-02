import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link } from 'react-router-dom'
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

const registerSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

type RegisterFormValues = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { signUp } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true)
    const { error } = await signUp(data.email, data.password)

    if (error) {
      toast.error(error.message || 'Falha no registro.')
    } else {
      toast.success('Registro realizado! Verifique seu email para confirmação.')
      form.reset()
    }
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <DiscAlbum className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Teko</h1>
          </div>
          <CardTitle className="text-2xl">Crie sua conta</CardTitle>
          <CardDescription>
            Comece a organizar sua coleção de vinis hoje mesmo.
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar'
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="underline hover:text-primary">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
