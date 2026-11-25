import { SITE_URL, siteConfig } from '../data/config'
import { isNonEmpty } from './assets'

export interface RouteSeoOptions {
  title: string
  description: string
  pathname: string
  robots?: string
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function setCanonicalLink(href: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', href)
}

export function normalizeSiteUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '').trim()
  if (!trimmed) return ''
  return trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`
}

export function buildPersonJsonLd(): Record<string, unknown> {
  const sameAs = [siteConfig.githubUrl, siteConfig.linkedInUrl].filter(isNonEmpty)
  const base = normalizeSiteUrl(SITE_URL)
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: siteConfig.name,
    jobTitle: 'Full-Stack & AI Developer',
    description: siteConfig.aboutParagraph,
    url: base,
  }
  if (sameAs.length > 0) {
    schema.sameAs = sameAs
  }
  if (isNonEmpty(siteConfig.email)) {
    schema.email = `mailto:${siteConfig.email}`
  }
  return schema
}

export function applyRouteSeo({
  title,
  description,
  pathname,
  robots = 'index, follow',
}: RouteSeoOptions): void {
  if (typeof document === 'undefined') return

  const base = normalizeSiteUrl(SITE_URL)
  const cleanPath = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}`
  const canonicalUrl = cleanPath === '/' ? `${base}/` : `${base}${cleanPath}`
  const ogImageUrl = `${base}/og-image.png`

  document.title = title
  setCanonicalLink(canonicalUrl)

  setMetaTag('name', 'description', description)
  setMetaTag('name', 'robots', robots)
  setMetaTag('property', 'og:title', title)
  setMetaTag('property', 'og:description', description)
  setMetaTag('property', 'og:url', canonicalUrl)
  setMetaTag('property', 'og:image', ogImageUrl)
  setMetaTag('name', 'twitter:title', title)
  setMetaTag('name', 'twitter:description', description)
  setMetaTag('name', 'twitter:image', ogImageUrl)

  let ldScript = document.getElementById('person-jsonld') as HTMLScriptElement | null
  if (!ldScript) {
    ldScript = document.createElement('script')
    ldScript.id = 'person-jsonld'
    ldScript.type = 'application/ld+json'
    document.head.appendChild(ldScript)
  }
  ldScript.textContent = JSON.stringify(buildPersonJsonLd())
}
