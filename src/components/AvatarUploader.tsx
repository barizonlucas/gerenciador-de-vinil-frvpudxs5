import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { uploadAvatar } from '@/services/storage'
import { updateProfile } from '@/services/profile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { User as UserIcon, Loader2 } from 'lucide-react'

export const AvatarUploader = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024 * 50) {
      // 50MB limit
      toast.error('O arquivo é muito grande. O limite é de 50MB.')
      return
    }

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Tipo de arquivo inválido. Apenas JPEG e PNG são permitidos.')
      return
    }

    setUploading(true)
    try {
      const avatarUrl = await uploadAvatar(file)
      await updateProfile({ avatar_url: avatarUrl })
      await refreshProfile()
      toast.success('Foto de perfil atualizada!')
    } catch (error: any) {
      toast.error(error.message || 'Falha ao enviar a foto.')
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const getInitials = () => {
    if (profile?.display_name) {
      return profile.display_name.charAt(0).toUpperCase()
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return <UserIcon className="h-12 w-12" />
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar
          className="h-32 w-32 cursor-pointer"
          onClick={handleAvatarClick}
        >
          <AvatarImage
            src={profile?.avatar_url ?? undefined}
            alt="Foto de perfil"
          />
          <AvatarFallback className="text-4xl">{getInitials()}</AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>
      <Button
        variant="outline"
        onClick={handleAvatarClick}
        disabled={uploading}
      >
        {uploading ? 'Enviando...' : 'Alterar Foto'}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
        disabled={uploading}
      />
    </div>
  )
}
