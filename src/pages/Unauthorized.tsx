import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

const UnauthorizedPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
      <h1 className="text-4xl font-bold text-destructive">403</h1>
      <h2 className="text-2xl font-semibold mt-2">Acesso não autorizado</h2>
      <p className="text-muted-foreground mt-4 max-w-md">
        Você não tem permissão para visualizar esta página. Se você acredita que
        isso é um erro, entre em contato com o suporte.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Voltar ao Teko</Link>
      </Button>
    </div>
  )
}

export default UnauthorizedPage
