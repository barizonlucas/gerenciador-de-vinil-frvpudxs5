import { useEffect } from 'react'

const GTM_ID = import.meta.env.VITE_GTM_ID

export const GoogleTagManager = () => {
  useEffect(() => {
    if (!GTM_ID) return

    // GTM Script Injection
    const scriptId = 'gtm-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GTM_ID}');`

      // Insert as high as possible in the head
      if (document.head.firstChild) {
        document.head.insertBefore(script, document.head.firstChild)
      } else {
        document.head.appendChild(script)
      }
    }

    // GTM Noscript Injection
    const noscriptId = 'gtm-noscript'
    if (!document.getElementById(noscriptId)) {
      const noscript = document.createElement('noscript')
      noscript.id = noscriptId
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`
      iframe.height = '0'
      iframe.width = '0'
      iframe.style.display = 'none'
      iframe.style.visibility = 'hidden'
      noscript.appendChild(iframe)

      // Insert immediately after opening body tag
      if (document.body.firstChild) {
        document.body.insertBefore(noscript, document.body.firstChild)
      } else {
        document.body.appendChild(noscript)
      }
    }
  }, [])

  return null
}
