const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-7WESMKC3CG'

declare global {
  interface Window {
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
  }
}

export const initAnalytics = () => {
  if (!GA_MEASUREMENT_ID) return
  if (window.gtag) return

  window.dataLayer = window.dataLayer || []
  function gtag(...args: any[]) {
    window.dataLayer?.push(args)
  }
  window.gtag = gtag

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  gtag('js', new Date())
  // Disable default page view to avoid duplicate with the router listener
  gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
}

export const trackPageView = (path: string) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_location: window.location.href,
  })
}
