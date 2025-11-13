import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

const AdminPollsPage = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Enquetes</h1>
          <p className="text-muted-foreground">
            Crie, edite e visualize enquetes para a comunidade.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Criar Nova Enquete
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Enquetes Ativas</CardTitle>
          <CardDescription>
            Estas são as enquetes que estão atualmente visíveis para os
            usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhuma enquete ativa no momento.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminPollsPage
