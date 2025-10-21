import { useNavigate } from 'react-router-dom'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { RecordForm } from '@/components/modals/RecordForm'
import { VinylRecord } from '@/types/vinyl'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AddRecordPage() {
  const navigate = useNavigate()
  const { addRecord } = useVinylContext()

  const handleSubmit = async (data: Omit<VinylRecord, 'id' | 'user_id'>) => {
    try {
      await addRecord(data)
      toast.success('Disco adicionado com sucesso!')
      navigate('/')
    } catch (error) {
      toast.error('Falha ao adicionar o disco. Tente novamente.')
      console.error(error)
    }
  }

  const handleCancel = () => {
    navigate('/')
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Adicionar Novo Disco</CardTitle>
          <CardDescription>
            Preencha os detalhes abaixo para adicionar um novo disco à sua
            coleção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecordForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitButtonText="Salvar Disco"
          />
        </CardContent>
      </Card>
    </div>
  )
}
