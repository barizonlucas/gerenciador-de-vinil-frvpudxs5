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

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const { sendPasswordResetEmail } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true)
    const { error } = await sendPasswordResetEmail(data.email)

    if (error) {
      toast.error(error.message || 'Falha ao enviar email de recuperação.')
    } else {
      toast.success(
        'Email de recuperação enviado! Verifique sua caixa de entrada.',
      )
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Link'
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            Lembrou sua senha?{' '}
            <Link to="/login" className="underline hover:text-primary">
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
