import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const AdminDashboardPage = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Painel do Administrador</h1>
      <p className="text-muted-foreground mb-8">
        Visão geral e gerenciamento do sistema.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enquetes Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Gerencie as enquetes da comunidade.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mensagens Não Lidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Responda às mensagens dos colecionadores.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboardPage
