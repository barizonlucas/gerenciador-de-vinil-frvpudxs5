import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const AdminMessagesPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Mensagens dos Colecionadores</h1>
      <p className="text-muted-foreground mb-8">
        Leia e responda às mensagens enviadas pelos usuários.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Caixa de Entrada</CardTitle>
          <CardDescription>
            Mensagens recebidas, ordenadas pelas mais recentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhuma mensagem na caixa de entrada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminMessagesPage
