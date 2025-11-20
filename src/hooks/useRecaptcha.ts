import { useEffect, useState, useCallback } from 'react'

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

const RECAPTCHA_SCRIPT_ID = 'google-recaptcha-v3'
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY

let loadScriptPromise: Promise<void> | null = null

const loadRecaptchaScript = () => {
  if (!RECAPTCHA_SITE_KEY) {
    return Promise.reject(
      new Error('VITE_RECAPTCHA_SITE_KEY não configurada no front-end.'),
    )
  }

  if (loadScriptPromise) {
    return loadScriptPromise
  }

  loadScriptPromise = new Promise<void>((resolve, reject) => {
    if (document.getElementById(RECAPTCHA_SCRIPT_ID)) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.id = RECAPTCHA_SCRIPT_ID
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new Error('Falha ao carregar o script do reCAPTCHA.'))

    document.head.appendChild(script)
  })

  return loadScriptPromise
}

export const useRecaptcha = () => {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true

    loadRecaptchaScript()
      .then(() => {
        window.grecaptcha?.ready(() => {
          if (isMounted) setIsReady(true)
        })
      })
      .catch((err) => {
        console.error(err)
        if (isMounted) setError(err as Error)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const executeRecaptcha = useCallback(
    async (action: string) => {
      if (error) {
        throw error
      }

      if (!RECAPTCHA_SITE_KEY) {
        throw new Error(
          'VITE_RECAPTCHA_SITE_KEY não configurada. Configure e tente novamente.',
        )
      }

      if (!window.grecaptcha) {
        throw new Error('reCAPTCHA ainda não carregou. Tente novamente.')
      }

      await loadRecaptchaScript()
      return window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action })
    },
    [error],
  )

  return { isReady, executeRecaptcha }
}
