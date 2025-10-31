import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Loader2, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

export const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const permissionStatusRef = useRef<PermissionStatus | null>(null)
  const permissionChangeHandlerRef = useRef<(() => void) | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [permissionState, setPermissionState] = useState<
    'checking' | 'prompt' | 'requesting' | 'granted' | 'denied'
  >('checking')
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsReady(false)
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('MEDIA_DEVICES_UNAVAILABLE')
    }

    const videoElement = videoRef.current

    if (!videoElement) {
      throw new Error('VIDEO_ELEMENT_NOT_READY')
    }

    if (streamRef.current) {
      if (videoElement.srcObject !== streamRef.current) {
        videoElement.srcObject = streamRef.current
      }
      if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setIsReady(true)
      } else {
        const handleCanPlay = () => {
          videoElement.removeEventListener('canplay', handleCanPlay)
          setIsReady(true)
        }
        videoElement.addEventListener('canplay', handleCanPlay)
      }
      return
    }

    setIsReady(false)
    let canPlayHandler: (() => void) | null = null

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })

      streamRef.current = mediaStream
      videoElement.srcObject = mediaStream
      videoElement.setAttribute('playsinline', 'true')

      const handleCanPlay = () => {
        videoElement.removeEventListener('canplay', handleCanPlay)
        setIsReady(true)
      }

      if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        setIsReady(true)
      } else {
        canPlayHandler = handleCanPlay
        videoElement.addEventListener('canplay', handleCanPlay)
      }

      await videoElement.play()
    } catch (error) {
      const videoElement = videoRef.current
      if (videoElement && canPlayHandler) {
        videoElement.removeEventListener('canplay', canPlayHandler)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      throw error
    }
  }, [])

  const buildDeniedMessage = useCallback(() => {
    if (typeof navigator === 'undefined') {
      return 'Você bloqueou o acesso à câmera. Atualize as permissões do navegador e tente novamente.'
    }

    const ua = navigator.userAgent ?? ''

    if (/iPad|iPhone|iPod/i.test(ua)) {
      return 'Você bloqueou o acesso à câmera. Vá em Ajustes > Safari > Câmera e permita o acesso, depois volte e tente novamente.'
    }

    if (/Android/i.test(ua)) {
      return 'Você bloqueou o acesso à câmera. Acesse Configurações > Apps > Chrome > Permissões > Câmera e permita o acesso, depois volte e tente novamente.'
    }

    return 'Você bloqueou o acesso à câmera. Atualize as permissões do navegador e tente novamente.'
  }, [])

  const parseCameraError = useCallback(
    (error: unknown) => {
      const fallback = {
        nextState: 'prompt' as const,
        message: 'Não foi possível iniciar a câmera. Tente novamente.',
      }

      if (!error || typeof error !== 'object') {
        return fallback
      }

      const domError = error as DOMException & { message?: string }

      if (domError.message === 'MEDIA_DEVICES_UNAVAILABLE') {
        return {
          nextState: 'denied' as const,
          message:
            'Este navegador não suporta acesso direto à câmera. Use um navegador compatível ou ajuste as permissões.',
        }
      }

      switch (domError.name) {
        case 'NotAllowedError':
        case 'PermissionDeniedError':
          return {
            nextState: 'denied' as const,
            message: buildDeniedMessage(),
          }
        case 'NotFoundError':
          return {
            nextState: 'denied' as const,
            message: 'Não encontramos nenhuma câmera neste dispositivo.',
          }
        case 'NotReadableError':
        case 'TrackStartError':
          return {
            nextState: 'prompt' as const,
            message:
              'Não foi possível acessar a câmera. Feche outros aplicativos que estejam usando a câmera e tente novamente.',
          }
        case 'OverconstrainedError':
        case 'ConstraintNotSatisfiedError':
          return {
            nextState: 'prompt' as const,
            message:
              'Não foi possível encontrar uma câmera compatível com essa configuração.',
          }
        case 'AbortError':
          return fallback
        default:
          return fallback
      }
    },
    [buildDeniedMessage],
  )

  const requestCameraAccess = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionError(
        'Este navegador não suporta acesso à câmera. Use um navegador compatível.',
      )
      setPermissionState('denied')
      return
    }

    setPermissionState('requesting')
    setPermissionError(null)

    try {
      await startCamera()
      setPermissionState('granted')
    } catch (error) {
      console.error('Error accessing camera:', error)
      const { nextState, message } = parseCameraError(error)
      setPermissionError(message)
      setPermissionState(nextState)
    }
  }, [startCamera, parseCameraError])

  useEffect(() => {
    let isMounted = true

    const checkPermission = async () => {
      if (typeof navigator === 'undefined' || !navigator.permissions?.query) {
        if (isMounted) {
          setPermissionState('prompt')
        }
        return
      }

      try {
        const status = await navigator.permissions.query({
          name: 'camera' as PermissionName,
        })

        if (!isMounted) {
          return
        }

        permissionStatusRef.current = status

        const updateFromStatus = () => {
          if (!isMounted) {
            return
          }

          if (status.state === 'granted') {
            setPermissionError(null)
            setPermissionState('granted')
          } else if (status.state === 'denied') {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop())
              streamRef.current = null
            }
            setIsReady(false)
            setPermissionError(buildDeniedMessage())
            setPermissionState('denied')
          } else {
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop())
              streamRef.current = null
            }
            setIsReady(false)
            setPermissionError(null)
            setPermissionState('prompt')
          }
        }

        updateFromStatus()

        const changeListener = () => {
          updateFromStatus()
        }

        permissionChangeHandlerRef.current = changeListener

        if ('addEventListener' in status) {
          status.addEventListener('change', changeListener)
        } else {
          status.onchange = changeListener
        }
      } catch (error) {
        console.error('Permission query failed:', error)
        if (isMounted) {
          setPermissionState('prompt')
        }
      }
    }

    checkPermission()

    return () => {
      isMounted = false
      const status = permissionStatusRef.current
      const handler = permissionChangeHandlerRef.current
      if (status && handler) {
        if ('removeEventListener' in status) {
          status.removeEventListener('change', handler)
        } else {
          status.onchange = null
        }
      }
      permissionStatusRef.current = null
      permissionChangeHandlerRef.current = null
    }
  }, [buildDeniedMessage])

  useEffect(() => {
    if (permissionState !== 'granted') {
      return
    }

    let cancelled = false

    const ensureStream = async () => {
      try {
        await startCamera()
      } catch (error) {
        if (cancelled) {
          return
        }
        console.error('Error starting camera after permission grant:', error)
        const { nextState, message } = parseCameraError(error)
        setPermissionError(message)
        setPermissionState(nextState)
      }
    }

    ensureStream()

    return () => {
      cancelled = true
    }
  }, [permissionState, startCamera, parseCameraError])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        toast.error('A câmera ainda está inicializando. Tente novamente.')
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (!context) {
        toast.error('Não foi possível processar a imagem.')
        return
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageUrl = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageUrl)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      stopStream()
    }
  }

  const handleRetake = async () => {
    setCapturedImage(null)
    try {
      await startCamera()
    } catch (error) {
      console.error('Error restarting camera:', error)
      const { nextState, message } = parseCameraError(error)
      setPermissionError(message)
      setPermissionState(nextState)
    }
  }

  const handleConfirm = () => {
    if (!capturedImage) {
      toast.error('Capture uma foto antes de confirmar.')
      return
    }
    canvasRef.current?.toBlob(
      (blob) => {
        if (blob) {
          // desliga câmera ANTES de avisar o pai (segurança / privacidade)
          stopStream()
          onCapture(blob)
        }
      },
      'image/jpeg',
      0.9,
    )
  }

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsReady(false)
    onClose()
  }

  return (
    <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
      {permissionState !== 'granted' && !capturedImage && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/80 p-6 text-center text-white">
          <div className="space-y-3 max-w-sm">
            <h2 className="text-xl font-semibold">Autorizar câmera</h2>
            {permissionState === 'checking' && (
              <div className="flex flex-col items-center gap-3 text-sm text-white/80">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Verificando permissões...</span>
              </div>
            )}
            {(permissionState === 'prompt' || permissionState === 'requesting') && (
              <>
                <p className="text-sm text-white/80">
                  Usamos sua câmera só para tirar a foto do seu disco. Nada é salvo sem você
                  confirmar.
                </p>
                {permissionError && (
                  <p className="text-xs text-red-200">{permissionError}</p>
                )}
              </>
            )}
            {permissionState === 'denied' && (
              <p className="text-sm text-red-100">
                {permissionError ??
                  'Sem acesso à câmera. Ajuste as permissões do navegador e tente novamente.'}
              </p>
            )}
          </div>
          <div className="flex w-full max-w-sm flex-col gap-2">
            {permissionState === 'prompt' && (
              <>
                <Button
                  className="w-full"
                  onClick={requestCameraAccess}
                >
                  Permitir acesso
                </Button>
                <Button className="w-full" variant="outline" onClick={handleClose}>
                  Agora não
                </Button>
              </>
            )}
            {permissionState === 'requesting' && (
              <>
                <Button className="w-full" disabled>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Solicitando...
                </Button>
                <Button className="w-full" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
              </>
            )}
            {permissionState === 'denied' && (
              <>
                <Button className="w-full" onClick={requestCameraAccess}>
                  Tentar novamente
                </Button>
                <Button className="w-full" variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </>
            )}
            {permissionState === 'checking' && (
              <Button className="w-full" variant="outline" onClick={onClose}>
                Agora não
              </Button>
            )}
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${
          capturedImage ? 'hidden' : 'block'
        }`}
      />
      {capturedImage && (
        <img
          src={capturedImage}
          alt="Captured"
          className="w-full h-full object-cover"
        />
      )}
      <canvas ref={canvasRef} className="hidden" />

      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-white bg-black/30 hover:bg-black/50"
        onClick={handleClose}
      >
        <X className="h-6 w-6" />
      </Button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
        {capturedImage ? (
          <>
            <Button onClick={handleRetake} variant="outline" size="lg">
              <RefreshCw className="mr-2 h-5 w-5" /> Tentar Novamente
            </Button>
            <Button onClick={handleConfirm} size="lg">
              Usar Foto
            </Button>
          </>
        ) : (
          <Button
            onClick={handleCapture}
            className="h-16 w-16 rounded-full border-4 border-white/50 bg-white/30 hover:bg-white/50"
            disabled={!isReady || permissionState !== 'granted'}
          >
            <Camera className="h-8 w-8 text-white" />
          </Button>
        )}
      </div>
    </div>
  )
}
