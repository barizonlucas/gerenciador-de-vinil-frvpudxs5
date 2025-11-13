import { PollRanking } from '@/components/admin/PollRanking'
import { QuickMetrics } from '@/components/admin/QuickMetrics'

const AdminDashboardPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Painel do Administrador</h1>
        <p className="text-muted-foreground">
          Visão geral e gerenciamento do sistema.
        </p>
      </div>

      <QuickMetrics />

      <PollRanking />
    </div>
  )
}

export default AdminDashboardPage
