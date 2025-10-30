import { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

export const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.')
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    startCamera()
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [startCamera, stream])

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageUrl = canvas.toDataURL('image/jpeg')
      setCapturedImage(imageUrl)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }

  const handleRetake = () => {
    setCapturedImage(null)
    startCamera()
  }

  const handleConfirm = () => {
    canvasRef.current?.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob)
        }
      },
      'image/jpeg',
      0.9,
    )
  }

  return (
    <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden flex items-center justify-center">
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
        onClick={onClose}
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
          >
            <Camera className="h-8 w-8 text-white" />
          </Button>
        )}
      </div>
    </div>
  )
}
