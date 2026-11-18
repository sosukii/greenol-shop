import { useHead } from '@unhead/vue'
import { site } from '@/config/site'

export interface SeoOptions {
  title: string
  description: string
  /** путь внутри сайта, начиная с «/» */
  path: string
  /** абсолютный или корневой путь к изображению для Open Graph */
  image?: string
  type?: 'website' | 'product'
  noindex?: boolean
  jsonLd?: Record<string, unknown>[]
}

export const absUrl = (path: string) => (/^https?:/.test(path) ? path : site.url + (path.startsWith('/') ? path : '/' + path))

/** Per-page title, description, canonical, Open Graph и JSON-LD. Работает при prerender (SSG). */
export function useSeo(o: SeoOptions | (() => SeoOptions)) {
  useHead(() => {
    const v = typeof o === 'function' ? o() : o
    const url = absUrl(v.path)
    const image = absUrl(v.image ?? '/og-default.png')
    return {
      title: v.title,
      meta: [
        { name: 'description', content: v.description },
        { name: 'robots', content: v.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large' },
        { property: 'og:type', content: v.type ?? 'website' },
        { property: 'og:site_name', content: site.name },
        { property: 'og:locale', content: site.locale },
        { property: 'og:title', content: v.title },
        { property: 'og:description', content: v.description },
        { property: 'og:url', content: url },
        { property: 'og:image', content: image },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [{ rel: 'canonical', href: url }],
      script: (v.jsonLd ?? []).map((ld, i) => ({ key: `ld-${i}`, type: 'application/ld+json', innerHTML: JSON.stringify(ld) })),
    }
  })
}

export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absUrl(it.path) })),
})

export const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  legalName: site.legal.name,
  url: site.url,
  logo: absUrl('/img/logo.png'),
  email: site.contacts.email,
  telephone: site.contacts.phoneRaw,
  address: { '@type': 'PostalAddress', streetAddress: 'ул. Стартовая, 14Т', addressLocality: 'Москва', addressCountry: 'RU' },
  taxID: site.legal.inn,
})

export const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: site.url,
  potentialAction: { '@type': 'SearchAction', target: `${site.url}/catalog?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
})
