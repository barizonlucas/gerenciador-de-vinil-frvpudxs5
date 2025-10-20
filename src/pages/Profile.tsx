import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { updateProfile } from '@/services/profile'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Skeleton } from '@/components/ui/skeleton'
import { AvatarUploader } from '@/components/AvatarUploader'

const profileSchema = z.object({
  display_name: z.string().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: '',
    },
  })

  const {
    formState: { isSubmitting, isDirty },
    reset,
  } = form

  useEffect(() => {
    if (profile) {
      reset({ display_name: profile.display_name || '' })
    }
  }, [profile, reset])

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile({ display_name: data.display_name })
      await refreshProfile()
      toast.success('Perfil atualizado com sucesso!')
      reset({ display_name: data.display_name || '' })
    } catch (error) {
      toast.error('Ocorreu um erro ao atualizar o perfil.')
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-8" />
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-32 w-32 rounded-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-4">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Configurações</h1>
      <p className="text-muted-foreground mb-8">
        Gerencie seu perfil e preferências.
      </p>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Foto de Perfil</CardTitle>
          <CardDescription>
            Esta foto será exibida publicamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUploader />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>
            Atualize seu nome de exibição e email.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" value={user?.email || ''} disabled />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Exibição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Seu nome público"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
