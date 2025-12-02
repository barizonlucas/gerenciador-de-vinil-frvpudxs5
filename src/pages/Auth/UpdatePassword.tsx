import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useNavigate } from 'react-router-dom'
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

const updatePasswordSchema = z.object({
  password: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
})

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>

export default function UpdatePasswordPage() {
  const navigate = useNavigate()
  const { updatePassword } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '' },
  })

  const onSubmit = async (data: UpdatePasswordFormValues) => {
    setIsSubmitting(true)
    const { error } = await updatePassword(data.password)

    if (error) {
      toast.error(error.message || 'Falha ao atualizar a senha.')
      setIsSubmitting(false)
    } else {
      toast.success('Senha atualizada com sucesso!')
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
          <CardTitle className="text-2xl">Crie uma nova senha</CardTitle>
          <CardDescription>Digite sua nova senha abaixo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
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
                    Salvando...
                  </>
                ) : (
                  'Salvar Nova Senha'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
