import { supabase } from '@/lib/supabase/client'

interface VerifyRecaptchaResponse {
  success: boolean
  score?: number
  action?: string
}

export const verifyRecaptcha = async (
  token: string,
  action: string,
  threshold = 0.4,
) => {
  const { data, error } =
    await supabase.functions.invoke<VerifyRecaptchaResponse>(
      'verify-recaptcha',
      {
        body: { token, action, threshold },
      },
    )

  if (error) {
    throw new Error(error.message || 'Falha na validação do reCAPTCHA.')
  }

  if (!data?.success) {
    throw new Error('Validação do reCAPTCHA reprovada.')
  }

  if (typeof data.score === 'number' && data.score < threshold) {
    throw new Error('Validação do reCAPTCHA com score insuficiente.')
  }

  return data
}
