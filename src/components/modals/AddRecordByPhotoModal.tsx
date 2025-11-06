import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CameraCapture } from '@/components/CameraCapture'
import { identifyAlbumCover, AIResponse } from '@/services/ai'
import {
  searchDiscogsMaster,
  getDiscogsVersions,
  DiscogsVersion,
} from '@/services/discogs'
import { useVinylContext } from '@/contexts/VinylCollectionContext'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle, DiscAlbum } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VinylRecord } from '@/types/vinyl'
import { RecordForm } from './RecordForm'

type ProcessStep =
  | 'capture'
  | 'identifying'
  | 'searching'
  | 'saving'
  | 'success'
  | 'error'
  | 'manual'

interface AddRecordByPhotoModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AddRecordByPhotoModal = ({
  isOpen,
  onClose,
}: AddRecordByPhotoModalProps) => {
  const { addRecord } = useVinylContext()
  const [step, setStep] = useState<ProcessStep>('capture')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)

  const resetState = () => {
    setStep('capture')
    setErrorMessage('')
    setAiResponse(null)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleManualFallback = () => {
    setStep('manual')
  }

  const handleManualSubmit = async (
    data: Omit<VinylRecord, 'id' | 'user_id'>,
  ) => {
    try {
      await addRecord(data)
      toast.success('Disco adicionado manualmente!')
      handleClose()
    } catch (error) {
      toast.error('Falha ao adicionar o disco.')
    }
  }

  const handleCapture = async (imageBlob: Blob) => {
    const imageFile = new File([imageBlob], 'cover.jpg', { type: 'image/jpeg' })

    try {
      setStep('identifying')
      const identified = await identifyAlbumCover(imageFile)
      setAiResponse(identified)

      setStep('searching')
      const discogsResult = await searchDiscogsMaster(
        identified.artist ?? '',
        identified.album_title ?? '',
      )

      if (!discogsResult) {
        throw new Error('Não encontramos uma correspondência exata no Discogs.')
      }

      setStep('saving')
      const masterId = (discogsResult.masterId ?? discogsResult.id).toString()
      let preferredVersion: DiscogsVersion | null = null

      try {
        const versionsResponse = await getDiscogsVersions(masterId, 1)
        preferredVersion = versionsResponse.versions?.[0] ?? null
      } catch (versionError) {
        console.error(
          'Falha ao buscar versões do master (cadastro por foto):',
          versionError,
        )
      }

      const releaseYearFromVersion =
        preferredVersion?.year &&
        !Number.isNaN(parseInt(preferredVersion.year, 10))
          ? parseInt(preferredVersion.year, 10)
          : undefined

      const newRecord: Omit<VinylRecord, 'id' | 'user_id'> = {
        albumTitle: discogsResult.albumTitle,
        artist: discogsResult.artist,
        releaseYear: discogsResult.year
          ? parseInt(discogsResult.year, 10)
          : releaseYearFromVersion,
        coverArtUrl: discogsResult.coverArtUrl || preferredVersion?.thumb,
        genre: Array.isArray(discogsResult.genre)
          ? discogsResult.genre.join(', ')
          : discogsResult.genre,
        master_id: masterId,
        release_id: preferredVersion
          ? preferredVersion.id.toString()
          : undefined,
        release_label: preferredVersion?.label,
        release_country: preferredVersion?.country,
        release_catno: preferredVersion?.catno,
      }
      await addRecord(newRecord)

      setStep('success')
      toast.success(`${newRecord.albumTitle} adicionado à coleção!`)
      setTimeout(handleClose, 1500)
    } catch (error: any) {
      console.error('Error in photo add flow:', error)
      setErrorMessage(error.message || 'Ocorreu um erro desconhecido.')
      setStep('error')
    }
  }

  const getInitialDataForManualForm = (): Partial<VinylRecord> => {
    if (aiResponse) {
      return {
        artist: aiResponse.artist ?? '',
        albumTitle: aiResponse.album_title ?? '',
      }
    }
    return {}
  }

  const renderContent = () => {
    switch (step) {
      case 'capture':
        return <CameraCapture onCapture={handleCapture} onClose={handleClose} />
      case 'manual':
        return (
          <div className="p-6">
            <RecordForm
              onSubmit={handleManualSubmit}
              onCancel={handleClose}
              initialData={getInitialDataForManualForm() as VinylRecord}
              submitButtonText="Adicionar Manualmente"
            />
          </div>
        )
      case 'identifying':
      case 'searching':
      case 'saving':
      case 'success':
      case 'error': {
        const messages = {
          identifying: 'Reconhecendo capa...',
          searching: 'Buscando detalhes...',
          saving: 'Salvando na coleção...',
          success: 'Adicionado à coleção!',
          error: 'Ocorreu um Erro',
        }
        const icons = {
          identifying: Loader2,
          searching: Loader2,
          saving: Loader2,
          success: CheckCircle,
          error: XCircle,
        }
        const colors = {
          success: 'text-success',
          error: 'text-destructive',
        }
        return (
          <div className="p-6 min-h-[300px] flex flex-col items-center justify-center">
            <StatusView
              icon={icons[step]}
              message={messages[step]}
              color={colors[step as keyof typeof colors]}
            />
            {step === 'error' && (
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  {errorMessage}
                </p>
                <div className="flex gap-4 mt-4">
                  <Button variant="outline" onClick={resetState}>
                    Tentar Novamente
                  </Button>
                  <Button onClick={handleManualFallback}>
                    Cadastrar Manualmente
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      }
      default:
        return null
    }
  }

  const getDialogTitle = () => {
    if (step === 'manual') return 'Cadastro Manual'
    return 'Adicionar por Foto'
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`sm:max-w-md ${step !== 'manual' ? 'p-0' : ''} ${
          step === 'manual' ? 'sm:max-w-2xl' : ''
        }`}
      >
        {step === 'capture' ? (
          renderContent()
        ) : (
          <>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <DiscAlbum /> {getDialogTitle()}
              </DialogTitle>
            </DialogHeader>
            {renderContent()}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

const StatusView = ({
  icon: Icon,
  message,
  color,
}: {
  icon: React.ElementType
  message: string
  color?: string
}) => (
  <div className="flex flex-col items-center gap-4 text-center">
    <Icon
      className={`h-12 w-12 ${
        Icon === Loader2 ? 'animate-spin' : ''
      } ${color || 'text-primary'}`}
    />
    <p className="text-lg font-medium">{message}</p>
  </div>
)
