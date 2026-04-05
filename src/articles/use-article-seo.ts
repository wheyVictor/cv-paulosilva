import { useEffect } from 'react'

export function useHomeSeo({ lang, title, description }: { lang: string; title: string; description: string }) {
  useEffect(() => {
    document.title = title

    const metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', description)

    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title)
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', description)
    document.querySelector('meta[property="og:locale"]')?.setAttribute('content', lang === 'en' ? 'en_US' : 'pt_BR')

    const canonical = lang === 'en' ? 'https://psilva.io/' : 'https://psilva.io/pt'
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical)
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', canonical)

    document.documentElement.lang = lang
  }, [lang, title, description])
}
