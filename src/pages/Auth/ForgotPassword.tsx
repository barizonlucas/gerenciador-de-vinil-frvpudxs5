import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
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
import { DiscAlbum } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (error) {
      toast.error(error.message || 'Falha ao enviar email de recuperação.')
    } else {
      toast.success(
        'Email de recuperação enviado! Verifique sua caixa de entrada.',
      )
      form.reset()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50 p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <DiscAlbum className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-primary font-display">
              Teko
            </h1>
          </div>
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de recuperação.
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Link'}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Lembrou sua senha?{' '}
            <Link to="/login" className="underline">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
